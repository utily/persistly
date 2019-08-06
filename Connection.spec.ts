import * as persistly from "."
describe("Connection", () => {
	it("open non-existing", () => {
		const connection = persistly.Connection.open("mongodb://localhost/nonexisting")
		expect(connection).toBeTruthy()
	})
})
