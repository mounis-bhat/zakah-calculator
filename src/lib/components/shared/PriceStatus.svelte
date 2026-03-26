<script lang="ts">
	import * as Alert from "$lib/components/ui/alert";
	import { formatCurrency } from "$lib/utils.js";
	import { ArrowsClockwise, CheckCircle, WarningCircle } from "phosphor-svelte";

	let {
		loading,
		error,
		goldPrice,
		silverPrice,
		currency,
		onretry,
	}: {
		loading: boolean;
		error: string | null;
		goldPrice: number | null;
		silverPrice: number | null;
		currency: string;
		onretry?: () => void;
	} = $props();
</script>

{#if loading}
	<div class="flex items-center gap-2 py-3 text-base text-muted-foreground">
		<ArrowsClockwise size={16} class="animate-spin" />
		<span>Fetching live prices...</span>
	</div>
{:else if error}
	<Alert.Root class="border-destructive/50 text-destructive">
		<WarningCircle size={16} />
		<Alert.Title>Couldn't fetch live prices</Alert.Title>
		<Alert.Description class="text-base">
			{error}. You can enter your local gold/silver price per gram manually below.
			{#if onretry}
				<button
					class="text-foreground underline underline-offset-2 ml-1"
					onclick={onretry}
				>
					Retry
				</button>
			{/if}
		</Alert.Description>
	</Alert.Root>
{:else if goldPrice !== null || silverPrice !== null}
	<div class="space-y-1 py-3">
		<div class="flex items-center gap-2 text-base text-muted-foreground">
			<CheckCircle size={16} class="text-success" />
			<span>
				Live prices loaded:
				{#if goldPrice !== null}
					Gold {formatCurrency(goldPrice, currency)}/g
				{/if}
				{#if goldPrice !== null && silverPrice !== null}
					&middot;
				{/if}
				{#if silverPrice !== null}
					Silver {formatCurrency(silverPrice, currency)}/g
				{/if}
			</span>
		</div>
		<p class="text-muted-foreground/70 pl-6 text-sm leading-relaxed">
			Live spot prices are fetched in USD from US market data and then converted
			into {currency}. Your actual buy or sell rate in your country may still
			differ because local dealer premiums, taxes, import costs, and market
			conditions vary. Enter your local rate below for better accuracy.
		</p>
	</div>
{/if}
