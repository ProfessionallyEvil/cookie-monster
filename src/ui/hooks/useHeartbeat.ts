import { useEffect, useState } from "react";
import { Heartbeat } from "../../types/Heartbeat";
import { serverEventEmitter } from "../../server/events/emitter";
import { useInterval } from "./useInterval";

let intervalRef: NodeJS.Timer;

export function useHeartbeat(): [Heartbeat[], (hb: Heartbeat) => boolean] {
	const [heartbeatList, setHeartbeatList] = useState([] as Heartbeat[]);
	const handleHeartbeat = (hb: Heartbeat) => {
		let exists = false;
		heartbeatList.map((existingBeat) => {
			if (existingBeat.id === hb.id) {
				existingBeat.lastReceived = hb.lastReceived;
				exists = true;
			}
			return existingBeat;
		});
		if (!exists) {
			heartbeatList.push(hb);
		}
		setHeartbeatList(([] as Heartbeat[]).concat(heartbeatList));
	};
	const rollOffExpiredHeartbeats = () => {
		if (heartbeatList.length > 0) {
			const timenow = new Date().getTime();
			const revisedList = heartbeatList.filter(
				(hb) => timenow - hb.lastReceived < 35000
			);
			if (revisedList.length < heartbeatList.length) {
				setHeartbeatList(revisedList);
			}
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

	const updateHeartbeat = (hb: Heartbeat) => {
		let success = false;
		let updatedList = heartbeatList.map((listHb) => {
			if (listHb.id === hb.id) {
				success = true;
				return hb;
			}
			return listHb;
		});
		if (success) {
			setHeartbeatList(([] as Heartbeat[]).concat(updatedList));
		}
		return success;
	};

	return [heartbeatList, updateHeartbeat];
}
