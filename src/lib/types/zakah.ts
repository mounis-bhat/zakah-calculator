export type MetalItemType = "jewelry" | "biscuit" | "coin" | "bar";

export interface MetalItem {
  id: string;
  metal: "gold" | "silver";
  type: MetalItemType;
  karat: number;
  grossWeight: number;
  stoneDeduction: number;
  quantity: number;
  estimatedPricePerUnit: number | null;
  localPricePerUnit: number | null;
  useLocalPrice: boolean;
}

export interface DebtEntry {
  id: string;
  label: string;
  amount: number;
  category: "immediate" | "installment";
}

export interface ZakahState {
  currency: string;
  spotPriceGold24KPerGram: number | null;
  spotPriceSilverPerGram: number | null;
  manualGoldPrice: number | null;
  manualSilverPrice: number | null;
  exchangeRate: number | null;
  cash: {
    onHand: number;
    inBank: number;
  };
  metalItems: MetalItem[];
  debts: DebtEntry[];
  nisabMethod: "silver" | "gold";
}

export interface ZakahSummary {
  totalCash: number;
  totalGoldValue: number;
  totalSilverValue: number;
  totalAssets: number;
  totalImmediateDebts: number;
  totalInstallmentDeductions: number;
  totalDebts: number;
  netWealth: number;
  nisabThreshold: number | null;
  isAboveNisab: boolean;
  zakahDue: number;
}

export const GOLD_NISAB_GRAMS = 87.48;
export const SILVER_NISAB_GRAMS = 595;
export const ZAKAH_RATE = 0.025;
export const TROY_OZ_TO_GRAMS = 31.1035;
export const GOLD_MAX_PURITY = 24;
export const SILVER_MAX_PURITY = 999;
