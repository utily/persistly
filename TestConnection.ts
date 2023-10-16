import { MongoMemoryServer } from "mongodb-memory-server"
import { Connection } from "./Connection"

export class TestConnection extends Connection {
	constructor(private server: MongoMemoryServer) {
		super(server.getUri())
	}
	async close(): Promise<void> {
		await super.close()
		await this.server.stop()
	}
	static async create(): Promise<TestConnection> {
		const server = await MongoMemoryServer.create()
		return new TestConnection(server)
	}
}
