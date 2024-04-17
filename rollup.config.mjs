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
import license from "rollup-plugin-license";

import packageJson from "./package.json" assert { type: "json" };

/* global process */

const LICENSE = `
MBS: Maid's Bondage Scripts

Copyright (C) 2023-2024 Bananarama92

This program is free software: you can redistribute it and/or modify it under the terms of
the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program.
If not, see https://www.gnu.org/licenses/.

An exception is made for the "mbs.css" API, which is licensed under the terms of GNU LGPL
version 3 (see https://www.gnu.org/licenses/lgpl-3.0.en.html).
`.trim();

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
        license({ banner: { content: LICENSE, commentStyle: "ignored" } }),
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
