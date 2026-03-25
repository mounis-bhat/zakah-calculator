import { TROY_OZ_TO_GRAMS } from "@/types/zakah";
import { getCached, PRICE_CACHE_TTL, setCache } from "./cache";

export function convertToPerGram(pricePerOz: number): number {
  return pricePerOz / TROY_OZ_TO_GRAMS;
}

export async function fetchGoldPrice(): Promise<number> {
  const cached = getCached<number>("gold_price", PRICE_CACHE_TTL);
  if (cached !== null) return cached;

  const res = await fetch("https://api.gold-api.com/price/XAU");
  if (!res.ok) throw new Error("Failed to fetch gold price");
  const data = await res.json();
  const price: number = data.price;
  setCache("gold_price", price);
  return price;
}

export async function fetchSilverPrice(): Promise<number> {
  const cached = getCached<number>("silver_price", PRICE_CACHE_TTL);
  if (cached !== null) return cached;

  const res = await fetch("https://api.gold-api.com/price/XAG");
  if (!res.ok) throw new Error("Failed to fetch silver price");
  const data = await res.json();
  const price: number = data.price;
  setCache("silver_price", price);
  return price;
}
