import { MongoMemoryServer } from "mongodb-memory-server"
import { Connection } from "./Connection"

export class TestConnection extends Connection {
	constructor(private server: MongoMemoryServer) {
		super(server.getConnectionString())
	}
	async close(): Promise<void> {
		await super.close()
		await this.server.stop()
	}
	static create(): TestConnection {
		return new TestConnection(new MongoMemoryServer())
	}
}
