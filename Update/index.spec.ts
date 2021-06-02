import * as persistly from "../index"

describe("Update", () => {
	it("toMongo", () => {
		const argument: persistly.Update<{ name: string; field: number; property: { nested: number }; remove: number }> = {
			name: "test",
			field: { $set: 1337 },
			property: { nested: 42 },
			remove: { $unset: true },
		}
		const filter = persistly.Update.toMongo(argument)
		expect(filter).toEqual({ $set: { name: "test", field: 1337, "property.nested": 42 }, $unset: { remove: true } })
	})
	it("addToSet", () => {
		const argument: persistly.Update<{
			name: string
			field: number
			property: { nested: number }
			remove: number
			event: number[]
		}> = {
			name: "test",
			field: { $set: 1337 },
			property: { nested: 42 },
			remove: { $unset: true },
			event: { $addToSet: [1, 2] },
		}
		const filter = persistly.Update.toMongo(argument)
		expect(filter).toEqual({
			$set: { name: "test", field: 1337, "property.nested": 42 },
			$unset: { remove: true },
			$addToSet: { event: [1, 2] },
		})
	})
	it("testRemoval", () => {
		const argument: persistly.Update<{ name: string; field: number; property: { nested: number }; remove: number }> = {
			name: "test",
			field: { $set: null },
			property: { nested: null },
			remove: { $unset: true },
		}
		const filter = persistly.Update.toMongo(argument)
		expect(filter).toEqual({ $set: { name: "test" }, $unset: { remove: true } })
	})
	it("test Clear", () => {
		const arrayAction = {
			$set: [
				null,
				undefined,
				"foo",
				123,
				{ test: null, foo: undefined, bar: "foo", example: ["bar", null, undefined] },
			],
		}
		expect(persistly.Update.Action.extract(arrayAction)).toEqual({
			$set: ["foo", 123, { bar: "foo", example: ["bar"] }],
		})
		const objectAction = {
			$set: { test: null, foo: undefined, bar: "foo", example: ["bar", null, undefined] },
		}
		expect(persistly.Update.Action.extract(objectAction)).toEqual({
			$set: { bar: "foo", example: ["bar"] },
		})
	})
})
