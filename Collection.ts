import * as mongo from "mongodb"
import * as authly from "authly"
import { Document } from "./Document"
import { Filter } from "./Filter"
import { Update } from "./Update"
import { Event } from "./Event"

export class Collection<T extends Document, Shard extends keyof T & string> {
	private hexadecmialIdLength: number
	readonly updated = new Event<T[Shard][]>()
	constructor(private backend: mongo.Collection, readonly shard: Shard, readonly idLength: 4 | 8 | 12 | 16 = 16) {
		this.hexadecmialIdLength = (idLength * 3) / 2
	}
	async get(filter: Filter<T>): Promise<T | undefined> {
		if (Document.is(filter))
			filter = this.fromDocument(filter)
		return this.toDocument(await this.backend.findOne(filter))
	}
	async list(filter?: Filter<T>): Promise<T[]> {
		if (Document.is(filter))
			filter = this.fromDocument(filter)
		return this.backend.find(filter).map<T>(this.toDocument.bind(this)).toArray()
	}
	async create(document: T): Promise<T>
	async create(documents: T[]): Promise<T[]>
	async create(documents: T | T[]): Promise<T | T[]> {
		let result: T | T[]
		if (Array.isArray(documents))
			if (documents.length > 0) {
				const r = await this.backend.insertMany(documents.map(this.fromDocument.bind(this)))
				result = await this.backend
					.find({ _id: { $in: Object.values(r.insertedIds) } })
					.map(d => this.toDocument(d))
					.toArray()
				this.updated.invoke([...new Set(result.map(d => d[this.shard]))])
			} else
				result = []
		else {
			const r = await this.backend.insertOne(this.fromDocument(documents))
			result = this.toDocument((await this.backend.find(r.insertedId).next()) || undefined)
			this.updated.invoke([result[this.shard]])
		}
		return result
	}

	private async deleteHelper(document: Filter<T> & Document): Promise<[T[Shard][], T | undefined]>
	private async deleteHelper(document: Filter<T>): Promise<[T[Shard][], T | number | undefined]>
	private async deleteHelper(document: Filter<T> & Document): Promise<[T[Shard][], T | number | undefined]> {
		let result: T | number | undefined
		let shards: T[Shard][] | undefined
		const filter: {
			_id?: mongo.ObjectID
			[property: string]: string | undefined | mongo.ObjectID
		} = this.fromDocument(Filter.toMongo(document, "id", this.shard))
		if (filter._id) {
			const deleted = await this.backend.findOneAndDelete(filter)
			result = deleted.ok ? this.toDocument(deleted.value) : undefined
			if (result)
				shards = [result[this.shard]]
		} else {
			;[shards, result] = !filter[this.shard] //Same Workaround as in updateHelper for lack of support on deleteMany
				? (
						await Promise.all(
							[
								...new Set(
									await this.backend
										.find(filter)
										.map(d => d[this.shard])
										.toArray()
								),
							].map(async s => {
								const f = { ...filter }
								f[this.shard] = s
								return [s, (await this.backend.deleteMany(f, {})).deletedCount]
							})
						)
				  ).reduce((r, c) => [[...r[0], c[1]], r[1] + c[1]], [[], 0])
				: [[filter[this.shard]], (await this.backend.deleteMany(filter, {})).deletedCount]
		}
		return [shards ?? [], result]
	}
	async delete(document: Filter<T> & Document): Promise<T | undefined>
	async delete(document: Filter<T>): Promise<T | number | undefined>
	async delete(documents: (Filter<T> & Document)[]): Promise<T[]>
	async delete(documents: Filter<T> | Filter<T>[]): Promise<T | number | undefined | T[]> {
		let result: [T[Shard][], T | number | undefined | T[]]
		if (Array.isArray(documents))
			if (documents.length > 0)
				result = (await Promise.all(documents.map(document => this.deleteHelper(document)))).reduce<[T[Shard][], T[]]>(
					(r, c) =>
						Document.is(c[1])
							? [
									[...r[0], ...c[0]],
									[...r[1], c[1]],
							  ]
							: r,
					[[], []]
				)
			else
				result = [[], []]
		else
			result = await this.deleteHelper(documents)
		if (result[0])
			this.updated.invoke([...new Set(result[0])])
		return result[1]
	}

