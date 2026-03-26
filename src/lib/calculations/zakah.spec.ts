import { describe, expect, test } from "vite-plus/test";
import {
  computeItemEstimate,
  computeItemValue,
  computeNisabThreshold,
  computePureWeight,
  computeTotalDebts,
  computeTotalMetalValue,
  computeZakahSummary,
} from "./zakah";
import type { DebtEntry, MetalItem, ZakahState } from "@/types/zakah";
import { GOLD_NISAB_GRAMS, SILVER_NISAB_GRAMS, ZAKAH_RATE } from "@/types/zakah";

function makeGoldItem(overrides: Partial<MetalItem> = {}): MetalItem {
  return {
    id: "test-1",
    metal: "gold",
    type: "jewelry",
    karat: 18,
    grossWeight: 10,
    stoneDeduction: 0,
    quantity: 1,
    estimatedPricePerUnit: null,
    localPricePerUnit: null,
    useLocalPrice: false,
    ...overrides,
  };
}

function makeSilverItem(overrides: Partial<MetalItem> = {}): MetalItem {
  return {
    id: "test-s1",
    metal: "silver",
    type: "bar",
    karat: 999,
    grossWeight: 100,
    stoneDeduction: 0,
    quantity: 1,
    estimatedPricePerUnit: null,
    localPricePerUnit: null,
    useLocalPrice: false,
    ...overrides,
  };
}

function makeDefaultState(overrides: Partial<ZakahState> = {}): ZakahState {
  return {
    currency: "USD",
    priceSourcePreference: "live",
    spotPriceGold24KPerGram: null,
    spotPriceSilverPerGram: null,
    manualGoldPrice: null,
    manualSilverPrice: null,
    exchangeRate: null,
    cash: { onHand: 0, inBank: 0 },
    metalItems: [],
    debts: [],
    nisabMethod: "silver",
    ...overrides,
  };
}

describe("computePureWeight", () => {
  test("18K gold: 10g gross = 7.5g pure", () => {
    expect(computePureWeight(10, 0, 18, 24)).toBeCloseTo(7.5);
  });

  test("22K gold: 10g gross = 9.166g pure", () => {
    expect(computePureWeight(10, 0, 22, 24)).toBeCloseTo(9.1667, 3);
  });

  test("24K gold: no purity loss", () => {
    expect(computePureWeight(10, 0, 24, 24)).toBeCloseTo(10);
  });

  test("stone deduction reduces weight before purity", () => {
    expect(computePureWeight(10, 2, 18, 24)).toBeCloseTo(6.0);
  });

  test("925 silver: 100g gross = 92.5g pure", () => {
    expect(computePureWeight(100, 0, 925, 999)).toBeCloseTo(92.593, 2);
  });

  test("999 silver: near-pure", () => {
    expect(computePureWeight(100, 0, 999, 999)).toBeCloseTo(100);
  });
});

describe("computeItemEstimate", () => {
  test("multiplies pure weight by spot price", () => {
    expect(computeItemEstimate(7.5, 100)).toBe(750);
  });
});

describe("computeItemValue", () => {
  test("uses local price when useLocalPrice is true", () => {
    const item = makeGoldItem({
      localPricePerUnit: 500,
      useLocalPrice: true,
      quantity: 2,
    });
    expect(computeItemValue(item, 100)).toBe(1000);
  });

  test("uses estimatedPricePerUnit when no local price", () => {
    const item = makeGoldItem({
      estimatedPricePerUnit: 700,
      quantity: 1,
    });
    expect(computeItemValue(item, 100)).toBe(700);
  });

  test("falls back to spot price calculation", () => {
    const item = makeGoldItem({
      karat: 24,
      grossWeight: 10,
      quantity: 1,
    });
    // 10g * (24/24) * 100 = 1000
    expect(computeItemValue(item, 100)).toBeCloseTo(1000);
  });

  test("returns 0 when no prices available", () => {
    const item = makeGoldItem();
    expect(computeItemValue(item, null)).toBe(0);
  });

  test("respects quantity in spot fallback", () => {
    const item = makeGoldItem({
      karat: 24,
      grossWeight: 10,
      quantity: 3,
    });
    expect(computeItemValue(item, 100)).toBeCloseTo(3000);
  });
});

describe("computeTotalMetalValue", () => {
  test("sums only items of specified metal", () => {
    const items = [
      makeGoldItem({ id: "g1", karat: 24, grossWeight: 10 }),
      makeSilverItem({ id: "s1", karat: 999, grossWeight: 100 }),
      makeGoldItem({ id: "g2", karat: 24, grossWeight: 5 }),
    ];
    // gold: 10*100 + 5*100 = 1500
    expect(computeTotalMetalValue(items, "gold", 100)).toBeCloseTo(1500);
  });

  test("returns 0 for no items", () => {
    expect(computeTotalMetalValue([], "gold", 100)).toBe(0);
  });
});

