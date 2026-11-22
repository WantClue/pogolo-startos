import { FileHelper } from '@start9labs/start-sdk'
import { manifest as bitcoinManifest } from 'bitcoin-core-startos/startos/manifest'
import { rpcCookieName, rpcVolumeId } from 'bitcoin-core-startos/startos/utils'
import { dependencies } from './dependencies'
import { connectionJson } from './fileModels/connection.json'
import { pogoloToml } from './fileModels/pogolo.toml'
import { i18n } from './i18n'
import { mainHostId, stratumInterfaceId } from './interfaces'
import { sdk } from './sdk'
import {
  bitcoindMountpoint,
  configPath,
  getBitcoindBridge,
  stratumPort,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting pogolo!'))

  const depResult = await dependencies.check(effects)
  depResult.throwIfNotSatisfied()

  const bitcoind = await getBitcoindBridge(effects)
  if (!bitcoind)
    throw new Error(
      i18n(
        'Bitcoin is not yet reachable on the internal network. Ensure it is installed and running.',
      ),
    )

  // restart pogolo whenever the user changes its config
  const conf = await pogoloToml.read().const(effects)

  // the dashboard's "Connect your miners" card: the Stratum Server's LAN
  // addresses (with the port StartOS assigned) and what miners must send.
  // Kept current with onChange, so an address change doesn't restart pogolo.
  const connectionInfo = sdk.host.getOwn(effects, mainHostId, (host) => ({
    addresses:
      host?.bindings[stratumPort]?.interfaces[
        stratumInterfaceId
      ]?.addressInfo?.nonLocal
        .filter({ visibility: 'private' })
        .format('hostname-info')
        .flatMap(({ hostname, port }) =>
          port === null ? [] : [{ host: hostname, port }],
        ) ?? [],
    passwordRequired: !!conf?.pogolo.password,
    defaultPayoutAddress: conf?.pogolo.pool_address || null,
  }))
  await connectionJson.write(effects, await connectionInfo.once())
  connectionInfo.onChange(async (info) => {
    if (info) await connectionJson.write(effects, info)
    return { cancel: false }
  })

  const sub = await sdk.SubContainer.of(
    effects,
    { imageId: 'pogolo' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      })
      .mountDependency<typeof bitcoinManifest>({
        dependencyId: 'bitcoind',
        volumeId: rpcVolumeId,
        subpath: null,
        mountpoint: bitcoindMountpoint,
        readonly: true,
      }),
    'pogolo-sub',
  )

  // bitcoind rewrites its cookie on every restart; restart pogolo so it re-reads it
  await FileHelper.string(
    `${await sub.rootfs}${bitcoindMountpoint}/${rpcCookieName}`,
  )
    .read()
    .const(effects)

  // dashboard: nginx serves the page and proxies /api/ to pogolo; the sampler
  // records hashrate history to /data/hashrate.csv for the graph
  const uiSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'nginx' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: true,
      })
      .mountAssets({
        subpath: 'dashboard',
        mountpoint: '/usr/share/nginx/html',
      })
      .mountAssets({
        subpath: 'nginx.conf',
        mountpoint: '/etc/nginx/conf.d/default.conf',
        type: 'file',
      }),
    'ui-sub',
  )
  const samplerSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'nginx' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      })
      .mountAssets({
        subpath: 'sampler.sh',
        mountpoint: '/sampler.sh',
        type: 'file',
      }),
    'sampler-sub',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('primary', {
      subcontainer: sub,
      exec: {
        command: ['/pogolo', '--conf', configPath],
        env: {
          POGOLO_BACKEND_HOST: bitcoind.rpc,
          POGOLO_BACKEND_ZMQHOST: bitcoind.zmq,
          NO_COLOR: '1',
        },
      },
      ready: {
        display: i18n('Stratum Server'),
        gracePeriod: 30_000,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, stratumPort, {
            successMessage: i18n('Stratum server is ready'),
            errorMessage: i18n('Stratum server is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('sampler', {
      subcontainer: samplerSub,
      exec: { command: ['sh', '/sampler.sh'] },
      ready: {
        display: null,
        fn: () => ({ result: 'success', message: null }),
      },
      requires: ['primary'],
    })
    .addDaemon('ui', {
      subcontainer: uiSub,
      exec: { command: ['nginx', '-g', 'daemon off;'] },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: [],
    })
})
