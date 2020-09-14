import * as authly from "authly"
import * as persistly from "./index"

type Type = { id: authly.Identifier; name: string; shard: string; added?: boolean; data?: string[]; remove?: string }

describe("Collection", () => {
	const connection = persistly.TestConnection.create()
	let collection: persistly.Collection<Type, "shard"> | undefined

	beforeAll(async () => {
		collection = await connection.get<Type, "shard">("data", "shard", 4)
		if (collection) {
			await collection.create([
				{ id: "id01", name: "first", shard: "a" },
				{ id: "id02", name: "second", shard: "b" },
				{ id: "id03", name: "third", shard: "a" },
			])
		}
	})

	it("id conversion", () => {
		for (const id of ["abcd", "id01", "aBcd0134"]) {
			const hex = authly.Identifier.toHexadecimal(id).padStart(24, "0").slice(0, 24)
			expect(hex).toHaveLength(24)
			expect(authly.Identifier.fromHexadecimal(hex.slice(24 - (id.length * 3) / 2))).toEqual(id)
		}
	})
	it("create one", async () => {
		if (collection) {
			const created = await collection.create({ id: "crea", name: "created", shard: "create" })
			expect(created).toEqual({ id: "crea", name: "created", shard: "create" })
		}
	})
	it("create many", async () => {
		const documents = [
			{ id: "cr01", name: "created 01", shard: "create many" },
			{ id: "cr02", name: "created 02", shard: "create many" },
			{ id: "cr03", name: "created 03", shard: "create many" },
		]
		let created: Type[]
		if (collection) {
			created = await collection.create(documents)
			expect(created).toEqual(documents)
		}
	})
	it("get", async () => {
		let second: Type | undefined
		if (collection) {
			second = await collection.get({ id: "id02" })
			expect(second).toEqual({ id: "id02", name: "second", shard: "b" })
		}
	})
	it("list one by id", async () => {
		let second: Type[]
		if (collection) {
			second = await collection.list({ id: "id02", shard: "b" })
			expect(second).toEqual([{ id: "id02", name: "second", shard: "b" }])
		}
	})
	it("list one by shard", async () => {
		let second: Type[]
		if (collection) {
			second = await collection.list({ shard: "b" })
			expect(second).toEqual([{ id: "id02", name: "second", shard: "b" }])
		}
	})
	it("list many by shard", async () => {
		let second: Type[]
		if (collection) {
			second = await collection.list({ shard: "a" })
			expect(second).toEqual([
				{ id: "id01", name: "first", shard: "a" },
				{ id: "id03", name: "third", shard: "a" },
			])
		}
	})
	it("list many by filter", async () => {
		let second: Type[]
		if (collection) {
			second = await collection.list({ shard: "a", name: { $gt: "great" } })
			expect(second).toEqual([{ id: "id03", name: "third", shard: "a" }])
		}
	})
	it("update one", async () => {
		if (collection) {
			await collection.create({ id: "upda", name: "not updated", shard: "update" })
			const updated = await collection.update({ id: "upda", shard: "update", name: "updated" })
			expect(updated).toEqual({ id: "upda", name: "updated", shard: "update" })
		}
	})
	it("update many", async () => {
		if (collection) {
			await collection.create([
				{ id: "up01", name: "not updated 01", shard: "update" },
				{ id: "up02", name: "not updated 02", shard: "update" },
				{ id: "up03", name: "not updated 03", shard: "update" },
				{ id: "up04", name: "not updated 04", shard: "update" },
			])
			const updated = await collection.update([
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
		}
	})

	it("update range", async () => {
		if (collection) {
			await collection.create([
				{ id: "upr0", name: "not updated 00", shard: "update-range", remove: "old" },
				{ id: "upr1", name: "not updated 01", shard: "update-range", remove: "old" },
				{ id: "upr2", name: "not updated 02", shard: "update-range", remove: "old" },
				{ id: "upr3", name: "not updated 03", shard: "update-range", remove: "old" },
			])

			const query: persistly.Filter<Type> & persistly.Update<Type> = {
				shard: "update-range",
				name: { $gt: "not updated 00", $lt: "not updated 03", $set: "updated" },
				added: true,
				remove: { $unset: true },
			}
			const updated = await collection.update(query)
			const result = await collection.list({ shard: "update-range" })
			expect(updated).toEqual(2)
			expect(result).toEqual([
				{ id: "upr0", shard: "update-range", name: "not updated 00", remove: "old" },
				{ id: "upr1", shard: "update-range", name: "updated", added: true },
				{ id: "upr2", shard: "update-range", name: "updated", added: true },
				{ id: "upr3", shard: "update-range", name: "not updated 03", remove: "old" },
			])
		}
	})
	it("update range, no shard", async () => {
		if (collection) {
			await collection.create([
				{ id: "urb0", name: "v2: not updated 00", shard: "update-range2-a", remove: "old" },
				{ id: "urb1", name: "v2: not updated 01", shard: "update-range2-a", remove: "old" },
				{ id: "urb2", name: "v2: not updated 02", shard: "update-range2-a", remove: "old" },
				{ id: "urb3", name: "v2: not updated 03", shard: "update-range2-a", remove: "old" },
				{ id: "urb4", name: "v2: not updated 00", shard: "update-range2-b", remove: "old" },
				{ id: "urb5", name: "v2: not updated 01", shard: "update-range2-b", remove: "old" },
				{ id: "urb6", name: "v2: not updated 02", shard: "update-range2-b", remove: "old" },
				{ id: "urb7", name: "v2: not updated 03", shard: "update-range2-b", remove: "old" },
				{ id: "urb8", name: "v2: not updated 00", shard: "update-range2-b" },
				{ id: "urb9", name: "v2: not updated 01", shard: "update-range2-b" },
				{ id: "urba", name: "v2: not updated 02", shard: "update-range2-b" },
				{ id: "urbb", name: "v2: not updated 03", shard: "update-range2-b" },
			])
			const query: persistly.Filter<Type> & persistly.Update<Type> = {
				name: { $gt: "v2: not updated 00", $lt: "v2: not updated 03", $set: "v2: updated" },
				added: true,
				remove: { $isset: true, $unset: true },
			}
			const updated = await collection.update(query)
			const result = (await collection.list({ shard: "update-range2-a" })).concat(
				await collection.list({ shard: "update-range2-b" })
			)
			expect(updated).toEqual(6)
			expect(result).toEqual([
				{ id: "urb0", shard: "update-range2-a", name: "v2: not updated 00", remove: "old" },
				{ id: "urb1", shard: "update-range2-a", name: "v2: updated", added: true },
				{ id: "urb2", shard: "update-range2-a", name: "v2: updated", added: true },
				{ id: "urb3", shard: "update-range2-a", name: "v2: not updated 03", remove: "old" },
				{ id: "urb4", shard: "update-range2-b", name: "v2: not updated 00", remove: "old" },
				{ id: "urb5", shard: "update-range2-b", name: "v2: updated", added: true },
				{ id: "urb6", shard: "update-range2-b", name: "v2: updated", added: true },
				{ id: "urb7", shard: "update-range2-b", name: "v2: not updated 03", remove: "old" },
				{ id: "urb8", shard: "update-range2-b", name: "v2: not updated 00" },
				{ id: "urb9", shard: "update-range2-b", name: "v2: updated", added: true },
				{ id: "urba", shard: "update-range2-b", name: "v2: updated", added: true },
				{ id: "urbb", shard: "update-range2-b", name: "v2: not updated 03" },
			])
		}
	})
	it("update one array", async () => {
		if (collection) {
			await collection.create({ id: "upar", name: "not updated", shard: "update", data: ["created"] })
			const updated = await collection.update({ id: "upar", shard: "update", data: ["updated"] })
			expect(updated).toEqual({ id: "upar", name: "not updated", shard: "update", data: ["created", "updated"] })
		}
	})
	//Insert testing of Callbacks
	it("update one, testing callback", async () => {
		if (collection) {
			await collection.create({ id: "updb", name: "not updated", shard: "update" })
			const mockCallback = jest.fn()
			collection.updated.listen(mockCallback)
			const updated = await collection.update({ id: "updb", shard: "update", name: "updated" })
			expect(updated).toEqual({ id: "updb", name: "updated", shard: "update" })
			expect(mockCallback.mock.calls.length).toBe(1)
			expect(mockCallback.mock.calls[0][0]).toEqual(["update"])
		}
	})
	// Callback testing multiple update
	it("update multiple callback testing", async () => {
		if (collection) {
			const mockCallback = jest.fn()
			collection.updated.listen(mockCallback)

			await collection.create([
				{ id: "mul1", name: "not updated 01", shard: "update" },
				{ id: "mul2", name: "not updated 02", shard: "update" },
				{ id: "mul3", name: "not updated 03", shard: "update" },
				{ id: "mul4", name: "not updated 04", shard: "update1" },
			])
			expect(mockCallback.mock.calls.length).toBe(1)
			expect(mockCallback.mock.calls[0][0]).toEqual(["update", "update1"])
			const updated = await collection.update([
				{ id: "mul1", shard: "update", name: "updated 01", added: true },
				{ id: "mul2", shard: "update", name: "updated 02", added: true },
				{ id: "mul3", shard: "update", name: "updated 03", added: true },
				{ id: "mul4", shard: "update1", name: "updated 04", added: true },
			])
			expect(mockCallback.mock.calls.length).toBe(2)
			expect(mockCallback.mock.calls[1][0]).toEqual(["update", "update1"])
			expect(updated).toEqual([
				{ id: "mul1", shard: "update", name: "updated 01", added: true },
				{ id: "mul2", shard: "update", name: "updated 02", added: true },
				{ id: "mul3", shard: "update", name: "updated 03", added: true },
				{ id: "mul4", shard: "update1", name: "updated 04", added: true },
			])
		}
	})

	afterAll(() => connection.close())
})
