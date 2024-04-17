/**
 * Copyright (C) Bananarama92
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of
 * the GNU Lesser General Public License as published by the Free Software Foundation,
 * either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this program.
 * If not, see https://www.gnu.org/licenses/.
 */

import { fromEntries, entries, logger } from "../lpgl/common";

/** A record mapping {@link DEFAULT_STYLE} keys to their CSS equivalent (see the `index.scss` root selector) */
const FIELD_MAPPING = Object.freeze({
    backgroundColor: "--mbs-background-color",
    buttonColor: "--mbs-button-color",
    buttonHoverColor: "--mbs-hover-color",
    tooltipColor: "--mbs-tooltip-color",
    borderColor: "--mbs-border-color",
    textColor: "--mbs-text-color",
}) satisfies Record<keyof typeof mbs.css.DEFAULT_STYLE, string>;

/** The default MBS style options. */
export const DEFAULT_STYLE: typeof mbs.css.DEFAULT_STYLE = Object.freeze({
    backgroundColor: "white",
    buttonColor: "white",
    buttonHoverColor: "cyan",
    tooltipColor: "lightyellow",
    borderColor: "black",
    textColor: "black",
});

/**
 * Set the passed MBS style options.
 * @param style A record with one or more of the to-be assigned style options
 */
export const setStyle: typeof mbs.css.setStyle = function setStyle(style) {
    if (typeof style !== "object") {
        throw new TypeError(`Invalid style type: "${typeof style}"`);
    } else if (style === null) {
        throw new Error("Invalid style value: null");
    }

    const selector = document.querySelector(":root") as null | HTMLElement;
    if (!selector) {
        logger.error(":root selector missing in document");
        return;
    }

    for (const [k1, k2] of entries(FIELD_MAPPING)) {
        const value = style[k1];
        if (value !== undefined) {
            selector.style.setProperty(k2, value);
        }
    }
};

/**
 * Get the currently assigned MBS style options.
 * @returns A record with the currently assigned style options
 */
export const getStyle: typeof mbs.css.getStyle = function getStyle() {
    const selector = document.querySelector(":root") as null | HTMLElement;
    if (!selector) {
        logger.error(":root selector missing in document");
        return { ...DEFAULT_STYLE };
    }

    return fromEntries(entries(FIELD_MAPPING).map(([k1, k2]) => {
        return [k1, selector.style.getPropertyValue(k2) || DEFAULT_STYLE[k1]];
    }));
};
