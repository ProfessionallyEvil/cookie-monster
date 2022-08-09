import { Request } from "express";

export interface CookieMonsterPayloadRequest extends Request {
	sequence?: { index: string; total: string };
	filename?: string;
	feederId?: string;
	isHeartbeat?: boolean;
}
