<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Zakah Calculator</title>
  <meta name="description" content="Calculate your obligatory Zakah on gold, silver, and cash." />
</svelte:head>
<div class="mx-auto min-h-[100dvh] max-w-2xl">
  {@render children()}
</div>
