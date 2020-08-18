import * as authly from "authly"

export interface Document {
	id: authly.Identifier
}

export namespace Document {
	export function is(value: any | Document): value is Document {
		return typeof value == "object" && authly.Identifier.is(value.id)
	}
}
