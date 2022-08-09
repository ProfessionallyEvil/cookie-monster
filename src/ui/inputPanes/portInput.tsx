import NumberInput from "./generic/numberInput";

import React, { FC } from "react";

const PortInput: FC<{
	id: string;
	onSubmit: Function;
}> = ({ id, onSubmit }) => {
	return (
		<NumberInput
			id={id}
			onSubmit={onSubmit}
			prompt={"Please enter a port number: "}
			validation={(n: string) => {
				try {
					const num = parseInt(n);
					return num >= 1 && num <= 65535
						? ""
						: "Port must be a number between 1 and 65535.";
				} catch (e) {
					return "Port must be numeric.";
				}
			}}
		/>
	);
};

module.exports = PortInput;
export default PortInput;
