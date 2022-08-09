import { useEffect, useState } from "react";
import { Heartbeat } from "../../types/Heartbeat";
import { serverEventEmitter } from "../../server/events/emitter";
import { useInterval } from "./useInterval";
import { ConnectionData } from "../../datastore/Connections";

let intervalRef: NodeJS.Timer;

export function useConnections(): [Heartbeat[], (hb: Heartbeat) => boolean] {
	const [heartbeatList, setHeartbeatList] = useState([] as Heartbeat[]);
	useEffect(() => {
		ConnectionData.registerCallback(setHeartbeatList);
		return () => {
			ConnectionData.clearCallbacks();
		};
	});
	const handleHeartbeat = (hb: Heartbeat) => {
		ConnectionData.add(hb);
	};
	const rollOffExpiredHeartbeats = () => {
		if (heartbeatList.length > 0) {
			ConnectionData.expire(35000);
		}
	};
	useInterval(rollOffExpiredHeartbeats, 5000);
	useEffect(() => {
		serverEventEmitter.on("heartbeat", handleHeartbeat);
		return () => {
			clearInterval(intervalRef);
			serverEventEmitter.removeAllListeners("heartbeat");
		};
	});

	const updateHeartbeat = ConnectionData.update;

	return [heartbeatList, updateHeartbeat];
}
