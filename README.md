<p align="center">
  <img src="icon.svg" alt="pogolo Logo" width="21%">
</p>

# pogolo on StartOS

> Everything not listed in this document should behave the same as upstream
> pogolo. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

[pogolo](https://github.com/0xf0xx0/pogolo) is a solo, db-less Bitcoin mining pool meant for LAN swarms. It speaks Stratum V1 and Stratum V2 on the same port. This package adds a dashboard of its own, since upstream ships none.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

pogolo runs from the unmodified upstream image; an nginx image serves the package's dashboard and records hashrate history.

| Property      | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Images        | `0xf0xx0/pogolo` (upstream, unmodified); `nginx` (Alpine variant) |
| Architectures | x86_64, aarch64                                                   |
| Entrypoint    | `/pogolo --conf /data/pogolo.toml`                                |

| Subcontainer  | Image    | Purpose                                                                                |
| ------------- | -------- | -------------------------------------------------------------------------------------- |
| `pogolo-sub`  | `pogolo` | The `primary` daemon: pogolo itself                                                    |
| `ui-sub`      | `nginx`  | The `ui` daemon: serves the dashboard and `connection.json`, proxies `/api/` to pogolo |
| `sampler-sub` | `nginx`  | The `sampler` daemon: appends the pool hashrate to `hashrate.csv` once a minute        |

pogolo runs with `NO_COLOR=1`. Upstream still emits a few ANSI bold/reset sequences, so log lines can end in `[0m`; that is cosmetic.

pogolo keeps no history, so the sampler reads `/api/v1/info` every minute and appends `unix_seconds,hashrate` to `/data/hashrate.csv`, keeping the last 7 days. nginx serves that file as `/history.csv` for the dashboard's graph.

## Volume and Data Layout

One volume holds pogolo's config and the dashboard's history; Bitcoin's `public` volume, which holds only what it publishes for dependents, is mounted read-only for its RPC cookie.

| Volume                | Mount Point     | Purpose                                                                 |
| --------------------- | --------------- | ----------------------------------------------------------------------- |
| `main`                | `/data`         | `pogolo.toml`, `hashrate.csv`, `connection.json`. Read-only in `ui-sub` |
| `bitcoind` / `public` | `/mnt/bitcoind` | Read-only, in `pogolo-sub` only, for Bitcoin's RPC `.cookie`            |

pogolo has no database: miners, shares and found blocks live in memory and reset on every restart.

## File Models

The package owns two files on the `main` volume: `pogolo.toml` (`startos/fileModels/pogolo.toml.ts`), pogolo's config, and `connection.json` (`startos/fileModels/connection.json.ts`), which only feeds the dashboard.

It is seeded with defaults on install and merged back into shape on every init. The package re-asserts `backend.cookie`, `pogolo.host`, `pogolo.port` and `pogolo.http_port` — a hand edit to those reverts. Every other modeled key (`tag`, `pool_address`, `password`, `default_difficulty`, `job_interval`, `target_share_interval`, `backend.poll_interval`) is the user's, written by the Configure action. `job_interval` is capped at 65535 because upstream parses it as uint16. `target_share_interval` is capped at 65 seconds because v1.1.7 multiplies its uint16 value by 1000 before converting to floating point; larger values overflow. Init resets an out-of-range target share interval to the 5-second default. `authority_keypair` is generated once at init (see [Installation and First-Run Flow](#installation-and-first-run-flow)); a value that is not even-length hex is dropped and a new key generated, since pogolo would refuse to start on it. Upstream keys the package does not model (`share_batch_window`, `wait_for_sync`, `disable_vardiff`, `ignore_suggested_difficulty`, `extranonce2_size`, …) survive a hand edit and an action write.

pogolo refuses to start on a key it does not recognise, so a misspelled hand-added key stops the service with `unknown keys in config` in the log.

`connection.json` is rewritten by `main.ts` on every start, and again whenever the Stratum Server's addresses change (without restarting pogolo). It holds the interface's enabled private, non-local addresses with their StartOS-assigned port, whether a Stratum V1 password is set, and the default payout address. Hostnames are unbracketed, including IPv6; the dashboard adds brackets when formatting host-and-port pairs. nginx serves it as `/connection.json` to the dashboard's **Connect your miners** card. Nothing reads it back. With no enabled LAN Stratum address, the card shows no connection endpoint and directs the user to the Stratum Server interface. It never guesses an endpoint from the Web UI address. If the metadata cannot be fetched, the card also leaves the password requirement unknown.

The Bitcoin RPC host and ZMQ endpoint are not in the file: `main.ts` resolves them from Bitcoin's bridge addresses at each start and passes them as `POGOLO_BACKEND_HOST` and `POGOLO_BACKEND_ZMQHOST`, which override the file. Any edit to `pogolo.toml` restarts the service.

## Dependencies

pogolo needs Bitcoin for block templates, block notifications and block submission.

| Dependency           | Required     | Health checks that must pass | Mount                                  | Purpose                                                |
| -------------------- | ------------ | ---------------------------- | -------------------------------------- | ------------------------------------------------------ |
| Bitcoin (`bitcoind`) | yes, running | `bitcoind`, `sync-progress`  | `public` at `/mnt/bitcoind`, read-only | RPC (cookie auth), `getblocktemplate`, ZMQ `hashblock` |

Because `sync-progress` is required, pogolo does not start until Bitcoin has finished its initial sync. Bitcoin rewrites its cookie on every restart; pogolo restarts with it to re-read the cookie.

## Network Access and Interfaces

All three interfaces are on the `main` host.

| Interface      | Id        | Type | Internal port | Protocol                                                                        |
| -------------- | --------- | ---- | ------------- | ------------------------------------------------------------------------------- |
| Stratum Server | `stratum` | api  | 5661          | Raw TCP, Stratum V1 and V2 on the same port; no TLS                             |
| API            | `api`     | api  | 5662          | HTTP, read-only: `/api/v1/info`, `/api/v1/gophers`, `/openapi.yaml`, `/metrics` |
| Web UI         | `ui`      | ui   | 5663          | HTTP, the package's dashboard                                                   |

Stratum keeps 5661 as its external port. The API and Web UI are offered on StartOS-assigned HTTPS ports; neither requires a login.

## Installation and First-Run Flow

There is no setup wizard and no credential. pogolo starts with upstream defaults and no default payout address, so every miner must use its own Bitcoin address as its username until one is set in Configure.

On install, the package asks Bitcoin to enable ZMQ (see [Tasks](#tasks)). pogolo then waits on Bitcoin being fully synced before it starts.

On every init, if `pogolo.toml` has no `authority_keypair`, the package runs `pogolo --generate-authority-key` once in a temporary pogolo subcontainer and stores the keypair. pogolo then keeps the same Stratum V2 authority key across restarts and reports its public half as `authorityPubkey` in `/api/v1/info`, which the dashboard shows. If generation fails, init logs `Could not generate a Stratum V2 authority key` and continues; pogolo falls back to a per-start key, and the next init retries.

The dashboard's **Connect your miners** card shows the Stratum V1 and V2 URLs, host and port, the authority public key, and the username and password rules. It opens on its own while no miner is connected.

## Actions

The package has one action.

**Configure** (`config`) — run it to set a default payout address (for miners that do not supply one), the coinbase tag, a Stratum V1 password, or difficulty and timing. It rewrites the modeled keys of `pogolo.toml` and leaves any other key alone. Saving restarts pogolo, which drops every connected miner; they reconnect on their own. Safe to repeat. Returns nothing. The form checks the payout address's syntax; pogolo checks it again at start and exits if it cannot decode it.

## Tasks

The package raises one task, on Bitcoin.

| Task                         | Severity | Raised when                  | Cleared by                                                           |
| ---------------------------- | -------- | ---------------------------- | -------------------------------------------------------------------- |
| Bitcoin → **Auto-Configure** | critical | Bitcoin's ZMQ is not enabled | Running Bitcoin's Auto-Configure with ZMQ on (the task pre-fills it) |

The task appears on **Bitcoin's** page, not pogolo's, and blocks Bitcoin from starting until it is run. It returns whenever ZMQ is switched off again.

## Health Checks

Two checks are shown; the sampler has none.

| Check     | Displayed      | Probe                  | Grace period |
| --------- | -------------- | ---------------------- | ------------ |
| `primary` | Stratum Server | Port 5661 is listening | 30 s         |
| `ui`      | Web Interface  | Port 5663 is listening | default      |

pogolo listens as soon as it has connected to Bitcoin, so a failing **Stratum Server** after the grace period means pogolo exited — read the log for the reason. The usual ones are `unknown keys in config` (a hand edit), a default payout address pogolo cannot decode for Bitcoin's chain, or `failed to connect to backend`. A failing **Web Interface** means nginx did not start; the dashboard's graph and stats also go blank while pogolo is down, since nginx proxies them.

## Backups and Restore

The `main` volume is copied wholesale: `pogolo.toml` (including the Stratum V2 authority keypair, so miners configured with its public key keep working after a restore), `hashrate.csv` and `connection.json`.

Nothing else needs rebuilding — pogolo keeps no state of its own, and miners reconnect after the restore. Bitcoin must be installed, synced and have ZMQ enabled before the restored service will start.

## Limitations and Differences

1. Only the JSON-RPC + ZMQ backend is wired up; upstream's btcd websocket backend is not available.
2. The `host` listen setting is fixed to `::`: pogolo's Stratum and HTTP API listeners accept both IPv4 and IPv6 inside its container.
3. The dashboard and hashrate history are this package's own, not upstream's. History covers only the time the service was running; gaps longer than three minutes are drawn as breaks.
4. pogolo prints the Stratum V1 password in its log when one is set.
5. pogolo 1.1.7 rejects a username with no `.` (a bare address), whether or not it is a valid address: Stratum V2 miners get `OpenStandardMiningChannel.Error` (`0x12`), Stratum V1 miners an `Unprocessable` error, and pogolo logs `failed decoding address`. If a default payout address is set, such a miner instead mines to the default address. Upstream regression from commit `d49e620`, fixed on upstream `logopo` (Nov 2026) but not yet in a tag; the workaround is `address.worker`.
6. A Stratum V2 client that verifies the pool's authority key must be given the public key shown on the dashboard (or `authorityPubkey` in `/api/v1/info`); without it the handshake fails with `Invalid Certificate`. Deleting `authority_keypair` from `pogolo.toml` makes init generate a new key, and every such client must then be updated.

---

## Quick Reference for AI Consumers

```yaml
package_id: pogolo
image: 0xf0xx0/pogolo
architectures: [x86_64, aarch64]
subcontainers: [pogolo-sub, ui-sub, sampler-sub]
volumes:
  main: /data
file_models:
  - /data/pogolo.toml
  - /data/connection.json
startos_managed_env_vars:
  - POGOLO_BACKEND_HOST
  - POGOLO_BACKEND_ZMQHOST
  - NO_COLOR
dependencies: [bitcoind]
interfaces:
  stratum: { type: api, port: 5661 }
  api: { type: api, port: 5662 }
  ui: { type: ui, port: 5663 }
actions:
  - config
tasks:
  - { action: bitcoind/autoconfig, severity: critical }
health_checks:
  - primary
  - ui
```
