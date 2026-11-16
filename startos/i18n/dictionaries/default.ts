export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting pogolo!': 0,
  'Bitcoin is not yet reachable on the internal network. Ensure it is installed and running.': 1,
  'Stratum Server': 2,
  'Stratum server is ready': 3,
  'Stratum server is not ready': 4,

  // interfaces.ts
  'Where your miners connect, using stratum+tcp:// or stratum2+tcp://': 5,
  API: 6,
  'Read-only pool statistics API': 7,

  // dependencies.ts
  'Must enable ZMQ in Bitcoin to use it with pogolo': 8,

  // actions/config.ts
  'Default Payout Address': 9,
  'On-chain Bitcoin address to mine to when a miner does not provide one as its username. Leave empty to require every miner to provide its own address.': 10,
  'Coinbase Tag': 11,
  'Written into the coinbase of every block this pool builds, so it becomes public on the blockchain if one of your miners finds a block. Replaced by the default tag if it is longer than about 86 characters.': 12,
  'Stratum V1 Password': 13,
  'If set, Stratum V1 miners must use this password to connect. Leave empty to accept any password.': 14,
  'Starting Difficulty': 15,
  'Difficulty assigned to a miner when it connects, before automatic adjustment kicks in.': 16,
  'Job Interval': 17,
  'How often to send new work to miners.': 18,
  'Target Share Interval': 19,
  'How often each miner should submit a share on average. Difficulty is adjusted to hit this.': 20,
  Configure: 21,
  'Set the default payout address, coinbase tag, password and difficulty settings.': 22,

  // web UI (main.ts, interfaces.ts)
  'Web Interface': 23,
  'The web interface is ready': 24,
  'The web interface is not ready': 25,
  'Web UI': 26,
  'Pool dashboard with hashrate graph and connected miners': 27,

  // actions/config.ts
  'Must be a Bitcoin address': 28,

  // init/authorityKey.ts
  'Could not generate a Stratum V2 authority key': 29,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
