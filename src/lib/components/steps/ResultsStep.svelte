<script lang="ts">
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { formatCurrency } from "$lib/utils.js";
	import * as Alert from "$lib/components/ui/alert";
	import * as Table from "$lib/components/ui/table";
	import * as Collapsible from "$lib/components/ui/collapsible";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import { computeItemValue } from "@/calculations/zakah";
	import { metalItemTypeLabels } from "@/data/metal-presets";
	import {
		CheckCircle,
		XCircle,
		Printer,
		ArrowCounterClockwise,
		CaretDown,
		PencilSimple,
	} from "phosphor-svelte";

	const s = $derived(zakahStore.summary);
	const currency = $derived(zakahStore.currency);
	function fmt(n: number) { return formatCurrency(n, currency); }

	const goldItems = $derived(
		zakahStore.metalItems.filter((i) => i.metal === "gold"),
	);
	const silverItems = $derived(
		zakahStore.metalItems.filter((i) => i.metal === "silver"),
	);

	let detailsOpen = $state(false);

	function handlePrint() {
		window.print();
	}

	function handleStartOver() {
		zakahStore.reset();
	}

	function goToStep(step: number) {
		zakahStore.currentStep = step;
	}
</script>

<div class="mx-auto max-w-lg space-y-6 print:max-w-none">
	<h2 class="text-lg font-semibold">Results</h2>

	<!-- Nisab Status -->
	{#if s.nisabThreshold !== null}
		{#if s.isAboveNisab}
			<Alert.Root class="border-green-600/30 bg-green-50 dark:bg-green-950/20">
				<CheckCircle size={16} class="text-green-600" />
				<Alert.Title class="text-green-800 dark:text-green-300">Zakah is obligatory</Alert.Title>
				<Alert.Description class="text-xs text-green-700 dark:text-green-400">
					Your net wealth ({fmt(s.netWealth)}) exceeds the {zakahStore.nisabMethod} nisab threshold ({fmt(s.nisabThreshold)}).
				</Alert.Description>
			</Alert.Root>
		{:else}
			<Alert.Root>
				<XCircle size={16} class="text-muted-foreground" />
				<Alert.Title>Below nisab threshold</Alert.Title>
				<Alert.Description class="text-xs">
					Your net wealth ({fmt(s.netWealth)}) is below the {zakahStore.nisabMethod} nisab threshold ({fmt(s.nisabThreshold)}).
					Zakah is not obligatory this year, but voluntary charity (Sadaqah) is always encouraged.
				</Alert.Description>
			</Alert.Root>
		{/if}
	{:else}
		<Alert.Root class="border-destructive/50">
			<Alert.Title>Cannot determine nisab</Alert.Title>
			<Alert.Description class="text-xs">
				No metal prices available. Go back to Step 1 and enter prices manually.
			</Alert.Description>
		</Alert.Root>
	{/if}

	<!-- Zakah Due -->
	{#if s.isAboveNisab}
		<div class="border-primary/20 bg-primary/5 rounded-md border p-6 text-center">
			<p class="text-muted-foreground text-[10px] uppercase tracking-wide">Zakah Due (2.5%)</p>
			<p class="text-primary text-2xl font-bold">{fmt(s.zakahDue)}</p>
		</div>
	{/if}

	<!-- Asset Summary Table -->
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-medium">Asset Summary</h3>
			<Button
				variant="ghost"
				size="icon-xs"
				onclick={() => goToStep(1)}
				aria-label="Edit assets"
				class="print:hidden"
			>
				<PencilSimple size={14} />
			</Button>
		</div>
		<Table.Root>
			<Table.Body>
				<Table.Row>
					<Table.Cell class="text-xs">Cash on hand</Table.Cell>
					<Table.Cell class="text-right text-xs">{fmt(zakahStore.cash.onHand)}</Table.Cell>
				</Table.Row>
				<Table.Row>
					<Table.Cell class="text-xs">Cash in bank</Table.Cell>
					<Table.Cell class="text-right text-xs">{fmt(zakahStore.cash.inBank)}</Table.Cell>
				</Table.Row>
				{#if s.totalGoldValue > 0}
					<Table.Row>
						<Table.Cell class="text-xs">Gold ({goldItems.length} item{goldItems.length !== 1 ? "s" : ""})</Table.Cell>
						<Table.Cell class="text-right text-xs">{fmt(s.totalGoldValue)}</Table.Cell>
					</Table.Row>
				{/if}
				{#if s.totalSilverValue > 0}
					<Table.Row>
						<Table.Cell class="text-xs">Silver ({silverItems.length} item{silverItems.length !== 1 ? "s" : ""})</Table.Cell>
						<Table.Cell class="text-right text-xs">{fmt(s.totalSilverValue)}</Table.Cell>
					</Table.Row>
				{/if}
				<Table.Row class="font-medium">
					<Table.Cell class="text-xs">Total assets</Table.Cell>
					<Table.Cell class="text-right text-xs">{fmt(s.totalAssets)}</Table.Cell>
				</Table.Row>
				{#if s.totalImmediateDebts > 0}
					<Table.Row>
						<Table.Cell class="text-xs">Immediate debts</Table.Cell>
						<Table.Cell class="text-destructive text-right text-xs">-{fmt(s.totalImmediateDebts)}</Table.Cell>
					</Table.Row>
				{/if}
				{#if s.totalInstallmentDeductions > 0}
					<Table.Row>
						<Table.Cell class="text-xs">Installment deductions</Table.Cell>
						<Table.Cell class="text-destructive text-right text-xs">-{fmt(s.totalInstallmentDeductions)}</Table.Cell>
					</Table.Row>
				{/if}
				<Table.Row class="font-semibold">
					<Table.Cell class="text-xs">Net zakatable wealth</Table.Cell>
					<Table.Cell class="text-right text-xs">{fmt(s.netWealth)}</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Per-item breakdown -->
	{#if zakahStore.metalItems.length > 0}
		<Collapsible.Root bind:open={detailsOpen}>
			<Collapsible.Trigger class="flex w-full items-center gap-1.5 text-xs font-medium">
				<CaretDown
					size={12}
					class={["transition-transform", detailsOpen && "rotate-180"]}
				/>
				Per-item breakdown
			</Collapsible.Trigger>
			<Collapsible.Content>
				<div class="mt-2 space-y-1">
					{#each zakahStore.metalItems as item (item.id)}
						{@const spotPrice = item.metal === "gold" ? zakahStore.effectiveGoldPrice : zakahStore.effectiveSilverPrice}
						{@const val = computeItemValue(item, spotPrice)}
						<div class="text-muted-foreground flex justify-between text-[10px]">
							<span>
								{metalItemTypeLabels[item.type]} ({item.metal})
								— {item.grossWeight}g {item.metal === "gold" ? `${item.karat}K` : item.karat}
								{#if item.quantity > 1}&times;{item.quantity}{/if}
							</span>
							<span>{fmt(val)}</span>
						</div>
					{/each}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	{/if}

	<Separator />

	<!-- Actions -->
	<div class="flex gap-2 print:hidden">
		<Button variant="outline" size="sm" onclick={handlePrint}>
			<Printer size={14} />
			Print
		</Button>
		<Button variant="ghost" size="sm" onclick={handleStartOver}>
			<ArrowCounterClockwise size={14} />
			Start Over
		</Button>
	</div>
</div>
