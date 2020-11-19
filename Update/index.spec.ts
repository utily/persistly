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
})
