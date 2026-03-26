<script lang="ts">
	import type { MetalItem } from "@/types/zakah";
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { computeTotalMetalValue } from "@/calculations/zakah";
	import { formatCurrency } from "$lib/utils.js";
	import { fade } from "svelte/transition";
	import { Button } from "$lib/components/ui/button";
	import * as Sheet from "$lib/components/ui/sheet";
	import MetalItemForm from "@/components/metal/MetalItemForm.svelte";
	import MetalItemCard from "@/components/metal/MetalItemCard.svelte";
	import InfoTooltip from "@/components/shared/InfoTooltip.svelte";
	import { Plus } from "phosphor-svelte";

	let sheetOpen = $state(false);
	let editingItem = $state<MetalItem | null>(null);

	const goldItems = $derived(
		zakahStore.metalItems.filter((i) => i.metal === "gold"),
	);
	const totalValue = $derived(
		computeTotalMetalValue(
			zakahStore.metalItems,
			"gold",
			zakahStore.effectiveGoldPrice,
		),
	);

	function openAdd() {
		editingItem = null;
		sheetOpen = true;
	}

	function openEdit(item: MetalItem) {
		editingItem = item;
		sheetOpen = true;
	}

	function handleSave(item: MetalItem) {
		if (editingItem) {
			zakahStore.updateMetalItem(item.id, item);
		} else {
			zakahStore.addMetalItem(item);
		}
		sheetOpen = false;
		editingItem = null;
	}

	function handleDelete(id: string) {
		zakahStore.removeMetalItem(id);
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 lg:space-y-8">
	<div class="animate-stagger-in space-y-2" style="--stagger-index: 0">
		<h1 class="font-display text-xl font-semibold lg:text-2xl">
			Gold Assets
		</h1>
		<p class="text-muted-foreground text-base">
			Add your gold items one by one. We'll help you value each piece.
			<InfoTooltip
				text="Include all gold jewelry, biscuits, coins, and bars you've held for one lunar year. Zakah is based on current market liquidation value."
			/>
		</p>
	</div>

	{#if goldItems.length === 0}
		<div
			class="animate-stagger-in border-primary/30 bg-primary/5 flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center lg:p-12"
			style="--stagger-index: 1"
		>
			<p class="text-muted-foreground text-base">
				No gold items added yet.
			</p>
			<Button size="sm" onclick={openAdd}>
				<Plus size={16} />
				Add Gold Item
			</Button>
		</div>
	{:else}
		<div
			class="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"
		>
			{#each goldItems as item, i (item.id)}
				<div
					class="animate-stagger-in"
					style="--stagger-index: {i + 1}"
					transition:fade={{ duration: 150 }}
				>
					<MetalItemCard
						{item}
						effectiveSpotPrice={zakahStore.effectiveGoldPrice}
						currency={zakahStore.currency}
						onedit={() => openEdit(item)}
						ondelete={() => handleDelete(item.id)}
					/>
				</div>
			{/each}
		</div>
		<Button
			variant="outline"
			size="sm"
			onclick={openAdd}
			class="w-full lg:w-auto"
		>
			<Plus size={16} />
			Add Another Item
		</Button>
	{/if}

	{#if totalValue > 0}
		<div
			class="animate-stagger-in bg-card border-border mx-auto max-w-sm rounded-lg border p-4 text-center shadow-sm"
			style="--stagger-index: {goldItems.length + 1}"
			transition:fade={{ duration: 200 }}
		>
			<p class="text-muted-foreground text-sm uppercase tracking-wide">
				Total Gold Value
			</p>
			<p class="text-lg font-semibold">
				{formatCurrency(totalValue, zakahStore.currency)}
			</p>
		</div>
	{/if}
</div>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="bottom" class="max-h-[85dvh] overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title>{editingItem ? "Edit" : "Add"} Gold Item</Sheet.Title>
			<Sheet.Description>
				Enter the details of your gold item.
			</Sheet.Description>
		</Sheet.Header>
		<div class="px-5 py-6">
			<MetalItemForm
				metal="gold"
				currency={zakahStore.currency}
				effectiveSpotPrice={zakahStore.effectiveGoldPrice}
				editItem={editingItem}
				onsave={handleSave}
				oncancel={() => (sheetOpen = false)}
			/>
		</div>
	</Sheet.Content>
</Sheet.Root>
