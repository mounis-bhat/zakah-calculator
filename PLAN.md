# Zakah Calculator App Development Plan

A mobile-first, educational Zakah calculator that guides less-knowledgeable users through itemized gold/silver valuation using real-world liquidation values — not just raw spot prices.

---

## 1. Core Data Model (TypeScript)

```typescript
type MetalItemType = "jewelry" | "biscuit" | "coin" | "bar";

interface MetalItem {
  id: string;
  metal: "gold" | "silver";
  type: MetalItemType;
  karat: number; // Gold: 9, 14, 17, 18, 21, 22, 24. Silver: typically 999, 925, 800
  grossWeight: number; // Total weight of the piece in grams
  stoneDeduction: number; // Weight of non-metal elements (stones, enamel, etc.)
  quantity: number; // How many identical items?
  estimatedPricePerUnit: number | null; // API-derived rough estimate (read-only, shown for reference)
  localPricePerUnit: number | null; // User-entered actual selling price from local jeweler
  useLocalPrice: boolean; // Whether user has overridden the estimate
}

interface DebtEntry {
  id: string;
  label: string;
  amount: number;
  category: "immediate" | "installment"; // immediate = due now, installment = monthly payment on long-term debt
}

interface ZakahState {
  // Setup
  currency: string;
  spotPriceGold24KPerGram: number | null; // Fetched from API, converted to user currency
  spotPriceSilverPerGram: number | null; // Fetched from API, converted to user currency
  manualGoldPrice: number | null; // User override if offline or prefers local rate
  manualSilverPrice: number | null; // User override
  exchangeRate: number | null; // USD → user currency rate from API

  // Assets
  cash: {
    onHand: number;
    inBank: number;
  };
  metalItems: MetalItem[];

  // Deductions
  debts: DebtEntry[];

  // Settings
  nisabMethod: "silver" | "gold"; // Default: "silver" (stricter)
}
```

### Key Computed Values

```typescript
// Pure metal content for a single item
pureWeight = (grossWeight - stoneDeduction) * (karat / maxPurity) // maxPurity: 24 for gold, 999 for silver

// Total pure gold in grams (across all gold items)
totalPureGold = sum of (pureWeight * quantity) for each gold item

// Total pure silver in grams (across all silver items)
totalPureSilver = sum of (pureWeight * quantity) for each silver item

// Monetary value of a single item (uses local price if set, else estimate)
itemValue = (useLocalPrice ? localPricePerUnit : estimatedPricePerUnit) * quantity

// Nisab thresholds
goldNisab = 87.48g pure gold
silverNisab = 595g pure silver
```

---

## 2. API Strategy

### Metal Spot Prices — gold-api.com

- **Endpoint:** `GET https://api.gold-api.com/price/XAU` (gold), `GET https://api.gold-api.com/price/XAG` (silver)
- **Auth:** None. No API key, no signup.
- **Rate limits:** None stated for real-time prices.
- **CORS:** Enabled (direct browser fetch).
- **Response:** `{ "name": "Gold", "price": 4552.60, "symbol": "XAU", "updatedAt": "..." }`
- **Unit:** Price per **troy ounce** in USD. Convert to grams: `pricePerGram = price / 31.1035`.

### Currency Conversion — open.er-api.com

- **Endpoint:** `GET https://open.er-api.com/v6/latest/USD`
- **Auth:** None.
- **Response:** `{ "rates": { "SAR": 3.75, "GBP": 0.746, "INR": 94.05, ... } }` — 150+ currencies.
- **Updates:** Daily.

### Client-Side Flow

1. Fetch gold + silver prices in parallel from gold-api.com.
2. Fetch exchange rates from open.er-api.com.
3. Compute `spotPricePerGram = (pricePerOz / 31.1035) * exchangeRate[currency]`.
4. Cache results in localStorage with a timestamp. Re-fetch only if stale (>6 hours).
5. **If any fetch fails:** Show a non-blocking banner — _"Couldn't fetch live prices. You can enter your local gold/silver price per gram manually."_ — and enable manual entry fields. The app remains fully functional.

### The Estimate vs. Reality Philosophy

The API price is a **rough reference point**, never the final word. The app's entire UX reinforces this:

- API estimates are shown in a muted style with an "approximate" label.
- The local price input is the prominent, encouraged field.
- Educational tooltips explain *why* the API price differs from what your jeweler would pay.

---

## 3. Gold & Silver Valuation: Domain Model

This is the core domain knowledge the app encodes and teaches users about.

### 3a. Purity (Karat System)

API spot prices are always for **pure** metal (24K gold / 999 silver). Real items are rarely pure:

