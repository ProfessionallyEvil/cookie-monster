import React, { FC, useEffect, useState } from "react";
import { Text, Newline, Box, useFocusManager, useApp } from "ink";
import { ServerListeningState } from "../types/ServerStatus";
import { ServerApi } from "../types/ServerApi";
import Menu from "./menu";
import { ChildMenuType } from "../types/ui/ChildMenuType";
import { MenuItem } from "../types/ui/MenuItem";
import { InputPaneType } from "../types/ui/InputPaneType";
import PortInput from "./inputPanes/portInput";
//import { useHeartbeat } from "./hooks/useHeartbeat";
import { ConnectionControl } from "./inputPanes/connectionControl";
import { Heartbeat } from "../types/Heartbeat";
import { useConnections } from "./hooks/useConnections";

function getStatusColor(status: ServerListeningState): string {
	switch (status) {
		case ServerListeningState.STARTED:
			return "greenBright";
		case ServerListeningState.STARTING:
			return "green";
		case ServerListeningState.STOPPING:
			return "red";
		case ServerListeningState.STOPPED:
			return "redBright";
		default:
			return "magenta";
	}
}

function getServerToggleMenuItem(status: ServerListeningState): MenuItem {
	switch (status) {
		case ServerListeningState.STARTED:
			return { key: "Stop Server", isSelectable: true };
		case ServerListeningState.STOPPED:
			return { key: "Start Server", isSelectable: true };
		default:
			return {
				key: `${
					ServerListeningState.STARTING ? "Starting" : "Stopping"
				} Server`,
				isSelectable: false,
			};
	}
}

