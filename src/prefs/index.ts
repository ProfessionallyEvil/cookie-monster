import { readFileSync } from "fs";
import { ServerConfig } from "../types/ServerConfig";
let configStore: any;

const { name } = JSON.parse(
	readFileSync(__dirname + "/../../package.json", "utf8")
);
export const defaultConfig: ServerConfig = {
	port: 3000,
	tempDir: "./tmp",
	outDir: "./out",
	pathsHttps: false,
	domains: ["localhost:3000"],
};

export async function getConfigStore() {
	return new Promise((resolve) => {
		if (configStore) {
			resolve(configStore);
		} else {
			import("configstore").then((mod) => {
				configStore = new mod.default(name, defaultConfig);
				resolve(configStore);
			});
		}
	});
}
