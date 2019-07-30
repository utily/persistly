import * as persistly from "."
describe("Connection", () => {
	it("open non-existing", () => {
		const connection = persistly.Connection.open("example.com", "nonexisting")
		expect(connection).toBeTruthy()
	})
})
