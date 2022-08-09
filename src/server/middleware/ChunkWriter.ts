import { writeFile } from "fs/promises";
import concatifier from "concatifier";
//const unidecode = require("unidecode");
//import { decode } from "../encoding/yuckify";
import { Response } from "express";
import { CookieMonsterPayloadRequest } from "../../types/index";
import { serverEventEmitter } from "../events/emitter";
import { readFileSync, writeFileSync } from "fs";

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
	let payload: string = req.cookies?.session || "";
	const f = req.filename?.split(/\/\\/g)?.pop() || "file";
	let writepath = `${tmpDir}/${f}.${req.sequence?.index || "x"}_${
		req.sequence?.total || "y"
	}`;
	console.log(writepath);
	writeFile(writepath, payload.substring(1))
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
		concatifier(fileList, `${outputDir}/${f}`, { delimiter: "" }).then(() => {
			let fullData = readFileSync(`${outputDir}/${f}`).toString();
			writeFileSync(`${outputDir}/${f}`, Buffer.from(fullData, "base64"), { encoding: "utf8" });
			console.log(`${f} written to out`);
		});
	}
	next();
}

//function bToA(b: string): string {
 //	return unidecode(Buffer.from(b, "base64").toString("utf-8"));//.replace(
 	//	/\0*/g,
 	//	""
 	//);
 //}