| Karat | Purity | Common Use |
|-------|--------|------------|
| 24K | 99.9% | Investment bars, biscuits, some coins |
| 22K | 91.6% | Traditional bridal jewelry, Sovereigns, Krugerrands |
| 21K | 87.5% | Middle Eastern jewelry standard |
| 18K | 75.0% | Everyday jewelry, gemstone settings |
| 17K | 70.8% | Some regional jewelry |
| 14K | 58.3% | Western market everyday jewelry |
| 9K | 37.5% | Budget jewelry (UK/Australia) |

**Impact:** 10g of 18K gold = 7.5g of pure gold. A jeweler pays for the 7.5g, not the 10g.

### 3b. Form Factor: Jewelry vs. Bullion

**Jewelry (high loss on resale):**
- Buyer pays a premium for craftsmanship ("making charges"). When selling back, the jeweler treats it as scrap — making charges drop to zero.
- Stones, enamel, and non-metal inlays must be deducted from gross weight. Zakah is only on the metal itself.

**Bullion — biscuits, bars, coins (retains value):**
- Traded very close to spot price. Standard investment vehicles.
- Still subject to dealer bid/ask spreads, but much smaller loss vs. jewelry.

### 3c. Economies of Scale (Weight Premiums)

Manufacturing costs are roughly fixed per unit. So:
- A 1g biscuit might carry a ~10% premium over spot.
- A 10g biscuit might carry ~3%.
- A 100g bar might carry ~1%.

When *selling*, dealers factor this in — ten 1g biscuits fetch a different total than one 10g biscuit. This is why per-unit local pricing matters.

### 3d. Zakah Valuation Principle

Islamic jurisprudence: Zakah on gold/silver is based on **current market liquidation value** — the cash you'd receive walking into a local shop and selling today. Not the purchase price, not the spot price, not the sentimental value.

The app solves this by:
1. Asking for karat (adjusts for purity).
2. Separating net weight from stones (deducts non-metal).
3. Showing an API rough estimate (starting point).
4. Prompting for local jeweler's actual buying rate (the real number).

---

## 4. The Multi-Step Wizard Flow

Progress is persisted to localStorage at each step. The wizard uses a progress indicator (step dots or numbered bar) at the top.

### Step 1: Welcome & Setup

- **Educational intro:** Brief, friendly explanation of what Zakah is and how this calculator helps. A sentence on the lunar year requirement.
- **Currency selector:** Dropdown of common currencies (SAR, USD, GBP, EUR, INR, PKR, AED, EGP, etc.) with search.
- **API fetch:** On currency selection, fetch spot prices + exchange rates. Show a loading state, then display the fetched gold/silver price per gram in the selected currency.
- **Manual override:** Prominent option — _"Know your local gold rate? Enter it here for better accuracy."_ Fields for gold and silver price per gram. If filled, these override the API values for all estimates.
- **Nisab method toggle:** Default to silver (stricter). Info tooltip explains the difference:
  - _"Silver nisab (~595g silver equivalent) is the stricter threshold — if your wealth exceeds this, Zakah is due. Gold nisab (~87.48g gold equivalent) is a higher threshold. Most scholars recommend the stricter (silver) approach."_

### Step 2: Cash Assets

- **Cash on hand** — physical cash, wallet.
- **Cash in bank** — savings, checking, any liquid deposits.
- Simple numeric inputs with currency symbol prefix.
- Educational tooltip: _"Include all liquid cash you've held for one lunar year."_

### Step 3: Gold Assets (Core Feature)

- **Empty state:** Encouraging prompt — _"Add your gold items one by one. We'll help you value each piece."_
- **"Add Gold Item" button** opens a bottom sheet / modal:
  1. **Type:** Jewelry / Biscuit / Coin / Bar (icon cards for easy selection).
  2. **Karat:** Quick-select buttons for common values (24K, 22K, 21K, 18K) + "Other" that reveals a custom numeric input. Smart defaults: selecting "Biscuit" pre-selects 24K, selecting "Jewelry" pre-selects 18K.
  3. **Gross weight (grams):** The total weight of the piece.
  4. **Stone/non-gold deduction (grams):** Default 0. Shown with a tooltip: _"If your jewelry has diamonds, gemstones, or enamel, subtract their weight. Ask your jeweler if unsure."_ Only prominently shown for jewelry type; collapsed/hidden for biscuits/bars.
  5. **Quantity:** How many identical pieces? Default 1.
  6. **Valuation section:**
     - Shows the **API estimate** (muted): _"~{estimate} {currency} based on spot price"_ with a small "how this is calculated" expandable.
     - **Local selling price per unit** (prominent input): _"What would your local jeweler pay for this item today?"_
     - Toggle: "Use my local price" (default ON if they enter one).
     - Educational note for jewelry: _"Jewelers typically pay scrap value — lower than what you paid. Making charges are not recoverable."_
     - Educational note for biscuits: _"Biscuit resale is close to spot price, but smaller biscuits may have slightly higher premiums."_
