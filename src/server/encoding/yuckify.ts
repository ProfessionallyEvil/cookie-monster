import { Buffer } from "buffer";

const charPool =
	"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomChar(): string {
	let index = Math.floor(Math.random() * (charPool.length - 1));
	return charPool[index] || "A";
}

export function encode(val: string): string {
	return randomChar() + Buffer.from(val, "binary").toString("base64");
}

export function decode(
	val: string,
	options: { type?: BufferEncoding; stripNulls?: boolean } = {}
): string {
	return Buffer.from(val.slice(1), "base64")
		.toString(options.type || "binary")
		.replaceAll(options.stripNulls === false ? "" : /\x00/g, "");
}
