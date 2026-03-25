<script lang="ts">
	import type { MetalItem, MetalItemType } from "@/types/zakah";
	import { GOLD_MAX_PURITY, SILVER_MAX_PURITY } from "@/types/zakah";
	import { goldDefaultKarat, silverDefaultFineness } from "@/data/metal-presets";
	import { computeItemEstimate, computePureWeight } from "@/calculations/zakah";
	import { formatCurrency } from "$lib/utils.js";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Button } from "$lib/components/ui/button";
	import { Switch } from "$lib/components/ui/switch";
	import { Separator } from "$lib/components/ui/separator";
	import TypeSelector from "./TypeSelector.svelte";
	import KaratSelector from "./KaratSelector.svelte";
	import CurrencyInput from "@/components/shared/CurrencyInput.svelte";
	import InfoTooltip from "@/components/shared/InfoTooltip.svelte";

	let {
		metal,
		currency,
		effectiveSpotPrice,
		editItem = null,
		onsave,
		oncancel,
	}: {
		metal: "gold" | "silver";
		currency: string;
		effectiveSpotPrice: number | null;
		editItem?: MetalItem | null;
		onsave: (item: MetalItem) => void;
		oncancel: () => void;
	} = $props();

	const maxPurity = $derived(metal === "gold" ? GOLD_MAX_PURITY : SILVER_MAX_PURITY);
	const defaultKarats = $derived(
		metal === "gold" ? goldDefaultKarat : silverDefaultFineness,
	);

	// Local draft state — initialized from editItem on first render
	let type = $state<MetalItemType>(editItem?.type ?? "jewelry");
	let karat = $state(editItem?.karat ?? (metal === "gold" ? goldDefaultKarat : silverDefaultFineness)["jewelry"]);
	let grossWeight = $state(editItem?.grossWeight ?? 0);
	let stoneDeduction = $state(editItem?.stoneDeduction ?? 0);
	let quantity = $state(editItem?.quantity ?? 1);
	let localPricePerUnit = $state(editItem?.localPricePerUnit ?? 0);
	let useLocalPrice = $state(editItem?.useLocalPrice ?? false);

	let grossWeightStr = $state(editItem?.grossWeight ? String(editItem.grossWeight) : "");
	let stoneDeductionStr = $state(
		editItem?.stoneDeduction ? String(editItem.stoneDeduction) : "",
	);
	let quantityStr = $state(editItem?.quantity ? String(editItem.quantity) : "1");

	// When type changes, update default karat
	$effect(() => {
		if (!editItem) {
			karat = defaultKarats[type];
		}
	});

	// Computed values
	const pureWeight = $derived(
		computePureWeight(grossWeight, stoneDeduction, karat, maxPurity),
	);
	const estimatedPrice = $derived(
		effectiveSpotPrice !== null
			? computeItemEstimate(pureWeight, effectiveSpotPrice)
			: null,
	);

	function parseNum(str: string): number {
		const n = parseFloat(str);
		return Number.isNaN(n) ? 0 : n;
	}

	function handleSave() {
		const item: MetalItem = {
			id: editItem?.id ?? crypto.randomUUID(),
			metal,
			type,
			karat,
			grossWeight,
			stoneDeduction,
			quantity,
			estimatedPricePerUnit: estimatedPrice,
			localPricePerUnit: localPricePerUnit || null,
			useLocalPrice: useLocalPrice && localPricePerUnit > 0,
		};
		onsave(item);
	}

	const canSave = $derived(grossWeight > 0 && quantity > 0);
</script>

<div class="space-y-5">
	<!-- Type -->
	<div class="space-y-2">
		<Label>Type</Label>
		<TypeSelector bind:value={type} {metal} />
	</div>

	<!-- Karat / Fineness -->
	<div class="space-y-2">
		<div class="flex items-center gap-1.5">
			<Label>{metal === "gold" ? "Karat" : "Fineness"}</Label>
			<InfoTooltip
				text={metal === "gold"
					? "Higher karat means higher purity. 24K is pure gold."
					: "999 is near-pure silver. 925 is sterling silver."}
			/>
		</div>
		<KaratSelector bind:value={karat} {metal} />
	</div>

	<!-- Weight -->
	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-1.5">
			<Label for="gross-weight">Gross weight (g)</Label>
			<Input
				id="gross-weight"
				type="text"
				inputmode="decimal"
				placeholder="0.00"
				value={grossWeightStr}
				oninput={(e) => {
					grossWeightStr = (e.target as HTMLInputElement).value;
					grossWeight = parseNum(grossWeightStr);
				}}
			/>
		</div>
		{#if type === "jewelry"}
			<div class="space-y-1.5">
				<div class="flex items-center gap-1.5">
					<Label for="stone-deduction">Stones (g)</Label>
					<InfoTooltip text="If your jewelry has diamonds, gemstones, or enamel, subtract their weight. Ask your jeweler if unsure." />
				</div>
				<Input
					id="stone-deduction"
					type="text"
					inputmode="decimal"
					placeholder="0"
					value={stoneDeductionStr}
					oninput={(e) => {
						stoneDeductionStr = (e.target as HTMLInputElement).value;
						stoneDeduction = parseNum(stoneDeductionStr);
					}}
				/>
			</div>
		{/if}
	</div>

	<!-- Quantity -->
	<div class="space-y-1.5 w-24">
		<Label for="quantity">Quantity</Label>
		<Input
			id="quantity"
			type="text"
			inputmode="numeric"
			value={quantityStr}
			oninput={(e) => {
				quantityStr = (e.target as HTMLInputElement).value;
				quantity = Math.max(1, Math.round(parseNum(quantityStr)));
			}}
		/>
	</div>

	<Separator />

	<!-- Valuation -->
	<div class="space-y-3">
		<Label>Valuation</Label>

		{#if estimatedPrice !== null}
			<div class="text-muted-foreground space-y-0.5 text-xs">
				<span class="italic">
					Estimated: ~{formatCurrency(estimatedPrice, currency)} based on spot price
				</span>
				<p class="text-[10px]">
					Pure {metal}: {pureWeight.toFixed(2)}g &times; {formatCurrency(effectiveSpotPrice ?? 0, currency)}/g
				</p>
			</div>
		{/if}

		<CurrencyInput
			bind:value={localPricePerUnit}
			{currency}
			label="Local selling price per unit"
		/>
		<p class="text-muted-foreground text-[10px]">
			{#if type === "jewelry"}
				Jewelers typically pay scrap value — lower than what you paid. Making charges are not recoverable.
			{:else}
				{metal === "gold" ? "Biscuit/bar" : "Bar/coin"} resale is close to spot price, but smaller pieces may have slightly higher premiums.
			{/if}
		</p>

		{#if localPricePerUnit > 0}
			<div class="flex items-center gap-2">
				<Switch bind:checked={useLocalPrice} id="use-local" />
				<Label for="use-local" class="text-xs">Use my local price</Label>
			</div>
		{/if}
	</div>

	<Separator />

	<!-- Actions -->
	<div class="flex gap-2">
		<Button onclick={handleSave} disabled={!canSave} class="flex-1">
			{editItem ? "Update" : "Add"} Item
		</Button>
		<Button variant="ghost" onclick={oncancel}>
			Cancel
		</Button>
	</div>
</div>
