import * as Mongo from "mongodb"
import { Collection } from "./Collection"
import { Document } from "./Document"

export class Connection {
	private client: Promise<Mongo.MongoClient>
	private readonly database: Promise<Mongo.Db>
	protected constructor(url: Promise<string>, database: Promise<string>) {
		this.client = url.then(u => Mongo.MongoClient.connect(u, { useNewUrlParser: true }))
		this.database = this.client.then(async c => c.db(await database))
	}
	get<T extends Document>(name: string, shard?: string, idLength: 4 | 8 | 12 | 16 = 16): Collection<T> {
		return new Collection<T>(this.database.then(db => db.collection(name)), shard, idLength)
	}
	async close(): Promise<void> {
		await (await this.client).close()
	}
	static open(url: string, database: string): Connection {
		return new Connection(Promise.resolve(url), Promise.resolve(database))
	}
}
