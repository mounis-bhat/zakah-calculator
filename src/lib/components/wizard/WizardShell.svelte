<script lang="ts">
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import ProgressBar from "./ProgressBar.svelte";
	import { ArrowLeft, ArrowRight, Calculator } from "phosphor-svelte";

	let {
		currentStep = $bindable(0),
		totalSteps = 6,
		children,
	}: {
		currentStep: number;
		totalSteps?: number;
		children: Snippet;
	} = $props();

	function goBack() {
		if (currentStep > 0) currentStep--;
	}

	function goNext() {
		if (currentStep < totalSteps - 1) currentStep++;
	}

	const isFirstStep = $derived(currentStep === 0);
	const isLastStep = $derived(currentStep === totalSteps - 1);
	const isSecondToLast = $derived(currentStep === totalSteps - 2);
</script>

<div class="flex min-h-[100dvh] flex-col">
	<ProgressBar
		{currentStep}
		{totalSteps}
		onstepto={(step) => (currentStep = step)}
	/>

	<div class="flex-1 px-4 pb-24">
		{@render children()}
	</div>

	<div
		class="bg-background/95 border-border fixed bottom-0 left-0 right-0 flex items-center justify-between border-t px-4 py-3 backdrop-blur-sm"
	>
		<Button
			variant="ghost"
			size="sm"
			onclick={goBack}
			disabled={isFirstStep}
			class={isFirstStep ? "invisible" : ""}
		>
			<ArrowLeft size={16} />
			Back
		</Button>

		{#if !isLastStep}
			<Button size="sm" onclick={goNext}>
				{#if isSecondToLast}
					<Calculator size={16} />
					Calculate Zakah
				{:else}
					Next
					<ArrowRight size={16} />
				{/if}
			</Button>
		{/if}
	</div>
</div>
