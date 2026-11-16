import { utils } from '@start9labs/start-sdk'
import { pogoloToml } from '../fileModels/pogolo.toml'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  pool_address: Value.text({
    name: i18n('Default Payout Address'),
    description: i18n(
      'On-chain Bitcoin address to mine to when a miner does not provide one as its username. Leave empty to require every miner to provide its own address.',
    ),
    required: false,
    default: null,
    placeholder: 'bc1q...',
    patterns: [
      {
        regex:
          '^((bc|tb|bcrt)1[02-9ac-hj-np-z]{8,87}|(BC|TB|BCRT)1[02-9AC-HJ-NP-Z]{8,87}|[123mn][1-9A-HJ-NP-Za-km-z]{25,34})$',
        description: i18n('Must be a Bitcoin address'),
      },
    ],
  }),
  tag: Value.text({
    name: i18n('Coinbase Tag'),
    description: i18n(
      'Written into the coinbase of every block this pool builds, so it becomes public on the blockchain if one of your miners finds a block. Replaced by the default tag if it is longer than about 86 characters.',
    ),
    required: true,
    default: '/pogolo on StartOS - decentralize or die/',
    maxLength: 86,
    patterns: [utils.Patterns.ascii],
  }),
  password: Value.text({
    name: i18n('Stratum V1 Password'),
    description: i18n(
      'If set, Stratum V1 miners must use this password to connect. Leave empty to accept any password.',
    ),
    required: false,
    default: null,
    masked: true,
  }),
  default_difficulty: Value.number({
    name: i18n('Starting Difficulty'),
    description: i18n(
      'Difficulty assigned to a miner when it connects, before automatic adjustment kicks in.',
    ),
    required: true,
    default: 1024,
    min: 0.16,
    integer: false,
  }),
  job_interval: Value.number({
    name: i18n('Job Interval'),
    description: i18n('How often to send new work to miners.'),
    required: true,
    default: 60,
    min: 1,
    max: 65535,
    integer: true,
    units: 's',
  }),
  target_share_interval: Value.number({
    name: i18n('Target Share Interval'),
    description: i18n(
      'How often each miner should submit a share on average. Difficulty is adjusted to hit this.',
    ),
    required: true,
    default: 5,
    min: 1,
    max: 65535,
    integer: true,
    units: 's',
  }),
})

export const config = sdk.Action.withInput(
  // id
  'config',

  // metadata
  async ({ effects }) => ({
    name: i18n('Configure'),
    description: i18n(
      'Set the default payout address, coinbase tag, password and difficulty settings.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // pre-fill the form from pogolo.toml
  async ({ effects }) => {
    const p = (await pogoloToml.read((c) => c.pogolo).once()) ?? undefined
    return {
      pool_address: p?.pool_address || null,
      tag: p?.tag,
      password: p?.password || null,
      default_difficulty: p?.default_difficulty,
      job_interval: p?.job_interval,
      target_share_interval: p?.target_share_interval,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    await pogoloToml.merge(effects, {
      pogolo: {
        pool_address: input.pool_address || undefined,
        tag: input.tag,
        password: input.password || undefined,
        default_difficulty: input.default_difficulty,
        job_interval: input.job_interval,
        target_share_interval: input.target_share_interval,
      },
    })
  },
)
