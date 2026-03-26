<script lang="ts">
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { formatCurrency } from "$lib/utils.js";
	import { fade } from "svelte/transition";
	import CurrencyInput from "@/components/shared/CurrencyInput.svelte";
	import InfoTooltip from "@/components/shared/InfoTooltip.svelte";
	import { Wallet, Bank } from "phosphor-svelte";

	const total = $derived(zakahStore.cash.onHand + zakahStore.cash.inBank);
</script>

<div class="mx-auto max-w-4xl space-y-6 lg:space-y-8">
	<div class="space-y-2">
		<h1 class="font-display text-xl font-semibold lg:text-2xl">
			Cash Assets
		</h1>
		<p class="text-muted-foreground text-base">
			Include all liquid cash you've held for one lunar year.
			<InfoTooltip
				text="This includes physical cash, money in your wallet, savings accounts, checking accounts, and any other liquid deposits."
			/>
		</p>
	</div>

	<div
		class="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0"
	>
		<div class="flex items-start gap-3">
			<Wallet size={20} class="text-primary/50 mt-6 shrink-0" />
			<CurrencyInput
				bind:value={zakahStore.cash.onHand}
				currency={zakahStore.currency}
				label="Cash on hand"
				placeholder="Physical cash, wallet"
				class="flex-1"
			/>
		</div>

		<div class="flex items-start gap-3">
			<Bank size={20} class="text-primary/50 mt-6 shrink-0" />
			<CurrencyInput
				bind:value={zakahStore.cash.inBank}
				currency={zakahStore.currency}
				label="Cash in bank"
				placeholder="Savings, checking"
				class="flex-1"
			/>
		</div>
	</div>

	{#if total > 0}
		<div
			class="bg-card border-border mx-auto max-w-sm rounded-lg border p-4 text-center shadow-sm"
			transition:fade={{ duration: 200 }}
		>
			<p class="text-muted-foreground text-sm uppercase tracking-wide">
				Total Cash
			</p>
			<p class="text-lg font-semibold">
				{formatCurrency(total, zakahStore.currency)}
			</p>
		</div>
	{/if}
</div>
