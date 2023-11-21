"use strict";

import typescript from "@rollup/plugin-typescript";
import progress from "rollup-plugin-progress";
import serve from "rollup-plugin-serve";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import simpleGit from "simple-git";
import json from "@rollup/plugin-json";

import packageJson from "./package.json" assert { type: "json" };

/* global process */

/** @type {import("rollup").RollupOptions} */
const config = {
    input: "src/index.ts",
    output: {
        name: "mbs",
        file: "dist/mbs.js",
        format: "iife",
        sourcemap: true,
        intro: async () => {
            let version = packageJson.version;
			const git = simpleGit();
            const latestTag = (await git.tags()).latest;
            devsuffix: {
                if (latestTag === undefined) {
                    console.error("MBS: Failed to load git tags");
                    break devsuffix;
                }

                // Grab all commits since the latest release
                const commits = (await git.log({ from: latestTag })).all;
                if (commits.length === 0) {
                    console.log(`MBS: No new commits since ${latestTag} tag`);
                    break devsuffix;
                }

                // Automatically increment the micro version by 1 w.r.t. the latest release if we haven't done so manually
                if (latestTag === `v${version}`) {
                    const versionSplit = version.split(".");
                    versionSplit[2] = (Number.parseInt(versionSplit[2]) + 1).toString();
                    if (Number.isNaN(versionSplit[2])) {
                        console.error(`MBS: Failed to parse ${version} micro version, invalid integer type`);
                        break devsuffix;
                    }
                    version = versionSplit.join(".");
                }

                const hash = commits.at(-1).hash;
                version += `.dev${commits.length - 1}+${hash.slice(0, 8)}`;
            }
            return `const MBS_VERSION="${version}"`;
		},
    },
    treeshake: false,
    plugins: [
        progress({ clearLine: true }),
        resolve({ browser: true }),
        typescript({ tsconfig: "./tsconfig.json", inlineSources: true }),
        commonjs(),
        json(),
    ],
    onwarn(warning, warn) {
        switch (warning.code) {
            case "EVAL":
            case "CIRCULAR_DEPENDENCY":
                return;
            default:
                warn(warning);
        }
    },
};

if (!process.env.ROLLUP_WATCH) {
    config.plugins.push(terser());
}

if (process.env.ROLLUP_WATCH) {
    config.plugins.push(
        serve({
            contentBase: "dist",
            host: "localhost",
            port: 8082,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        }),
    );
}

export default config;
