import { pogoloToml } from '../fileModels/pogolo.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Without authority_keypair, pogolo makes a new Stratum V2 authority key on
// every start, so a miner configured with the pool's public key stops
// connecting after a restart. Generate one once and keep it in pogolo.toml
// (on the main volume, so backups carry it).
export const authorityKey = sdk.setupOnInit(async (effects) => {
  const existing = await pogoloToml
    .read((c) => c.pogolo.authority_keypair)
    .once()
  if (existing) return

  try {
    const { stdout } = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'pogolo' },
      null,
      'authority-keygen',
      (sub) =>
        sub.execFail(['/pogolo', '--nocolor', '--generate-authority-key']),
    )
    // pogolo prints a few ANSI codes even with --nocolor; the keypair is the
    // only line that is pure hex
    const keypair = stdout
      .toString()
      .replace(/\x1b\[[0-9;]*m/g, '')
      .match(/^(?:[0-9a-f]{2})+$/m)?.[0]
    if (!keypair) throw new Error('no keypair in output')

    await pogoloToml.merge(effects, { pogolo: { authority_keypair: keypair } })
  } catch (e) {
    // pogolo still runs with a per-start key; the next init retries
    console.warn(i18n('Could not generate a Stratum V2 authority key'), e)
  }
})
