<script lang="ts">
	import type { Cell } from '$lib/cell';
	import { trpc } from '$lib/trpc';
	import { debounce } from '$lib/util';
	import { onMount } from 'svelte';
	import ColorBar from './ColorBar.svelte';

	export let width: number;
	export let height: number;

	let canvas: HTMLCanvasElement;

	let centerX = 0;
	let centerY = 0;

	let previousX = 0;
	let previousY = 0;

	let currentX = 0;
	let currentY = 0;

	$: adjustedWidth = Math.ceil(width / 10 + 10);
	$: adjustedHeight = Math.ceil(height / 10 + 10);

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
				x: centerX - adjustedWidth,
				y: centerY - adjustedHeight,
				width: canvas.width,
				height: canvas.height,
			}),
		100
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

	function updateCurrentCell(event: MouseEvent) {
		const rect = canvas.getBoundingClientRect();

		const x = event.clientX - rect.left - canvas.width / 2;
		const y = event.clientY - rect.top - canvas.height / 2;

		if (x !== previousX || y !== previousY) {
			previousX = x;
			previousY = y;

			trpc().updateColor.mutate(
				{ x: Math.round(x / 5), y: Math.round(y / 5), color },
				{}
			);
		}
	}

	let dragging = false;
	let draggingStartX = 0;
	let draggingStartY = 0;

	function handleMouseMove(event: MouseEvent) {
		const rect = canvas.getBoundingClientRect();

		currentX =
			centerX + Math.round((event.clientX - rect.left - canvas.width / 2) / 5);
		currentY =
			centerY + Math.round((event.clientY - rect.top - canvas.height / 2) / 5);

		// if mouse is down
		if (event.buttons === 1) {
			updateCurrentCell(event);
		} else if (event.buttons === 2) {
			if (!dragging) {
				dragging = true;
				draggingStartX = event.clientX;
				draggingStartY = event.clientY;
			}

			// move canvas around and request new chunks
			const x = event.clientX - draggingStartX;
			const y = event.clientY - draggingStartY;

			centerX += Math.round(x / 5);
			centerY += Math.round(y / 5);

			// request new chunk
			getChunk();

			// re-draw canvas by offsetting current pixels
			const ctx = canvas.getContext('2d')!;

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.putImageData(imageData, x - canvas.width / 2, y - canvas.height / 2);
		} else {
			dragging = false;
		}
	}

	let color: number;
</script>

<div class="absolute m-2 flex flex-col gap-1">
	<div class="bg-slate-600/80 p-3 rounded-full">
		<ColorBar bind:selected={color} />
	</div>

	<div
		class="bg-slate-600/80 p-3 rounded-full w-fit text-white font-extrabold font-mono"
	>
		({currentX}, {currentY})
	</div>
</div>

<canvas
	bind:this={canvas}
	{width}
	{height}
	on:mousemove={handleMouseMove}
	on:click={updateCurrentCell}
/>
