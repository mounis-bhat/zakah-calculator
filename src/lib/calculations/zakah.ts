import {
  GOLD_MAX_PURITY,
  GOLD_NISAB_GRAMS,
  SILVER_MAX_PURITY,
  SILVER_NISAB_GRAMS,
  ZAKAH_RATE,
  type DebtEntry,
  type MetalItem,
  type ZakahState,
  type ZakahSummary,
} from "@/types/zakah";

export function computePureWeight(
  grossWeight: number,
  stoneDeduction: number,
  karat: number,
  maxPurity: number,
): number {
  return (grossWeight - stoneDeduction) * (karat / maxPurity);
}

export function computeItemEstimate(pureWeightGrams: number, spotPricePerGram: number): number {
  return pureWeightGrams * spotPricePerGram;
}

export function computeItemValue(item: MetalItem, spotPricePerGram: number | null): number {
  if (item.useLocalPrice && item.localPricePerUnit !== null) {
    return item.localPricePerUnit * item.quantity;
  }
  // Always recalculate from pure weight when a current price is available
  // so that currency changes and price updates are reflected immediately.
  // Fall back to the stored estimate only when no live price exists.
  if (spotPricePerGram !== null) {
    const maxPurity = item.metal === "gold" ? GOLD_MAX_PURITY : SILVER_MAX_PURITY;
    const pure = computePureWeight(item.grossWeight, item.stoneDeduction, item.karat, maxPurity);
    return pure * spotPricePerGram * item.quantity;
  }
  if (item.estimatedPricePerUnit !== null) {
    return item.estimatedPricePerUnit * item.quantity;
  }
  return 0;
}

export function computeTotalMetalValue(
  items: MetalItem[],
  metal: "gold" | "silver",
  spotPricePerGram: number | null,
): number {
  return items
    .filter((item) => item.metal === metal)
    .reduce((sum, item) => sum + computeItemValue(item, spotPricePerGram), 0);
}

export function computeNisabThreshold(
  method: "silver" | "gold",
  goldPricePerGram: number | null,
  silverPricePerGram: number | null,
): number | null {
  if (method === "silver" && silverPricePerGram !== null) {
    return SILVER_NISAB_GRAMS * silverPricePerGram;
  }
  if (method === "gold" && goldPricePerGram !== null) {
    return GOLD_NISAB_GRAMS * goldPricePerGram;
  }
  return null;
}

export function computeTotalDebts(debts: DebtEntry[]): {
  immediate: number;
  installment: number;
  total: number;
} {
  let immediate = 0;
  let installment = 0;
  for (const d of debts) {
    if (d.category === "immediate") {
      immediate += d.amount;
    } else {
      installment += d.amount * 12;
    }
  }
  return { immediate, installment, total: immediate + installment };
}

export function computeZakahSummary(state: ZakahState): ZakahSummary {
  const effectiveGoldPrice =
    state.priceSourcePreference === "local" && state.manualGoldPrice !== null
      ? state.manualGoldPrice
      : state.spotPriceGold24KPerGram;
  const effectiveSilverPrice =
    state.priceSourcePreference === "local" && state.manualSilverPrice !== null
      ? state.manualSilverPrice
      : state.spotPriceSilverPerGram;

  const totalCash = state.cash.onHand + state.cash.inBank;
  const totalGoldValue = computeTotalMetalValue(state.metalItems, "gold", effectiveGoldPrice);
  const totalSilverValue = computeTotalMetalValue(state.metalItems, "silver", effectiveSilverPrice);
  const totalAssets = totalCash + totalGoldValue + totalSilverValue;

  const debtTotals = computeTotalDebts(state.debts);
  const totalDebts = debtTotals.total;
  const netWealth = totalAssets - totalDebts;

  const nisabThreshold = computeNisabThreshold(
    state.nisabMethod,
    effectiveGoldPrice,
    effectiveSilverPrice,
  );

  const isAboveNisab = nisabThreshold !== null ? netWealth >= nisabThreshold : false;
  const zakahDue = isAboveNisab ? netWealth * ZAKAH_RATE : 0;

  return {
    totalCash,
    totalGoldValue,
    totalSilverValue,
    totalAssets,
    totalImmediateDebts: debtTotals.immediate,
    totalInstallmentDeductions: debtTotals.installment,
    totalDebts,
    netWealth,
    nisabThreshold,
    isAboveNisab,
    zakahDue,
  };
}
