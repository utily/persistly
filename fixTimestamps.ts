export function fixTimestamps<T>(value: T): T
export function fixTimestamps(value: Record<string, any>): Record<string, any> {
	for (const entry of Object.entries(value)) {
		if (typeof entry[1] == "string")
			value[entry[0]] = fixIncorrect(entry[1])
		else if (typeof entry[1] == "object")
			value[entry[0]] = fixTimestamps(entry[1])
	}
	return value
}
function fixIncorrect(value: string): string {
	if (value.length == 22 && value.match(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\dZ$/))
		value = value.substring(0, 21) + "00Z"
	else if (value.length == 23 && value.match(/^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d\dZ$/))
		value = value.substring(0, 22) + "0Z"
	return value
}
