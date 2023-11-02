import * as authly from "authly"
import * as mongo from "mongodb"
import { Document } from "./Document"
import { Event } from "./Event"
import { Filter } from "./Filter"
import { fixTimestamps } from "./fixTimestamps"
import { Options } from "./Options"
import { Update } from "./Update"

export class Collection<T extends Document, Shard extends keyof T & string> {
	private hexadecmialIdLength: number
	readonly updated = new Event<mongo.WithId<Record<string, any>>[Shard][]>()
	constructor(private backend: mongo.Collection, readonly shard: Shard, readonly idLength: 4 | 8 | 12 | 16 = 16) {
		this.hexadecmialIdLength = (idLength * 3) / 2
	}
	async get(filter: Filter<T>): Promise<T | undefined> {
		let mongoFilter: mongo.Filter<Record<string, any>> = Filter.toMongo(filter ?? {}, "*")
		if (Document.is(mongoFilter))
			mongoFilter = this.fromDocument(mongoFilter)
		return this.toDocument(await this.backend.findOne(mongoFilter))
	}
	async list(filter?: Filter<T>): Promise<T[]> {
		let mongoFilter = Filter.toMongo(filter ?? {}, "*")
		if (Document.is(mongoFilter))
			mongoFilter = this.fromDocument(mongoFilter)
		return this.backend
			.find(mongoFilter ?? {})
			.map<T>(this.toDocument.bind(this))
			.toArray()
	}
	async create(document: T): Promise<T | undefined>
	async create(documents: T[]): Promise<T[]>
	async create(documents: T | T[]): Promise<T | T[] | undefined> {
		let result: T | T[] | undefined
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
			result && this.updated.invoke([result[this.shard]])
		}
		return result
	}

	private async deleteHelper(
		document: Filter<T> & Document
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | undefined]>
	private async deleteHelper(
		document: Filter<T>
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | number | undefined]>
	private async deleteHelper(
		document: Filter<T> & Document
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | number | undefined]> {
		let result: T | number | undefined
		let shards: mongo.WithId<Record<string, any>>[Shard][] | undefined
		let filter = Filter.toMongo(document, "id", this.shard)
		if (Document.is(filter))
			filter = this.fromDocument(filter)
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
				  ).reduce<[mongo.WithId<Record<string, any>>[Shard][], number]>(
						(r, c) => [[...r[0], c[1]], r[1] + c[1]],
						[[], 0]
				  )
				: [[filter[this.shard]], (await this.backend.deleteMany(filter, {})).deletedCount]
		}
		return [shards ?? [], result]
	}
	async delete(document: Filter<T> & Document): Promise<T | undefined>
	async delete(document: Filter<T>): Promise<T | number | undefined>
	async delete(documents: (Filter<T> & Document)[]): Promise<T[]>
	async delete(documents: Filter<T> | Filter<T>[]): Promise<T | number | undefined | T[]> {
		let result: [mongo.WithId<Record<string, any>>[Shard][], T | number | undefined | T[]]
		if (Array.isArray(documents))
			if (documents.length > 0)
				result = (await Promise.all(documents.map(document => this.deleteHelper(document)))).reduce<
					[mongo.WithId<Record<string, any>>[Shard][], T[]]
				>(
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

	private async updateHelper(
		document: Filter<T> & Update<T> & Document
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | undefined]>
	private async updateHelper(
		document: Filter<T> & Update<T> & Options & Document
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | undefined]>
	private async updateHelper(
		document: Filter<T> & Update<T>
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | number | undefined]>
	private async updateHelper(
		document: Filter<T> & Update<T> & Options & Document
	): Promise<[mongo.WithId<Record<string, any>>[Shard][], T | number | undefined]> {
		let result: T | number | undefined
		let shards: mongo.WithId<Record<string, any>>[Shard][] | undefined
		const options = Options.extractOptions(document)
		let filter = Filter.toMongo(document, "id", this.shard)
		if (Document.is(filter))
			filter = this.fromDocument(filter)
		const update = Update.toMongo(document, "id", this.shard)
		if (filter._id) {
			const updated = await this.backend.findOneAndUpdate(filter, update, {
				returnDocument: "after",
				...options,
			})
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
								return [s, (await this.backend.updateMany(f, update, { ...options })).matchedCount]
							})
						)
				  ).reduce<[mongo.WithId<Record<string, any>>[Shard][], number]>(
						(r, c) => [[...r[0], c[1]], r[1] + c[1]],
						[[], 0]
				  )
				: [[filter[this.shard]], (await this.backend.updateMany(filter, update, { ...options })).modifiedCount]
		}
		return [shards ?? [], result]
	}

	async update(document: Filter<T> & Update<T> & Options & Document): Promise<T | undefined>
	async update(document: Filter<T> & Update<T> & Document): Promise<T | undefined>
	async update(document: Filter<T> & Update<T>): Promise<T | number | undefined>
	async update(documents: (Filter<T> & Update<T> & Options & Document)[]): Promise<T[]>
	async update(
		documents: (Filter<T> & Update<T> & Options) | (Filter<T> & Update<T> & Options)[]
	): Promise<T | number | undefined | T[]> {
		let result: [mongo.WithId<Record<string, any>>[Shard][], T | undefined | T[] | number]
		if (Array.isArray(documents))
			if (documents.length > 0)
				result = (await Promise.all(documents.map(document => this.updateHelper(document)))).reduce<
					[mongo.WithId<Record<string, any>>[Shard][], T[]]
				>(
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

	async getDistinct(field: string): Promise<any[]> {
		return await this.backend.distinct(field)
	}

	private toBase64(id: mongo.ObjectId): authly.Identifier {
		return authly.Identifier.fromHexadecimal(id.toHexString().slice(24 - this.hexadecmialIdLength))
	}
	private toBase16(id: authly.Identifier): mongo.ObjectId {
		return new mongo.ObjectId(authly.Identifier.toHexadecimal(id).padStart(24, "0").slice(0, 24))
	}
	private toDocument(document: { _id: mongo.ObjectId }): T
	private toDocument(document: { _id: mongo.ObjectId } | undefined | null): T | undefined
	private toDocument(document: { _id: mongo.ObjectId } | undefined | null): T | undefined {
		let result: T | undefined
		if (document) {
			const id = this.toBase64(document._id)
			delete (document as { _id?: mongo.ObjectId })._id
			result = fixTimestamps({ ...document, id }) as any
		}
		return result
	}
	private fromDocument(document: Partial<Document>) {
		const result: Partial<Document> & { _id?: mongo.ObjectId } = { ...document }
		if (document.id)
			result._id = new mongo.ObjectId(this.toBase16(document.id))
		delete result.id
		return fixTimestamps(result)
	}
}
