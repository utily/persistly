export interface Options {
	$upsert?: boolean
}
export namespace Options {
	export function is(value: Options | any): value is Options {
		return typeof value == "object" && (value.$upsert == undefined || typeof value.$upsert == "boolean")
	}
	export function isKey(value: keyof Options | any): value is keyof Options {
		return value == "$upsert"
	}
	export function keyToMongo(field: keyof Options): string {
		return field.slice(1)
	}
	export function extractOptions(document: Record<string, unknown>): Record<string, unknown> {
		const result: Record<string, unknown> = {}
		for (const option in document)
			if (isKey(option) && document[option]) {
				result[keyToMongo(option)] = document[option]
				delete document[option]
			}
		return result
	}
}
