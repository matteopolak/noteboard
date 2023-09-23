/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,svelte,ts}',
	],
	plugins: [
		require('daisyui'),
		require('@tailwindcss/typography'),
	],
	daisyui: {
		themes: ['light'],
	},
	theme: {
		extend: {
			animation: {
				shake: 'shake 0.7s ease-in-out infinite',
			},
			keyframes: {
				shake: {
					'0%': {
						transform: 'translate(1px, 1px) rotate(0deg)',
					},
					'10%': {
						transform: 'translate(-1px, -1px) rotate(-1deg)',
					},
					'20%': {
						transform: 'translate(-1px, 0px) rotate(1deg)',
					},
					'30%': {
						transform: 'translate(1px, 1px) rotate(0deg)',
					},
					'40%': {
						transform: 'translate(1px, -1px) rotate(1deg)',
					},
					'50%': {
						transform: 'translate(-1px, 1px) rotate(-1deg)',
					},
					'60%': {
						transform: 'translate(-1px, 1px) rotate(0deg)',
					},
					'70%': {
						transform: 'translate(1px, 1px) rotate(-1deg)',
					},
					'80%': {
						transform: 'translate(-1px, -1px) rotate(1deg)',
					},
					'90%': {
						transform: 'translate(1px, 1px) rotate(0deg)',
					},
					'100%': {
						transform: 'translate(1px, -1px) rotate(-1deg)',
					},
				},
			},
		},
	},
}
