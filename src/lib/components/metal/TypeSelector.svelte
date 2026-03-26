<script lang="ts">
	import type { MetalItemType } from "@/types/zakah";
	import { metalItemTypeLabels } from "@/data/metal-presets";
	import { cn } from "$lib/utils.js";
	import { Diamond, Cube, CurrencyDollar, Rectangle } from "phosphor-svelte";

	let {
		value = $bindable<MetalItemType>("jewelry"),
		metal,
	}: {
		value: MetalItemType;
		metal: "gold" | "silver";
	} = $props();

	const types: MetalItemType[] = ["jewelry", "biscuit", "coin", "bar"];

	const icons: Record<MetalItemType, typeof Diamond> = {
		jewelry: Diamond,
		biscuit: Rectangle,
		coin: CurrencyDollar,
		bar: Cube,
	};
</script>

<div class="grid grid-cols-4 gap-2">
	{#each types as itemType}
		{@const Icon = icons[itemType]}
		<button
			type="button"
			class={cn(
				"border-border flex flex-col items-center gap-1.5 rounded-md border p-3 text-sm transition-all",
				value === itemType
					? "border-primary bg-primary/5 text-primary ring-primary/30 ring-1"
					: "text-muted-foreground hover:border-foreground/20 hover:text-foreground"
			)}
			onclick={() => (value = itemType)}
		>
			<Icon size={20} weight={value === itemType ? "fill" : "regular"} />
			<span>{metalItemTypeLabels[itemType]}</span>
		</button>
	{/each}
</div>
