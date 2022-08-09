import { CookieMonsterPayloadRequest } from "../../types/FileRequest";
import { Response } from "express";
import { serverEventEmitter } from "../events/emitter";
import { Heartbeat } from "../../types/Heartbeat";

export async function RecordHeartbeat(
	req: CookieMonsterPayloadRequest,
	_: Response,
	next: Function
) {
	if (req.filename?.toLowerCase()?.split(".")?.shift() === "hb") {
		serverEventEmitter.emit("heartbeat", {
			id: req.feederId || "unknown_feeder",
			lastReceived: new Date().getTime(),
			commandQueue: [],
		} as Heartbeat);
		req.isHeartbeat = true;
	}
	next();
}
