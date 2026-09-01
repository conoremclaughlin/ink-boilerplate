const os = require('os');

/**
 * Dynamic app config — its job is to capture, at bundle time, two facts about
 * the machine serving the app that the phone cannot work out for itself.
 *
 * Everything static still lives in app.json; this file only adds `extra`.
 *
 * ## Why the port has to come from here
 *
 * The runtime resolver derives the API HOST from Metro (see
 * src/lib/resolveApiUrl.ts) — the phone is already talking to the dev machine,
 * so the API is on that same machine. It cannot derive the PORT the same way:
 * Metro's port (8081) has nothing to do with the API's, and probing a guessed
 * list of ports is both slow and wrong the moment someone picks a new base.
 *
 * But the shell that starts the server already knows the answer. If your repo
 * launches its API with an env var for the port (a PORT_BASE convention, or
 * plain PORT), Metro is started from that same environment — so reading it
 * here is a fact rather than a guess.
 *
 * CHANGE FOR YOUR PROJECT: the env var name and the default below.
 *
 * ## Why the LAN IP is baked
 *
 * A release build on a physical device has no Metro host, so host derivation
 * has nothing to work from and falls back to loopback — which on a phone is
 * the phone itself, and fails with a confusing network error. Recording the
 * dev machine's LAN address at build time gives that case something real to
 * fall back to. It is deliberately ranked BELOW the Metro host so a dev build
 * still follows a changing DHCP lease without a rebuild.
 */

/** Port the API listens on, from the environment that launched Metro. */
const PORT_ENV_VAR = 'PCP_PORT_BASE'; // e.g. INKREAD_PORT_BASE, API_PORT
const DEFAULT_PORT = 3001; // your project's main dev API port

function apiPort() {
  const base = Number.parseInt(process.env[PORT_ENV_VAR] ?? '', 10);
  return Number.isInteger(base) && base > 0 && base < 65536 ? base : DEFAULT_PORT;
}

/**
 * This machine's LAN IPv4, preferring macOS Wi-Fi/Ethernet.
 *
 * Interface order matters: a Docker bridge or VPN adapter is also a
 * non-internal IPv4, and picking one produces an address the phone cannot
 * reach. en0/en1 first, then anything else, and never an internal one.
 */
function lanHost() {
  const interfaces = os.networkInterfaces();
  const preferred = ['en0', 'en1'];
  const names = [...preferred, ...Object.keys(interfaces).filter((n) => !preferred.includes(n))];
  for (const name of names) {
    for (const info of interfaces[name] ?? []) {
      const isIpv4 = info.family === 'IPv4' || info.family === 4;
      if (isIpv4 && !info.internal) return info.address;
    }
  }
  return null;
}

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiPort: apiPort(),
    lanHost: lanHost(),
  },
});
