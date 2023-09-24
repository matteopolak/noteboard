<script lang="ts">
	import type { Cell } from '$lib/cell';
	import { trpc } from '$lib/trpc';
	import { debounce } from '$lib/util';
	import { onMount } from 'svelte';
	import ColorBar from './ColorBar.svelte';

	export let width: number;
	export let height: number;

	let canvas: HTMLCanvasElement;

	$: adjustedWidth = Math.ceil(width / 10 + 10);
	$: adjustedHeight = Math.ceil(height / 10 + 10);

	$: console.log({ adjustedWidth, adjustedHeight });

	$: {
		if (canvas) {
			canvas.width = width;
			canvas.height = height;

			getChunk();
		}
	}

	const getChunk = debounce(
		() =>
			trpc().getChunk.query({
				x: -adjustedWidth,
				y: -adjustedHeight,
				width: canvas.width,
				height: canvas.height,
			}),
		1_000
	);

	onMount(() => {
		trpc().live.subscribe(undefined, {
			onData: cells => {
				for (const cell of cells) {
					// update a 5px by 5px square at the specified data.x, data.y coordinates
					// and fill it with the colour provided by data.color, which is a 24-bit integer in RGB
					updateCell(cell);
				}
			},
		});

		getChunk();
	});

	function updateCell(cell: Cell) {
		const ctx = canvas.getContext('2d')!;

		ctx.fillStyle = `rgb(${cell.color >> 16}, ${(cell.color >> 8) & 0xff}, ${
			cell.color & 0xff
		})`;
		ctx.fillRect(
			cell.x * 5 + canvas.width / 2,
			cell.y * 5 + canvas.height / 2,
			5,
			5
		);
	}

	let previousX = 0;
	let previousY = 0;
	function updateCurrentCell(event: MouseEvent) {
		const rect = canvas.getBoundingClientRect();

		// 0,0 is the middle of the canvas
		const x = event.clientX - rect.left - canvas.width / 2;
		const y = event.clientY - rect.top - canvas.height / 2;

		console.log({ x, y });

		if (x !== previousX && y !== previousY) {
			trpc().updateColor.mutate(
				{ x: Math.round(x / 5), y: Math.round(y / 5), color },
				{}
			);
			previousX = x;
			previousY = y;
		}
	}

	let currentX = 0;
	let currentY = 0;

	function handleMouseMove(event: MouseEvent) {
		const rect = canvas.getBoundingClientRect();

		currentX = Math.round((event.clientX - rect.left - canvas.width / 2) / 5);
		currentY = Math.round((event.clientY - rect.top - canvas.height / 2) / 5);

		// if mouse is down
		if (event.buttons === 1) {
			updateCurrentCell(event);
		}
	}

	let color: number;
</script>

<div
	class="absolute top-0 left-0 right-0 w-full grid grid-flow-col content-between p-4"
>
	<div />

	<div>
		<ColorBar bind:selected={color} />
	</div>

	<div class="absolute right-0">
		x: {currentX}
		y: {currentY}
	</div>
</div>

<canvas bind:this={canvas} {width} {height} on:mousemove={handleMouseMove} />
