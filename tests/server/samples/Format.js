export function parseCookieHeader(header) {
	return header
		.replace(/^Cookie\:\ /, "")
		.split(";")
		.map((cookie) => {
			let [key, val] = cookie.trim().split("=");
			return { key: key, val: val };
		})
		.reduce((prevVal, cookie) => {
			prevVal[cookie.key] = cookie.val;
			return prevVal;
		}, {});
}
