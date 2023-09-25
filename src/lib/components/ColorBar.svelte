<script context="module">
	export const WHITE = {
		html: '#FFFFFF',
		hex: 0xffffff,
		label: 'Eraser',
	};
</script>

<script lang="ts">
	import { COLOR_TO_NOTE } from '$lib/cell';

	const COLORS = [
		//Pastel brown
		{
			html: '#836953',
			hex: 0x836953,
			label: 'C',
		},
		// Pastel red
		{
			html: '#ff6961',
			hex: 0xff6961,
			label: 'D',
		},
		// Pastel purple
		{
			html: '#b19cd9',
			hex: 0xb19cd9,
			label: 'E',
		},
		// Pastel pink
		{
			html: '#ff9ff3',
			hex: 0xff9ff3,
			label: 'F',
		},
		// Pastel orange
		{
			html: '#ffb347',
			hex: 0xffb347,
			label: 'G',
		},
		// Pastel blue
		{
			html: '#a0c4ff',
			hex: 0xa0c4ff,
			label: 'A',
		},
		// Pastel cyan
		{
			html: '#a0e7e5',
			hex: 0xa0e7e5,
			label: 'B',
		},
		//Pastel green
		{
			html: '#bce29e',
			hex: 0xbce29e,
			label: 'C',
		},
		WHITE,
	];

	export let selected = COLORS[0];
</script>

<div class="flex flex-row gap-2">
	{#each COLORS as color}
		<input
			class="w-8 h-8 radio"
			type="radio"
			name="color"
			value={color}
			style="background-color: {color.html}"
			checked={selected.hex === color.hex}
			bind:group={selected}
			on:click={() => COLOR_TO_NOTE[color.hex]?.().play()}
		/>
	{/each}
</div>
