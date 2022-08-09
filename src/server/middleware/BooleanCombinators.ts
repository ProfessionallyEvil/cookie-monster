import { Request, Response } from "express";

export function mwOr(
	f: (req: Request) => boolean,
	mw1: (req: Request, res: Response, next: Function) => void,
	mw2: (req: Request, res: Response, next: Function) => void
) {
	return (req: Request, res: Response, next: Function) => {
		if (f(req)) {
			mw1(req, res, next);
		} else {
			mw2(req, res, next);
		}
	};
}

export function mwIf(
	f: (req: Request) => boolean,
	mw: (req: Request, res: Response, next: Function) => void
) {
	return (req: Request, res: Response, next: Function) => {
		if (f(req)) {
			mw(req, res, next);
		} else {
			next();
		}
	};
}
