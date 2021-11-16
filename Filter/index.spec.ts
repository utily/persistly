import * as persistly from "../index"

describe("Filter", () => {
	const partialArgument = {
		id: "ab01",
		shard: { $eq: "shard01" },
		field: { nested: { $eq: 42 } },
		other: { value: 13.37 },
		not: false,
		some: { nested: "test", argument: { with: "spaces", orsmth: "test", value: { $gt: 4 } } },
	}
	it("EasyMongo", () => {
		const test = { id: "id02" }
		expect(persistly.Filter.toMongo(test, "*")).toEqual({ id: "id02" })
	})
	it("toMongo", () => {
		const argument = {
			id: "ab01",
			shard: { $eq: "shard01" },
			field: { nested: { $eq: 42 } },
			other: { value: 13.37 },
			not: false,
		}
		const filter = persistly.Filter.toMongo(argument, "id", "shard")
		expect(filter).toEqual({ id: "ab01", shard: "shard01", "field.nested": 42 })
	})
	it("TestPartial toMongo", () => {
		const filter = persistly.Filter.toMongo(partialArgument, "*")
		expect(filter).toEqual({
			id: "ab01",
			shard: "shard01",
			"other.value": 13.37,
			not: false,
			"field.nested": 42,
			"some.argument.orsmth": "test",
			"some.argument.with": "spaces",
			"some.argument.value": { $gt: 4 },
			"some.nested": "test",
		})
	})
	it("Test isset", () => {
		const testing = {
			id: "ab01",
			field: { nested: { $eq: 42 } },
			something: { $isset: true },
		}
		const filter = persistly.Filter.toMongo(testing, "id")
		expect(filter).toEqual({
			"field.nested": 42,
			id: "ab01",
			something: {
				$exists: true,
			},
		})
	})
	it("elemMatch", () => {
		const test = { array: { $elemMatch: { created: { $gt: 2 } } } }
		expect(persistly.Filter.toMongo(test, "*")).toEqual({ array: { $elemMatch: { created: { $gt: 2 } } } })
	})
})
