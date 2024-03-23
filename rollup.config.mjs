"use strict";

import typescript from "@rollup/plugin-typescript";
import progress from "rollup-plugin-progress";
import serve from "rollup-plugin-serve";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import simpleGit from "simple-git";
import json from "@rollup/plugin-json";
import scss from "rollup-plugin-scss";

import packageJson from "./package.json" assert { type: "json" };

/* global process */

/**
 * Increment the package version if it is lower than or equal to the latest git tag.
 * @param {string} pkgVersion
 * @param {string} gitVersion
 * @returns {string}
 */
function incrementVersion(pkgVersion, gitVersion) {
    const version_pattern = /^(v?)([0-9]+)\.([0-9]+)\.([0-9]+)$/;
    const gitExec = version_pattern.exec(gitVersion);
    const pkgExec = version_pattern.exec(pkgVersion);
    if (gitExec === null || pkgExec === null) {
        const version = gitExec === null ? gitVersion : pkgVersion;
        console.error(`MBS: Failed to parse version "${version}"`);
        return pkgVersion;
    }

    const gitArray = gitExec.slice(2, 5).map(i => Number.parseInt(i, 10));
    const pkgArray = pkgExec.slice(2, 5).map(i => Number.parseInt(i, 10));
    for (let i=0; i < 3; i++) {
        if (pkgArray[i] > gitArray[i]) {
            return pkgVersion;
        } else if (pkgArray[i] !== gitArray[i]) {
            break;
        }
    }

    // Automatically increment the micro version by 1 w.r.t. the latest release if we haven't done so manually
    gitArray[2] += 1;
    return gitArray.join(".");
}

/** @type {import("rollup").RollupOptions} */
const config = {
    input: "src/index.tsx",
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
                    console.log(`MBS: No new commits since the "${latestTag}" tag`);
                    break devsuffix;
                } else {
                    version = incrementVersion(version, latestTag);
                }

                const hash = commits[0].hash;
                version += `.dev${commits.length - 1}+${hash.slice(0, 8)}`;
                console.log(`MBS: Updated version "${packageJson.version}" to "${version}"`);
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
        scss({ output: false }),
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
