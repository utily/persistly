import * as persistly from "../index"

describe("Filter", () => {
	it("toMongo", () => {
		const argument = {
			id: "ab01",
			shard: { $eq: "shard01" },
			field: { nested: { $eq: 42 } },
			other: { value: 13.37 },
			not: false,
		}
		const filter = persistly.Filter.toMongo(argument, "id", "shard")
		expect(filter).toEqual({ id: "ab01", shard: "shard01", field: { nested: 42 } })
	})
})
