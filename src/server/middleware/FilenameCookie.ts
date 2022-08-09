import { CookieMonsterPayloadRequest } from "../../types/FileRequest";
import { Response } from "express";
import { decode } from "../encoding/yuckify";

export async function FilenameCookie(
	req: CookieMonsterPayloadRequest,
	_: Response,
	next: Function
) {
	let filenameCookie = req.cookies?.f;
	if (filenameCookie) {
		req.filename = decode(filenameCookie);
	}
	next();
}
