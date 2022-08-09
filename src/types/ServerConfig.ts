import { PathLike } from "fs";

export type ServerConfig = {
	port: number;
	tempDir: PathLike;
	outDir: PathLike;
	pathsHttps: boolean;
	domains: string[];
};

export type ConfStore = {
	set: ((key: string, value: any) => void) | ((obj: any) => void);
	get: (key: string) => any;
	has: (key: string) => boolean;
	delete: (key: string) => void;
	clear: () => void;
	size: number;
	path: string;
	all: any;
};
