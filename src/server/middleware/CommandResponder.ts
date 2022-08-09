import { CookieMonsterPayloadRequest } from "../../types/FileRequest";
import { Response } from "express";
import { encode } from "../encoding/yuckify";
import { ConnectionData } from "../../datastore/Connections";

export async function CommandResponder(
	req: CookieMonsterPayloadRequest,
	res: Response,
	next: Function
) {
	if (req.isHeartbeat && req.feederId) {
		let connection = ConnectionData.get(req.feederId);
		let command = connection?.commandQueue?.shift();
		if (command && connection) {
			res.cookie("session", encode(command));
			ConnectionData.update(connection);
		}
	}
	next();
}