const App: FC<{
	initialPort: string;
	initialServerStatus?: ServerListeningState;
	serverApi: ServerApi;
}> = ({
	initialPort,
	initialServerStatus = ServerListeningState.STOPPED,
	serverApi,
}) => {
	const [childMenuShown, setChildMenu] = useState(ChildMenuType.NONE);
	const [inputPaneShown, setInputPane] = useState(InputPaneType.NONE);
	const [serverStatus, setServerStatus] = useState(initialServerStatus);
	const [shortcutPrompt, setShortcutPrompt] = useState("");
	const [port, setPort] = useState(initialPort);
	const { exit } = useApp();
	const { focus } = useFocusManager();
	const [heartbeats, updateHeartbeat] = useConnections();
	const [selectedHeartbeat, setSelectedHeartbeat] = useState() as [
		Heartbeat | undefined,
		Function
	];

	if (
		inputPaneShown === InputPaneType.CONNECTIONS &&
		selectedHeartbeat &&
		heartbeats.findIndex((hb) => hb.id === selectedHeartbeat.id) === -1
	) {
		// Selected heartbeat has rolled off.
		setSelectedHeartbeat(undefined);
	}

	const renderInputPane = (type: InputPaneType) => {
		switch (type) {
			case InputPaneType.CONNECTIONS:
				return (
					<ConnectionControl
						updateHeartbeat={updateHeartbeat}
						connection={selectedHeartbeat}
						onDone={() => {
							setInputPane(InputPaneType.NONE);
							focus("childMenu");
						}}
					/>
				);
			case InputPaneType.PORT:
				return (
					<PortInput
						id="inputPane"
						onSubmit={(portNum: number) => {
							serverApi.setConfig({ port: portNum }).then((result) => {
								if (result.success) {
									setInputPane(InputPaneType.NONE);
									setPort(result.config.port.toString());
									focus("childMenu");
								} else {
									console.error(result.reason);
								}
							});
						}}
					/>
				);
			default:
				return <></>;
		}
	};

	const getConnectionsMenu = () => {
		let menu = heartbeats.map((hb) => {
			return {
				key: hb.id,
				isSelectable: true,
			} as MenuItem;
		});
		menu.push(
			{ key: "---", isSelectable: false },
			{ key: "Done", isSelectable: true }
		);
		return menu;
	};

	const handleSetPrompt = (prompt: string) => {
		setShortcutPrompt(prompt);
	};

	const handleMainMenuSelect = (key: string) => {
		setInputPane(InputPaneType.NONE);
		switch (key) {
			case "Settings":
				setChildMenu(ChildMenuType.SETTINGS);
				focus("childMenu");
				break;
			case "Connections":
				setChildMenu(ChildMenuType.CONNECTIONS);
				focus("childMenu");
				break;
			case "Actions":
				setChildMenu(ChildMenuType.ACTIONS);
				focus("childMenu");
				break;
			case "Exit":
				if (serverApi.getState() === ServerListeningState.STOPPED) {
					exit();
				} else {
					serverApi.stop().then((result) => {
						if (result.success) {
							exit();
						} else {
							console.error("Failed to stop server: ", result.reason);
						}
					});
				}
				break;
			case "Start Server":
				setServerStatus(ServerListeningState.STARTING);
				serverApi.start().then((result) => {
					setServerStatus(result.state);
					if (!result.success) {
						console.error(result.reason);
					}
				});
				break;
			case "Stop Server":
				setServerStatus(ServerListeningState.STOPPING);
				serverApi.stop().then((result) => {
					setServerStatus(result.state);
					if (!result.success) {
						console.error(result.reason);
					}
				});
				break;
			default:
				break;
		}
	};

	const handleChildMenuSelect = (key: string) => {
		switch (key) {
			case "Done":
				setChildMenu(ChildMenuType.NONE);
				setInputPane(InputPaneType.NONE);
				focus("mainMenu");
				break;
			case "Change Port":
				setInputPane(InputPaneType.PORT);
				focus("inputPane");
				break;
			case "Save Current Settings as Default":
				handleSetPrompt("Overwrite saved settings? (y/n)");
				serverApi.saveConfig().then((_success) => {
					setChildMenu(ChildMenuType.NONE);
					focus("mainMenu");
				});
				break;
			default:
				let isConnectionId = /\d+\.\d+/.test(key);
				if (isConnectionId) {
					setInputPane(InputPaneType.CONNECTIONS);
					setSelectedHeartbeat(heartbeats.find((hb) => hb.id === key));
					focus("connectionPane");
				}
				break;
		}
	};

	const childMenuItems = {
		[ChildMenuType.NONE]: [],
		[ChildMenuType.SETTINGS]: [
			{ key: "Change Port", isSelectable: true },
			{ key: "Set Temp Directory", isSelectable: true },
			{ key: "Set Out Directory", isSelectable: true },
			{ key: "---", isSelectable: false },
			{ key: "Save Current Settings as Default", isSelectable: true },
			{ key: "---", isSelectable: false },
			{ key: "Done", isSelectable: true },
		],
		[ChildMenuType.ACTIONS]: [
			{ key: "Send Command", isSelectable: true },
			{ key: "---", isSelectable: false },
			{ key: "Done", isSelectable: true },
		],
	};

	// One-time
	useEffect(() => {
		setTimeout(() => {
			let state = serverApi.getState();
			if (state !== serverStatus) {
				setServerStatus(state);
			}
		}, 1000);
	}, []);

	return (
		<Box flexDirection="column" height={16}>
			<Box borderStyle={"classic"} borderColor={"yellow"}>
				<Text>
					Listening on port <Text color="yellow">{port}</Text>
					<Newline />
					Server is currently{" "}
					<Text color={getStatusColor(serverStatus)}>
						{serverStatus.toString()}
					</Text>
					<Newline />
					Currently have <Text color={"yellow"}>{heartbeats.length}</Text>{" "}
					heartbeats
				</Text>
				<Newline />
			</Box>
			<Box width="75%">
				<Box
					borderStyle={"single"}
					borderColor={
						childMenuShown === ChildMenuType.NONE ? "green" : "yellow"
					}
				>
					<Text>
						<Menu
							id="mainMenu"
							autoFocus
							items={[
								{ key: "Settings", isSelectable: true },
								{ key: "Connections", isSelectable: true },
								// { key: "Actions", label: "Bulk Actions", isSelectable: true },
								{ key: "---", isSelectable: false },
								getServerToggleMenuItem(serverStatus),
								{ key: "Exit", isSelectable: true },
							]}
							onSelect={handleMainMenuSelect}
						/>
						<Newline />
					</Text>
				</Box>
				<Box
					borderStyle={"single"}
					borderColor={inputPaneShown ? "yellow" : "green"}
					display={childMenuShown === ChildMenuType.NONE ? "none" : "flex"}
				>
					<Text>
						{childMenuShown !== ChildMenuType.CONNECTIONS ? (
							<Menu
								id="childMenu"
								items={childMenuItems[childMenuShown]}
								onSelect={handleChildMenuSelect}
							/>
						) : (
							<Menu
								id="childMenu"
								items={getConnectionsMenu()}
								onSelect={handleChildMenuSelect}
							/>
						)}
					</Text>
				</Box>
				<Box
					borderStyle="single"
					borderColor={"green"}
					display={inputPaneShown === InputPaneType.NONE ? "none" : "flex"}
				>
					{renderInputPane(inputPaneShown)}
				</Box>
			</Box>
			<Text>
				<Newline />
				{shortcutPrompt}
			</Text>
		</Box>
	);
};

module.exports = App;
export default App;
