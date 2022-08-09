import { CookieMonsterPayloadRequest } from "../../types/FileRequest";
import { Response } from "express";

export async function FeederId(
	req: CookieMonsterPayloadRequest,
	_: Response,
	next: Function
) {
	if (req.cookies?._ga) {
		req.feederId = req.cookies._ga.replace(/^GA1\.2\./, "");
	}
	next();
}
