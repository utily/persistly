import * as authly from "authly"
import * as persistly from "./"

describe("Collection", () => {
	const connection = persistly.TestConnection.create()
	let collection: persistly.Collection<{ id: authly.Identifier, name: string, shard: string, added?: boolean, data?: string[], toRemove?: object, toRemove2?: object, compare?: string }> | undefined

	beforeAll(async () => {
		collection = await connection.get<{ id: authly.Identifier, name: string, shard: string, added?: boolean, data?: string[], toRemove?: object, toRemove2?: object, compare?: string }>("data", "shard", 4)
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
	it("conditional update", async () => {
		await collection!.create([
			{ id: "co01", toRemove: { remove: "no" }, name: "1.1.1", compare: "2019-08-16T12:15:11+00:00", shard: "listA" },
			{ id: "co02", toRemove: { remove: "no" }, name: "1.1.2", compare: "2019-08-16T16:15:11+00:00", shard: "listA" },
			{ id: "co03", toRemove: { remove: "yes" }, name: "1.2.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co04", toRemove: { remove: "no" }, name: "1.2.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co05", toRemove: undefined, name: "1.3.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co06", toRemove: undefined, name: "1.3.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co07", name: "1.4.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co08", name: "1.4.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co09", toRemove2: { remove: "no" }, name: "2.1.1", compare: "2019-08-16T12:15:11+00:00", shard: "listA" },
			{ id: "co10", toRemove2: { remove: "no" }, name: "2.1.2", compare: "2019-08-16T16:15:11+00:00", shard: "listA" },
			{ id: "co11", toRemove2: { remove: "yes" }, name: "2.2.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co12", toRemove2: { remove: "no" }, name: "2.2.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co13", toRemove2: undefined, name: "2.3.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co14", toRemove2: undefined, name: "2.3.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co15", toRemove: { remove: "no" }, toRemove2: { remove: "no" }, name: "3.1.1", compare: "2019-08-16T12:15:11+00:00", shard: "listA" },
			{ id: "co16", toRemove: { remove: "no" }, toRemove2: { remove: "no" }, name: "3.1.2", compare: "2019-08-16T16:15:11+00:00", shard: "listA" },
			{ id: "co17", toRemove: { remove: "yes" }, toRemove2: { remove: "yes" }, name: "3.2.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co18", toRemove: { remove: "no" }, toRemove2: { remove: "no" }, name: "3.2.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co19", toRemove: { remove: "yes" }, toRemove2: undefined, name: "3.3.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co20", toRemove: { remove: "no" }, toRemove2: undefined, name: "3.3.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co21", toRemove2: { remove: "yes" }, toRemove: undefined, name: "4.3.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co22", toRemove2: { remove: "no" }, toRemove: undefined, name: "4.3.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
			{ id: "co23", toRemove: undefined, toRemove2: undefined, name: "4.3.1", compare: "2019-08-16T12:15:11+00:00", shard: "listB" },
			{ id: "co24", toRemove: undefined, toRemove2: undefined, name: "4.3.2", compare: "2019-08-16T16:15:11+00:00", shard: "listB" },
		])
		const updated = await collection!.update({ toRemove: undefined, toRemove2: undefined }, { shard: "listB", compare: { $lte: "2019-08-16T14:15:11+00:00" }, $or: [ { toRemove: { $exists: true } }, { toRemove2: { $exists: true } }] })
		const listed = await collection!.list({ shard: { $in: ["listA", "listB"]} })
		expect(updated && Array.isArray(updated) && updated.every(value => !value.toRemove && !value.toRemove2)).toBeTruthy()
		expect(listed && Array.isArray(listed) && listed.every((value: any) => value?.toRemove?.remove != "yes" && value?.toRemove2?.remove != "yes")).toBeTruthy()
	})
	afterAll(() => connection.close())
})
