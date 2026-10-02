/**
 * Minimal OANDA v20 REST API client.
 *
 * Requires OANDA_API_TOKEN in the environment (a personal access token from
 * your OANDA account, "Manage API Access" in account settings). Each user's
 * own account id + environment live in BrokerAccount (prisma/schema.prisma)
 * — this scaffold uses one shared API token with per-user account ids,
 * which matches how OANDA's practice/live API tokens work.
 *
 * Docs: https://developer.oanda.com/rest-live-v20/introduction/
 */

type OandaEnv = "practice" | "live";

function baseUrl(env: OandaEnv) {
  return env === "live"
    ? "https://api-fxtrade.oanda.com"
    : "https://api-fxpractice.oanda.com";
}

function token() {
  const t = process.env.OANDA_API_TOKEN;
  if (!t) {
    throw new Error(
      "OANDA_API_TOKEN is not set. Add it to .env.local — see .env.example."
    );
  }
  return t;
}

async function oandaFetch(env: OandaEnv, path: string, init: RequestInit = {}) {
  const res = await fetch(`${baseUrl(env)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    // Account data changes constantly — never cache.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OANDA API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function getAccountSummary(env: OandaEnv, accountId: string) {
  const data = await oandaFetch(env, `/v3/accounts/${accountId}/summary`);
  return data.account as {
    balance: string;
    NAV: string;
    unrealizedPL: string;
    marginUsed: string;
    marginAvailable: string;
    openTradeCount: number;
    openPositionCount: number;
    currency: string;
  };
}

export async function getOpenTrades(env: OandaEnv, accountId: string) {
  const data = await oandaFetch(env, `/v3/accounts/${accountId}/openTrades`);
  return data.trades as Array<{
    id: string;
    instrument: string;
    price: string;
    currentUnits: string;
    unrealizedPL: string;
    openTime: string;
  }>;
}

export async function getCandles(
  env: OandaEnv,
  instrument: string,
  count = 60,
  granularity = "H1"
) {
  const data = await oandaFetch(
    env,
    `/v3/instruments/${instrument}/candles?count=${count}&granularity=${granularity}&price=M`
  );
  return data.candles as Array<{
    time: string;
    mid: { o: string; h: string; l: string; c: string };
    complete: boolean;
  }>;
}

/**
 * Places a market order. This sends a REAL order to the account's
 * environment (practice or live) — used by lib/bot-engine.ts. Double-check
 * `environment` is "practice" before ever wiring this to run unattended.
 */
export async function placeMarketOrder(
  env: OandaEnv,
  accountId: string,
  instrument: string,
  units: number // positive = buy, negative = sell
) {
  const data = await oandaFetch(env, `/v3/accounts/${accountId}/orders`, {
    method: "POST",
    body: JSON.stringify({
      order: {
        type: "MARKET",
        instrument,
        units: String(units),
        timeInForce: "FOK",
        positionFill: "DEFAULT",
      },
    }),
  });
  return data;
}
