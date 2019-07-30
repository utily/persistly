import * as mongo from "mongodb"
import { Document } from "./Document"

export class Collection<T extends Document> {
	constructor(private backend: Promise<mongo.Collection>, private shard?: string) { }
	async get(filter: object): Promise<T>{
		return mapId<T>((await this.backend).findOne(filter))
	}
	async list(filter?: object): Promise<T[]>{
		return (await this.backend).find(filter).map<T>(mapId).toArray()
	}
	async create(document: T): Promise<T>
	async create(documents: T[]): Promise<T[]>
	async create(documents: T | T[]): Promise<T | T[]> {
		let result: T | T[]
		if (Array.isArray(documents)) {
			const r = await (await this.backend).insertMany(documents)
			result = await ((await this.backend).find({ _id: { $in: Object.values(r.insertedIds) } })).toArray()
		} else {
			const r = await (await this.backend).insertOne(documents)
			result = await (await this.backend).find(r.insertedId).next() || undefined
		}
		return result
	}
	async update(document: Partial<T>): Promise<T>
	async update(documents: Partial<T>[]): Promise<T[]>
	async update(documents: Partial<T> | Partial<T>[]): Promise<T | T[]> {
		let result: T | T[]
		if (Array.isArray(documents)) {
			let updated: any
			await Promise.all(documents.map(async document => {
				updated = await this.update(document)
			}))
			result = updated || []
		} else {
			const filter: { _id: mongo.ObjectID, [property: string]: string | undefined | mongo.ObjectID } = { _id: new mongo.ObjectID(documents.id) }
			delete documents.id
			if (this.shard){
				filter[this.shard] = (documents as unknown as { [property: string]: string | undefined })[this.shard]
				delete (documents as unknown as { [property: string]: string | undefined })[this.shard]
			}
			const updated = await (await this.backend).findOneAndUpdate(filter, { $addToSet: documents }, { returnOriginal: false } )
			result = updated.ok = updated.value || []
		}
		return result
	}
}
function mapId<T extends Document>(document: any): T {
	const result = { ...document, id: document._id }
	delete(result._id)
	return result
}
