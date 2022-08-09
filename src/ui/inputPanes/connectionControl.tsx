import React, { FC } from "react";
import { Newline, Text, useFocus, useInput } from "ink";
// import TextInput from "ink-text-input";
import { Heartbeat } from "../../types/Heartbeat";

export const ConnectionControl: FC<{
	id?: string;
	updateHeartbeat: (hb: Heartbeat) => boolean;
	connection?: Heartbeat;
	onDone: Function;
}> = ({ id = "connectionPane", updateHeartbeat, connection, onDone }) => {
	useFocus({ id: id });
	useInput((input, _key) => {
		if (input === "d") {
			onDone();
		}
		if (input === "w") {
			if (connection) {
				connection?.commandQueue.push("whoami");
				updateHeartbeat(connection);
			}
		}
	});
	return (
		<Text>
			<Text>
				{connection ? (
					<>
						Last Heartbeat:{" "}
						<Text color={"magenta"}>
							{new Date(connection?.lastReceived || "").toLocaleTimeString()}
						</Text>
					</>
				) : (
					<Text color={"red"}>Selected connection has disconnected.</Text>
				)}
			</Text>
			<Newline />
			<Text color={"yellow"}>Queued Commands</Text>
			<Newline />
			<Text>---</Text>
			<Newline />
			{connection?.commandQueue.map((cmd, idx) => (
				<Text key={idx} color={"greenBright"}>
					{`${idx + 1}. ${cmd}`}
					<Newline />
				</Text>
			))}
			<Newline />
			<Text>
				(w)hoami <Text color={"cyan"}>|</Text> (d)one
			</Text>
		</Text>
	);
};
