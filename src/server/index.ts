import express, { Express } from "express";
import cookieParser from "cookie-parser";
import { readdirSync, readFileSync } from "fs";
import path from "path";

import {
	ChunkWriter,
	FilenameCookie,
	SequenceCookies,
	Combinators,
	RecordHeartbeat,
	FeederId,
	CommandResponder,
} from "./middleware";
import { CookieMonsterPayloadRequest } from "../types/FileRequest";
import { ResponseMapping } from "../types/Responses";

const app: Express = express();

app.disable("x-powered-by");
app.use(cookieParser());
app.use(SequenceCookies);
app.use(FilenameCookie);
app.use(FeederId);
app.use(RecordHeartbeat);
app.use(CommandResponder);
app.use(
	Combinators.mwIf((req: CookieMonsterPayloadRequest) => {
		return req.filename && !req.isHeartbeat ? true : false;
	}, ChunkWriter)
);

const responses: ResponseMapping = {
	images: readdirSync(__dirname + "/../responses/images"),
	html: readdirSync(__dirname + "/../responses/html"),
	js: readdirSync(__dirname + "/../responses/js"),
	css: readdirSync(__dirname + "/../responses/css"),
	json: readdirSync(__dirname + "/../responses/json"),
};

app.all("*", (req, res) => {
	const extension = /\.[a-z]+/i.exec(req.url);
	let type = "html";
	let mimeType = "text/html";
	let is404 = false;
	if (!extension) {
		if (/\/api\//i.test(req.url)) {
			type = "json";
		}
	} else {
		switch (extension[0]) {
			case ".html":
			case ".html":
			case ".php":
			case ".jsp":
			case ".aspx":
				type = "html";
				mimeType = "text/html";
				break;
			case ".png":
			case ".gif":
			case ".jpg":
				mimeType = `image/${extension[0].substring(1)}`;
				type = "images";
				break;
			case ".js":
				mimeType = "text/javascript";
				type = "js";
				break;
			case ".css":
				mimeType = "text/css";
				type = "css";
				break;
			default:
				is404 = true;
				break;
		}
	}

	const candidateResponses = responses[type as keyof ResponseMapping];
	const selectedFile =
		candidateResponses[Math.floor(Math.random() * candidateResponses.length)];
	const file = readFileSync(
		path.join(__dirname, "../responses", type, selectedFile || ""),
		{ encoding: "utf8" }
	);
	res
		.status(is404 ? 404 : 200)
		.type(mimeType)
		.send(file.toString());
});

export default app;
