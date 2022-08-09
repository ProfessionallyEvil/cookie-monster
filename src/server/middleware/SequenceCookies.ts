import { Response } from "express";
import { CookieMonsterPayloadRequest } from "../../types";
import { decode } from "../encoding/yuckify";

export function SequenceCookies(
	req: CookieMonsterPayloadRequest,
	_: Response,
	next: Function
) {
	let itnCookie = req.cookies?.itn;
	if (itnCookie) {
		let [total, index]: string[] = decode(itnCookie).split(".");
		req.sequence = { index: index || "-1", total: total || "0" };
	}
	next();
}
