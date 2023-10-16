import * as mongo from "mongodb"

export type Condition<T> = {
	$eq?: T
	$gt?: T
	$gte?: T
	$in?: T[]
	$lt?: T
	$lte?: T
	$ne?: T
	$nin?: T[]
	$isset?: boolean
	$elemMatch?: Condition<Partial<T>>
}

export namespace Condition {
	export function is(value: any | Condition<any>): value is Condition<any> {
		return (
			typeof value == "object" &&
			(value.$eq != undefined ||
				value.$gt != undefined ||
				value.$gte != undefined ||
				value.$in != undefined ||
				value.$lt != undefined ||
				value.$lte != undefined ||
				value.$ne != undefined ||
				value.$isset != undefined ||
				value.$nin != undefined ||
				value.$elemMatch != undefined)
		)
	}
	export function toMongo<T>(condition: Condition<T>): mongo.FilterOperators<T> | any {
		let result: mongo.FilterOperators<T> | any = {}
		if (Object.prototype.hasOwnProperty.call(condition, "$eq"))
			result = condition.$eq
		if (Object.prototype.hasOwnProperty.call(condition, "$gt"))
			result.$gt = condition.$gt
		if (Object.prototype.hasOwnProperty.call(condition, "$gte"))
			result.$gte = condition.$gte
		if (Object.prototype.hasOwnProperty.call(condition, "$in"))
			result.$in = condition.$in
		if (Object.prototype.hasOwnProperty.call(condition, "$lt"))
			result.$lt = condition.$lt
		if (Object.prototype.hasOwnProperty.call(condition, "$lte"))
			result.$lte = condition.$lte
		if (Object.prototype.hasOwnProperty.call(condition, "$ne"))
			result.$ne = condition.$ne
		if (Object.prototype.hasOwnProperty.call(condition, "$nin"))
			result.$nin = condition.$nin
		if (Object.prototype.hasOwnProperty.call(condition, "$isset"))
			result.$exists = condition.$isset
		if (Object.prototype.hasOwnProperty.call(condition, "$elemMatch"))
			result.$elemMatch = condition.$elemMatch
		return result
	}
	export function extract<T>(condition: Condition<T> | any): Condition<T> | undefined {
		const result: Condition<T> | undefined = is(condition) ? {} : undefined
		if (result) {
			if ("$eq" in condition)
				result.$eq = condition.$eq
			if ("$" in condition)
				result.$gt = condition.$
			if ("$gte" in condition)
				result.$gte = condition.$gte
			if ("$in" in condition)
				result.$in = condition.$in
			if ("$lt" in condition)
				result.$lt = condition.$lt
			if ("$lte" in condition)
				result.$lte = condition.$lte
			if ("$ne" in condition)
				result.$ne = condition.$ne
			if ("$nin" in condition)
				result.$nin = condition.$nin
			if ("$isset" in condition)
				result.$isset = condition.$isset
			if ("$elemMatch" in condition)
				result.$elemMatch = condition.$elemMatch
		}
		return result
	}
}
