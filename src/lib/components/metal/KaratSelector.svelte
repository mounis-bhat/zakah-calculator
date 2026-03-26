<script lang="ts">
	import { goldKaratOptions, silverFinenessOptions } from "@/data/metal-presets";
	import { Input } from "$lib/components/ui/input";
	import { cn } from "$lib/utils.js";

	let {
		value = $bindable(24),
		metal,
	}: {
		value: number;
		metal: "gold" | "silver";
	} = $props();

	const options = $derived(
		metal === "gold" ? goldKaratOptions : silverFinenessOptions,
	);
	const isPreset = $derived(options.some((o) => o.value === value));
	let showCustom = $state(false);
	let customValue = $state("");

	function selectPreset(val: number) {
		value = val;
		showCustom = false;
	}

	function enableCustom() {
		showCustom = true;
		customValue = isPreset ? "" : String(value);
	}

	function handleCustomInput(e: Event) {
		const input = e.target as HTMLInputElement;
		customValue = input.value;
		const parsed = parseFloat(input.value);
		if (!Number.isNaN(parsed) && parsed > 0) {
			value = parsed;
		}
	}
</script>

<div class="space-y-2">
	<div class="flex flex-wrap gap-1.5">
		{#each options as option, i}
			<button
				type="button"
				style="--stagger-index: {i}"
				class={cn(
					"animate-scale-in rounded-md border px-3 py-1.5 text-sm font-medium transition-all",
					value === option.value && !showCustom
						? "border-primary bg-primary text-primary-foreground"
						: "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
				)}
				onclick={() => selectPreset(option.value)}
			>
				{option.label}
			</button>
		{/each}
		<button
			type="button"
			class={cn(
				"rounded-md border px-3 py-1.5 text-sm font-medium transition-all",
				showCustom
					? "border-primary bg-primary text-primary-foreground"
					: "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
			)}
			onclick={enableCustom}
		>
			Other
		</button>
	</div>

	{#if showCustom}
		<Input
			type="number"
			placeholder={metal === "gold" ? "e.g. 17" : "e.g. 800"}
			value={customValue}
			oninput={handleCustomInput}
			class="w-32"
		/>
	{/if}
</div>
