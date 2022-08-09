import { writeFile } from "fs/promises";
import concatifier from "concatifier";
// const unidecode = require("unidecode");
import { decode } from "../encoding/yuckify";
import { Response } from "express";
import { CookieMonsterPayloadRequest } from "../../types/index";
import { serverEventEmitter } from "../events/emitter";

// const underscoreRx = /^\/\//;

let outputDir: string | undefined;
let tmpDir: string | undefined;

serverEventEmitter.on(
	"setOutDirectory",
	(evt: { outDir: string; tmpDir: string }) => {
		outputDir = evt.outDir;
		tmpDir = evt.tmpDir;
	}
);

export async function ChunkWriter(
	req: CookieMonsterPayloadRequest,
	_: Response,
	next: Function
) {
	let payload = req.cookies?.session
		? decode(req.cookies.session, { stripNulls: false, type: "binary" })
		: "";
	const f = req.filename?.split(/\/\\/g)?.pop() || "file";
	let writepath = `${tmpDir}/${f}.${req.sequence?.index || "x"}_${
		req.sequence?.total || "y"
	}`;
	console.log(writepath);
	writeFile(writepath, payload)
		.then((_) => {})
		.catch((err) => {
			console.log(err);
		});

	if (req.sequence?.index && req.sequence?.index === req.sequence?.total) {
		let nt = Number(req.sequence?.total);
		let fileList: string[] = [];
		for (let filenum = 1; filenum <= nt; filenum++) {
			fileList.push(`${tmpDir}/${f}.${String(filenum)}_${req.sequence?.total}`);
		}
		concatifier(fileList, `${outputDir}/${f}`, { delimiter: "" });
		console.log(`${f} written to out`);
	}
	next();
}

// function bToA(b: string): string {
// 	return unidecode(Buffer.from(b, "base64").toString("utf8")).replace(
// 		/\0*/g,
// 		""
// 	);
// }
