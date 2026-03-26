<script lang="ts">
	import type { MetalItem } from "@/types/zakah";
	import { computeItemValue } from "@/calculations/zakah";
	import { metalItemTypeLabels } from "@/data/metal-presets";
	import { formatCurrency } from "$lib/utils.js";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Diamond, Cube, CurrencyDollar, Rectangle, PencilSimple, Trash } from "phosphor-svelte";

	let {
		item,
		effectiveSpotPrice,
		currency,
		onedit,
		ondelete,
	}: {
		item: MetalItem;
		effectiveSpotPrice: number | null;
		currency: string;
		onedit: () => void;
		ondelete: () => void;
	} = $props();

	const icons = {
		jewelry: Diamond,
		biscuit: Rectangle,
		coin: CurrencyDollar,
		bar: Cube,
	} as const;

	const Icon = $derived(icons[item.type]);
	const value = $derived(computeItemValue(item, effectiveSpotPrice));
	const karatLabel = $derived(
		item.metal === "gold" ? `${item.karat}K` : `${item.karat}`,
	);
</script>

<div class="bg-card border-border flex items-center gap-3 rounded-lg border p-3 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
	<div class="text-primary/50">
		<Icon size={20} />
	</div>

	<div class="flex-1 space-y-0.5">
		<div class="flex items-center gap-1.5">
			<span class="text-base font-medium">
				{metalItemTypeLabels[item.type]}
			</span>
			<Badge variant="outline" class="text-[10px]">{karatLabel}</Badge>
			{#if item.useLocalPrice}
				<Badge variant="secondary" class="text-[10px]">Local price</Badge>
			{/if}
		</div>
		<div class="text-muted-foreground text-sm">
			{item.grossWeight}g
			{#if item.stoneDeduction > 0}
				(-{item.stoneDeduction}g stones)
			{/if}
			{#if item.quantity > 1}
				&times; {item.quantity}
			{/if}
		</div>
	</div>

	<div class="text-right">
		<div class="text-base font-medium">{formatCurrency(value, currency)}</div>
	</div>

	<div class="flex gap-0.5">
		<Button variant="ghost" size="icon-xs" onclick={onedit} aria-label="Edit item">
			<PencilSimple size={14} />
		</Button>
		<Button
			variant="ghost"
			size="icon-xs"
			onclick={ondelete}
			aria-label="Delete item"
			class="text-destructive hover:text-destructive"
		>
			<Trash size={14} />
		</Button>
	</div>
</div>
