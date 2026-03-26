<script lang="ts">
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { formatCurrency } from "$lib/utils.js";
	import { goto } from "$app/navigation";
	import { fly, fade } from "svelte/transition";
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
	const pricingModeLabel = $derived(
		(zakahStore.manualGoldPrice !== null &&
			zakahStore.effectiveGoldPrice === zakahStore.manualGoldPrice) ||
			(zakahStore.manualSilverPrice !== null &&
				zakahStore.effectiveSilverPrice === zakahStore.manualSilverPrice)
			? "Local manual rates"
			: "Live USD spot rates",
	);
	function fmt(n: number) {
		return formatCurrency(n, currency);
	}

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
		goto("/");
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 lg:space-y-8 print:max-w-none">
	<h1 class="animate-stagger-in font-display text-2xl font-bold lg:text-3xl" style="--stagger-index: 0">Results</h1>

	<!-- Nisab Status -->
	{#if s.nisabThreshold !== null}
		{#if s.isAboveNisab}
			<Alert.Root class="animate-stagger-in border-success/30 bg-success/5" style="--stagger-index: 1">
				<CheckCircle size={16} class="text-success" />
				<Alert.Title class="text-success"
					>Zakah is obligatory</Alert.Title
				>
				<Alert.Description class="text-base text-success/80">
					Your net wealth ({fmt(s.netWealth)}) exceeds the {zakahStore.nisabMethod}
					nisab threshold ({fmt(s.nisabThreshold)}).
				</Alert.Description>
			</Alert.Root>
		{:else}
			<Alert.Root class="animate-stagger-in" style="--stagger-index: 1">
				<XCircle size={16} class="text-muted-foreground" />
				<Alert.Title>Below nisab threshold</Alert.Title>
				<Alert.Description class="text-sm">
					Your net wealth ({fmt(s.netWealth)}) is below the {zakahStore.nisabMethod}
					nisab threshold ({fmt(s.nisabThreshold)}). Zakah is not
					obligatory this year, but voluntary charity (Sadaqah) is
					always encouraged.
				</Alert.Description>
			</Alert.Root>
		{/if}
	{:else}
		<Alert.Root class="animate-stagger-in border-destructive/50" style="--stagger-index: 1">
			<Alert.Title>Cannot determine nisab</Alert.Title>
			<Alert.Description class="text-base">
				No metal prices available. Go to <a
					href="/"
					class="underline underline-offset-2">Setup</a
				> and enter prices manually.
			</Alert.Description>
		</Alert.Root>
	{/if}

	<!-- Zakah Due -->
	{#if s.isAboveNisab}
		<div
			class="border-primary/20 rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 text-center shadow-lg shadow-primary/10 lg:p-12"
			in:fly={{ y: 20, duration: 400, delay: 200 }}
		>
			<p
				class="text-muted-foreground text-sm font-medium uppercase tracking-wide"
			>
				Zakah Due (2.5%)
			</p>
			<p
				class="font-display text-primary text-4xl font-bold sm:text-5xl lg:text-6xl"
			>
				{fmt(s.zakahDue)}
			</p>
			<div class="animate-shimmer mx-auto mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-gold to-transparent bg-[length:200%_100%]"></div>
		</div>
	{/if}

	<div class="animate-stagger-in grid gap-3 sm:grid-cols-2" style="--stagger-index: 2">
		<div class="rounded-2xl border border-border/60 bg-card/70 p-4">
			<p class="text-muted-foreground text-[11px] uppercase tracking-[0.22em]">
				Pricing mode
			</p>
			<p class="mt-2 text-base font-semibold">{pricingModeLabel}</p>
			<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
				{#if pricingModeLabel === "Local manual rates"}
					Results are using the manual gold and silver rates you entered in Setup.
				{:else}
					Results are using live USD spot prices converted into {currency}.
				{/if}
			</p>
		</div>

		<div class="rounded-2xl border border-border/60 bg-card/70 p-4">
			<p class="text-muted-foreground text-[11px] uppercase tracking-[0.22em]">
				Nisab basis
			</p>
			<p class="mt-2 text-base font-semibold capitalize">
				{zakahStore.nisabMethod} threshold
			</p>
			<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
				{#if s.nisabThreshold !== null}
					Current threshold: {fmt(s.nisabThreshold)}
				{:else}
					Set a valid price source in Setup to calculate the threshold.
				{/if}
			</p>
		</div>
	</div>

	<!-- Asset Summary Table -->
	<div class="animate-stagger-in space-y-2" style="--stagger-index: 3">
		<div class="flex items-center justify-between">
			<h3 class="text-base font-medium lg:text-lg">Asset Summary</h3>
			<Button
				variant="ghost"
				size="icon-xs"
				onclick={() => goto("/cash")}
				aria-label="Edit assets"
				class="print:hidden"
			>
				<PencilSimple size={14} />
			</Button>
		</div>
		<Table.Root>
			<Table.Body>
				<Table.Row>
					<Table.Cell class="text-sm">Cash on hand</Table.Cell>
					<Table.Cell class="text-right text-sm"
						>{fmt(zakahStore.cash.onHand)}</Table.Cell
					>
				</Table.Row>
				<Table.Row>
					<Table.Cell class="text-sm">Cash in bank</Table.Cell>
					<Table.Cell class="text-right text-sm"
						>{fmt(zakahStore.cash.inBank)}</Table.Cell
					>
				</Table.Row>
				{#if s.totalGoldValue > 0}
					<Table.Row>
						<Table.Cell class="text-sm"
							>Gold ({goldItems.length} item{goldItems.length !==
							1
								? "s"
								: ""})</Table.Cell
						>
						<Table.Cell class="text-right text-sm"
							>{fmt(s.totalGoldValue)}</Table.Cell
						>
					</Table.Row>
				{/if}
				{#if s.totalSilverValue > 0}
					<Table.Row>
						<Table.Cell class="text-sm"
							>Silver ({silverItems.length} item{silverItems.length !==
							1
								? "s"
								: ""})</Table.Cell
						>
						<Table.Cell class="text-right text-sm"
							>{fmt(s.totalSilverValue)}</Table.Cell
						>
					</Table.Row>
				{/if}
				<Table.Row class="font-medium">
					<Table.Cell class="text-sm">Total assets</Table.Cell>
					<Table.Cell class="text-right text-sm"
						>{fmt(s.totalAssets)}</Table.Cell
					>
				</Table.Row>
				{#if s.totalImmediateDebts > 0}
					<Table.Row>
						<Table.Cell class="text-sm">Immediate debts</Table.Cell>
						<Table.Cell
							class="text-destructive text-right text-sm"
							>-{fmt(s.totalImmediateDebts)}</Table.Cell
						>
					</Table.Row>
				{/if}
				{#if s.totalInstallmentDeductions > 0}
					<Table.Row>
						<Table.Cell class="text-sm"
							>Installment deductions</Table.Cell
						>
						<Table.Cell
							class="text-destructive text-right text-sm"
							>-{fmt(s.totalInstallmentDeductions)}</Table.Cell
						>
					</Table.Row>
				{/if}
				<Table.Row class="font-semibold">
					<Table.Cell class="text-primary text-sm"
						>Net zakatable wealth</Table.Cell
					>
					<Table.Cell class="text-primary text-right text-sm"
						>{fmt(s.netWealth)}</Table.Cell
					>
				</Table.Row>
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Per-item breakdown -->
	{#if zakahStore.metalItems.length > 0}
		<Collapsible.Root bind:open={detailsOpen} class="animate-stagger-in" style="--stagger-index: 4">
			<Collapsible.Trigger
				class="flex w-full items-center gap-1.5 text-base font-medium"
			>
				<CaretDown
					size={12}
					class={[
						"transition-transform",
						detailsOpen && "rotate-180",
					]}
				/>
				Per-item breakdown
			</Collapsible.Trigger>
			<Collapsible.Content>
				<div class="mt-2 space-y-1">
					{#each zakahStore.metalItems as item (item.id)}
						{@const spotPrice =
							item.metal === "gold"
								? zakahStore.effectiveGoldPrice
								: zakahStore.effectiveSilverPrice}
						{@const val = computeItemValue(item, spotPrice)}
						<div
							class="text-muted-foreground flex justify-between text-sm"
						>
							<span>
								{metalItemTypeLabels[item.type]} ({item.metal})
								— {item.grossWeight}g {item.metal === "gold"
									? `${item.karat}K`
									: item.karat}
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
	<div class="animate-stagger-in flex gap-2 print:hidden" style="--stagger-index: 5">
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
