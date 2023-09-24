<script lang="ts">
	import { COLOR_TO_NOTE, type Cell } from '$lib/cell';
	import { trpc } from '$lib/trpc';
	import { debounce } from '$lib/util';
	import { onMount } from 'svelte';
	import ColorBar, { WHITE } from './ColorBar.svelte';

	const PIXEL_SIZE = 15;
	const BACKGROUND = 0x1d1d1d;

	export let width: number;
	export let height: number;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	let center = { x: 0, y: 0 };
	$: bounds = convertScreenPixelToCoordinate({ x: width, y: height });

	let previousX = 0;
	let previousY = 0;

	let currentX = 0;
	let currentY = 0;

	$: {
		if (canvas) {
			canvas.width = width;
			canvas.height = height;

			getChunk();
		}
	}

	$: console.log(center);

	const getChunk = debounce(() => {
		trpc().getChunk.query({
			x: center.x - bounds.x - 1,
			y: center.y - bounds.y - 1,
			width: bounds.x * 2 + 2,
			height: bounds.y * 2 + 2,
		});
	}, 100);

	onMount(() => {
		ctx = canvas?.getContext('2d')!;

		ctx.fillStyle = `rgb(${BACKGROUND >> 16}, ${(BACKGROUND >> 8) & 0xff}, ${
			BACKGROUND & 0xff
		})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

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
			x: Math.floor((pixel.x - width / 2) / PIXEL_SIZE + center.x),
			y: Math.floor((pixel.y - height / 2) / PIXEL_SIZE + center.y),
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

	function updateCell(cell: Cell) {
		const pixel = convertCoordinateToScreenPixel(cell);

		ctx.fillStyle = `rgb(${cell.color >> 16}, ${(cell.color >> 8) & 0xff}, ${
			cell.color & 0xff
		})`;
		ctx.fillRect(pixel.x, pixel.y, PIXEL_SIZE, PIXEL_SIZE);


	}

	function removeCell(cell: Cell) {
		const pixel = convertCoordinateToScreenPixel(cell);

		ctx.fillStyle = `rgb(${BACKGROUND >> 16}, ${(BACKGROUND >> 8) & 0xff}, ${
			BACKGROUND & 0xff
		})`;
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

			if(color.hex = WHITE.hex) {
				trpc().removeCell.mutate({ x, y, color }, {});
			} else {
				trpc().updateCell.mutate({ x, y, color }, {});
			}
		}
	}

	let dragging = false;
	let selecting = false;

	let lastDragPosition = { x: 0, y: 0 };

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
				lastDragPosition = { x: event.clientX, y: event.clientY };
			}

			if (event.ctrlKey && !selecting) {
				selecting = true;
				return;
			} else if (selecting) return;

			// move canvas around and request new chunks
			const currentDrag = {
				x: event.clientX - lastDragPosition.x,
				y: event.clientY - lastDragPosition.y,
			};

			lastDragPosition = { x: event.clientX, y: event.clientY };

			// save snapshot of canvas to re-draw, offset at a new position after clearing it
			const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

			// clear canvas first
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			// re-draw canvas at new position, going in the "opposite" direction of the mouse
			ctx.putImageData(canvasData, currentDrag.x, currentDrag.y);

			center = convertScreenPixelToCoordinate({
				x: canvas.width / 2 + currentDrag.x,
				y: canvas.height / 2 + currentDrag.y,
			});

			// request new chunk
			getChunk();
		} else {
			dragging = false;

			if (selecting) {
				selecting = false;

				const dragStart = convertScreenPixelToCoordinate({
					x: event.clientX - lastDragPosition.x,
					y: event.clientY - lastDragPosition.y,
				});
				const dragEnd = convertScreenPixelToCoordinate({
					x: event.clientX,
					y: event.clientY,
				});

				const x = Math.min(dragStart.x, dragEnd.x);
				const y = Math.min(dragStart.y, dragEnd.y);

				const width = Math.abs(dragStart.x - dragEnd.x);
				const height = Math.abs(dragStart.y - dragEnd.y);

				const gizmoPoint = convertCoordinateToScreenPixel({
					x,
					y,
				});

				// draw a rectangle
				ctx.strokeStyle = 'green';
				ctx.strokeRect(
					gizmoPoint.x,
					gizmoPoint.y,
					(width + 1) * PIXEL_SIZE,
					(height + 1) * PIXEL_SIZE
				);

				const cells = await trpc().returnChunk.query({
					x,
					y,
					width,
					height,
				});

				cells.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));

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

					await COLOR_TO_NOTE[color]?.play();
					await sleep(200 * (cellsBetween + 1));

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
</script>

<div
	class="absolute m-2 flex flex-col gap-1 top-0 left-0 right-0 place-items-center pointer-events-none"
>
	<div class="bg-slate-600/80 p-3 rounded-full pointer-events-auto shadow-2xl">
		<ColorBar bind:selected={color} />
	</div>
	<div
		class="bg-slate-600/80 p-3 rounded-full w-fit text-white font-extrabold font-mono hadow-xl"
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
	style="image-rendering: pixelated;"
/>
