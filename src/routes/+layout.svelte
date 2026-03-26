<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { page } from "$app/stores";
	import { goto, onNavigate } from "$app/navigation";
	import { onMount } from "svelte";
	import { zakahStore } from "@/state/zakah-state.svelte";
	import { Button } from "$lib/components/ui/button";
	import * as Sheet from "$lib/components/ui/sheet";
	import { cn, formatCurrency } from "$lib/utils.js";
	import type { Component } from "svelte";
	import {
		ArrowLeft,
		ArrowRight,
		Calculator,
		CheckCircle,
		Coins,
		Receipt,
		SlidersHorizontal,
		Sparkle,
		Wallet,
	} from "phosphor-svelte";

	let { children } = $props();

	type RouteMeta = {
		path: string;
		label: string;
		description: string;
		icon: Component;
	};

	const routes: RouteMeta[] = [
		{
			path: "/",
			label: "Setup",
			description: "Preferences and live prices",
			icon: SlidersHorizontal,
		},
		{
			path: "/cash",
			label: "Cash",
			description: "Wallets and bank balances",
			icon: Wallet,
		},
		{
			path: "/gold",
			label: "Gold",
			description: "Jewelry and bullion items",
			icon: Sparkle,
		},
		{
			path: "/silver",
			label: "Silver",
			description: "Silver holdings by weight",
			icon: Coins,
		},
		{
			path: "/debts",
			label: "Debts",
			description: "Short-term liabilities",
			icon: Receipt,
		},
		{
			path: "/results",
			label: "Results",
			description: "Final nisab and zakah due",
			icon: Calculator,
		},
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
	const currentRoute = $derived(routes[currentIndex] ?? routes[0]);
	const stepNumber = $derived(currentIndex >= 0 ? currentIndex + 1 : 1);
	const progressValue = $derived(
		currentIndex >= 0 ? (stepNumber / routes.length) * 100 : 0,
	);
	const cashEntered = $derived(zakahStore.cash.onHand + zakahStore.cash.inBank);
	const goldItemCount = $derived(
		zakahStore.metalItems.filter((item) => item.metal === "gold").length,
	);
	const silverItemCount = $derived(
		zakahStore.metalItems.filter((item) => item.metal === "silver").length,
	);
	const debtCount = $derived(zakahStore.debts.length);
	const dataSectionsCount = $derived(
		[
			zakahStore.effectiveGoldPrice !== null && zakahStore.effectiveSilverPrice !== null,
			cashEntered > 0,
			goldItemCount > 0,
			silverItemCount > 0,
			debtCount > 0,
		].filter(Boolean).length,
	);
	const pricingModeLabel = $derived(
		(zakahStore.manualGoldPrice !== null &&
			zakahStore.effectiveGoldPrice === zakahStore.manualGoldPrice) ||
			(zakahStore.manualSilverPrice !== null &&
				zakahStore.effectiveSilverPrice === zakahStore.manualSilverPrice)
			? "Local manual"
			: "Live USD spot",
	);

	let mounted = $state(false);
	let menuOpen = $state(false);
	let saveState = $state<"idle" | "saving" | "saved" | "error">("idle");
	let savedAt = $state<Date | null>(null);
	const autosaveLabel = $derived.by(() => {
		if (saveState === "saving") return "Saving changes";
		if (saveState === "error") return "Save failed";
		if (!savedAt) return "Local autosave ready";
		return "Saved locally";
	});

	onMount(() => {
		zakahStore.loadFromStorage();
		mounted = true;
		saveState = zakahStore.hasSavedState ? "saved" : "idle";
		savedAt = zakahStore.hasSavedState ? new Date() : null;
	});

	// Debounced persistence
	let persistTimeout: ReturnType<typeof setTimeout>;
	$effect(() => {
		if (!mounted) return;
		zakahStore.toState();
		clearTimeout(persistTimeout);
		saveState = "saving";
		persistTimeout = setTimeout(() => {
			try {
				zakahStore.persist();
				saveState = "saved";
				savedAt = new Date();
			} catch {
				saveState = "error";
			}
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
			<div class="flex items-center justify-between gap-4 py-3 lg:py-5">
				<div class="flex min-w-0 items-center gap-3">
					<a
						href="/"
						class="font-display text-lg font-semibold tracking-tight lg:text-2xl"
					>
						Zakah Calculator
					</a>
					<div class="hidden rounded-full border border-border/60 bg-card/75 px-3 py-1.5 text-xs text-muted-foreground lg:flex lg:items-center lg:gap-2 lg:transition-transform lg:hover:-translate-y-0.5">
						<span
							class={cn(
								"size-2 rounded-full",
								saveState === "saving"
									? "bg-primary animate-pulse animate-status-glow"
									: saveState === "error"
										? "bg-destructive"
										: "bg-success animate-status-glow",
							)}
						></span>
						{autosaveLabel}
					</div>
				</div>

				<div class="flex items-center gap-3 lg:hidden">
					<div class="min-w-0 text-right">
						<p class="truncate text-sm font-semibold">{currentRoute.label}</p>
						<p class="text-muted-foreground text-xs">
							Step {stepNumber} of {routes.length}
						</p>
						<p class="text-muted-foreground/80 mt-0.5 text-[11px]">
							{autosaveLabel}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						class="rounded-full border-border/60 bg-background/70 px-3 text-sm"
						onclick={() => (menuOpen = true)}
					>
						All steps
					</Button>
				</div>

				<div class="hidden items-center gap-4 lg:flex">
					<div class="text-right">
						<p class="text-muted-foreground text-xs uppercase tracking-[0.22em]">
							Guided workflow
						</p>
						<p class="text-sm font-medium">
							Step {stepNumber} of {routes.length}
						</p>
					</div>
					<div class="nav-progress-track w-24">
						<div
							class="nav-progress-fill"
							style={`width: ${progressValue}%`}
						></div>
					</div>
				</div>
			</div>

			<div class="hidden gap-3 pb-4 lg:grid lg:grid-cols-6">
				{#each routes as route, i}
					{@const isActive = route.path === $page.url.pathname}
					{@const isComplete = i < currentIndex}
					{@const Icon = route.icon}
					<a
						href={route.path}
						style="--stagger-index: {i}"
						class={cn(
							"animate-stagger-in group block rounded-[1.4rem] border px-4 py-4 transition-all duration-200",
							isActive
								? "border-primary/40 bg-primary/12 shadow-lg shadow-primary/10"
								: isComplete
									? "border-border/70 bg-card/80 hover:border-primary/30 hover:bg-card"
									: "border-border/50 bg-background/55 hover:border-border hover:bg-card/70",
						)}
					>
						<div class="flex items-start gap-3">
							<div
								class={cn(
									"flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
									isActive
										? "border-primary/50 bg-primary text-primary-foreground"
										: isComplete
											? "border-primary/30 bg-primary/12 text-primary"
											: "border-border/60 bg-muted/50 text-muted-foreground group-hover:text-foreground",
								)}
							>
								{#if isComplete}
									<CheckCircle size={18} weight="fill" />
								{:else}
									<Icon size={18} />
								{/if}
							</div>
							<div class="min-w-0 space-y-1">
								<p
									class={cn(
										"truncate text-sm font-semibold",
										isActive ? "text-foreground" : "text-foreground/90",
									)}
								>
									{route.label}
								</p>
								<p class="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
									{route.description}
								</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<div class="print:hidden">
		<div class="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-12 xl:px-16">
			<section class="animate-scale-in animate-soft-float overflow-hidden rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-card via-card/95 to-background/80 shadow-xl shadow-black/10" style="--stagger-index: 0">
				<div class="grid gap-4 p-4 lg:grid-cols-[1.3fr_1fr] lg:p-5">
					<div class="space-y-4">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="text-muted-foreground text-xs uppercase tracking-[0.24em]">
									Progress overview
								</p>
								<h2 class="font-display text-lg font-semibold lg:text-xl">
									{currentRoute.label}
								</h2>
							</div>
							<div class="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-sm font-medium">
								{stepNumber}/{routes.length}
							</div>
						</div>
						<p class="text-muted-foreground max-w-xl text-sm leading-relaxed">
							{currentRoute.description}. Sections with data: {dataSectionsCount} of 5.
						</p>
						<div class="nav-progress-track overflow-hidden">
							<div class="pointer-events-none absolute inset-y-0 left-0 w-20 animate-shimmer bg-gradient-to-r from-transparent via-white/12 to-transparent bg-[length:200%_100%]"></div>
							<div class="nav-progress-fill" style={`width: ${progressValue}%`}></div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-2xl border border-border/60 bg-background/55 p-3">
							<p class="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">Cash entered</p>
							<p class="mt-2 text-base font-semibold">{formatCurrency(cashEntered, zakahStore.currency)}</p>
						</div>
						<div class="rounded-2xl border border-border/60 bg-background/55 p-3">
							<p class="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">Net wealth</p>
							<p class="mt-2 text-base font-semibold">{formatCurrency(zakahStore.summary.netWealth, zakahStore.currency)}</p>
						</div>
						<div class="rounded-2xl border border-border/60 bg-background/55 p-3">
							<p class="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">Metals logged</p>
							<p class="mt-2 text-base font-semibold">{goldItemCount + silverItemCount} items</p>
							<p class="text-muted-foreground mt-1 text-xs">{goldItemCount} gold, {silverItemCount} silver</p>
						</div>
						<div class="rounded-2xl border border-border/60 bg-background/55 p-3">
							<p class="text-muted-foreground text-[11px] uppercase tracking-[0.2em]">Pricing mode</p>
							<p class="mt-2 text-base font-semibold">{pricingModeLabel}</p>
							<p class="text-muted-foreground mt-1 text-xs">{debtCount} debt entries recorded</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>

	<Sheet.Root bind:open={menuOpen}>
		<Sheet.Content
			side="right"
			class="w-[88vw] max-w-sm border-l border-border/60 bg-background/95 p-0 backdrop-blur-xl"
		>
			<div class="flex h-full flex-col">
				<div class="border-border/60 border-b px-5 pb-4 pt-5">
					<p class="text-muted-foreground text-xs uppercase tracking-[0.24em]">
						Calculator steps
					</p>
					<div class="mt-2 flex items-end justify-between gap-3">
						<div>
							<h2 class="font-display text-xl font-semibold">{currentRoute.label}</h2>
							<p class="text-muted-foreground mt-1 text-sm">
								{currentRoute.description}
							</p>
						</div>
						<div class="text-right text-sm font-medium">
							{stepNumber}/{routes.length}
						</div>
					</div>
					<div class="nav-progress-track mt-4">
						<div
							class="nav-progress-fill"
							style={`width: ${progressValue}%`}
						></div>
					</div>
				</div>

				<div class="flex-1 overflow-y-auto p-3">
					<div class="space-y-2">
						{#each routes as route, i}
							{@const isActive = route.path === $page.url.pathname}
							{@const isComplete = i < currentIndex}
							{@const Icon = route.icon}
							<a
								href={route.path}
								onclick={() => (menuOpen = false)}
								class={cn(
									"block rounded-2xl border px-4 py-3 transition-colors",
									isActive
										? "border-primary/40 bg-primary/10"
										: isComplete
											? "border-border/60 bg-card/80"
											: "border-border/50 bg-background/40",
								)}
							>
								<div class="flex items-start gap-3">
									<div
										class={cn(
											"flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
											isActive
												? "border-primary/50 bg-primary text-primary-foreground"
												: isComplete
													? "border-primary/30 bg-primary/12 text-primary"
													: "border-border/60 bg-muted/50 text-muted-foreground",
										)}
									>
										{#if isComplete}
											<CheckCircle size={18} weight="fill" />
										{:else}
											<Icon size={18} />
										{/if}
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center justify-between gap-3">
											<p class="truncate text-sm font-semibold">{route.label}</p>
											<span class="text-muted-foreground text-xs">
												{#if isActive}
													Current
												{:else if isComplete}
													Done
												{:else}
													Next
												{/if}
											</span>
										</div>
										<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
											{route.description}
										</p>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</div>
		</Sheet.Content>
	</Sheet.Root>

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
				class="mx-auto grid max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 sm:px-6 lg:px-12 lg:pb-10 xl:px-16"
			>
				{#if prevRoute}
					<Button
						variant="ghost"
						size="sm"
						onclick={() => goto(prevRoute.path)}
						class="justify-self-start"
					>
						<ArrowLeft size={16} />
						{prevRoute.label}
					</Button>
				{:else}
					<div class="h-7"></div>
				{/if}

				<div class="min-w-0 text-center">
					<p class="text-muted-foreground text-[11px] uppercase tracking-[0.24em]">
						Current step
					</p>
					<p class="truncate text-sm font-semibold">{currentRoute.label}</p>
				</div>

				{#if nextRoute}
					<Button
						size={isSecondToLast ? "default" : "sm"}
						onclick={() => goto(nextRoute.path)}
						class={cn(
							"justify-self-end",
							isSecondToLast && "font-semibold shadow-sm",
						)}
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
