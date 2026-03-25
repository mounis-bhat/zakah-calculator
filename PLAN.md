# Zakah Calculator App Development Plan

## 1. Core Data Model (TypeScript)

To handle the complexities of different gold types, karats, and economies of scale (biscuits vs. jewelry), the state needs a robust itemized structure.

```typescript
type GoldItemType = "jewelry" | "biscuit" | "coin";

interface GoldItem {
  id: string;
  type: GoldItemType;
  karat: number; // e.g., 24, 22, 21, 18
  unitWeight: number; // Gross weight per item (e.g., a 5g biscuit or a 20g necklace)
  stoneDeduction: number; // Weight of non-gold elements to subtract per unit
  quantity: number; // How many of this exact item?
  sellingPricePerUnit: number; // Actual market selling value for this specific unit
}

interface ZakahState {
  currency: string;
  baseGoldPrice24K: number; // Fetched from API, used for estimates
  cash: {
    onHand: number;
    bank: number;
  };
  goldItems: GoldItem[];
  silverItems: any[]; // Similar structure to GoldItem if needed later
  debts: number; // Immediate short-term deductions
}
```

## 2. The Multi-Step Wizard Flow

The app will swap out UI components based on the user's current step, saving progress along the way.

### Step 1: Setup & Baseline

- **Action:** User selects their local currency.
- **API Call:** App fetches the live 24K Gold and Silver spot price per gram.

### Step 2: Cash Assets

- **Action:** Simple inputs for Cash on Hand and Cash in Bank Accounts.

### Step 3: Itemized Gold (The Core Feature)

- **Action:** User builds a dynamic list of their gold assets.
- **Adding an Item:** When they click "Add Gold Item", a modal opens asking for:
  - **Type:** Jewelry, Biscuit, or Coin.
  - **Karat:** (e.g., 18K for jewelry, 24K for a biscuit).
  - **Unit Details:** Weight of the item, weight of stones/deductions, and quantity.
- **Valuation Strategy & The Auto-Fetch Challenge:**
  - **The Challenge:** Free gold APIs only provide the raw spot price per gram. They do not know the retail premiums for a 1g vs 10g biscuit, nor do they account for jeweler deductions on 18K scrap.
  - **The Solution:** If the user clicks "Use Auto Price", we take the raw 24K spot price per gram, adjust for karat, and multiply by the unit weight to provide a rough estimate.
  - **The Override:** We display a prominent disclaimer alongside this estimate: _"This is the raw gold value. Biscuits usually sell for slightly more/less based on dealer premiums, and jewelry has different scrap rates. Please adjust to your local shop's rate for maximum accuracy."_ \* The user is then strongly encouraged to manually enter the **Actual Local Selling Price (per unit)**.
- **UI:** Added items appear as a stack of summary cards.

### Step 4: Short-Term Debts

- **Action:** User inputs any immediate, due debts (e.g., utility bills, borrowed cash to be paid this month) which are deducted from the total Zakatable amount.

### Step 5: Final Calculation & Results

- **Nisab Check (Behind the Scenes):** _ Convert all gold items to their pure 24K equivalent weight: `(Net Weight _ Quantity) \* (Karat / 24)`.
  - Sum this up. If the total pure gold equivalent is **≥ 87.48 grams** (or the cash equivalent), Zakah is obligatory.
- **Zakah Calculation:**
  - Sum the user-defined _monetary values_ of all Gold Items + Cash - Debts.
  - Multiply the final Zakatable net worth by **0.025 (2.5% for Lunar year)**.
- **UI:** Display a clean summary breakdown: Total Assets, Total Deductions, Net Zakatable Wealth, and the final Zakah Due.
