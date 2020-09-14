export class Event<T> {
	private listeners: ((value: T) => void)[] = []
	listen(listener: (value: T) => void) {
		this.listeners.push(listener)
	}
	invoke(value: T) {
		this.listeners.forEach(l => l(value))
	}
}