- **Item cards:** Each added item shows as a summary card — type icon, weight, karat, value, edit/delete actions.
- **Running total:** Sticky footer showing total gold value so far.

### Step 4: Silver Assets

- Same structure as Step 3 but for silver.
- Silver purity uses millesimal fineness (999, 925 Sterling, 800) instead of karat.
- Common types: bars, coins, jewelry, silverware/utensils.
- Tooltip: _"Include silver jewelry, coins, bars, and silverware if held as wealth. Everyday-use utensils are debated among scholars — include them to be safe."_

### Step 5: Debts & Deductions

- Two categories with educational guidance:
  - **Immediate debts:** Bills due now, loans to be repaid this month, rent due, borrowed cash.
    - _"These are debts you owe right now or within the very near term."_
  - **Installment deductions:** Monthly payments on long-term debts (mortgage installments, car payments, student loan payments).
    - _"Some scholars allow deducting up to 12 months of upcoming installments. Enter your monthly payment amount — the app will calculate the annual total."_
    - Input: monthly amount. Display shows `× 12 = {annual}`.
- Dynamic list with add/remove for each category.

### Step 6: Results & Summary

**Behind the scenes:**

1. **Nisab check:**
   - Convert all gold items to pure 24K equivalent grams.
   - Convert all silver items to pure 999 equivalent grams.
   - Compute the monetary value of each nisab threshold using the spot (or manual) price.
   - If `nisabMethod === "silver"`: use silver nisab (595g × silver price per gram).
   - If `nisabMethod === "gold"`: use gold nisab (87.48g × gold price per gram).
   - Total wealth = cash + all metal item values.
   - Net wealth = total wealth − total debts.
   - If net wealth ≥ nisab threshold → Zakah is obligatory.

2. **Zakah calculation:**
   - `zakahDue = netWealth * 0.025` (2.5% lunar year rate).

**UI — Results breakdown:**

- **Nisab status:** Clear pass/fail indicator with the threshold amount shown.
  - If below nisab: friendly message — _"Your net wealth is below the nisab threshold. Zakah is not obligatory for you this year, but voluntary charity (Sadaqah) is always encouraged."_
- **Asset summary table:**
  | Category | Value |
  |----------|-------|
  | Cash on hand | {amount} |
  | Cash in bank | {amount} |
  | Gold ({n} items) | {amount} |
  | Silver ({n} items) | {amount} |
  | **Total assets** | **{amount}** |
  | Immediate debts | −{amount} |
  | Installment deductions | −{amount} |
  | **Net zakatable wealth** | **{amount}** |
- **Zakah due:** Large, prominent display — `{currency} {zakahDue}`.
- **Expandable detail:** Per-item breakdown showing each metal item's contribution.
- **Print / Export:** Button to generate a clean printable summary (CSS print styles or PDF via browser print dialog).
- **Start over / Edit:** Links back to any step to adjust inputs.

---

## 5. Persistence & State Management

- **Svelte stores** for reactive state during the session.
- **localStorage** for persistence across sessions:
  - Save full `ZakahState` on every meaningful input change (debounced).
  - On app load, hydrate from localStorage if data exists. Show a _"Welcome back — continue where you left off?"_ prompt.
  - Include a "Start fresh" option that clears saved state.
- **API cache:** Store fetched prices + exchange rates with a timestamp. Re-fetch if older than 6 hours.

---

## 6. Design Principles

- **Mobile-first:** All layouts designed for 375px+ screens. Desktop gets wider cards but same flow.
- **Educational, not preachy:** Short tooltips and contextual hints. Never block progress — always let the user skip explanations.
- **Trust the user, guide the novice:** Sensible defaults (karat pre-selection, stone deduction = 0 for bullion) reduce friction for knowledgeable users while tooltips help beginners.
- **Accuracy over convenience:** Always prefer the user's local price. The API estimate is a crutch, not a crutch to lean on.
- **Accessible:** Proper ARIA labels, keyboard navigation, sufficient color contrast.

---

## 7. Tech Stack

- **Framework:** SvelteKit (already scaffolded)
- **UI components:** shadcn-svelte (already installed)
- **Toolchain:** Vite+ (`vp dev`, `vp build`, `vp check`, `vp test`)
- **State:** Svelte stores + localStorage
- **APIs:** gold-api.com (metal prices), open.er-api.com (currency conversion)
- **No backend required** — fully client-side

---

## 8. Future Pipeline (Not v1)

- Investments & business assets (stocks, inventory, receivables)
- i18n (Arabic, Urdu, etc.)
- Hawl (lunar year) date tracking / reminders
- Zakah distribution guidance
- Dark mode
