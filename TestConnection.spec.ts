import { TestConnection } from "./TestConnection"

describe("TestConnection", () => {
	it("create & close", async () => {
		const connection = TestConnection.create()
		expect(connection).toBeTruthy()
		await connection.close()
	})
	it("get", async () => {
		const connection = TestConnection.create()
		const collection = connection.get<{ id: string; name: string }, "id">("data", "id")
		expect(collection).toBeTruthy()
		await connection.close()
	})
})
