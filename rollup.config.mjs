"use strict";

import typescript from "@rollup/plugin-typescript";
import progress from "rollup-plugin-progress";
import serve from "rollup-plugin-serve";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";

/* global process */

/** @type {import("rollup").RollupOptions} */
const config = {
    input: "src/index.ts",
    output: {
        name: "mbs",
        file: "dist/mbs.js",
        format: "iife",
        sourcemap: true,
    },
    treeshake: false,
    plugins: [
        progress({ clearLine: true }),
        resolve({ browser: true }),
        typescript({ tsconfig: "./tsconfig.json", inlineSources: true }),
        commonjs(),
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
