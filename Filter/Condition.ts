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
}

export namespace Condition {
	export function is(value: any | Condition<any>): value is Condition<any> {
		return typeof value == "object" && (
			value.$eq != undefined ||
			value.$gt != undefined ||
			value.$gte != undefined ||
			value.$in != undefined ||
			value.$lt != undefined ||
			value.$lte != undefined ||
			value.$ne != undefined ||
			value.$nin != undefined
		)
	}
	export function toMongo<T>(condition: Condition<T>): mongo.QuerySelector<T> | any {
		let result: mongo.QuerySelector<T> | any = {}
		if (condition.hasOwnProperty("$eq"))
			result = condition.$eq
		if (condition.hasOwnProperty("$gt"))
			result.$gt = condition.$gt
		if (condition.hasOwnProperty("$gte"))
			result.$gte = condition.$gte
		if (condition.hasOwnProperty("$in"))
			result.$in = condition.$in
		if (condition.hasOwnProperty("$lt"))
			result.$lt = condition.$lt
		if (condition.hasOwnProperty("$lte"))
			result.$lte = condition.$lte
		if (condition.hasOwnProperty("$ne"))
			result.$ne = condition.$ne
		if (condition.hasOwnProperty("$nin"))
			result.$nin = condition.$nin
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
		}
		return result
	}
}
