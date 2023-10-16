echo >dist/cjs/package.json '{
  "type": "commonjs",
	"typings": "dist/cjs/index.d.ts"
}'

echo >dist/mjs/package.json '{
  "type": "module",
	"typings": "dist/mjs/index.d.ts"
}'

