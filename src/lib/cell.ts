export type Cell = {
	x: number;
	y: number;
	color: number;
};

export const COLOR_TO_NOTE: Record<number, () => HTMLAudioElement> = {
	[0x836953]: () => new Audio('/notes/c.ogg'),
	[0xff6961]: () => new Audio('/notes/d.ogg'),
	[0xb19cd9]: () => new Audio('/notes/e.ogg'),
	[0xff9ff3]: () => new Audio('/notes/f.ogg'),
	[0xffb347]: () => new Audio('/notes/g.ogg'),
	[0xa0c4ff]: () => new Audio('/notes/a1.ogg'),
	[0xa0e7e5]: () => new Audio('/notes/b1.ogg'),
	[0xbce29e]: () => new Audio('/notes/c1.ogg'),
};
