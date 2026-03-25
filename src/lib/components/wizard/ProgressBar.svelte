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

<nav aria-label="Wizard progress" class="w-full px-4 py-5">
	<ol class="flex items-start">
		{#each { length: totalSteps } as _, i}
			{@const isCompleted = i < currentStep}
			{@const isCurrent = i === currentStep}
			{@const isFuture = i > currentStep}

			<li
				class="flex flex-col items-center"
				style="flex: {i === totalSteps - 1 ? '0 0 auto' : '1 1 0%'}"
			>
				<div class="flex w-full items-center">
					<button
						type="button"
						class={cn(
							"relative z-10 flex shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
							"size-9 sm:size-10",
							isCompleted &&
								"bg-primary text-primary-foreground cursor-pointer shadow-sm",
							isCurrent &&
								"border-2 border-primary bg-primary/10 text-primary shadow-sm",
							isFuture &&
								"border-2 border-border bg-muted text-muted-foreground cursor-default",
						)}
						disabled={!isCompleted}
						onclick={() => isCompleted && onstepto?.(i)}
						aria-current={isCurrent ? "step" : undefined}
						aria-label={`Step ${i + 1}: ${stepLabels[i]}`}
					>
						{#if isCompleted}
							<Check size={18} weight="bold" />
						{:else}
							{i + 1}
						{/if}
						{#if isCurrent}
							<span
								class="border-primary absolute inset-0 animate-ping rounded-full border-2 opacity-20"
							></span>
						{/if}
					</button>

					{#if i < totalSteps - 1}
						<div class="relative mx-1 h-0.5 flex-1">
							<div class="bg-border absolute inset-0 rounded-full"></div>
							<div
								class={cn(
									"absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
									isCompleted
										? "bg-primary w-full"
										: isCurrent
											? "bg-primary/40 w-1/2"
											: "w-0",
								)}
							></div>
						</div>
					{/if}
				</div>

				<span
					class={cn(
						"mt-2 max-w-16 text-center text-xs leading-tight sm:max-w-none",
						isCurrent
							? "text-primary font-semibold"
							: isCompleted
								? "text-foreground font-medium"
								: "text-muted-foreground",
					)}
				>
					{stepLabels[i]}
				</span>
			</li>
		{/each}
	</ol>
</nav>
