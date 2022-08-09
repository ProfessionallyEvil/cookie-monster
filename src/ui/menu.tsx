import React, { FC, useState } from "react";
import { Text, Newline, useInput, useFocus } from "ink";
import { MenuItem } from "../types/ui/MenuItem";

const Menu: FC<{
	items: MenuItem[];
	onSelect: Function;
	id: string;
	autoFocus?: boolean;
}> = ({ items, onSelect, id, autoFocus = false }) => {
	const [highlightedItem, setHighlightedItem] = useState(0);
	const { isFocused } = useFocus({ id, autoFocus });

	const getColors = (idx: number): { fg: string; bg?: string } => {
		if (isFocused) {
			return idx === highlightedItem
				? { fg: "black", bg: "green" }
				: { fg: "green" };
		} else {
			return idx === highlightedItem
				? { fg: "black", bg: "yellow" }
				: { fg: "yellow" };
		}
	};

	useInput(
		(_input, key) => {
			if (key.downArrow) {
				if (items[highlightedItem + 1]) {
					setHighlightedItem(highlightedItem + 1);
				}
			}
			if (key.upArrow) {
				if (items[highlightedItem - 1]) {
					setHighlightedItem(highlightedItem - 1);
				}
			}
			if (key.return) {
				if (items[highlightedItem]?.isSelectable) {
					onSelect(items[highlightedItem]?.key);
				}
			}
		},
		{ isActive: isFocused }
	);
	if (highlightedItem > 0 && highlightedItem > items.length - 1) {
		setHighlightedItem(0);
	}
	return (
		<Text>
			{items.map((item, idx) => {
				const { fg, bg } = getColors(idx);
				return (
					<Text key={idx}>
						<Text
							backgroundColor={bg}
							color={fg}
							dimColor={!isFocused}
							key={idx}
						>
							{item.label ? item.label : item.key}
						</Text>
						<Newline />
					</Text>
				);
			})}
		</Text>
	);
};

module.exports = Menu;
export default Menu;
