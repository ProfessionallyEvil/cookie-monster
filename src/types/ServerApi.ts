import { ServerConfig } from "./ServerConfig";
import { ServerListeningState } from "./ServerStatus";

export type StateChangeResult = {
	requestedState: ServerListeningState;
	state: ServerListeningState;
	reason: string;
	success: boolean;
};

export type ConfigChangeResult = {
	requestedConfig: Partial<ServerConfig>;
	config: ServerConfig;
	success: boolean;
	restartRequested: boolean;
	serverStateBefore: ServerListeningState;
	serverRestartResult?: StateChangeResult;
	reason: string;
};

export type ServerApi = {
	getState: () => ServerListeningState;
	start: () => Promise<StateChangeResult>;
	stop: () => Promise<StateChangeResult>;
	restart: () => Promise<StateChangeResult>;
	getConfig: () => ServerConfig;
	setConfig: (newConfig: Partial<ServerConfig>) => Promise<ConfigChangeResult>;
	saveConfig: () => Promise<boolean>;
};
