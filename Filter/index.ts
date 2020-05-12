import * as mongo from "mongodb"
import { Condition as FilterCondition } from "./Condition"
import { Document } from "../Document"

export type Filter<T> = {
	[P in keyof T]?: FilterCondition<T[P]> | Filter<T[P]> | any
}
// tslint:disable: no-shadowed-variable
export namespace Filter {
	export function toMongo<T>(filter: Filter<T>, ...prioritized: (string | undefined)[]): mongo.QuerySelector<T> & Document {
		const result: any & Document = {}
		for (const field in filter)
			if (filter.hasOwnProperty(field)) {
				const value = filter[field]
				const r = FilterCondition.is(value) ? FilterCondition.toMongo(value) :
				typeof value == "object" ? Filter.toMongo(value as any) :
				prioritized.some(p => p == field) ? value :
				undefined
				if (r != undefined && !(Object.keys(r).length == 0 && r.constructor == Object))
					result[field] = r
			}
		return result
	}
	export type Condition<T> = FilterCondition<T>
	export namespace Condition {
		export const extract = FilterCondition.extract
	}
}
