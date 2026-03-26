<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/stores";
	import { goto, onNavigate } from "$app/navigation";
	import { onMount } from "svelte";
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { Button } from "$lib/components/ui/button";
	import { cn } from "$lib/utils.js";
	import { ArrowLeft, ArrowRight, Calculator } from "phosphor-svelte";

	let { children } = $props();

	const routes = [
		{ path: "/", label: "Setup" },
		{ path: "/cash", label: "Cash" },
		{ path: "/gold", label: "Gold" },
		{ path: "/silver", label: "Silver" },
		{ path: "/debts", label: "Debts" },
		{ path: "/results", label: "Results" },
	];

	const currentIndex = $derived(
		routes.findIndex((r) => r.path === $page.url.pathname),
	);
	const prevRoute = $derived(
		currentIndex > 0 ? routes[currentIndex - 1] : null,
	);
	const nextRoute = $derived(
		currentIndex >= 0 && currentIndex < routes.length - 1
			? routes[currentIndex + 1]
			: null,
	);
	const isSecondToLast = $derived(currentIndex === routes.length - 2);

	let mounted = $state(false);

	onMount(() => {
		zakahStore.loadFromStorage();
		mounted = true;
	});

	// Debounced persistence
	let persistTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (!mounted) return;
		zakahStore.toState();
		clearTimeout(persistTimeout);
		persistTimeout = setTimeout(() => {
			zakahStore.persist();
		}, 500);
	});

	// View Transitions API
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Zakah Calculator</title>
	<meta
		name="description"
		content="Calculate your obligatory Zakah on gold, silver, and cash."
	/>
</svelte:head>

<div class="flex min-h-[100dvh] flex-col">
	<!-- Top Navigation -->
	<nav
		class="border-border/50 sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"
	>
		<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-12 xl:px-16">
			<div class="flex items-center py-3 lg:py-4">
				<a
					href="/"
					class="font-display text-lg font-semibold tracking-tight lg:text-xl"
				>
					Zakah Calculator
				</a>
			</div>
			<div class="no-scrollbar -mb-px flex gap-1 overflow-x-auto pb-3">
				{#each routes as route, i}
					{@const isActive = route.path === $page.url.pathname}
					<a
						href={route.path}
						style="--stagger-index: {i}"
						class={cn(
							"animate-stagger-in whitespace-nowrap rounded-full px-4 py-2 text-base font-medium transition-colors",
							isActive
								? "bg-primary/15 text-primary"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{route.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<!-- Content -->
	<main class="flex-1 pb-20 lg:pb-0">
		<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12 xl:px-16">
			{#if mounted}
				{@render children()}
			{/if}
		</div>
	</main>

	<!-- Bottom Navigation -->
	{#if mounted && (prevRoute || nextRoute)}
		<div
			class="border-border/50 bg-background/90 fixed bottom-0 left-0 right-0 border-t backdrop-blur-md print:hidden lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none"
		>
			<div
				class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-12 lg:pb-10 xl:px-16"
			>
				{#if prevRoute}
					<Button
						variant="ghost"
						size="sm"
						onclick={() => goto(prevRoute.path)}
					>
						<ArrowLeft size={16} />
						{prevRoute.label}
					</Button>
				{:else}
					<div></div>
				{/if}

				{#if nextRoute}
					<Button
						size={isSecondToLast ? "default" : "sm"}
						onclick={() => goto(nextRoute.path)}
						class={isSecondToLast ? "font-semibold shadow-sm" : ""}
					>
						{#if isSecondToLast}
							<Calculator size={16} />
							Calculate Zakah
						{:else}
							{nextRoute.label}
							<ArrowRight size={16} />
						{/if}
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>
