<script lang="ts" module>
	let welcomeChecked = false;
</script>

<script lang="ts">
	import { onMount } from "svelte";
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { currencies } from "@/data/currencies";
	import {
		convertToPerGram,
		fetchGoldPrice,
		fetchSilverPrice,
	} from "@/api/prices";
	import { fetchExchangeRates } from "@/api/currency";
	import * as Select from "$lib/components/ui/select";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Switch } from "$lib/components/ui/switch";
	import { Label } from "$lib/components/ui/label";
	import { Button } from "$lib/components/ui/button";
	import CurrencyInput from "@/components/shared/CurrencyInput.svelte";
	import InfoTooltip from "@/components/shared/InfoTooltip.svelte";
	import PriceStatus from "@/components/shared/PriceStatus.svelte";

	let loading = $state(false);
	let error = $state<string | null>(null);
	let manualGold = $state(zakahStore.manualGoldPrice ?? 0);
	let manualSilver = $state(zakahStore.manualSilverPrice ?? 0);
	let showWelcomeBack = $state(false);

	const selectedCurrency = $derived(
		currencies.find((c) => c.code === zakahStore.currency),
	);

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
			const rate =
				zakahStore.currency === "USD"
					? 1
					: (rates[zakahStore.currency] ?? 1);
			zakahStore.exchangeRate = rate;
			zakahStore.spotPriceGold24KPerGram = convertToPerGram(goldOz) * rate;
			zakahStore.spotPriceSilverPerGram =
				convertToPerGram(silverOz) * rate;
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
		if (!welcomeChecked && zakahStore.hasSavedState) {
			const hasData =
				zakahStore.cash.onHand > 0 ||
				zakahStore.cash.inBank > 0 ||
				zakahStore.metalItems.length > 0 ||
				zakahStore.debts.length > 0;
			if (hasData) {
				showWelcomeBack = true;
			}
		}
		welcomeChecked = true;

		manualGold = zakahStore.manualGoldPrice ?? 0;
		manualSilver = zakahStore.manualSilverPrice ?? 0;

		if (zakahStore.spotPriceGold24KPerGram === null) {
			fetchPrices();
		}
	});

	function handleContinue() {
		showWelcomeBack = false;
	}

	function handleStartFresh() {
		zakahStore.reset();
		showWelcomeBack = false;
		manualGold = 0;
		manualSilver = 0;
		fetchPrices();
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 lg:space-y-8">
	<div class="animate-stagger-in space-y-2" style="--stagger-index: 0">
		<h1 class="font-display text-xl font-semibold lg:text-2xl">Setup</h1>
		<p class="text-muted-foreground text-base leading-relaxed">
			Calculate your obligatory Zakah on gold, silver, and cash. This
			calculator helps you determine the current market liquidation value
			of your assets.
		</p>
	</div>

	<div
		class="animate-stagger-in space-y-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:space-y-0"
		style="--stagger-index: 1"
	>
		<!-- Currency -->
		<div class="space-y-1.5">
			<Label>Currency</Label>
			<Select.Root
				type="single"
				value={zakahStore.currency}
				onValueChange={handleCurrencyChange}
			>
				<Select.Trigger class="w-full">
					{#if selectedCurrency}
						<span class="text-base">{selectedCurrency.flag}</span>
					{/if}
					{selectedCurrency?.name ?? zakahStore.currency}
				</Select.Trigger>
				<Select.Content>
					{#each currencies as c (c.code)}
						<Select.Item value={c.code}>
							<span class="text-base">{c.flag}</span> {c.name} ({c.code})
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Nisab method -->
		<div class="space-y-2">
			<div class="flex items-center gap-1.5">
				<Label>Nisab method</Label>
				<InfoTooltip>
					<p>
						<strong>Silver nisab</strong> (~595g silver equivalent)
						is the stricter threshold — if your wealth exceeds this,
						Zakah is due.
					</p>
					<p class="mt-1">
						<strong>Gold nisab</strong> (~87.48g gold equivalent) is
						a higher threshold. Most scholars recommend the stricter
						(silver) approach.
					</p>
				</InfoTooltip>
			</div>
			<div class="flex items-center gap-3">
				<span
					class={[
						"text-base",
						zakahStore.nisabMethod === "silver" && "font-medium",
					]}
				>
					Silver (stricter)
				</span>
				<Switch
					checked={zakahStore.nisabMethod === "gold"}
					onCheckedChange={(checked) => {
						zakahStore.nisabMethod = checked ? "gold" : "silver";
					}}
				/>
				<span
					class={[
						"text-base",
						zakahStore.nisabMethod === "gold" && "font-medium",
					]}
				>
					Gold
				</span>
			</div>
		</div>
	</div>

	<!-- Price status -->
	<div class="animate-stagger-in" style="--stagger-index: 2">
		<PriceStatus
			{loading}
			{error}
			goldPrice={zakahStore.spotPriceGold24KPerGram}
			silverPrice={zakahStore.spotPriceSilverPerGram}
			currency={zakahStore.currency}
			onretry={fetchPrices}
		/>
	</div>

	<!-- Manual overrides -->
	<div class="animate-stagger-in space-y-3" style="--stagger-index: 3">
		<div class="flex items-center gap-1.5">
			<Label>Manual price override</Label>
			<InfoTooltip
				text="Know your local gold/silver rate? Enter it here for better accuracy. These override the live API prices."
			/>
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
</div>

<Dialog.Root bind:open={showWelcomeBack}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Welcome back</Dialog.Title>
			<Dialog.Description>
				You have saved progress from a previous session. Would you like
				to continue where you left off?
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="ghost" onclick={handleStartFresh}
				>Start fresh</Button
			>
			<Button onclick={handleContinue}>Continue</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
