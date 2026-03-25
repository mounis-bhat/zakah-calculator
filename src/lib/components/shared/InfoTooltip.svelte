<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { Info } from "phosphor-svelte";
	import type { Snippet } from "svelte";

	let {
		text = "",
		children,
	}: {
		text?: string;
		children?: Snippet;
	} = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger
			class="text-muted-foreground hover:text-foreground inline-flex cursor-help align-middle transition-colors"
			aria-label="More information"
		>
			<Info size={16} />
		</Tooltip.Trigger>
		<Tooltip.Content side="top" class="max-w-xs text-xs">
			{#if children}
				{@render children()}
			{:else}
				{text}
			{/if}
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
