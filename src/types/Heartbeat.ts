export type Heartbeat = {
	id: string;
	lastReceived: number;
	commandQueue: string[];
};
