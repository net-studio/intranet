module.exports = {
	globDirectory: 'dist/',
	globPatterns: [
		'**/*.{js,ico,html,svg,png,json}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	],
	"maximumFileSizeToCacheInBytes": 5000000,
};