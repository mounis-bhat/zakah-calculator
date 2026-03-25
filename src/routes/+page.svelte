<script lang="ts">
	import { onMount } from "svelte";
	import { zakahStore } from "@/state/zakah-state.svelte";
	import WizardShell from "@/components/wizard/WizardShell.svelte";
	import WelcomeStep from "@/components/steps/WelcomeStep.svelte";
	import CashStep from "@/components/steps/CashStep.svelte";
	import GoldStep from "@/components/steps/GoldStep.svelte";
	import SilverStep from "@/components/steps/SilverStep.svelte";
	import DebtsStep from "@/components/steps/DebtsStep.svelte";
	import ResultsStep from "@/components/steps/ResultsStep.svelte";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";

	let showWelcomeBack = $state(false);
	let mounted = $state(false);

	onMount(() => {
		const hasData = zakahStore.loadFromStorage();
		if (hasData && zakahStore.currentStep > 0) {
			showWelcomeBack = true;
		}
		mounted = true;
	});

	// Debounced persistence
	let persistTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (!mounted) return;
		// Read all state to establish dependencies
		zakahStore.toState();
		const step = zakahStore.currentStep;
		clearTimeout(persistTimeout);
		persistTimeout = setTimeout(() => {
			zakahStore.persist();
		}, 500);
	});

	function handleContinue() {
		showWelcomeBack = false;
	}

	function handleStartFresh() {
		zakahStore.reset();
		showWelcomeBack = false;
	}
</script>

{#if mounted}
	<WizardShell bind:currentStep={zakahStore.currentStep}>
		{#if zakahStore.currentStep === 0}
			<WelcomeStep />
		{:else if zakahStore.currentStep === 1}
			<CashStep />
		{:else if zakahStore.currentStep === 2}
			<GoldStep />
		{:else if zakahStore.currentStep === 3}
			<SilverStep />
		{:else if zakahStore.currentStep === 4}
			<DebtsStep />
		{:else if zakahStore.currentStep === 5}
			<ResultsStep />
		{/if}
	</WizardShell>
{/if}

<Dialog.Root bind:open={showWelcomeBack}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Welcome back</Dialog.Title>
			<Dialog.Description>
				You have saved progress from a previous session. Would you like to continue where you left off?
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="ghost" onclick={handleStartFresh}>Start fresh</Button>
			<Button onclick={handleContinue}>Continue</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
