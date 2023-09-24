<script lang="ts">
	import { COLOR_TO_NOTE, type Cell } from '$lib/cell';
	import { trpc } from '$lib/trpc';
	import { debounce } from '$lib/util';
	import { onMount } from 'svelte';
	import ColorBar from './ColorBar.svelte';

	const PIXEL_SIZE = 15;

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

	function convertScreenPixelToCoordinate(pixel: { x: number; y: number }) {
		return {
			x: centerX + Math.floor((pixel.x - canvas.width / 2) / PIXEL_SIZE),
			y: centerY + Math.floor((pixel.y - canvas.height / 2) / PIXEL_SIZE),
		};
	}

	function convertCoordinateToScreenPixel(coordinate: {
		x: number;
		y: number;
	}) {
		return {
			x: (coordinate.x - centerX) * PIXEL_SIZE + canvas.width / 2,
			y: (coordinate.y - centerY) * PIXEL_SIZE + canvas.height / 2,
		};
	}

	function updateCell(cell: Cell) {
		const ctx = canvas.getContext('2d')!;

		ctx.fillStyle = `rgb(${cell.color >> 16}, ${(cell.color >> 8) & 0xff}, ${
			cell.color & 0xff
		})`;

		const pixel = convertCoordinateToScreenPixel(cell);

		ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
	}

	function updateCurrentCell(event: MouseEvent) {
		const { x, y } = convertScreenPixelToCoordinate({
			x: event.clientX,
			y: event.clientY,
		});

		if (x !== previousX || y !== previousY) {
			previousX = x;
			previousY = y;

			trpc().updateColor.mutate({ x, y, color }, {});
		}
	}

	let dragging = false;
	let selecting = false;

	let draggingStartX = 0;
	let draggingStartY = 0;

	function sleep(ms: number) {
		return new Promise(r => setTimeout(r, ms));
	}

	async function handleMouseMove(event: MouseEvent) {
		const currentCoord = convertScreenPixelToCoordinate({
			x: event.clientX,
			y: event.clientY,
		});

		currentX = currentCoord.x;
		currentY = currentCoord.y;

		// if mouse is down
		if (event.buttons === 1) {
			updateCurrentCell(event);
		} else if (event.buttons === 2) {
			if (!dragging) {
				dragging = true;
				draggingStartX = event.clientX;
				draggingStartY = event.clientY;
			}

			console.log({ ctrl: event.ctrlKey, selecting });

			if (event.ctrlKey && !selecting) {
				selecting = true;
				draggingStartX = event.clientX;
				draggingStartY = event.clientY;

				return;
			} else if (selecting) return;

			// move canvas around and request new chunks
			const x = draggingStartX - event.clientX;
			const y = draggingStartY - event.clientY;

			centerX += Math.round(x / 5 / PIXEL_SIZE);
			centerY += Math.round(y / 5 / PIXEL_SIZE);

			// request new chunk
			getChunk();

			// re-draw canvas by offsetting current pixels
			const ctx = canvas.getContext('2d')!;

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			ctx.clearRect(0, 0, canvas.width, canvas.height);
		} else {
			dragging = false;

			if (selecting) {
				selecting = false;

				const dragStart = convertScreenPixelToCoordinate({
					x: draggingStartX,
					y: draggingStartY,
				});

				const dragEnd = convertScreenPixelToCoordinate({
					x: event.clientX,
					y: event.clientY,
				});

				const x = Math.min(dragStart.x, dragEnd.x);
				const y = Math.min(dragStart.y, dragEnd.y);

				const width = Math.abs(dragStart.x - dragEnd.x);
				const height = Math.abs(dragStart.y - dragEnd.y);

				const cells = await trpc().returnChunk.query({
					x,
					y,
					width,
					height,
				});

				cells.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

				console.log({ cells });

				for (const [i, cell] of cells.entries()) {
					const next = cells[i + 1];
					// cells are played left-to-right, top-to-bottom like reading a book

					// number of cells between this cell and the next cell
					// if theyre on the same row, this is the difference in x
					// if theyre on different rows, this is the difference in y * width
					// plus the difference in x
					const cellsBetween =
						next && next.y === cell.y
							? next.x - cell.x
							: next
							? (next.y - cell.y) * width + next.x - cell.x
							: 0;

					const color = cell.color;

					cell.color = 0;
					updateCell(cell);

					console.log('playing');
					console.log({
						color,
						note: COLOR_TO_NOTE[color],
						cell,
						cellsBetween,
					});
					await COLOR_TO_NOTE[color]?.play();

					await sleep(200 * Math.max(1, cellsBetween + 1));

					cell.color = color;
					updateCell(cell);
				}
			}
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