describe("computeNisabThreshold", () => {
  test("silver nisab = 595g * silver price", () => {
    expect(computeNisabThreshold("silver", 100, 1)).toBe(SILVER_NISAB_GRAMS * 1);
  });

  test("gold nisab = 87.48g * gold price", () => {
    expect(computeNisabThreshold("gold", 100, 1)).toBe(GOLD_NISAB_GRAMS * 100);
  });

  test("returns null when relevant price is missing", () => {
    expect(computeNisabThreshold("silver", 100, null)).toBeNull();
    expect(computeNisabThreshold("gold", null, 1)).toBeNull();
  });
});

describe("computeTotalDebts", () => {
  test("sums immediate debts directly", () => {
    const debts: DebtEntry[] = [
      { id: "d1", label: "Rent", amount: 1000, category: "immediate" },
      { id: "d2", label: "Loan", amount: 500, category: "immediate" },
    ];
    const result = computeTotalDebts(debts);
    expect(result.immediate).toBe(1500);
    expect(result.installment).toBe(0);
    expect(result.total).toBe(1500);
  });

  test("multiplies installments by 12", () => {
    const debts: DebtEntry[] = [
      {
        id: "d1",
        label: "Car payment",
        amount: 300,
        category: "installment",
      },
    ];
    const result = computeTotalDebts(debts);
    expect(result.immediate).toBe(0);
    expect(result.installment).toBe(3600);
    expect(result.total).toBe(3600);
  });

  test("handles mixed debts", () => {
    const debts: DebtEntry[] = [
      { id: "d1", label: "Rent", amount: 1000, category: "immediate" },
      {
        id: "d2",
        label: "Mortgage",
        amount: 2000,
        category: "installment",
      },
    ];
    const result = computeTotalDebts(debts);
    expect(result.immediate).toBe(1000);
    expect(result.installment).toBe(24000);
    expect(result.total).toBe(25000);
  });

  test("empty array returns zeros", () => {
    const result = computeTotalDebts([]);
    expect(result.total).toBe(0);
  });
});

describe("computeZakahSummary", () => {
  test("basic scenario: cash only, above nisab", () => {
    const state = makeDefaultState({
      cash: { onHand: 1000, inBank: 5000 },
      manualSilverPrice: 1, // nisab = 595 * 1 = 595
      nisabMethod: "silver",
    });
    const summary = computeZakahSummary(state);
    expect(summary.totalCash).toBe(6000);
    expect(summary.totalAssets).toBe(6000);
    expect(summary.netWealth).toBe(6000);
    expect(summary.nisabThreshold).toBe(595);
    expect(summary.isAboveNisab).toBe(true);
    expect(summary.zakahDue).toBeCloseTo(6000 * ZAKAH_RATE);
  });

  test("below nisab: no zakah due", () => {
    const state = makeDefaultState({
      cash: { onHand: 100, inBank: 0 },
      manualSilverPrice: 1,
      nisabMethod: "silver",
    });
    const summary = computeZakahSummary(state);
    expect(summary.isAboveNisab).toBe(false);
    expect(summary.zakahDue).toBe(0);
  });

  test("debts reduce net wealth below nisab", () => {
    const state = makeDefaultState({
      cash: { onHand: 1000, inBank: 0 },
      manualSilverPrice: 1,
      debts: [{ id: "d1", label: "Loan", amount: 500, category: "immediate" }],
    });
    const summary = computeZakahSummary(state);
    expect(summary.netWealth).toBe(500);
    expect(summary.isAboveNisab).toBe(false);
    expect(summary.zakahDue).toBe(0);
  });

  test("gold items contribute to total assets", () => {
    const state = makeDefaultState({
      manualGoldPrice: 100,
      manualSilverPrice: 1,
      metalItems: [makeGoldItem({ karat: 24, grossWeight: 10, quantity: 1 })],
    });
    const summary = computeZakahSummary(state);
    // 10g * 100 = 1000
    expect(summary.totalGoldValue).toBeCloseTo(1000);
    expect(summary.totalAssets).toBeCloseTo(1000);
  });

  test("manual prices override spot prices in local mode", () => {
    const state = makeDefaultState({
      priceSourcePreference: "local",
      spotPriceGold24KPerGram: 50,
      manualGoldPrice: 100,
      manualSilverPrice: 1,
      metalItems: [makeGoldItem({ karat: 24, grossWeight: 10, quantity: 1 })],
    });
    const summary = computeZakahSummary(state);
    // Uses manual price (100), not spot (50)
    expect(summary.totalGoldValue).toBeCloseTo(1000);
  });

  test("live mode keeps using fetched spot prices", () => {
    const state = makeDefaultState({
      priceSourcePreference: "live",
      spotPriceGold24KPerGram: 50,
      manualGoldPrice: 100,
      spotPriceSilverPerGram: 1,
      manualSilverPrice: 3,
      metalItems: [makeGoldItem({ karat: 24, grossWeight: 10, quantity: 1 })],
    });

    const summary = computeZakahSummary(state);

    expect(summary.totalGoldValue).toBeCloseTo(500);
    expect(summary.nisabThreshold).toBeCloseTo(595);
  });

  test("null nisab threshold when no prices", () => {
    const state = makeDefaultState();
    const summary = computeZakahSummary(state);
    expect(summary.nisabThreshold).toBeNull();
    expect(summary.isAboveNisab).toBe(false);
    expect(summary.zakahDue).toBe(0);
  });
});
