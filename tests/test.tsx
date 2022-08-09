import React from "react";
import chalk from "chalk/index";
import test from "ava";
import { render } from "ink-testing-library";
import App from "../src/ui/app";

test("greet unknown user", (t) => {
	const { lastFrame } = render(<App />);

	t.is(lastFrame(), chalk`Hello, {green Stranger}`);
});

test("greet user with a name", (t) => {
	const { lastFrame } = render(<App name="Jane" />);

	t.is(lastFrame(), chalk`Hello, {green Jane}`);
});