	private async updateHelper(document: Filter<T> & Update<T> & Document): Promise<[T[Shard][], T | undefined]>
	private async updateHelper(document: Filter<T> & Update<T>): Promise<[T[Shard][], T | number | undefined]>
	private async updateHelper(
		document: Filter<T> & Update<T> & Document
	): Promise<[T[Shard][], T | number | undefined]> {
		let result: T | number | undefined
		let shards: T[Shard][] | undefined
		const filter: {
			_id?: mongo.ObjectID
			[property: string]: string | undefined | mongo.ObjectID
		} = this.fromDocument(Filter.toMongo(document, "id", this.shard))
		const update: { $push?: { [field: string]: { $each: any[] } }; $set?: { [field: string]: any } } = Update.toMongo(
			document,
			"id",
			this.shard
		)
		if (filter._id) {
			const updated = await this.backend.findOneAndUpdate(filter, update, { returnOriginal: false })
			result = updated.ok ? this.toDocument(updated.value) : undefined
			if (result)
				shards = [result[this.shard]]
		} else {
			;[shards, result] = !filter[this.shard] // Workaround for CosmosDB:s lack of support for updateMany across shards, slow
				? (
						await Promise.all(
							[
								...new Set(
									await this.backend
										.find(filter)
										.map(d => d[this.shard])
										.toArray()
								),
							].map(async s => {
								const f = { ...filter }
								f[this.shard] = s
								return [s, (await this.backend.updateMany(f, update, {})).matchedCount]
							})
						)
				  ).reduce((r, c) => [[...r[0], c[1]], r[1] + c[1]], [[], 0])
				: [[filter[this.shard]], (await this.backend.updateMany(filter, update, {})).modifiedCount]
		}
		return [shards ?? [], result]
	}

	async update(document: Filter<T> & Update<T> & Document): Promise<T | undefined>
	async update(document: Filter<T> & Update<T>): Promise<T | number | undefined>
	async update(documents: (Filter<T> & Update<T> & Document)[]): Promise<T[]>
	async update(documents: (Filter<T> & Update<T>) | (Filter<T> & Update<T>)[]): Promise<T | number | undefined | T[]> {
		let result: [T[Shard][], T | undefined | T[] | number]
		if (Array.isArray(documents))
			if (documents.length > 0)
				result = (await Promise.all(documents.map(document => this.updateHelper(document)))).reduce<[T[Shard][], T[]]>(
					(r, c) =>
						Document.is(c[1])
							? [
									[...r[0], ...c[0]],
									[...r[1], c[1]],
							  ]
							: r,
					[[], []]
				)
			else
				result = [[], []]
		else
			result = await this.updateHelper(documents)
		if (result[0])
			this.updated.invoke([...new Set(result[0])])
		return result[1]
	}
	private toBase64(id: mongo.ObjectID): authly.Identifier {
		return authly.Identifier.fromHexadecimal(id.toHexString().slice(24 - this.hexadecmialIdLength))
	}
	private toBase16(id: authly.Identifier): mongo.ObjectID {
		return new mongo.ObjectID(authly.Identifier.toHexadecimal(id).padStart(24, "0").slice(0, 24))
	}
	private toDocument(document: { _id: mongo.ObjectID }): T
	private toDocument(document: { _id: mongo.ObjectID } | undefined | null): T | undefined
	private toDocument(document: { _id: mongo.ObjectID } | undefined | null): T | undefined {
		let result: T | undefined
		if (document) {
			const id = this.toBase64(document._id)
			delete (document as { _id?: mongo.ObjectID })._id
			result = { ...document, id } as any
		}
		return result
	}
	private fromDocument(document: Partial<Document>): any {
		const result: any = { ...document }
		if (document.id)
			result._id = new mongo.ObjectID(this.toBase16(document.id))
		delete result.id
		return result
	}
}
