<script lang="ts">
	import { COLOR_TO_NOTE, type Cell } from '$lib/cell';
	import { trpc } from '$lib/trpc';
	import { debounce } from '$lib/util';
	import { onMount } from 'svelte';
	import ColorBar, { WHITE } from './ColorBar.svelte';
	import ZoomBar from './ZoomBar.svelte';
	import LeftMouseIcon from './LeftMouseIcon.svelte';

	const BACKGROUND = 0xffffff;

	export let width: number;
	export let height: number;

	let zoom: number;
	$: PIXEL_SIZE = 15 * zoom;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let center = { x: 0, y: 0 };
	$: bounds = convertScreenPixelToCoordinate({
		x: Math.max(width, width / zoom),
		y: Math.max(height, height / zoom),
	});

	let previousX = 0;
	let previousY = 0;

	let currentX = 0;
	let currentY = 0;

	$: if (canvas) {
		canvas.width = width;
		canvas.height = height;

		getChunk();
	}

	function handleZoom() {
		ctx.fillStyle = `rgb(${BACKGROUND >> 16}, ${(BACKGROUND >> 8) & 0xff}, ${
			BACKGROUND & 0xff
		})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		getChunk();
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		ctx.fillStyle = `rgb(${BACKGROUND >> 16}, ${(BACKGROUND >> 8) & 0xff}, ${
			BACKGROUND & 0xff
		})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		trpc().watchUpdate.subscribe(undefined, {
			onData: cells => {
				for (const cell of cells) {
					// update a 5px by 5px square at the specified data.x, data.y coordinates
					// and fill it with the colour provided by data.color, which is a 24-bit integer in RGB
					updateCell(cell);
				}
			},
		});

		trpc().watchRemove.subscribe(undefined, {
			onData: cells => {
				for (const cell of cells) {
					// update a 5px by 5px square at the specified data.x, data.y coordinates
					// and fill it with the colour provided by data.color, which is a 24-bit integer in RGB
					removeCell(cell);
				}
			},
		});
	});

	const getChunk = debounce(() => {
		trpc().requestChunkStream.query({
			x: Math.floor(center.x - bounds.x - 1),
			y: Math.floor(center.y - bounds.y - 1),
			width: Math.floor(bounds.x * 2 + 2),
			height: Math.floor(bounds.y * 2 + 2),
		});
	}, 50);

	function convertScreenPixelToCoordinate(pixel: { x: number; y: number }) {
		return {
			x: center.x + (pixel.x - width / 2) / PIXEL_SIZE,
			y: center.y + (pixel.y - height / 2) / PIXEL_SIZE,
		};
	}

	function convertCoordinateToScreenPixel(coordinate: {
		x: number;
		y: number;
	}) {
		return {
			x: Math.floor((coordinate.x - center.x) * PIXEL_SIZE + width / 2),
			y: Math.floor((coordinate.y - center.y) * PIXEL_SIZE + height / 2),
		};
	}

	function scalePixelToCoordinate(scalar: number) {
		return scalar / PIXEL_SIZE;
	}

	function updateCell(cell: Cell) {
		const pixel = convertCoordinateToScreenPixel(cell);

		ctx.fillStyle = `rgb(${cell.color >> 16}, ${(cell.color >> 8) & 0xff}, ${
			cell.color & 0xff
		})`;
		ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
	}

	function removeCell(cell: Omit<Cell, 'color'>) {
		const pixel = convertCoordinateToScreenPixel(cell);

		ctx.fillStyle = `rgb(${BACKGROUND >> 16}, ${(BACKGROUND >> 8) & 0xff}, ${
			BACKGROUND & 0xff
		})`;
		ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);
	}

	function updateCurrentCell(event: MouseEvent) {
		const position = convertScreenPixelToCoordinate({
			x: event.clientX,
			y: event.clientY,
		});

		position.x = Math.floor(position.x);
		position.y = Math.floor(position.y);

		if (position.x !== previousX || position.y !== previousY) {
			previousX = position.x;
			previousY = position.y;

			if (color === WHITE) {
				trpc().removeCell.mutate({ x: position.x, y: position.y }, {});
			} else {
				trpc().updateCell.mutate(
					{ x: position.x, y: position.y, color: color.hex },
					{}
				);
			}
		}
	}

	let dragging = false;
	let selecting = false;

	let firstSelectPixel = { x: 0, y: 0 };

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
			const currentCoord = convertScreenPixelToCoordinate({
				x: event.clientX,
				y: event.clientY,
			});

			currentX = currentCoord.x;
			currentY = currentCoord.y;

			updateCurrentCell(event);
		} else if (event.buttons === 2) {
			if (!dragging) {
				dragging = true;
			}

			if (event.ctrlKey && !selecting) {
				selecting = true;
				firstSelectPixel = {
					x: event.clientX,
					y: event.clientY,
				};

				return;
			} else if (selecting) return;

			// save snapshot of canvas to re-draw, offset at a new position after clearing it
			const canvasData = ctx.getImageData(0, 0, width, canvas.height);

			// clear canvas first
			ctx.clearRect(0, 0, width, canvas.height);
			// re-draw canvas at new position, going in the "opposite" direction of the mouse
			ctx.putImageData(canvasData, event.movementX, event.movementY);

			center.x -= scalePixelToCoordinate(event.movementX);
			center.y -= scalePixelToCoordinate(event.movementY);
			center = center;

			// request new chunk
			getChunk();
		} else {
			dragging = false;

			if (selecting) {
				selecting = false;

				const dragStart = convertScreenPixelToCoordinate({
					x: firstSelectPixel.x,
					y: firstSelectPixel.y,
				});
				const dragEnd = convertScreenPixelToCoordinate({
					x: event.clientX,
					y: event.clientY,
				});

				const dragTopLeft = {
					x: Math.min(dragStart.x, dragEnd.x),
					y: Math.min(dragStart.y, dragEnd.y),
				};

				const dragBottomRight = {
					x: Math.max(dragStart.x, dragEnd.x),
					y: Math.max(dragStart.y, dragEnd.y),
				};

				const pixelTopLeft = convertCoordinateToScreenPixel(dragTopLeft);
				const pixelBottomRight =
					convertCoordinateToScreenPixel(dragBottomRight);

				// draw a rectangle
				ctx.strokeStyle = 'green';
				ctx.strokeRect(
					pixelTopLeft.x,
					pixelTopLeft.y,
					pixelBottomRight.x - pixelTopLeft.x,
					pixelBottomRight.y - pixelTopLeft.y
				);

				const cells = await trpc().getChunk.query({
					x: Math.round(dragTopLeft.x),
					y: Math.round(dragTopLeft.y),
					width: Math.round(dragBottomRight.x - dragTopLeft.x),
					height: Math.round(dragBottomRight.y - dragTopLeft.y),
				});

				// sort cells based on their order in a grid, read left-to-right, top-to-bottom
				cells.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

				for (const [i, cell] of cells.entries()) {
					const next = cells[i + 1];
					const prev = cells[i - 1];
					// cells are played left-to-right, top-to-bottom like reading a book

					// number of cells between this cell and the next cell
					// if theyre on the same row, this is the difference in x
					// if theyre on different rows, this is the difference in y * width
					// plus the difference in x
					const cellsBetween =
						next && next.y === cell.y
							? next.x - cell.x
							: next
							? (next?.y - cell.y) * (dragBottomRight.x - dragTopLeft.x) +
							  (next?.x - cell.x)
							: 0;

					const color = cell.color;

					cell.color = 0;
					updateCell(cell);

					await COLOR_TO_NOTE[color]?.().play();
					await sleep(80 * cellsBetween + 200);

					cell.color = color;
					updateCell(cell);
				}
			}
		}
	}

	let color: {
		hex: number;
		html: string;
		label: string;
	};

	let helpSectionOpen = false;
