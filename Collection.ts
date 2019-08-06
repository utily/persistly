import * as mongo from "mongodb"
import * as authly from "authly"
import { Document } from "./Document"

export class Collection<T extends Document> {
	private hexadecmialIdLength: number
	constructor(private backend: mongo.Collection, readonly shard?: string, readonly idLength: 4 | 8 | 12 | 16 = 16) {
		this.hexadecmialIdLength = idLength * 3 / 2
	}
	async get(filter: object & any): Promise<T | undefined> {
		if (Document.is(filter))
			filter = this.fromDocument(filter)
		return this.toDocument(await this.backend.findOne(filter))
	}
	async list(filter?: object): Promise<T[]>{
		if (Document.is(filter))
			filter = this.fromDocument(filter)
		return this.backend.find(filter).map<T>(this.toDocument.bind(this)).toArray()
	}
	async create(document: T): Promise<T>
	async create(documents: T[]): Promise<T[]>
	async create(documents: T | T[]): Promise<T | T[]> {
		let result: T | T[]
		if (Array.isArray(documents)) {
			const r = await this.backend.insertMany(documents.map(this.fromDocument.bind(this)))
			result = await (this.backend.find({ _id: { $in: Object.values(r.insertedIds) } })).map(d => this.toDocument(d)).toArray()
		} else {
			const r = await this.backend.insertOne(this.fromDocument(documents))
			result = this.toDocument(await this.backend.find(r.insertedId).next() || undefined)
		}
		return result
	}
	async update(document: Partial<T> & Document): Promise<T | undefined>
	async update(documents: (Partial<T> & Document)[]): Promise<T[]>
	async update(documents: Partial<T> & Document | (Partial<T> & Document)[]): Promise<T | undefined | T[]> {
		let result: T | undefined | T[]
		if (Array.isArray(documents))
			result = (await Promise.all(documents.map(document => this.update(document)))).filter(r => r != undefined) as T[]
		else {
			const filter: { _id: mongo.ObjectID, [property: string]: string | undefined | mongo.ObjectID } = this.fromDocument({ id: documents.id })
			delete documents.id
			if (this.shard) {
				filter[this.shard] = (documents as unknown as { [property: string]: string | undefined })[this.shard]
				delete (documents as unknown as { [property: string]: string | undefined })[this.shard]
			}
			const push: { [field: string]: { $each: any[] } } = {}
			const set: { [field: string]: any } = {}
			for (const field in documents)
				if (documents.hasOwnProperty(field)) {
					const value = (documents as { [field: string]: any | any[] })[field]
					if (Array.isArray(value))
						push[field] = { $each: value }
					else
						set[field] = value
				}
			const update: { $push?: { [field: string]: { $each: any[] } }, $set?: { [field: string]: any } } = {}
			if (Object.entries(push).length > 0)
				update.$push = push
			if (Object.entries(set).length > 0)
				update.$set = set
			const updated = await this.backend.findOneAndUpdate(filter, update, { returnOriginal: false })
			result = updated.ok ? this.toDocument(updated.value) : undefined
		}
		return result
	}
	private toDocument(document: { _id: mongo.ObjectID }): T
	private toDocument(document: { _id: mongo.ObjectID } | undefined | null): T | undefined
	private toDocument(document: { _id: mongo.ObjectID } | undefined | null): T | undefined {
		let result: T | undefined
		if (document) {
			const id = authly.Identifier.fromHexadecimal(document._id.toHexString().slice(24 - this.hexadecmialIdLength))
			delete(document._id)
			result = { ...document, id } as any
		}
		return result
	}
	private fromDocument(document: Document): any {
		const id = authly.Identifier.toHexadecimal(document.id).padStart(24, "0").slice(0, 24)
		const result = { ...document, _id: new mongo.ObjectID(id) }
		delete(result.id)
		return result
	}
}
