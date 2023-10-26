import { MongoMemoryServer } from "mongodb-memory-server"
import { Connection } from "./Connection"

export class TestConnection extends Connection {
	constructor(private server: Promise<MongoMemoryServer>) {
		super(server.then(s => s.getUri()))
	}
	async close(): Promise<void> {
		await super.close()
		await (await this.server).stop()
	}
	static create(): TestConnection {
		return new TestConnection(MongoMemoryServer.create())
	}
}
