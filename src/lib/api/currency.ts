import { getCached, PRICE_CACHE_TTL, setCache } from "./cache";

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const cached = getCached<Record<string, number>>("exchange_rates", PRICE_CACHE_TTL);
  if (cached !== null) return cached;

  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Failed to fetch exchange rates");
  const data = await res.json();
  const rates: Record<string, number> = data.rates;
  setCache("exchange_rates", rates);
  return rates;
}
