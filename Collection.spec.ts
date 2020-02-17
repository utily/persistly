import * as authly from "authly"
import * as persistly from "./"

describe("Collection", () => {
	const connection = persistly.TestConnection.create()
	let collection: persistly.Collection<{ id: authly.Identifier, name: string, shard: string, added?: boolean, data?: string[] }> | undefined

	beforeAll(async () => {
		collection = await connection.get<{ id: authly.Identifier, name: string, shard: string, added?: boolean, data?: string[] }>("data", "shard", 4)
		await collection!.create([
			{ id: "id01", name: "first", shard: "a" },
			{ id: "id02", name: "second", shard: "b" },
			{ id: "id03", name: "third", shard: "a" },
		])
	})

	it("id conversion", () => {
		for (const id of ["abcd", "id01", "aBcd0134"]) {
			const hex = authly.Identifier.toHexadecimal(id).padStart(24, "0").slice(0, 24)
			expect(hex).toHaveLength(24)
			expect(authly.Identifier.fromHexadecimal(hex.slice(24 - id.length * 3 / 2))).toEqual(id)
		}
	})
	it("create one", async () => {
		const created = await collection!.create({ id: "crea", name: "created", shard: "create" })
		expect(created).toEqual({ id: "crea", name: "created", shard: "create" })
	})
	it("create many", async () => {
		const documents = [{ id: "cr01", name: "created 01", shard: "create many" }, { id: "cr02", name: "created 02", shard: "create many" }, { id: "cr03", name: "created 03", shard: "create many" }]
		const created = await collection!.create(documents)
		expect(created).toEqual(documents)
	})
	it("get", async () => {
		const second = await collection!.get({ id: "id02" })
		expect(second).toEqual({ id: "id02", name: "second", shard: "b" })
	})
	it("list one by id", async () => {
		const second = await collection!.list({ id: "id02", shard: "b" })
		expect(second).toEqual([{ id: "id02", name: "second", shard: "b" }])
	})
	it("list one by shard", async () => {
		const second = await collection!.list({ shard: "b" })
		expect(second).toEqual([{ id: "id02", name: "second", shard: "b" }])
	})
	it("list many by shard", async () => {
		const second = await collection!.list({ shard: "a" })
		expect(second).toEqual([{ id: "id01", name: "first", shard: "a" }, { id: "id03", name: "third", shard: "a" }])
	})
	it("update one", async () => {
		await collection!.create({ id: "upda", name: "not updated", shard: "update" })
		const updated = await collection!.update({ id: "upda", shard: "update", name: "updated" })
		expect(updated).toEqual({ id: "upda", name: "updated", shard: "update" })
	})
	it("update many", async () => {
		await collection!.create([
			{ id: "up01", name: "not updated 01", shard: "update" },
			{ id: "up02", name: "not updated 02", shard: "update" },
			{ id: "up03", name: "not updated 03", shard: "update" },
			{ id: "up04", name: "not updated 04", shard: "update" },
		])
		const updated = await collection!.update([
			{ id: "up01", shard: "update", name: "updated 01", added: true },
			{ id: "up02", shard: "update", name: "updated 02", added: true },
			{ id: "up03", shard: "update", name: "updated 03", added: true },
			{ id: "up04", shard: "update", name: "updated 04", added: true },
		])
		expect(updated).toEqual([
			{ id: "up01", shard: "update", name: "updated 01", added: true },
			{ id: "up02", shard: "update", name: "updated 02", added: true },
			{ id: "up03", shard: "update", name: "updated 03", added: true },
			{ id: "up04", shard: "update", name: "updated 04", added: true },
		])
	})
	it("update one array", async () => {
		await collection!.create({ id: "upar", name: "not updated", shard: "update", data: [ "created" ] })
		const updated = await collection!.update({ id: "upar", shard: "update", data: [ "updated"] })
		expect(updated).toEqual({ id: "upar", name: "not updated", shard: "update", data: ["created", "updated"] })
	})
	afterAll(() => connection.close())
})