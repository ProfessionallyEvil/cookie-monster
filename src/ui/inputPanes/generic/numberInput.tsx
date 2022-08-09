import React, { FC, useState, useEffect } from "react";
import { Newline, Text, useFocus, useFocusManager } from "ink";
import TextInput from "ink-text-input";

const NumberInput: FC<{
	id: string;
	onSubmit: Function;
	prompt: string;
	validation: Function;
}> = ({
	id,
	prompt = "Please enter a number",
	onSubmit,
	validation = () => {
		return "";
	},
}) => {
	const { isFocused } = useFocus({ id: id, autoFocus: true });
	const [userInput, setUserInput] = useState("");
	const [errorText, setErrorText] = useState("");

	const handleSubmit = () => {
		let validationError = validation(userInput);
		if (validationError.length > 0) {
			setErrorText(validationError);
		} else {
			onSubmit(userInput);
		}
	};
	// Always focus when first rendered.
	const { focus } = useFocusManager();
	useEffect(() => {
		focus(id);
	}, []);

	return (
		<Text>
			<Text color={"green"}>{prompt}</Text>
			<Newline count={2} />
			<Text color={"cyanBright"}>
				<TextInput
					focus={isFocused}
					placeholder={"3000"}
					value={userInput}
					onChange={setUserInput}
					onSubmit={handleSubmit}
				/>
			</Text>
			<Text color={"red"}>{errorText}</Text>
		</Text>
	);
};

module.exports = NumberInput;
export default NumberInput;
