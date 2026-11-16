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

| Subcontainer  | Image    | Purpose                                                                         |
| ------------- | -------- | ------------------------------------------------------------------------------- |
| `pogolo-sub`  | `pogolo` | The `primary` daemon: pogolo itself                                             |
| `ui-sub`      | `nginx`  | The `ui` daemon: serves the dashboard and proxies `/api/` to pogolo             |
| `sampler-sub` | `nginx`  | The `sampler` daemon: appends the pool hashrate to `hashrate.csv` once a minute |

pogolo runs with `NO_COLOR=1`. Upstream still emits a few ANSI bold/reset sequences, so log lines can end in `[0m`; that is cosmetic.

pogolo keeps no history, so the sampler reads `/api/v1/info` every minute and appends `unix_seconds,hashrate` to `/data/hashrate.csv`, keeping the last 7 days. nginx serves that file as `/history.csv` for the dashboard's graph.

## Volume and Data Layout

One volume holds pogolo's config and the dashboard's history; Bitcoin's volume is mounted read-only for its RPC cookie.

| Volume              | Mount Point     | Purpose                                                      |
| ------------------- | --------------- | ------------------------------------------------------------ |
| `main`              | `/data`         | `pogolo.toml`, `hashrate.csv`. Read-only in `ui-sub`         |
| `bitcoind` / `main` | `/mnt/bitcoind` | Read-only, in `pogolo-sub` only, for Bitcoin's RPC `.cookie` |

pogolo has no database: miners, shares and found blocks live in memory and reset on every restart.

## File Models

The package owns one file, `pogolo.toml` on the `main` volume (`startos/fileModels/pogolo.toml.ts`).

It is seeded with defaults on install and merged back into shape on every init. The package re-asserts `backend.cookie`, `pogolo.host`, `pogolo.port` and `pogolo.http_port` — a hand edit to those reverts. Every other modeled key (`tag`, `pool_address`, `password`, `default_difficulty`, `job_interval`, `target_share_interval`, `backend.poll_interval`) is the user's, written by the Configure action. `job_interval` and `target_share_interval` are capped at 65535 because upstream parses them as uint16 since v1.1.7. Upstream keys the package does not model (`share_batch_window`, `wait_for_sync`, `authority_keypair`, `disable_vardiff`, `ignore_suggested_difficulty`, `extranonce2_size`, …) survive a hand edit and an action write.

pogolo refuses to start on a key it does not recognise, so a misspelled hand-added key stops the service with `unknown keys in config` in the log.

The Bitcoin RPC host and ZMQ endpoint are not in the file: `main.ts` resolves them from Bitcoin's bridge addresses at each start and passes them as `POGOLO_BACKEND_HOST` and `POGOLO_BACKEND_ZMQHOST`, which override the file. Any edit to `pogolo.toml` restarts the service.

## Dependencies

pogolo needs Bitcoin for block templates, block notifications and block submission.

| Dependency           | Required     | Health checks that must pass | Mount                                | Purpose                                                |
| -------------------- | ------------ | ---------------------------- | ------------------------------------ | ------------------------------------------------------ |
| Bitcoin (`bitcoind`) | yes, running | `bitcoind`, `sync-progress`  | `main` at `/mnt/bitcoind`, read-only | RPC (cookie auth), `getblocktemplate`, ZMQ `hashblock` |

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

The `main` volume is copied wholesale: `pogolo.toml` and `hashrate.csv`.

Nothing else needs rebuilding — pogolo keeps no state of its own, and miners reconnect after the restore. Bitcoin must be installed, synced and have ZMQ enabled before the restored service will start.

## Limitations and Differences

1. Only the JSON-RPC + ZMQ backend is wired up; upstream's btcd websocket backend is not available.
2. The `host` listen setting is fixed to `::`: pogolo's Stratum and HTTP API listeners accept both IPv4 and IPv6 inside its container.
3. The dashboard and hashrate history are this package's own, not upstream's. History covers only the time the service was running; gaps longer than three minutes are drawn as breaks.
4. pogolo prints the Stratum V1 password in its log when one is set.
5. pogolo generates a new Stratum V2 authority key on every start and never publishes it, so a V2 client that verifies the pool's authority key cannot connect: the handshake fails with `Invalid Certificate`. Start9's Stratum V2 package (SRI Translator) is one such client. This is upstream behavior.

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
