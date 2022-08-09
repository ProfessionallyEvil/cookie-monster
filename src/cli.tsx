#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import meow from "meow";
import App from "./ui/app";
import Server from "./server/index";
import { ServerListeningState } from "./types";
import { serverEventEmitter } from "./server/events/emitter";
import {
	ConfigChangeResult,
	ServerApi,
	StateChangeResult,
} from "./types/ServerApi";
import { ConfStore, ServerConfig } from "./types/ServerConfig";
import { Server as httpServer } from "http";
import { defaultConfig } from "./prefs";
import * as Path from "path";
import { mkdirSync, existsSync } from "fs";

const cli = meow(
	`
	Usage
	  $ cookie-monster

	Options
		--port  <portnumber>  port to listen on
		--start   immediately start the server
		${/* add tls cert, domainList or domainFile, savePrefs boolean */ ""}
	Examples
	  $ manager --port=3000 --start
	  
`,
	{
		flags: {
			port: {
				type: "number",
				default: 3000,
			},
			start: {
				type: "boolean",
				default: false,
			},
			out: {
				type: "string",
				isRequired: true,
			},
		},
	}
);

// Top-level vars

//console.log('cwd', process.cwd());
//console.log('outDir arg', cli.flags.out);
const outDirectory = Path.resolve(process.cwd(), cli.flags.out);

let serverStatus = cli.flags.start
	? ServerListeningState.STARTING
	: ServerListeningState.STOPPED;

let savedConfig: ConfStore | undefined;
let localConfig: ServerConfig;
let serverInstance: httpServer | undefined;

function startServer(): Promise<StateChangeResult> {
	return new Promise((resolve, _reject) => {
		if (
			serverStatus === ServerListeningState.STOPPED &&
			!serverInstance?.listening
		) {
			// TODO: Try catch this
			serverInstance = Server.listen(localConfig.port, () => {
				serverStatus = serverInstance?.listening
					? ServerListeningState.STARTED
					: ServerListeningState.STOPPED;
				resolve({
					requestedState: ServerListeningState.STARTED,
					state: serverStatus,
					reason: "",
					success: serverInstance?.listening || false,
				});
			});
		} else {
			serverStatus = serverInstance?.listening
				? ServerListeningState.STARTED
				: ServerListeningState.STOPPED;
			resolve({
				requestedState: ServerListeningState.STARTED,
				state: serverStatus,
				reason: `Cannot request Start while server in ${serverStatus} state.`,
				success: false,
			});
		}
	});
}

function restartServer(): Promise<StateChangeResult> {
	return new Promise((resolve) => {
		stopServer().then((result) => {
			if (result.success) {
				startServer().then(resolve);
			} else {
				resolve(result);
			}
		});
	});
}

function stopServer(): Promise<StateChangeResult> {
	return new Promise((resolve, _reject) => {
		if (serverInstance && serverStatus === ServerListeningState.STARTED) {
			// TODO: Try catch this
			serverInstance.close((reason) => {
				serverStatus = serverInstance?.listening
					? ServerListeningState.STARTED
					: ServerListeningState.STOPPED;
				resolve({
					requestedState: ServerListeningState.STOPPED,
					state: serverStatus,
					reason: reason?.message || "",
					success: serverStatus === ServerListeningState.STOPPED,
				});
			});
		} else {
			serverStatus = serverInstance?.listening
				? ServerListeningState.STARTED
				: ServerListeningState.STOPPED;
			resolve({
				requestedState: ServerListeningState.STOPPED,
				state: serverStatus,
				reason: `Cannot request Stop while server in ${serverStatus} state.`,
				success: false,
			});
		}
	});
}

const serverApi: ServerApi = {
	getState: function (): ServerListeningState {
		return serverInstance?.listening
			? ServerListeningState.STARTED
			: ServerListeningState.STOPPED;
	},
	start: startServer,
	stop: stopServer,
	restart: restartServer,
	getConfig: function (): ServerConfig {
		return localConfig;
	},
	saveConfig: function () {
		return new Promise((resolve) => {
			Object.keys(localConfig).forEach((key) => {
				savedConfig?.set(key, localConfig[key as keyof ServerConfig]);
			});
			resolve(true);
		});
	},
	setConfig: function (
		newConfig: Partial<ServerConfig>
	): Promise<ConfigChangeResult> {
		return new Promise(async (resolve) => {
			localConfig = Object.assign(localConfig, newConfig);
			if (serverStatus !== ServerListeningState.STARTED) {
				resolve({
					requestedConfig: newConfig,
					config: localConfig,
					success: true,
					restartRequested: false,
					serverStateBefore: serverStatus,
					reason: "",
				});
			} else {
				restartServer().then((restartResult) => {
					resolve({
						requestedConfig: newConfig,
						config: localConfig,
						success: true,
						restartRequested: true,
						serverStateBefore: ServerListeningState.STARTED,
						serverRestartResult: restartResult,
						reason: "",
					});
				});
			}
		});
	},
};

//getConfigStore().then((config: any) => {
//savedConfig = config as ConfStore;
localConfig = Object.assign({}, defaultConfig, { outDirectory: outDirectory });
if (!existsSync(outDirectory)) {
	mkdirSync(outDirectory, { recursive: true });
}
let tmpDir = Path.join(outDirectory, "./tmp");
if (!existsSync(tmpDir)) {
	mkdirSync(tmpDir, { recursive: true });
}
serverEventEmitter.emit("setOutDirectory", {
	outDir: outDirectory,
	tmpDir: tmpDir,
});
//localConfig
if (cli.flags.port) {
	localConfig.port = cli.flags.port;
}
render(
	<App
		initialPort={localConfig.port.toString()}
		initialServerStatus={serverStatus}
		serverApi={serverApi}
	/>
);

if (cli.flags.start) {
	serverInstance = Server.listen(cli.flags.port, () => {
		serverStatus = ServerListeningState.STARTED;
	});
}
//});
