import * as mongo from "mongodb"
import { Action as UpdateAction } from "./Action"

export type Update<T> = {
	[P in keyof T]?: UpdateAction<T[P]> | Update<T[P]> | any
}

export namespace Update {
	function update<T>(
		query: mongo.UpdateQuery<T>,
		operation: UpdateAction.Operator,
		field: string,
		value: any
	): mongo.UpdateQuery<T> {
		const r: { [f: string]: any } = query[operation] ?? {}
		r[field] = value
		query[operation] = r as any
		return query
	}
	export function toMongo<T>(update: Update<T>, ...suppress: (string | undefined)[]): mongo.UpdateQuery<T> {
		const result: mongo.UpdateQuery<T> = {}
		for (const field in update)
			if (Object.prototype.hasOwnProperty.call(update, field) && !suppress.some(s => s == field)) {
				const value = update[field]
				toMongoUpdate(result, field, value)
			}
		return result
	}
	function toMongoUpdate<T, P>(query: mongo.UpdateQuery<T>, prefix: string, value: any) {
		if (Array.isArray(value))
			update(query, "$push", prefix, { $each: value.filter(v => v != undefined) })
		else if (typeof value != "object" && value != undefined)
			update(query, "$set", prefix, value)
		else
			for (const field in value) {
				if (Object.prototype.hasOwnProperty.call(value, field)) {
					const v = value[field]
					if (UpdateAction.Operator.is(field) && v != undefined)
						update(query, field, prefix, v)
					else if (!field.startsWith("$"))
						toMongoUpdate(query, prefix + "." + field, v)
				}
			}
	}
	export function extract<T>(update: Update<T>): Update<T> {
		const result: Update<T> = {}
		for (const field in update)
			if (Object.prototype.hasOwnProperty.call(update, field)) {
				const value = UpdateAction.extract(update[field])
				if (value != undefined)
					result[field] = value
			}
		return result
	}
	export type Action<T> = UpdateAction<T>
	export namespace Action {
		export const extract = UpdateAction.extract
	}
}
