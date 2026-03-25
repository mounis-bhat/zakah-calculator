<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { Check } from "phosphor-svelte";

	let {
		currentStep,
		totalSteps = 6,
		onstepto,
	}: {
		currentStep: number;
		totalSteps?: number;
		onstepto?: (step: number) => void;
	} = $props();

	const stepLabels = ["Setup", "Cash", "Gold", "Silver", "Debts", "Results"];
</script>

<nav aria-label="Wizard progress" class="w-full px-2 py-4">
	<ol class="flex items-center justify-between gap-1">
		{#each { length: totalSteps } as _, i}
			{@const isCompleted = i < currentStep}
			{@const isCurrent = i === currentStep}
			<li class="flex flex-1 flex-col items-center gap-1.5">
				<button
					type="button"
					class={cn(
						"flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all",
						isCompleted && "bg-primary text-primary-foreground cursor-pointer",
						isCurrent && "bg-primary text-primary-foreground ring-primary/30 ring-2",
						!isCompleted && !isCurrent && "bg-muted text-muted-foreground",
						!isCompleted && !isCurrent && "cursor-default"
					)}
					disabled={!isCompleted}
					onclick={() => isCompleted && onstepto?.(i)}
					aria-current={isCurrent ? "step" : undefined}
					aria-label={`Step ${i + 1}: ${stepLabels[i]}`}
				>
					{#if isCompleted}
						<Check size={14} weight="bold" />
					{:else}
						{i + 1}
					{/if}
				</button>
				<span
					class={cn(
						"text-[10px] leading-tight",
						isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
					)}
				>
					{stepLabels[i]}
				</span>
			</li>
		{/each}
	</ol>
</nav>
