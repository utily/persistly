// tslint:disable-next-line: no-implicit-dependencies
import { MongoMemoryServer } from "mongodb-memory-server"
import { Connection } from "./Connection"

// Extend the default timeout so MongoDB binaries can download
jest.setTimeout(60000)

export class TestConnection extends Connection {
	constructor(private server: MongoMemoryServer) {
		super(server.getConnectionString(), server.getDbName())
	}
	async close(): Promise<void> {
		await super.close()
		await this.server.stop()
	}
	static create(): TestConnection {
		return new TestConnection(new MongoMemoryServer())
	}
}
