echo >dist/cjs/package.json '{
  "type": "commonjs",
	"typings": "./index.d.ts"
}'

echo >dist/mjs/package.json '{
  "type": "module",
	"typings": "./index.d.ts"
}'

