import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Written by main.ts, read by the dashboard's "Connect your miners" card
// (nginx serves it as /connection.json). Never read back by the package.
const shape = z.object({
  // LAN addresses of the Stratum Server interface, with StartOS's assigned port
  addresses: z.array(z.object({ host: z.string(), port: z.number().int() })),
  passwordRequired: z.boolean(),
  defaultPayoutAddress: z.string().nullable(),
})

export const connectionJson = FileHelper.json(
  {
    base: sdk.volumes.main,
    subpath: 'connection.json',
  },
  shape,
)
