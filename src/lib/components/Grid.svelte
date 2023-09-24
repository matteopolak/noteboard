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

	let currentX = 0.5;
	let currentY = 0.5;

	$: {
		if (canvas) {
			canvas.width = width;
			canvas.height = height;

			getChunk();
		}
	}

	const getChunk = debounce(() => {
		trpc().requestChunkStream.query({
			x: Math.floor(center.x - bounds.x - 1),
			y: Math.floor(center.y - bounds.y - 1),
			width: Math.floor(bounds.x * 2 + 2),
			height: Math.floor(bounds.y * 2 + 2),
		});
	}, 50);

	onMount(() => {
		ctx = canvas?.getContext('2d')!;

		ctx.fillStyle = `rgb(${BACKGROUND >> 16}, ${(BACKGROUND >> 8) & 0xff}, ${
			BACKGROUND & 0xff
		})`;
		ctx.fillRect(0, 0, width, height);

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

		getChunk();
	});

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

	function sleep(ms: number) {
		return new Promise(r => setTimeout(r, ms));
	}

	async function handleMouseMove(event: MouseEvent) {
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

			console.log('center', center);

			// request new chunk
			getChunk();

			const currentCoord = convertScreenPixelToCoordinate({
				x: event.clientX,
				y: event.clientY,
			});

			currentX = currentCoord.x;
			currentY = currentCoord.y;
		} else {
			const currentCoord = convertScreenPixelToCoordinate({
				x: event.clientX,
				y: event.clientY,
			});

			currentX = currentCoord.x;
			currentY = currentCoord.y;

			dragging = false;

			if (selecting) {
				selecting = false;

				const dragStart = convertScreenPixelToCoordinate({
					x: event.movementX,
					y: event.movementY,
				});
				const dragEnd = convertScreenPixelToCoordinate({
					x: event.clientX,
					y: event.clientY,
				});

				const dragTopLeft = {
					x: Math.min(dragStart.x, dragEnd.x),
					y: Math.min(dragStart.y, dragEnd.y),
				};

				const dragDeltaX = Math.abs(dragStart.x - dragEnd.x);
				const dragDeltaY = Math.abs(dragStart.y - dragEnd.y);

				const gizmoPoint = convertCoordinateToScreenPixel({
					x: center.x + dragDeltaX,
					y: center.y + dragDeltaY,
				});

				// draw a rectangle
				ctx.strokeStyle = 'green';
				ctx.strokeRect(
					gizmoPoint.x,
					gizmoPoint.y,
					(dragDeltaX + 1) * PIXEL_SIZE,
					(dragDeltaY + 1) * PIXEL_SIZE
				);

				const cells = await trpc().getChunk.query({
					x: dragDeltaX,
					y: dragDeltaY,
					width: dragTopLeft.x,
					height: dragTopLeft.y,
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
		({(currentX - 0.5).toFixed(2)}, {(currentY - 0.5).toFixed(2)})
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
