import { useEffect, useRef } from "react";

export function useInterval(callback: any, delay: number) {
	const savedCallback = useRef();

	// Remember the latest callback.
	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	// Set up the interval.
	useEffect(() => {
		function tick() {
			if (savedCallback?.current) {
				(savedCallback.current as Function)();
			}
		}
		if (delay !== null) {
			let id = setInterval(tick, delay);
			return () => clearInterval(id);
		} else {
			return () => {};
		}
	}, [delay]);
}
