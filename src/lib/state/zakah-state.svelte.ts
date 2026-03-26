import { computeZakahSummary } from "@/calculations/zakah";
import type { DebtEntry, MetalItem, ZakahState, ZakahSummary } from "@/types/zakah";

const STORAGE_KEY = "zakah_calculator_state";

function createDefaultState(): ZakahState {
  return {
    currency: "USD",
    spotPriceGold24KPerGram: null,
    spotPriceSilverPerGram: null,
    manualGoldPrice: null,
    manualSilverPrice: null,
    exchangeRate: null,
    cash: { onHand: 0, inBank: 0 },
    metalItems: [],
    debts: [],
    nisabMethod: "silver",
  };
}

class ZakahStore {
  hasSavedState = $state(false);

  // Setup
  currency = $state("USD");
  spotPriceGold24KPerGram = $state<number | null>(null);
  spotPriceSilverPerGram = $state<number | null>(null);
  manualGoldPrice = $state<number | null>(null);
  manualSilverPrice = $state<number | null>(null);
  exchangeRate = $state<number | null>(null);

  // Assets
  cash = $state({ onHand: 0, inBank: 0 });
  metalItems = $state<MetalItem[]>([]);

  // Deductions
  debts = $state<DebtEntry[]>([]);

  // Settings
  nisabMethod = $state<"silver" | "gold">("silver");

  // Derived values
  effectiveGoldPrice = $derived(this.manualGoldPrice ?? this.spotPriceGold24KPerGram);
  effectiveSilverPrice = $derived(this.manualSilverPrice ?? this.spotPriceSilverPerGram);
  summary: ZakahSummary = $derived(computeZakahSummary(this.toState()));

  // Metal item methods
  addMetalItem(item: MetalItem): void {
    this.metalItems = [...this.metalItems, item];
  }

  updateMetalItem(id: string, updates: Partial<MetalItem>): void {
    this.metalItems = this.metalItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
  }

  removeMetalItem(id: string): void {
    this.metalItems = this.metalItems.filter((item) => item.id !== id);
  }

  // Debt methods
  addDebt(debt: DebtEntry): void {
    this.debts = [...this.debts, debt];
  }

  updateDebt(id: string, updates: Partial<DebtEntry>): void {
    this.debts = this.debts.map((d) => (d.id === id ? { ...d, ...updates } : d));
  }

  removeDebt(id: string): void {
    this.debts = this.debts.filter((d) => d.id !== id);
  }

  // Serialization
  toState(): ZakahState {
    return {
      currency: this.currency,
      spotPriceGold24KPerGram: this.spotPriceGold24KPerGram,
      spotPriceSilverPerGram: this.spotPriceSilverPerGram,
      manualGoldPrice: this.manualGoldPrice,
      manualSilverPrice: this.manualSilverPrice,
      exchangeRate: this.exchangeRate,
      cash: { ...this.cash },
      metalItems: this.metalItems.map((item) => ({ ...item })),
      debts: this.debts.map((d) => ({ ...d })),
      nisabMethod: this.nisabMethod,
    };
  }

  persist(): void {
    try {
      const data = {
        state: this.toState(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable
    }
  }

  loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const s: ZakahState = data.state;
      if (!s) return false;

      this.currency = s.currency ?? "USD";
      this.spotPriceGold24KPerGram = s.spotPriceGold24KPerGram ?? null;
      this.spotPriceSilverPerGram = s.spotPriceSilverPerGram ?? null;
      this.manualGoldPrice = s.manualGoldPrice ?? null;
      this.manualSilverPrice = s.manualSilverPrice ?? null;
      this.exchangeRate = s.exchangeRate ?? null;
      this.cash = s.cash ?? { onHand: 0, inBank: 0 };
      this.metalItems = s.metalItems ?? [];
      this.debts = s.debts ?? [];
      this.nisabMethod = s.nisabMethod ?? "silver";
      this.hasSavedState = true;
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    const defaults = createDefaultState();
    this.currency = defaults.currency;
    this.spotPriceGold24KPerGram = defaults.spotPriceGold24KPerGram;
    this.spotPriceSilverPerGram = defaults.spotPriceSilverPerGram;
    this.manualGoldPrice = defaults.manualGoldPrice;
    this.manualSilverPrice = defaults.manualSilverPrice;
    this.exchangeRate = defaults.exchangeRate;
    this.cash = { ...defaults.cash };
    this.metalItems = [];
    this.debts = [];
    this.nisabMethod = defaults.nisabMethod;
    this.hasSavedState = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export const zakahStore = new ZakahStore();
