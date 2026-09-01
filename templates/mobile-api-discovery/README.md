# Mobile API discovery (Expo)

Stop hardcoding the dev server's address in a mobile app. The phone works out
both the **host** and the **port** of the local API on its own, so a new LAN IP,
a DHCP lease change, or an isolated server on a different port costs nothing —
no `.env` edit, no rebuild, no typing a URL on a phone keyboard.

Extracted from Inkwell (pcp), which extended the host-only version in inkread.

## The problem it solves

An Expo app has no way to know where the API lives, and each usual answer fails
somewhere:

| Approach | Fails when |
| --- | --- |
| `localhost` | On a device, localhost is the phone. Only works in a simulator. |
| Hardcoded LAN IP in `.env.local` | The lease changes, or you move network. Silent until login fails. |
| Hardcoded port | You run an isolated server on another port. The URL is well-formed and points at nothing. |
| Probing a list of candidate ports | Slow at startup, and stale the moment someone picks a new base. |

## How it works

Two facts the phone cannot deduce are captured on the dev machine at bundle
time, by `app.config.js`, and read at runtime through `expo-constants`:

- **`extra.apiPort`** — from the env var that launches your API. Metro starts
  from that same shell, so this is a fact rather than a guess. Metro's own port
  (8081) is unrelated to the API's and is deliberately not used.
- **`extra.lanHost`** — this machine's LAN IPv4, preferring `en0`/`en1` so a
  Docker bridge or VPN adapter cannot win.

At runtime `resolveApiUrl` picks the first tier that applies:

1. `EXPO_PUBLIC_API_URL` — explicit override always wins.
2. **The Metro host** — a dev build is already talking to the dev machine, and
   the API is on it. This is what follows a changing IP with no rebuild. Five
   Expo fields are tried (`hostUri`, `expoGoConfig.debuggerHost`,
   `manifest.debuggerHost`, `manifest2…debuggerHost`, `linkingUri`) because
   which one is populated varies by runtime, and reading only one lands you on
   loopback.
3. **`extra.lanHost`** — the baked address. This is what saves a build
   installed on a device, which has no Metro to ask. Ranked below Metro on
   purpose, so a dev build prefers live truth over a build-time snapshot.
4. `extra.productionApiUrl` — a real deployment.
5. Loopback — last resort, and the resolver reports `source` so the UI can
   explain why rather than emitting a generic network error.

Tiers 3 and 4 **swap order with the build**, which is the whole reason `isDev`
is a parameter. A dev build prefers the LAN address; a release build prefers the
configured production URL and keeps LAN only as a fallback. Get this wrong and a
shipped app addresses the laptop that built it, and `productionApiUrl` can never
take effect no matter what anyone sets.

## Files → destinations

| File | Destination |
| --- | --- |
| `app.config.js` | `packages/mobile/app.config.js` (keep static config in `app.json`; this spreads it and adds `extra`) |
| `resolveApiUrl.ts` | `packages/mobile/src/lib/resolveApiUrl.ts` |
| `resolveApiUrl.test.ts` | beside it |

Then wire it where your HTTP client builds its base URL:

```ts
import Constants from 'expo-constants';
import { resolveApiUrl, describeApiUrlProblem } from './resolveApiUrl';

const constantsAny = Constants as unknown as Record<string, any>;

const resolved = resolveApiUrl({
  explicit: process.env.EXPO_PUBLIC_API_URL,
  metroHostCandidates: [
    Constants.expoConfig?.hostUri,
    constantsAny.expoGoConfig?.debuggerHost,
    constantsAny.manifest?.debuggerHost,
    constantsAny.manifest2?.extra?.expoGo?.debuggerHost,
    Constants.linkingUri,
  ],
  lanHost: Constants.expoConfig?.extra?.lanHost,
  productionApiUrl: Constants.expoConfig?.extra?.productionApiUrl,
  isDev: __DEV__,
  port: Number(Constants.expoConfig?.extra?.apiPort) || 3001,
});

export const API_URL = resolved.url;
export const API_URL_HINT = describeApiUrlProblem(resolved, __DEV__);
```

## Change for your project

- `PORT_ENV_VARS` and `DEFAULT_PORT` at the top of `app.config.js`. List every
  name your server accepts, **most canonical first, mirroring the server's own
  precedence** — if the two drift, the app addresses a different server than
  the one running, which looks exactly like the server being down.
- Requires `expo-constants` (already a dependency of any Expo app).

## Verify it, don't assume it

`expo config` runs the real resolver, so check the values rather than trusting
the file:

```bash
npx expo config --type public --json | jq '.extra'          # apiPort + lanHost
INK_PORT_BASE=4801 npx expo config --type public --json | jq '.extra.apiPort'
INK_PORT_BASE= PCP_PORT_BASE=4801 npx expo config --type public --json | jq '.extra.apiPort'
```

## Gotchas learned the hard way

- **Expo turns a JSON `null` in `extra` into `{}`.** So `"productionApiUrl":
  null` in app.json arrives as an object, and `{}?.trim()` does **not**
  short-circuit — it throws. That happens at module import, so a release build
  dies on launch with no useful message. The resolver takes these as `unknown`
  and narrows them for exactly this reason; keep that if you edit it.
- **`hostUri` alone is not enough.** It is documented as dev-only and is absent
  in several runtimes. Read all the candidates.
- **Loopback is a real answer in a simulator and a wrong one on hardware**, so
  the resolver returns a `source` and a human-readable hint instead of silently
  proceeding.
- **iOS blocks cleartext by default.** For `http://` on a LAN address, set
  `ios.infoPlist.NSAppTransportSecurity` to
  `{ "NSAllowsArbitraryLoads": false, "NSAllowsLocalNetworking": true }` —
  local networking only, not a blanket exemption.
- **Android emulator is not handled.** A Metro host of `localhost` (adb
  reverse) resolves to the emulator itself; map it to `10.0.2.2` if you target
  Android.
