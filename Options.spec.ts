import * as persistly from "./index"

describe("Option", () => {
	it("extractOptions", () => {
		const argument: persistly.Update<Record<string, unknown>> = {
			name: "test",
			field: { $set: 1337 },
			property: { nested: 42 },
			remove: { $unset: true },
			$upsert: true,
		}
		const options = persistly.Options.extractOptions(argument)
		const filter = persistly.Update.toMongo(argument)
		expect(filter).toEqual({ $set: { name: "test", field: 1337, "property.nested": 42 }, $unset: { remove: true } })
		expect(options).toEqual({ upsert: true })
	})
	it("Empty Options", () => {
		const argument: persistly.Update<Record<string, unknown>> = {
			name: "test",
			field: { $set: 1337 },
			property: { nested: 42 },
			remove: { $unset: true },
		}
		const options = persistly.Options.extractOptions(argument)
		const filter = persistly.Update.toMongo(argument)
		expect(filter).toEqual({ $set: { name: "test", field: 1337, "property.nested": 42 }, $unset: { remove: true } })
		expect(options).toEqual({})
	})
})
