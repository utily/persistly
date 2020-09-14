import * as persistly from "."

describe("Connection", () => {
	it("open non-existing", () => {
		const connection = persistly.Connection.open("mongodb://localhost/nonexisting")
		expect(connection).toBeTruthy()
	})
	it("open real", async () => {
		const db = process.env.database
		if (db) {
			const connection = persistly.Connection.open(db)
			expect(connection).toBeTruthy()
			const merchant = await connection.get<{ id: string } & any, "id">("merchant", "id", 4)
			expect(merchant).toBeTruthy()
			await connection.close()
		}
	})
})
