<script lang="ts">
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { currencies } from "@/data/currencies";
	import { convertToPerGram, fetchGoldPrice, fetchSilverPrice } from "@/api/prices";
	import { fetchExchangeRates } from "@/api/currency";
	import * as Select from "$lib/components/ui/select";
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import CurrencyInput from "@/components/shared/CurrencyInput.svelte";
	import InfoTooltip from "@/components/shared/InfoTooltip.svelte";
	import PriceStatus from "@/components/shared/PriceStatus.svelte";
	import { onMount } from "svelte";

	let loading = $state(false);
	let error = $state<string | null>(null);
	let manualGold = $state(zakahStore.manualGoldPrice ?? 0);
	let manualSilver = $state(zakahStore.manualSilverPrice ?? 0);

	$effect(() => {
		zakahStore.manualGoldPrice = manualGold || null;
	});
	$effect(() => {
		zakahStore.manualSilverPrice = manualSilver || null;
	});

	async function fetchPrices() {
		loading = true;
		error = null;
		try {
			const [goldOz, silverOz, rates] = await Promise.all([
				fetchGoldPrice(),
				fetchSilverPrice(),
				fetchExchangeRates(),
			]);
			const rate = zakahStore.currency === "USD" ? 1 : (rates[zakahStore.currency] ?? 1);
			zakahStore.exchangeRate = rate;
			zakahStore.spotPriceGold24KPerGram = convertToPerGram(goldOz) * rate;
			zakahStore.spotPriceSilverPerGram = convertToPerGram(silverOz) * rate;
		} catch (e) {
			error = e instanceof Error ? e.message : "Unknown error";
		} finally {
			loading = false;
		}
	}

	function handleCurrencyChange(value: string | undefined) {
		if (!value) return;
		zakahStore.currency = value;
		fetchPrices();
	}

	onMount(() => {
		if (zakahStore.spotPriceGold24KPerGram === null) {
			fetchPrices();
		}
	});
</script>

<div class="mx-auto max-w-lg space-y-6">
	<div class="space-y-2">
		<h1 class="text-lg font-semibold">Zakah Calculator</h1>
		<p class="text-muted-foreground text-xs leading-relaxed">
			Calculate your obligatory Zakah on gold, silver, and cash.
			This calculator helps you determine the current market liquidation
			value of your assets — the cash you'd receive selling today.
		</p>
	</div>

	<!-- Currency -->
	<div class="space-y-1.5">
		<Label>Currency</Label>
		<Select.Root
			type="single"
			value={zakahStore.currency}
			onValueChange={handleCurrencyChange}
		>
			<Select.Trigger class="w-full">
				{currencies.find((c) => c.code === zakahStore.currency)?.name ?? zakahStore.currency}
			</Select.Trigger>
			<Select.Content>
				{#each currencies as c (c.code)}
					<Select.Item value={c.code}>
						{c.symbol} {c.name} ({c.code})
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- Price status -->
	<PriceStatus
		{loading}
		{error}
		goldPrice={zakahStore.spotPriceGold24KPerGram}
		silverPrice={zakahStore.spotPriceSilverPerGram}
		currency={zakahStore.currency}
		onretry={fetchPrices}
	/>

	<!-- Manual overrides -->
	<div class="space-y-3">
		<div class="flex items-center gap-1.5">
			<Label>Manual price override</Label>
			<InfoTooltip text="Know your local gold/silver rate? Enter it here for better accuracy. These override the live API prices." />
		</div>
		<div class="grid grid-cols-2 gap-3">
			<CurrencyInput
				bind:value={manualGold}
				currency={zakahStore.currency}
				label="Gold price/g"
				placeholder="e.g. 290"
			/>
			<CurrencyInput
				bind:value={manualSilver}
				currency={zakahStore.currency}
				label="Silver price/g"
				placeholder="e.g. 3.50"
			/>
		</div>
	</div>

	<!-- Nisab method -->
	<div class="space-y-2">
		<div class="flex items-center gap-1.5">
			<Label>Nisab method</Label>
			<InfoTooltip>
				<p>
					<strong>Silver nisab</strong> (~595g silver equivalent) is the stricter
					threshold — if your wealth exceeds this, Zakah is due.
				</p>
				<p class="mt-1">
					<strong>Gold nisab</strong> (~87.48g gold equivalent) is a higher
					threshold. Most scholars recommend the stricter (silver) approach.
				</p>
			</InfoTooltip>
		</div>
		<div class="flex items-center gap-3">
			<span class={["text-xs", zakahStore.nisabMethod === "silver" && "font-medium"]}>
				Silver (stricter)
			</span>
			<Switch
				checked={zakahStore.nisabMethod === "gold"}
				onCheckedChange={(checked) => {
					zakahStore.nisabMethod = checked ? "gold" : "silver";
				}}
			/>
			<span class={["text-xs", zakahStore.nisabMethod === "gold" && "font-medium"]}>
				Gold
			</span>
		</div>
	</div>
</div>
