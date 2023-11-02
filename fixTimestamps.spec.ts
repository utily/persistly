import * as persistly from "./index"

describe("datetime bug fix", () => {
	it.each([
		["2023-10-31T10:10:10Z", "2023-10-31T10:10:10Z"],
		["2023-10-31T10:10:10.1Z", "2023-10-31T10:10:10.100Z"],
		["2023-10-31T10:10:10.12Z", "2023-10-31T10:10:10.120Z"],
		["2023-10-31T10:10:10.123Z", "2023-10-31T10:10:10.123Z"],
		[{ nested: "2023-10-31T10:10:10.12Z" }, { nested: "2023-10-31T10:10:10.120Z" }],
	])("datetime bug fix", async (before, after) => {
		const item = {
			id: "1234123412341234",
			created: before,
			event: [
				{
					type: "order",
					date: before,
				},
			],
		}
		const fixed = persistly.fixTimestamps(item)
		expect(fixed).toEqual({
			id: "1234123412341234",
			created: after,
			event: [
				{
					type: "order",
					date: after,
				},
			],
		})
	})
})
