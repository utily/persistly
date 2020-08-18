import * as Mongo from "mongodb"
import { Collection } from "./Collection"
import { Document } from "./Document"

export class Connection {
	private client: Promise<Mongo.MongoClient | undefined>
	private readonly database: Promise<Mongo.Db | undefined>
	protected constructor(url: Promise<string>, database?: Promise<string>) {
		this.client = url.then(u => Mongo.MongoClient.connect(u, { useNewUrlParser: true })).catch(() => undefined)
		this.database = this.client
			.then(async c => (c ? c.db(database ? await database : undefined) : undefined))
			.catch(() => undefined)
	}
	async get<T extends Document>(
		name: string,
		shard?: string,
		idLength: 4 | 8 | 12 | 16 = 16
	): Promise<Collection<T> | undefined> {
		const database = await this.database
		return database ? new Collection<T>(database.collection(name), shard, idLength) : undefined
	}
	async close(): Promise<void> {
		const client = await this.client
		if (client)
			await client.close()
	}
	static open(url: string, database?: string): Connection {
		return new Connection(Promise.resolve(url), database ? Promise.resolve(database) : undefined)
	}
}
