import { Heartbeat } from "../types/Heartbeat";

// Quick and dirty in-memory store for now.
let connectionData: Heartbeat[] = [];

let callbacks: Function[] = [];

function notifyCallbacks() {
	callbacks.forEach((cb) => cb(connectionData));
}

function findConnection(id: string) {
	return connectionData.find((conn) => conn.id === id);
}

function touchConnection(id: string) {
	let conn = findConnection(id);
	if (conn) {
		conn.lastReceived = new Date().getTime();
		notifyCallbacks();
		return true;
	}
	return false;
}

export const ConnectionData = {
	get: findConnection,
	list: () => {
		return ([] as Heartbeat[]).concat(connectionData);
	},
	add: function (conn: Heartbeat) {
		if (!touchConnection(conn.id)) {
			connectionData.push(conn);
			notifyCallbacks();
		}
	},
	remove: function (...conns: Heartbeat[]) {
		connectionData = connectionData.filter((conn) => !conns.includes(conn));
		notifyCallbacks();
	},
	update: function (hb: Heartbeat) {
		let success = false;
		connectionData = connectionData.map((listHb) => {
			if (listHb.id === hb.id) {
				success = true;
				return hb;
			}
			return listHb;
		});
		if (success) {
			notifyCallbacks();
		}
		return success;
	},
	expire: function (age: number) {
		const currentTime = new Date().getTime();
		connectionData = connectionData.filter(
			(conn) => currentTime - conn.lastReceived <= age
		);
		notifyCallbacks();
	},
	touch: touchConnection,
	registerCallback: (cb: Function) => {
		callbacks.push(cb);
	},
	clearCallbacks: () => {
		callbacks = [];
	},
};