</script>

<div
	class="absolute m-2 flex flex-col gap-1 top-0 left-0 right-0 place-items-center pointer-events-none"
>
	<div class="flex flex-row gap-1 flex-wrap">
		<div
			class="bg-slate-600/90 p-3 rounded-full pointer-events-auto shadow-2xl"
		>
			<ColorBar bind:selected={color} />
		</div>
		<div
			class="bg-slate-600/90 p-3 rounded-full pointer-events-auto shadow-2xl"
		>
			<ZoomBar bind:zoom on:zoom={handleZoom} />
		</div>

		<button
			class="absolute top-0 right-0 pointer-events-auto btn bg-slate-600/90 border-none text-white w-12 h-12 hover:bg-slate-500/80"
			on:click={() => (helpSectionOpen = true)}
		>
			<svg class="fill-current h-6 w-6" viewBox="0 0 24 24">
				<path
					d="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.7-2.18-3.7-1.69 0-2.52 1.28-2.87 2.34L6.54 6.96C7.25 4.83 9.18 3 11.99 3c2.35 0 3.96 1.07 4.78 2.41.7 1.15 1.11 3.3.03 4.9-1.2 1.77-2.35 2.31-2.97 3.45-.25.46-.35.76-.35 2.24h-2.89c-.01-.78-.13-2.05.48-3.15zM14 20c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z"
				/>
			</svg>
		</button>

		<dialog class:modal-open={helpSectionOpen} class="modal">
			<div class="modal-box bg-slate-600 text-white">
				<h3 class="font-bold text-lg">Welcome to Noteboard!</h3>

				<div class="flex flex-row place-content-between">
					<span> Place a note on the current tile </span>
					<kbd class="kbd kbd-sm text-slate-600 inline-block">
						<LeftMouseIcon />
					</kbd>
				</div>

				<div class="flex flex-row place-content-between">
					<span> Play the selected notes </span>
					<span>
						<kbd class="kbd kbd-sm text-slate-600">Ctrl</kbd>
						<kbd class="kbd kbd-sm text-slate-600 inline-block">
							<LeftMouseIcon />
						</kbd>
					</span>
				</div>

				<div class="flex flex-row place-content-between">
					<span> Pan viewport </span>
					<kbd class="kbd kbd-sm text-slate-600 inline-block">
						<svg class="fill-current w-6 h-6 inline-block" viewBox="0 0 24 24">
							<path
								d="M13 1.07V9h7c0-4.08-3.05-7.44-7-7.93zM4 15c0 4.42 3.58 8 8 8s8-3.58 8-8v-4H4v4zm7-13.93C7.05"
							/>
						</svg>
					</kbd>
				</div>
			</div>
			<form method="dialog" class="modal-backdrop">
				<button on:click={() => (helpSectionOpen = false)}>close</button>
			</form>
		</dialog>
	</div>
	<div
		class="bg-slate-600/80 p-3 rounded-full w-fit text-white font-extrabold font-mono hadow-xl"
	>
		({currentX.toFixed(2)}, {currentY.toFixed(2)})
	</div>
</div>

<canvas
	bind:this={canvas}
	{width}
	{height}
	on:mousemove={handleMouseMove}
	on:mouseup={handleMouseMove}
	on:mousedown={handleMouseMove}
	on:click={updateCurrentCell}
	style="image-rendering: pixelated;"
/>
