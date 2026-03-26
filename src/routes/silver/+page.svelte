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

	const silverItems = $derived(
		zakahStore.metalItems.filter((i) => i.metal === "silver"),
	);
	const totalValue = $derived(
		computeTotalMetalValue(
			zakahStore.metalItems,
			"silver",
			zakahStore.effectiveSilverPrice,
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
	<div class="space-y-2">
		<h1 class="font-display text-xl font-semibold lg:text-2xl">
			Silver Assets
		</h1>
		<p class="text-muted-foreground text-base">
			Add your silver items — bars, coins, jewelry, and silverware.
			<InfoTooltip
				text="Include silver jewelry, coins, bars, and silverware if held as wealth. Everyday-use utensils are debated among scholars — include them to be safe."
			/>
		</p>
	</div>

	{#if silverItems.length === 0}
		<div
			class="border-muted-foreground/20 bg-muted/50 flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center lg:p-12"
		>
			<p class="text-muted-foreground text-base">
				No silver items added yet.
			</p>
			<Button size="sm" onclick={openAdd}>
				<Plus size={16} />
				Add Silver Item
			</Button>
		</div>
	{:else}
		<div
			class="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"
		>
			{#each silverItems as item (item.id)}
				<div transition:fade={{ duration: 150 }}>
					<MetalItemCard
						{item}
						effectiveSpotPrice={zakahStore.effectiveSilverPrice}
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
			class="bg-card border-border mx-auto max-w-sm rounded-lg border p-4 text-center shadow-sm"
			transition:fade={{ duration: 200 }}
		>
			<p class="text-muted-foreground text-sm uppercase tracking-wide">
				Total Silver Value
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
			<Sheet.Title
				>{editingItem ? "Edit" : "Add"} Silver Item</Sheet.Title
			>
			<Sheet.Description>
				Enter the details of your silver item.
			</Sheet.Description>
		</Sheet.Header>
		<div class="px-5 py-6">
			<MetalItemForm
				metal="silver"
				currency={zakahStore.currency}
				effectiveSpotPrice={zakahStore.effectiveSilverPrice}
				editItem={editingItem}
				onsave={handleSave}
				oncancel={() => (sheetOpen = false)}
			/>
		</div>
	</Sheet.Content>
</Sheet.Root>
