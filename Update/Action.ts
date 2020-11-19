export type Action<T> = {
	$set?: T
	$unset?: true
	$push?: T
	$addToSet?: T
}

export namespace Action {
	export function is(value: any | Action<any>): value is Action<any> {
		return (
			typeof value == "object" &&
			(value.$set != undefined || value.$unset != undefined || value.$push != undefined || value.$addToSet != undefined)
		)
	}
	export type Operator = "$set" | "$unset" | "$push" | "$addToSet"
	export namespace Operator {
		export function is(value: any | Operator): value is Operator {
			return typeof value == "string" && ["$set", "$unset", "$push", "$addToSet"].some(o => o == value)
		}
	}
	export function extract<T>(action: Action<T> | any): Action<T> | undefined {
		const result: Action<T> | undefined = is(action) ? {} : undefined
		if (result) {
			if ("$set" in action)
				result.$set = action.$set
			if ("$unset" in action)
				result.$unset = action.$unset
			if ("$push" in action)
				result.$push = action.$push
			if ("$addToSet" in action)
				result.$addToSet = action.$addToSet
		}
		return result
	}
}
