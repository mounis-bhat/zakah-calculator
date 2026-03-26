<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { getCurrencySymbol } from "@/data/currencies";
	import { cn } from "$lib/utils.js";

	let {
		value = $bindable(0),
		currency,
		label,
		placeholder = "0.00",
		id = crypto.randomUUID(),
		class: className,
	}: {
		value: number;
		currency: string;
		label: string;
		placeholder?: string;
		id?: string;
		class?: string;
	} = $props();

	let displayValue = $state(value === 0 ? "" : String(value));

	function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const raw = input.value.replace(/[^0-9.]/g, "");
		displayValue = raw;
		const parsed = parseFloat(raw);
		value = Number.isNaN(parsed) ? 0 : parsed;
	}

	function handleBlur() {
		if (value === 0) {
			displayValue = "";
		} else {
			displayValue = String(value);
		}
	}

	$effect(() => {
		// Sync external changes
		if (value === 0 && displayValue === "") return;
		const parsed = parseFloat(displayValue);
		if (!Number.isNaN(parsed) && parsed !== value) {
			displayValue = value === 0 ? "" : String(value);
		}
	});
</script>

<div class={cn("space-y-1.5", className)}>
	<Label for={id}>{label}</Label>
	<div class="relative">
		<span
			class="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm"
		>
			{getCurrencySymbol(currency)}
		</span>
		<Input
			{id}
			type="text"
			inputmode="decimal"
			value={displayValue}
			{placeholder}
			class="pl-8"
			oninput={handleInput}
			onblur={handleBlur}
		/>
	</div>
</div>
