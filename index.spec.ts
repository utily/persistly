import * as persistly from "./index"

describe("persistly", () => {
	it("Filter Update split", () => {
		const argument = {
			id: "ab01",
			shard: { $eq: "shard01" },
			field: { nested: { $eq: 42 }, $set: 1337 },
			other: { value: 13.37 },
			not: false,
			name: "test",
			property: { nested: 42 },
			remove: { $unset: true },
			filter: { $eq: 42 },
			range: { $gt: 42, $lte: 1337 },
			array: ["element0", "element1"],
		}
		const filter = persistly.Filter.toMongo(argument, "id", "shard")
		expect(filter).toEqual({
			id: "ab01",
			shard: "shard01",
			filter: 42,
			"field.nested": 42,
			range: { $gt: 42, $lte: 1337 },
		})
		const update = persistly.Update.toMongo(argument, "id", "shard")
		expect(update).toEqual({
			$set: { name: "test", field: 1337, "property.nested": 42, "other.value": 13.37, not: false },
			$unset: { remove: true },
			$push: { array: { $each: ["element0", "element1"] } },
		})
	})
})
