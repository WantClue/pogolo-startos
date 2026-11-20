# pogolo

pogolo needs a fully synced **Bitcoin** with ZMQ enabled, and does not start until Bitcoin has finished syncing.

## Documentation

- [pogolo README](https://github.com/0xf0xx0/pogolo/blob/logopo/README.MD) — the upstream guide, including the config file reference.

## Getting set up

1. When Bitcoin shows a task asking to enable ZMQ for pogolo, run it.
2. Optionally open **Actions → Configure** to set a default payout address and your coinbase tag.
3. Open the **Web UI** and follow **Connect your miners**.

## Connecting miners

Open the **Web UI**. The **Connect your miners** card at the top lists everything a miner needs, with a copy button for each:

- the Stratum V1 URL (`stratum+tcp://…`), and the host and port separately for miners such as Bitaxe that ask for them apart
- the Stratum V2 URL (`stratum2+tcp://…`) and the pool's **authority public key**, for Stratum V2 miners and proxies that ask for one
- what to use as username and password

If your server has more than one address, pick the one your miners can reach from the list. Use a LAN address — miners cannot connect over Tor. If the card has no address, enable a LAN address under **Interfaces → Stratum Server** in StartOS.

Use your Bitcoin address followed by a worker name as the username, for example `bc1q….worker1`. Every block found pays the address before the dot. Always include the `.worker1` part: pogolo 1.1.7 treats a bare address as an invalid username. With no default payout address, the channel or login is refused. With a default payout address, a bare address or any other invalid username mines to that default instead — not to the address in the username.

## Watching the pool

The **Web UI** interface is the pool dashboard: total hashrate with a graph of the last hour, day or week, every connected miner with its hashrate, difficulty and shares, and any blocks found. Connected miners and found blocks reset when pogolo restarts; the hashrate graph keeps a week of history.

The **API** interface serves the same statistics as JSON at `/api/v1/info`.

## Actions

- **Configure** — default payout address, coinbase tag, Stratum V1 password, and difficulty and timing. Saving restarts pogolo; your miners reconnect on their own.

## Limitations

- pogolo is meant for your own network. Stratum is not encrypted, so don't expose the Stratum Server to the internet.
- If you set a Stratum V1 password, it appears in pogolo's logs.
- The authority public key stays the same across restarts and backups. Stratum V2 miners that check it won't connect without it — copy it from the dashboard.
