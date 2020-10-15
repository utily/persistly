import { Filter } from "./Filter"

export interface Options {
	$upsert?: boolean
	$projection?: Record<string, unknown>
	$sort?: Record<string, unknown>
	$maxTimeMS?: number
	$returnNewDocument?: boolean
	$collation?: Record<string, unknown>
}

export namespace Options {
	export function is(value: Options | any): value is Options {
		return (
			typeof value == "object" &&
			(value.$upsert == undefined || typeof value.$upsert == "boolean") &&
			(value.$projection == undefined || typeof value.$projection == "object") &&
			(value.$sort == undefined || typeof value.$sort == "object") &&
			(value.$maxTimeMS == undefined || typeof value.$maxTimeMS == "number") &&
			(value.$returnNewDocument == undefined || typeof value.$returnNewDocument == "boolean") &&
			(value.$collation == undefined || typeof value.$collation == "object")
		)
	}
	export function isKey(value: keyof Options | any): value is keyof Options {
		return (
			value == "$upsert" ||
			value == "$projection" ||
			value == "$sort" ||
			value == "$maxTimeMS" ||
			value == "$returnNewDocument" ||
			value == "$collation"
		)
	}
	export function keyToMongo(field: keyof Options): string {
		return field.slice(1)
	}
	export function extractOptions(filter: Filter<any>): Record<string, unknown> | undefined {
		const result: Record<string, unknown> = {}
		for (const option in filter)
			if (isKey(option) && filter[option]) {
				result[keyToMongo(option)] = filter[option]
				delete filter[option]
			}
		return result
	}
}
