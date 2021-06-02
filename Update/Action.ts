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
				result.$set = clear(action.$set)
			if ("$unset" in action)
				result.$unset = action.$unset
			if ("$push" in action)
				result.$push = clear(action.$push)
			if ("$addToSet" in action)
				result.$addToSet = clear(action.$addToSet)
		}
		return result
	}
}
function clear(value: any): any {
	if (Array.isArray(value))
		value = value.filter(v => v != undefined && v != null).map(clear)
	else if (value && typeof value == "object")
		for (const entry of Object.entries(value)) {
			if (entry[1] == undefined || entry[1] == null)
				delete value[entry[0]]
			else if (typeof entry[1] == "object")
				value[entry[0]] = clear(entry[1])
		}
	return value
}
