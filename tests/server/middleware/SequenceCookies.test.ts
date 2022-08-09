import { SequenceCookies } from "../../../src/server/middleware/SequenceCookies";
import { Request, Response } from "express";
import { CookieMonsterPayloadRequest } from "../../../src/types";
import { FileCookieMockRequestSet } from "../samples/Cookies";

const mockRequestWithNoSequenceCookies: Partial<Request> = {
	cookies: {},
};

describe("SequenceCookies Middleware", () => {
	it("should extract values from the itn cookies if present", () => {
		SequenceCookies(
			FileCookieMockRequestSet[2] as Request,
			{} as Response,
			() => {
				let req = FileCookieMockRequestSet[2] as CookieMonsterPayloadRequest;
				expect(req.sequence?.index).toBe("3");
				expect(req.sequence?.total).toBe("28");
			}
		);
	});

	it("should gracefully handle a missing itn cookie", () => {
		SequenceCookies(
			mockRequestWithNoSequenceCookies as Request,
			{} as Response,
			() => {
				let req =
					mockRequestWithNoSequenceCookies as CookieMonsterPayloadRequest;
				expect(req.sequence?.index).toBeUndefined();
				expect(req.sequence?.total).toBeUndefined();
			}
		);
	});
});
