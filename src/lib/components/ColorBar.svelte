<script lang="ts">
	const COLORS = [
		// Pastel green
		{
			html: '#bce29e',
			hex: 0xbce29e,
		},
		// Pastel orange
		{
			html: '#ffb347',
			hex: 0xffb347,
		},
		// Pastel red
		{
			html: '#ff6961',
			hex: 0xff6961,
		},
		// Pastel pink
		{
			html: '#ff9ff3',
			hex: 0xff9ff3,
		},
		// Pastel purple
		{
			html: '#b19cd9',
			hex: 0xb19cd9,
		},
		// Pastel blue
		{
			html: '#a0c4ff',
			hex: 0xa0c4ff,
		},
	];

	// Pastel cyan
	const DEFAULT = {
		html: '#a0e7e5',
		hex: 0xa0e7e5,
	};

	export let selected = DEFAULT.hex;
</script>

<div class="flex flex-row gap-2">
	<input
		checked
		class="w-8 h-8 radio"
		type="radio"
		name="color"
		value={DEFAULT.hex}
		style="background-color: {DEFAULT.html}"
		bind:group={selected}
	/>

	{#each COLORS as color}
		<input
			class="w-8 h-8 radio"
			type="radio"
			name="color"
			value={color.hex}
			style="background-color: {color.html}"
			bind:group={selected}
		/>
	{/each}
</div>
