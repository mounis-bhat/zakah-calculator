<script lang="ts">
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { computeTotalDebts } from "@/calculations/zakah";
	import { formatCurrency } from "$lib/utils.js";
	import { getCurrencySymbol } from "@/data/currencies";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Separator } from "$lib/components/ui/separator";
	import InfoTooltip from "@/components/shared/InfoTooltip.svelte";
	import { Plus, Trash } from "phosphor-svelte";

	const immediateDebts = $derived(
		zakahStore.debts.filter((d) => d.category === "immediate"),
	);
	const installmentDebts = $derived(
		zakahStore.debts.filter((d) => d.category === "installment"),
	);
	const totals = $derived(computeTotalDebts(zakahStore.debts));

	function addDebt(category: "immediate" | "installment") {
		zakahStore.addDebt({
			id: crypto.randomUUID(),
			label: "",
			amount: 0,
			category,
		});
	}

	function updateLabel(id: string, label: string) {
		zakahStore.updateDebt(id, { label });
	}

	function updateAmount(id: string, rawValue: string) {
		const val = parseFloat(rawValue.replace(/[^0-9.]/g, ""));
		zakahStore.updateDebt(id, { amount: Number.isNaN(val) ? 0 : val });
	}
</script>

<div class="mx-auto max-w-lg space-y-6">
	<div class="space-y-2">
		<h2 class="text-lg font-semibold">Debts & Deductions</h2>
		<p class="text-muted-foreground text-xs">
			Debts are subtracted from your total wealth before calculating Zakah.
		</p>
	</div>

	<!-- Immediate debts -->
	<div class="space-y-3">
		<div class="flex items-center gap-1.5">
			<Label class="text-sm font-medium">Immediate debts</Label>
			<InfoTooltip text="Bills due now, loans to be repaid this month, rent due, borrowed cash. These are debts you owe right now or within the very near term." />
		</div>

		{#each immediateDebts as debt (debt.id)}
			<div class="flex items-center gap-2">
				<div class="flex-1">
					<Input
						type="text"
						placeholder="e.g. Rent, Loan"
						value={debt.label}
						oninput={(e) => updateLabel(debt.id, (e.target as HTMLInputElement).value)}
					/>
				</div>
				<div class="relative w-28">
					<span class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">
						{getCurrencySymbol(zakahStore.currency)}
					</span>
					<Input
						type="text"
						inputmode="decimal"
						placeholder="0.00"
						value={debt.amount || ""}
						oninput={(e) => updateAmount(debt.id, (e.target as HTMLInputElement).value)}
						class="pl-8"
					/>
				</div>
				<Button
					variant="ghost"
					size="icon-xs"
					onclick={() => zakahStore.removeDebt(debt.id)}
					aria-label="Remove debt"
					class="text-destructive hover:text-destructive"
				>
					<Trash size={14} />
				</Button>
			</div>
		{/each}

		<Button variant="outline" size="sm" onclick={() => addDebt("immediate")}>
			<Plus size={14} />
			Add Debt
		</Button>
	</div>

	<Separator />

	<!-- Installment debts -->
	<div class="space-y-3">
		<div class="flex items-center gap-1.5">
			<Label class="text-sm font-medium">Installment deductions</Label>
			<InfoTooltip text="Some scholars allow deducting up to 12 months of upcoming installments. Enter your monthly payment amount — the app will calculate the annual total." />
		</div>

		{#each installmentDebts as debt (debt.id)}
			<div class="space-y-1">
				<div class="flex items-center gap-2">
					<div class="flex-1">
						<Input
							type="text"
							placeholder="e.g. Mortgage, Car payment"
							value={debt.label}
							oninput={(e) => updateLabel(debt.id, (e.target as HTMLInputElement).value)}
						/>
					</div>
					<div class="relative w-28">
						<span class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs">
							{getCurrencySymbol(zakahStore.currency)}
						</span>
						<Input
							type="text"
							inputmode="decimal"
							placeholder="Monthly"
							value={debt.amount || ""}
							oninput={(e) => updateAmount(debt.id, (e.target as HTMLInputElement).value)}
							class="pl-8"
						/>
					</div>
					<Button
						variant="ghost"
						size="icon-xs"
						onclick={() => zakahStore.removeDebt(debt.id)}
						aria-label="Remove installment"
						class="text-destructive hover:text-destructive"
					>
						<Trash size={14} />
					</Button>
				</div>
				{#if debt.amount > 0}
					<p class="text-muted-foreground pl-1 text-[10px]">
						{formatCurrency(debt.amount, zakahStore.currency)}/mo &times; 12 = {formatCurrency(debt.amount * 12, zakahStore.currency)}
					</p>
				{/if}
			</div>
		{/each}

		<Button variant="outline" size="sm" onclick={() => addDebt("installment")}>
			<Plus size={14} />
			Add Installment
		</Button>
	</div>

	{#if totals.total > 0}
		<div class="border-border rounded-md border p-3 text-center">
			<p class="text-muted-foreground text-[10px] uppercase tracking-wide">Total Deductions</p>
			<p class="text-base font-semibold">{formatCurrency(totals.total, zakahStore.currency)}</p>
		</div>
	{/if}
</div>
