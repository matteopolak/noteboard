<script lang="ts">
	import { COLOR_TO_NOTE } from '$lib/cell';

	const COLORS = [
		//Pastel brown
		{
			html: '#836953',
			hex: 0x836953,
		},
		// Pastel red
		{
			html: '#ff6961',
			hex: 0xff6961,
		},
		// Pastel purple
		{
			html: '#b19cd9',
			hex: 0xb19cd9,
		},
		// Pastel pink
		{
			html: '#ff9ff3',
			hex: 0xff9ff3,
		},
		// Pastel orange
		{
			html: '#ffb347',
			hex: 0xffb347,
		},
		// Pastel blue
		{
			html: '#a0c4ff',
			hex: 0xa0c4ff,
		},
		// Pastel cyan
		{
			html: '#a0e7e5',
			hex: 0xa0e7e5,
		},
		//Pastel green
		{
			html: '#bce29e',
			hex: 0xbce29e,
		},
	];

	export let selected = COLORS[0].hex;
</script>

<div class="flex flex-row gap-2">
	{#each COLORS as color}
		<input
			class="w-8 h-8 radio"
			type="radio"
			name="color"
			value={color.hex}
			style="background-color: {color.html}"
			checked={selected === color.hex}
			bind:group={selected}
			on:click={() => COLOR_TO_NOTE[color.hex].play()}
		/>
	{/each}
</div>
