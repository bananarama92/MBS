/** Backports of BC bug fixes */

import { sortBy } from "lodash-es";

// @ts-ignore: ignore "variable is declared but never read" warnings; always keep the symbol in accessible
import { MBS_MOD_API } from "./common";
import { logger } from "./common";
import { waitForBC } from "./common_bc";
import { BC_MIN_VERSION } from "./sanity_checks";

import styles from "./backport.scss";
import craftingJSONStyles from "./backport-crafting-json.scss";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

/**
 * Partition the string into separate parts using the given replacer keys, replacing them with replacer values
 * @template T
 * @param {string} string
 * @param {Record<string, T>} replacers
 * @returns {(string | T)[]}
 */
function stringPartitionReplace<T>(string: string, replacers: Record<string, T>): (string | T)[] {
    const pattern = new RegExp(`(${Object.keys(replacers).map(key => regEscape(key)).join("|")})`, "g");
    const matches = Array.from(string.matchAll(pattern));
    if (matches.length === 0) {
        return [string];
    }
    matches.sort((a, b) => a.index - b.index);

    const ret: (string | T)[] = [];
    let i = 0;
    for (const match of matches) {
        if (match.index < i) {
            continue;
        }
        const prefix = string.slice(i, match.index);
        if (prefix) {
            ret.push(prefix);
        }
        ret.push(replacers[match[0]]);
        i = match.index + match[0].length;
    }

    const suffix = string.slice(i);
    if (suffix) {
        ret.push(suffix);
    }
    return ret;
}

/**
 * Escapes any potential regex syntax characters in a string, and returns a new string that can be safely used as a literal pattern for the {@link RegExp} constructor.
 * @license MIT - Copyright (c) 2014-2025 Denis Pushkarev, core-js 3.40.0 - 2025.01.08
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
 * @see https://github.com/zloirock/core-js/blob/v3.40.0/packages/core-js/modules/esnext.regexp.escape.js
 * @param S The string to escape.
 * @returns A new string that can be safely used as a literal pattern for the {@link RegExp} constructor.
 */
const regEscape = (() => {
    // As of the time of writing a limited number of browsers have native `RegExp.escape` support
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape
    if ("escape" in RegExp && typeof RegExp.escape === "function") {
        return RegExp.escape;
    }

    const WHITESPACES = (
        "\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002" +
        "\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF"
    );

    const FIRST_DIGIT_OR_ASCII = /^[0-9a-z]/i;
    const SYNTAX_SOLIDUS = /^[$()*+./?[\\\]^{|}]/;
    const OTHER_PUNCTUATORS_AND_WHITESPACES = RegExp("^[!\"#%&',\\-:;<=>@`~" + WHITESPACES + "]");
    const ControlEscape = {
        "\u0009": "t",
        "\u000A": "n",
        "\u000B": "v",
        "\u000C": "f",
        "\u000D": "r",
    };

    /** @type {(chr: string) => string} */
    function escapeChar(chr: string) {
        const hex = chr.charCodeAt(0).toString(16);
        return hex.length < 3 ? "\\x" + hex.padStart(2, "0") : "\\u" + hex.padStart(4, "0");
    }

    // `RegExp.escape` method
    // https://github.com/tc39/proposal-regex-escaping
    /** @type {(S: string) => string} */
    return function escape(S: string): string {
        if (typeof S !== "string") {
            throw new TypeError("Argument is not a string");
        }

        const length = S.length;
        const result = Array(length);

        for (let i = 0; i < length; i++) {
            const chr = S.charAt(i);
            if (i === 0 && FIRST_DIGIT_OR_ASCII.exec(chr)) {
                result[i] = escapeChar(chr);
            } else if (chr in ControlEscape) {
                result[i] = "\\" + ControlEscape[chr as keyof typeof ControlEscape];
            } else if (SYNTAX_SOLIDUS.exec(chr)) {
                result[i] = "\\" + chr;
            } else if (OTHER_PUNCTUATORS_AND_WHITESPACES.exec(chr)) {
                result[i] = escapeChar(chr);
            } else {
                const charCode = chr.charCodeAt(0);
                if ((charCode & 0xF800) !== 0xD800) { // single UTF-16 code unit
                    result[i] = chr;
                } else if (charCode >= 0xDC00 || i + 1 >= length || (S.charCodeAt(i + 1) & 0xFC00) !== 0xDC00) { // unpaired surrogate
                    result[i] = escapeChar(chr);
                } else { // surrogate pair
                    result[i] = chr;
                    result[++i] = S.charAt(i);
                }
            }
        }

        return result.join("");
    };
})();

declare namespace craftingJSON {
    export interface DataEncoded {
        /** The version of the file format */
        version: 1;
        /** The date & time on which the crafts were exported (see {@link Date.toLocaleString}) */
        date: string;
        /** A list of base64-encoded {@link CraftingItem} object strings or null if the craft is empty */
        crafts: (null | string)[];
    }

    export interface DataDecoded extends Pick<DataEncoded, "version"> {
        /** The decoded crafting item list */
        crafts: (null | CraftingItem)[];
    }

    interface ParsingOutputBase {
        /** The status code */
        status: CraftingStatusType;
        /** All crafted item indices within the `data.crafts` list that encountered a critical error during their validation */
        errors?: Set<number>;
        /** The decoded crafted item JSON data */
        data?: craftingJSON.DataDecoded;
    }

    interface ParsingOutputErr extends ParsingOutputBase {
        status: 0;
        errors?: never;
        data?: never;
    }

    interface ParsingOutputOk extends Required<ParsingOutputBase> {
        status: 1 | 2;
    }

    export type ParsingOutput = ParsingOutputErr | ParsingOutputOk;
}

function createCraftTooltipContent(craft: CraftingItem): HTMLElement[] {
    const label = ElementCreate({
        tag: "span",
        children: [InterfaceTextGet("DialogMenuCrafting") + ":"],
    });
    const list = ElementCreate({
        tag: "ul",
        classList: ["button-tooltip-craft"],
        children: [
            craft.Property ? {
                tag: "li",
                children: [
                    InterfaceTextGet("CraftingProperty").replace("CraftProperty", ""),
                    {
                        tag: "q",
                        children: [{ tag: "dfn", children: [craft.Property] }, " - "],
                    },
                ],
            } : undefined,
            (craft.MemberName && craft.MemberNumber) ? {
                tag: "li",
                children: [
                    InterfaceTextGet("CraftingMember").replace("MemberName (MemberNumber)", ""),
                    { tag: "q", children: [`${craft.MemberName} (${craft.MemberNumber})`] },
                ],
            } : undefined,
            {
                tag: "li",
                children: [
                    InterfaceTextGet("CraftingPrivate").replace("CraftPrivate", ""),
                    { tag: "q", children: [CommonCapitalize(craft.Private.toString())] },
                ],
            },
            craft.Description ? {
                tag: "li",
                children: [
                    InterfaceTextGet("CraftingDescription").replace("CraftDescription", ""),
                    { tag: "q", children: CraftingDescription.DecodeToHTML(craft.Description) },
                ],
            } : undefined,
        ],
    });

    TextPrefetchFile("Screens/Room/Crafting/Text_Crafting.csv").loadedPromise.then((textCache) => {
        const dfn = list.querySelector("dfn");
        if (dfn) {
            dfn.parentElement?.append(textCache.get(`Description${dfn.textContent}`));
        }
    });
    return [label, list];
}

declare namespace ElementCheckbox {

	/** Various options that can be passed along to {@link ElementCheckbox.Create} */
	interface Options {
		/** Whether the checkbox is checked by default or not */
		checked?: boolean;
		/** Whether the checkbox should be disabled or not */
		disabled?: boolean;
		/**
		 * The {@link HTMLInputElement.value}/{@link HTMLInputElement.valueAsNumber} associated with the checkbox when checked.
		 *
		 * Defaults to `"on"` if not specified.
		 */
		value?: string | number;
		/** Whether the checkbox should serve as a checkbox or radio button */
		type?: "checkbox" | "radio";
		/** If a `radio` {@link Options.type} is specified, this mandates that a radio _must_ be selected within its {@link Options.name}-defined group */
		required?: boolean;
		/**
		 * The name of the input.
		 *
		 * Particularly important when a `radio` {@link Options.type} is specified, as all radios with the same name define a group of options.
		 */
		name?: string;
	}
}

/**
 * Namespace for creating DOM checkboxes.
 */
const ElementCheckbox = {
    _pointerdown: function(this: HTMLInputElement) {
        document.addEventListener("pointerup", ElementCheckbox._pointerup);
        document.addEventListener("pointercancel", ElementCheckbox._pointerup);
    },

    _pointerup: function(this: Document) {
        // Ensure that focus is lost after clicking
        /** @type {null | HTMLInputElement} */
        const input: undefined | null | HTMLInputElement = document.activeElement?.closest("input.checkbox");
        input?.blur();

        document.removeEventListener("pointerup", ElementCheckbox._pointerup);
        document.removeEventListener("pointercancel", ElementCheckbox._pointerup);
    },

    /**
     * Construct an return a DOM checkbox element (`<input type="checkbox">`)
     * @param {null | string} id - The ID of the element, or `null` if one must be assigned automatically
     * @param {null | ((this: HTMLInputElement, ev: Event) => any)} onChange - The change event listener to-be fired upon checkbox clicks
     * @param {null | ElementCheckbox.Options} options - High level options for the to-be created checkbox
     * @param {null | Partial<Record<"checkbox", Omit<HTMLOptions<any>, "tag">>>} htmlOptions - Additional {@link ElementCreate} options to-be applied to the respective (child) element
     */
    Create: function Create(
        id: null | string = null,
        onChange: null | ((this: HTMLInputElement, ev: Event) => any) = null,
        options: null | ElementCheckbox.Options = null,
        htmlOptions: null | Partial<Record<"checkbox", Omit<HTMLOptions<any>, "tag">>> = null,
    ) {
        id ??= ElementGenerateID();
        const checkbox = document.getElementById(id);
        if (checkbox) {
            console.error(`Element "${id}" already exists`);
            return checkbox;
        }

        options ??= {};
        const checkboxOptions = htmlOptions?.checkbox ?? {};
        switch (checkboxOptions.attributes?.type ?? options.type ?? "checkbox") {
            case "radio":
                options.required ??= true;
                break;
        }

        return ElementCreate({
            ...checkboxOptions,
            tag: "input",
            attributes: {
                id,
                type: options.type ?? "checkbox",
                disabled: options.disabled,
                checked: options.checked,
                value: options.value,
                name: options.name,
                required: options.required,
                ...(checkboxOptions.attributes ?? {}),
            },
            classList: ["checkbox", ...(checkboxOptions.classList ?? [])],
            eventListeners: {
                change: onChange ?? undefined,
                pointerdown: ElementCheckbox._pointerdown,
                ...(checkboxOptions.eventListeners ?? {}),
            },
        });
    },
};

/**
 * Namespace for encoding & decoding crafting inventories to and from JSON
 */
const craftingJSON = {
    /**
     * A cache of imported crafting items
     * @private
     */
    _craftListCache: null as null | { name: string, status: CraftingStatusType, craft: null | CraftingItem }[],

    /** Get the event listeners for drag and dropping */
    getDragListeners() {
        // Need to do some manual book keeping here, as the `dragenter` + `dragleave` duo also fires when dragging between child elements
        let parent: null | HTMLElement = null;
        let draggedItem: null | HTMLElement = null;

        function dragstart(this: HTMLElement, ev: DragEvent) {
            parent = null;
            draggedItem = this.closest("fieldset");
            if (ev.dataTransfer) {
                ev.dataTransfer.setData("application/my-app", `${this.id}`);
                ev.dataTransfer.effectAllowed = "move";
            }
        }

        function dragenter(this: HTMLElement) {
            if (this === parent) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            parent = this;

            const fieldsets: Element[] = Array.from(this.parentElement?.children ?? []);
            const indexTarget = fieldsets.indexOf(this);
            if (indexTarget === -1) {
                return;
            }

            const indexSource = (fieldsets as unknown[]).indexOf(draggedItem);
            if (indexSource === -1) {
                return;
            }

            if (indexSource > indexTarget) {
                this.classList.toggle("border-top", true);
                this.classList.toggle("border-bottom", false);
            } else if (indexSource < indexTarget) {
                this.classList.toggle("border-top", false);
                this.classList.toggle("border-bottom", true);
            } else {
                this.classList.toggle("border-top", true);
                this.classList.toggle("border-bottom", true);
            }
        }

        function dragleave(this: HTMLElement) {
            if (this !== parent) {
                this.classList.toggle("border-top", false);
                this.classList.toggle("border-bottom", false);
            }
        }

        return { dragenter, dragleave, dragstart };
    },

    /**
     * @private
     * @param {Element} fieldset
     * @param {Element} radioContainer
     */
    _queueAdvance(fieldset: Element, radioContainer: Element | null, checkLog: Map<{ inputNew: HTMLInputElement, inputOld: HTMLInputElement }, boolean>) {
        if (!radioContainer) {
            return;
        }
        fieldset.prepend(radioContainer);

        const inputNew: null | HTMLInputElement = radioContainer.querySelector("input[type='radio'][value='new']");
        const inputOld: null | HTMLInputElement = fieldset.querySelector("input[type='radio'][value='old']");
        if (inputNew && inputOld) {
            checkLog.set({ inputOld, inputNew }, inputNew.checked);
            inputNew.name = inputOld.name;
        }
    },

    eventListeners: {
        focusTooltip: function(this: HTMLElement) {
            const root = this.getRootNode() as ShadowRoot;
            const tooltips = this.getAttribute("aria-owns")?.split(" ").map(id => root.getElementById(id)).filter((el): el is HTMLElement => el?.getAttribute("role") === "tooltip") ?? [];
            tooltips.forEach(e => e.toggleAttribute("data-focus", true));
        },

        blurTooltip: function(this: HTMLElement) {
            const root = this.getRootNode() as ShadowRoot;
            const tooltips = this.getAttribute("aria-owns")?.split(" ").map(id => root.getElementById(id)).filter((el): el is HTMLElement => el?.getAttribute("role") === "tooltip") ?? [];
            tooltips.forEach(e => e.toggleAttribute("data-focus", false));
        },

        hoverinTooltip: function(this: HTMLElement) {
            const root = this.getRootNode() as ShadowRoot;
            const tooltips = this.getAttribute("aria-owns")?.split(" ").map(id => root.getElementById(id)).filter((el): el is HTMLElement => el?.getAttribute("role") === "tooltip") ?? [];
            tooltips.forEach(e => e.toggleAttribute("data-hover", true));
        },

        hoveroutTooltip: function(this: HTMLElement) {
            const root = this.getRootNode() as ShadowRoot;
            const tooltips = this.getAttribute("aria-owns")?.split(" ").map(id => root.getElementById(id)).filter((el): el is HTMLElement => el?.getAttribute("role") === "tooltip") ?? [];
            tooltips.forEach(e => e.toggleAttribute("data-hover", false));
        },

        dragover: function(this: HTMLElement, ev: DragEvent) {
            ev.preventDefault();
            if (ev.dataTransfer) {
                ev.dataTransfer.dropEffect = "move";
            }
        },

        drop: function(this: HTMLElement, ev: DragEvent) {
            ev.preventDefault();
            const fieldsets = Array.from(this.children);

            // Identify the target and source elements
            const elemTarget = ev.target instanceof Element ? ev.target.closest("[draggable='true']") : null;
            const indexTarget = (fieldsets as unknown[]).indexOf(elemTarget?.closest("fieldset"));
            if (!elemTarget || Number.isNaN(indexTarget) || !craftingJSON._craftListCache || !ev.dataTransfer) {
                return;
            }

            const data = ev.dataTransfer.getData("application/my-app");
            const root = this.getRootNode() as ShadowRoot;
            const elemSource = root.getElementById(data);
            const indexSource = (fieldsets as unknown[]).indexOf(elemSource?.closest("fieldset"));
            if (!elemSource || Number.isNaN(indexSource) || indexSource === indexTarget) {
                return;
            }

            this.setAttribute("aria-busy", "true");
            elemSource.remove();
            const checkedStates: Map<{ inputNew: HTMLInputElement, inputOld: HTMLInputElement }, boolean> = new Map();
            let index = indexSource;
            if (indexSource < indexTarget) {
                while (index < indexTarget) {
                    craftingJSON._queueAdvance(fieldsets[index], this.children[++index].querySelector("[draggable='true']"), checkedStates);
                }
            } else {
                while (index > indexTarget) {
                    craftingJSON._queueAdvance(fieldsets[index], this.children[--index].querySelector("[draggable='true']"), checkedStates);
                }
            }
            craftingJSON._queueAdvance(fieldsets[index], elemSource, checkedStates);

            // Restore the previous checked states
            for (const [{ inputNew, inputOld }, checked] of checkedStates.entries()) {
                inputNew.checked = checked;
                inputOld.checked = !checked;
            }

            // Also re-sort the crafting item array
            const craft = craftingJSON._craftListCache[indexSource];
            craftingJSON._craftListCache.splice(indexSource, 1);
            craftingJSON._craftListCache.splice(indexTarget, 0, craft);

            // Re-enumerate the legend labels
            for (const [i, el] of this.querySelectorAll(".radiogroup-label").entries()) {
                el.textContent = (i + 1).toString();
            }
            this.removeAttribute("aria-busy");
        },

        dragend: function(this: HTMLElement) {
            this.querySelectorAll(".border-top, .border-bottom").forEach(e => {
                e.classList.toggle("border-top", false);
                e.classList.toggle("border-bottom", false);
            });
        },

        clickCancel: function() {
            CraftingUnload();
        },

        clickAccept: function(this: HTMLElement, ev: Event) {
            const craftList = craftingJSON._craftListCache;
            if (craftList == null) {
                ev.stopImmediatePropagation();
                return;
            }

            /** @type {NodeListOf<HTMLInputElement>} */
            const inputs: undefined | NodeListOf<HTMLInputElement> = this.closest("dialog")?.querySelectorAll("input[type='radio']:checked");
            inputs?.forEach(el => {
                const index = Number.parseInt(el.name, 10);
                if (!Number.isNaN(index) && el.value === "new" && el.validity.valid) {
                    Player.Crafting[index] = craftList[index].craft;
                }
            });
            CraftingSaveServer();
            CraftingUnload();
        },

        changeFile: async function(this: HTMLInputElement) {
            const dialog = this.closest("dialog");
            const fieldset = this.closest("fieldset");
            const tooltipContainer = dialog?.querySelector(".tooltip-container");
            const file = this.files?.[0];

            // Put an arbitrary cap of 1 GiB on the file size as a safeguard against opening (potentially malicious) files that are waaaay too large
            if (!tooltipContainer || !fieldset || !dialog || !file || file.size >= (1024**3)) {
                return;
            }

            dialog.setAttribute("aria-busy", "true");

            const searchInput: null | HTMLInputElement = fieldset.querySelector("input[type='search']");
            if (searchInput) {
                searchInput.value = searchInput.defaultValue;
                searchInput.list?.replaceChildren();
            }

            const crafts = craftingJSON.decode(await file.text());
            if (crafts.status === CraftingStatusType.CRITICAL_ERROR) {
                const errMsg = "failed to parse file";
                this.setCustomValidity(errMsg);
                dialog.querySelector("[role='menuitem'][name='accept']")?.setAttribute("aria-disabled", "true");
                fieldset.querySelector("legend [role='status']")?.replaceChildren(`(${errMsg})`);
                fieldset.querySelectorAll("button, input[type='search']").forEach(e => e.toggleAttribute("disabled", true));
                fieldset.querySelector(".radio-supergroup")?.replaceChildren();
                tooltipContainer.replaceChildren();
                craftingJSON._craftListCache = null;
                dialog.removeAttribute("aria-busy");
                return;
            }

            const craftList = crafts.data.crafts.map((craft, i) => {
                const status = crafts.errors.has(i) ? CraftingStatusType.CRITICAL_ERROR : CraftingStatusType.OK;
                return {
                    name: craft?.Name ?? "Empty",
                    status,
                    craft: status === CraftingStatusType.CRITICAL_ERROR ? null : craft,
                };
            }).slice(0, 160);

            const statusMsg = crafts.status === CraftingStatusType.ERROR ? `(failed to parse ${crafts.errors.size.toString().padStart(2, " ")} craft(s))` : "";
            dialog.querySelector("[role='menuitem'][name='accept']")?.setAttribute("aria-disabled", "false");
            fieldset.querySelector("legend [role='status']")?.replaceChildren(statusMsg);
            fieldset.querySelectorAll("button, input[type='search']").forEach(e => e.toggleAttribute("disabled", false));
            fieldset.querySelector(".radio-supergroup")?.replaceChildren(...craftingJSON.createRadioGroups(craftList, tooltipContainer));
            fieldset.querySelector(".radio-supergroup")?.scrollTo({ top: 0, behavior: "instant" });
            craftingJSON._craftListCache = craftList;
            dialog.removeAttribute("aria-busy");
        },

        inputFile: function(this: HTMLInputElement) {
            this.setCustomValidity("");
        },

        clickSelectNew: function(this: HTMLElement) {
            const inputs: undefined | NodeListOf<HTMLInputElement> | HTMLInputElement[] = this.closest("fieldset")?.querySelectorAll("input[type='radio'][value='new']:enabled") ?? [];
            inputs.forEach(el => el.checked = true);
        },

        clickSelectOld: function(this: HTMLElement) {
            const inputs: undefined | NodeListOf<HTMLInputElement> | HTMLInputElement[] = this.closest("fieldset")?.querySelectorAll("input[type='radio'][value='old']:enabled") ?? [];
            inputs.forEach(el => el.checked = true);
        },

        clickError: function(this: HTMLElement) {
            this.focus();
        },

        inputSearch: function(this: HTMLInputElement) {
            const superGroup = this.closest("fieldset")?.querySelector(".radio-supergroup");
            if (!superGroup?.children.length) {
                return;
            }

            const query = this.value.trim();
            if (!query) {
                superGroup.querySelectorAll(".label-highlight").forEach(e => e.parentElement?.replaceChildren(e.parentElement.textContent ?? ""));
                return;
            }

            let match = null as null | Element;
            const regex = new RegExp(query, "gi");
            superGroup.querySelectorAll(".craft-label").forEach(e => {
                e.innerHTML = e.textContent?.replaceAll(regex, string => {
                    match ??= e;
                    return `<em class="label-highlight">${ChatRoomHTMLEntities(string)}</em>`;
                }) ?? "";
            });
            if (match) {
                match.closest("[role='radiogroup']")?.scrollIntoView({ behavior: "instant" });
            }
        },

        focusSearch: function(this: HTMLInputElement) {
            const superGroup = this.closest("fieldset")?.querySelector(".radio-supergroup");
            if (!superGroup?.children.length || !this.list || this.list.children.length !== 0) {
                return;
            }

            const names = new Set(Array.from(superGroup.querySelectorAll(".craft-label")).map(el => el.textContent?.trim() ?? ""));
            this.list.append(...Array.from(names).sort().map(value => ElementCreate({ tag: "option", attributes: { value } })));
        },

        keydownDocument: function(this: Document, ev: KeyboardEvent) {
            const root = document.getElementById("crafting-import-dialog")?.shadowRoot;
            const searchInput = root?.querySelector("input[type='search']");
            if (
                !(searchInput instanceof HTMLInputElement)
                || searchInput.disabled
                || searchInput.readOnly
                || root?.activeElement === searchInput
            ) {
                return;
            }

            const modifiers = CommonKey.GetModifiers(ev);
            checkKey: if (ev.key.length === 1 && (!modifiers || modifiers === CommonKey.SHIFT)) {
                break checkKey;
            } else if (ev.key === "Backspace" && !modifiers) {
                break checkKey;
            } else {
                return;
            }

            ev.preventDefault();
            ev.stopPropagation();

            if (ev.key === "Backspace") {
                searchInput.value = searchInput.value.slice(0, -1);
            } else if (searchInput.value.length < searchInput.maxLength) {
                searchInput.value += ev.key;
            }
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
            searchInput.dispatchEvent(new InputEvent("input"));
        },

        pasteDocument: function(this: Document, ev: ClipboardEvent) {
            const root = document.getElementById("crafting-import-dialog")?.shadowRoot;
            const searchInput = root?.querySelector("input[type='search']");
            if (
                !(searchInput instanceof HTMLInputElement)
                || searchInput.disabled
                || searchInput.readOnly
                || root?.activeElement === searchInput
            ) {
                return;
            }

            ev.preventDefault();
            ev.stopPropagation();

            const content = ev.clipboardData?.getData("text");
            if (!content) {
                return;
            }

            searchInput.value = content.slice(0, searchInput.maxLength);
            searchInput.focus();
            searchInput.dispatchEvent(new InputEvent("input"));
        },
    } satisfies Record<string, (ev: never) => any>,

    /**
     * Encode the passed list of crafting items into a JSON-valid object
     * @param {readonly (null | CraftingItem)[]} crafts - The list of crafting items
     * @returns {craftingJSON.DataEncoded} The encoded object of JSON-valid crafts
     */
    encode: function encode(crafts: readonly (null | CraftingItem)[]): craftingJSON.DataEncoded {
        const data: (null | string)[] = [];

        let i = 0;
        const max = Math.max(80, crafts.length);
        while (i < max) {
            const craft = crafts[i++] ?? null;
            data.push(craft == null ? null : LZString.compressToBase64(JSON.stringify(craft)));
        }
        return {
            version: 1,
            date: new Date().toLocaleString(),
            crafts: data,
        };
    },

    /**
     * Decode the passed stringified object of crafting JSON data
     * @param {string} craftsJSON - The stringified and to-be decoded crafted JSON data
     * @returns {craftingJSON.ParsingOutput} - The decoded crafted JSON data
     */
    decode: function decode(craftsJSON: string): craftingJSON.ParsingOutput {
        let obj: craftingJSON.DataEncoded;
        try {
            obj = JSON.parse(craftsJSON);
        } catch (err) {
            console.error(err);
            return { status: CraftingStatusType.CRITICAL_ERROR };
        }
        if (!CommonIsObject(obj)) {
            return { status: CraftingStatusType.CRITICAL_ERROR };
        }

        switch (obj.version) {
            case 1: {
                if (!Array.isArray(obj.crafts)) {
                    return { status: CraftingStatusType.CRITICAL_ERROR };
                }

                const errors: Set<number> = new Set;
                const crafts: (null | CraftingItem)[] = [];
                for (const [i, craftString] of obj.crafts.entries()) {
                    /** @type {null | CraftingItem} */
                    let craft: null | CraftingItem = null;
                    if (craftString != null) {
                        try {
                            craft = JSON.parse(LZString.decompressFromBase64(craftString) as string);
                        } catch {
                            errors.add(i);
                        }
                    }
                    if (craft != null && CraftingValidate(craft) === CraftingStatusType.CRITICAL_ERROR) {
                        errors.add(i);
                        crafts.push(null);
                    } else {
                        crafts.push(craft);
                    }
                }
                return {
                    errors,
                    status: errors.size === 0 ? CraftingStatusType.OK : CraftingStatusType.ERROR,
                    data: { version: obj.version, crafts },
                };
            }
            default:
                return { status: CraftingStatusType.CRITICAL_ERROR };
        }
    },

    /**
     * Return a single `<label>`-embedded `<input type="radio">` element
     * @param {null | CraftingItem} craft
     * @param {string} tooltipID
     * @param {{ name: string, checked: boolean, disabled: boolean, value: string }} options
     * @returns {HTMLElement}
     */
    createRadio: function createRadio(craft: null | CraftingItem, tooltipID: string, options: { name: string, checked: boolean, disabled: boolean, value: string }): HTMLElement {
        const asset = CraftingAssets[craft?.Item as string]?.[0];
        return ElementCreate({
            tag: "label",
            attributes: {
                "aria-owns": asset != null ? tooltipID : undefined,
            },
            children: [
                ElementCheckbox.Create(
                    null, () => null, { type: "radio", ...options },
                    { checkbox: { attributes: { "aria-describedby": asset != null ? tooltipID : undefined } } },
                ),
                {
                    tag: "img",
                    attributes: {
                        alt: asset?.Description,
                        decoding: "async",
                        loading: "lazy",
                        src: asset == null || CharacterAppearanceItemIsHidden(asset.Name, asset.DynamicGroupName) ? "./Icons/HiddenItem.png" : `./Assets/Female3DCG/${asset.DynamicGroupName}/Preview/${asset.Name}.png`,
                        "aria-hidden": asset == null ? "true" : undefined,
                    },
                },
                craft?.Name ? { tag: "span", classList: ["craft-label"], children: [craft.Name] } : { tag: "i", children: ["Empty"] },
            ],
            eventListeners: {
                focusin: craftingJSON.eventListeners.focusTooltip,
                focusout: craftingJSON.eventListeners.blurTooltip,
                mouseenter: craftingJSON.eventListeners.hoverinTooltip,
                mouseleave: craftingJSON.eventListeners.hoveroutTooltip,
            },
        });
    },

    /**
     * Return a list of `<input type="radio">`-containing `<fieldset>` elements
     * @param {readonly { name: string, status: CraftingStatusType, craft: null | CraftingItem }[]} items
     * @param {Node} tooltipContainer
     */
    createRadioGroups: function createRadioGroups(items: readonly { name: string, status: CraftingStatusType, craft: null | CraftingItem }[], tooltipContainer: Node) {
        const dragListeners = craftingJSON.getDragListeners();
        const crafts = Player.Crafting.length < 160 ? Array(160).fill(null).map((_, i) => Player.Crafting[i] ?? null) : Player.Crafting;
        return crafts.map((oldCraft, i) => {
            const newCraft = items[i] ?? { name: "<empty>", craft: null, status: CraftingStatusType.OK };
            const newChecked = newCraft.craft != null && newCraft.status !== CraftingStatusType.CRITICAL_ERROR;

            /** @type {null | HTMLElement} */
            let statusElement: null | HTMLElement = null;
            if (newCraft.status === CraftingStatusType.CRITICAL_ERROR) {
                statusElement = ElementButton.Create(
                    null,
                    craftingJSON.eventListeners.clickError,
                    { label: "❗", tooltipRole: "none", tooltip: TextGet("JSONError"), noStyling: true },
                    {
                        label: { attributes: { "aria-hidden": "true" } },
                        button: { attributes: { "aria-label": TextGet("JSONToggle") } },
                    },
                );
            } else {
                statusElement = ElementCreate({ tag: "div", attributes: { "aria-hidden": "true" } });
            }

            const oldTooltipID = ElementGenerateID();
            const newTooltipID = ElementGenerateID();
            const labelID = ElementGenerateID();
            const ret: HTMLOptions<"fieldset"> = {
                tag: "fieldset",
                attributes: { role: "radiogroup", "aria-labelledby": labelID },
                eventListeners: CommonPick(dragListeners, ["dragleave", "dragenter"]),
                children: [
                    {
                        tag: "div",
                        attributes: {
                            id: ElementGenerateID(),
                            draggable: "true",
                        },
                        eventListeners: {
                            dragstart: dragListeners.dragstart,
                        },
                        children: [
                            { tag: "span", children: [(i + 1).toString()], attributes: { id: labelID }, classList: ["radiogroup-label"] },
                            craftingJSON.createRadio(newCraft.craft, newTooltipID, { checked: newChecked, disabled: !newChecked, name: i.toString(), value: "new" }),
                            statusElement,
                        ],
                    },
                    craftingJSON.createRadio(oldCraft, oldTooltipID, { checked: !newChecked, disabled: false, name: i.toString(), value: "old" }),
                ],
            };

            for (const [id, craft] of Object.entries({ [oldTooltipID]: oldCraft, [newTooltipID]: newCraft.craft })) {
                if (craft != null) {
                    tooltipContainer.appendChild(ElementCreate({
                        tag: "div",
                        attributes: { id, role: "tooltip" },
                        classList: ["button-tooltip", "button-tooltip-justify"],
                        children: [createCraftTooltipContent(craft)[1]],
                    }));
                }
            }
            return ElementCreate(ret);
        });
    },

    /**
     * Create and return the `<dialog>` and its shadowroot-containing `<div>` parent
     * @param {null | Node} parent The parent node, if any
     */
    createDialog: function createDialog(parent: null | Node = null) {
        const textInputID = ElementGenerateID();
        const searchDatalistID = ElementGenerateID();
        const supergroupID = ElementGenerateID();
        const descriptionID = ElementGenerateID();
        const dialog = ElementCreate({
            tag: "dialog",
            attributes: { closedby: "none" },
            children: [
                {
                    tag: "aside",
                    classList: ["aside"],
                    children: [
                        ElementMenu.Create(
                            null,
                            [
                                ElementButton.Create(
                                    null,
                                    craftingJSON.eventListeners.clickCancel,
                                    { image: "./Icons/Cancel.png", tooltip: TextGet("JSONCancel"), tooltipPosition: "left" },
                                    { button: { attributes: { name: "cancel" } } },
                                ),
                                ElementButton.Create(
                                    null,
                                    craftingJSON.eventListeners.clickAccept,
                                    { image: "./Icons/Accept.png", disabled: true, tooltip: TextGet("JSONUpload"), tooltipPosition: "left" },
                                    { button: { attributes: { name: "accept" } } },
                                ),
                            ],
                            { direction: "rtl" },
                        ),
                        {
                            tag: "section",
                            attributes: { id: descriptionID },
                            classList: ["description"],
                            children: [
                                {
                                    tag: "p",
                                    children: stringPartitionReplace(
                                        TextGet("JSONDescription0"),
                                        { "{all}": ElementCreate({ tag: "em", children: [TextGet("JSONDescriptionAll")] }) },
                                    ),
                                },
                                {
                                    tag: "ol",
                                    children: [
                                        {
                                            tag: "li",
                                            children: stringPartitionReplace(TextGet("JSONDescription1"), {
                                                "{json}": ElementCreate({ tag: "code", children: [".json"] }),
                                                "{download-tooltip}": ElementCreate({ tag: "q", children: [TextGet("JSONDownload")] }),
                                            }),
                                        },
                                        { tag: "li", children: [TextGet("JSONDescription2")] },
                                        { tag: "li", children: [TextGet("JSONDescription3")] },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    tag: "fieldset",
                    attributes: { name: "import" },
                    children: [
                        {
                            tag: "legend",
                            children: [{
                                tag: "label",
                                children: [
                                    "Import crafts",
                                    " ",
                                    { tag: "span", attributes: { role: "status" } },
                                ],
                                attributes: { for: textInputID },
                            }],
                        },
                        {
                            tag: "input",
                            attributes: { type: "file", accept: "application/json", id: textInputID, autofocus: true, "aria-describedby": descriptionID },
                            classList: ["button-styling", "button", "blank-button"],
                            eventListeners: {
                                input: craftingJSON.eventListeners.inputFile as any,
                                change: craftingJSON.eventListeners.changeFile as any,
                            },
                        },
                        {
                            tag: "input",
                            attributes: {
                                type: "search",
                                placeholder: "Filter crafts",
                                size: 0,
                                maxlength: 30,
                                spellcheck: "false",
                                list: searchDatalistID,
                                disabled: true,
                                "aria-controls": supergroupID,
                            },
                            eventListeners: {
                                focus: craftingJSON.eventListeners.focusSearch as any,
                                input: craftingJSON.eventListeners.inputSearch as any,
                            },
                        },
                        {
                            tag: "datalist",
                            attributes: { id: searchDatalistID },
                        },
                        {
                            tag: "output",
                            attributes: { for: textInputID },
                            children: [
                                ElementButton.Create(
                                    null,
                                    craftingJSON.eventListeners.clickSelectNew,
                                    { label: "New crafts (select all)", disabled: true },
                                    { button: { attributes: { name: "select-new" } } },
                                ),
                                ElementButton.Create(
                                    null,
                                    craftingJSON.eventListeners.clickSelectOld,
                                    { label: "Old crafts (select all)", disabled: true },
                                    { button: { attributes: { name: "select-old" } } },
                                ),
                                {
                                    tag: "div",
                                    classList: ["radio-supergroup", "scroll-box"],
                                    attributes: { id: supergroupID },
                                    eventListeners: {
                                        dragover: craftingJSON.eventListeners.dragover,
                                        dragend: craftingJSON.eventListeners.dragend,
                                        drop: craftingJSON.eventListeners.drop,
                                    },
                                },
                                {
                                    tag: "div",
                                    classList: ["tooltip-container"],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        const root = ElementCreate({
            tag: "div",
            attributes: { id: "crafting-import-dialog" },
            parent: parent ?? undefined,
        });

        const shadow = root.attachShadow({ mode: "open", delegatesFocus: true });
        shadow.append(
            ElementCreate({ tag: "link", attributes: { href: "CSS/normalize.css", rel: "stylesheet" } }),
            ElementCreate({ tag: "link", attributes: { href: "CSS/button.css", rel: "stylesheet" } }),
            ElementCreate({ tag: "link", attributes: { href: "CSS/Styles.css", rel: "stylesheet" } }),
            <style id="mbs-backport-style">{craftingJSONStyles.toString()}</style>,
            dialog,
        );
        return { root, dialog };
    },
};

waitForBC("backport", {
    async afterLoad() {
        switch (GameVersion) {
            case "R116": {
                MBS_MOD_API.hookFunction("CraftingResize", 0, (args, next) => {
                    const dialog = document.getElementById("crafting-import-dialog");
                    if (dialog) {
                        ElementSetFontSize(dialog);
                    }
                    return next(args);
                });
                MBS_MOD_API.hookFunction("CraftingUnload", 0, (args, next) => {
                    const dialog = document.getElementById("crafting-import-dialog");
                    if (dialog) {
                        dialog.remove();
                        document.removeEventListener("keydown", craftingJSON.eventListeners.keydownDocument);
                        document.removeEventListener("paste", craftingJSON.eventListeners.pasteDocument);
                        return;
                    }
                    return next(args);
                });
                MBS_MOD_API.hookFunction("CraftingExit", 0, (args, next) => {
                    const dialog = document.getElementById("crafting-import-dialog");
                    if (dialog) {
                        dialog.remove();
                        return;
                    }
                    return next(args);
                });
                MBS_MOD_API.hookFunction("CraftingRun", 0, (args, next) => {
                    const ret = next(args);
                    if (CraftingMode == "Slot") {
                        DrawButton(1265, 15, 90, 90, "", CraftingReorderMode === "None" ? "White" : "Gray", "Icons/Download.png", TextGet("JSONDownload"), CraftingReorderMode !== "None");
                        DrawButton(1370, 15, 90, 90, "", CraftingReorderMode === "None" ? "White" : "Gray", "Icons/Upload.png", TextGet("JSONUpload"), CraftingReorderMode !== "None");
                    }
                    return ret;
                });
                MBS_MOD_API.hookFunction("CraftingClick", 0, (args, next) => {
                    const ret = next(args);
                    if (CraftingMode == "Slot" && CraftingReorderMode == "None") {
                        if (MouseIn(1265, 15, 90, 90)) {
                            const href = URL.createObjectURL(new Blob(
                                [JSON.stringify(craftingJSON.encode(Player.Crafting), null, 4)],
                                { type: "application/json" },
                            ));
                            const date = new Date();
                            const download = ElementCreate({
                                tag: "a",
                                parent: document.body,
                                attributes: {
                                    href,
                                    hidden: true,
                                    download: `craft${Player.MemberNumber}-${date.getFullYear()}-${date.getMonth().toString().padStart(2, "0")}-${date.getDay().toString().padStart(2, "0")}.json`,
                                },
                            });
                            download.click();
                            download.remove();
                            URL.revokeObjectURL(href);
                        } else if (MouseIn(1370, 15, 90, 90)) {
                            const { dialog } = craftingJSON.createDialog(document.body);
                            document.addEventListener("keydown", craftingJSON.eventListeners.keydownDocument);
                            document.addEventListener("paste", craftingJSON.eventListeners.pasteDocument);
                            CraftingResize(true);
                            dialog.showModal();
                        }
                    }
                    return ret;
                });
                MBS_MOD_API.hookFunction("CraftingLoad", 0, (args, next) => {
                    const ret = next(args);
                    if (TextScreenCache != null) {
                        Object.assign(TextScreenCache.cache, {
                            JSONError: "Error while parsing craft",
                            JSONToggle: "Toggle status text",
                            JSONCancel: "Cancel",
                            JSONDescriptionAll: "all",
                            JSONDescription0: "Load a new inventory of crafting items with the following steps, overriding {all} existing items:",
                            JSONDescription1: "Import the {json} file with exported crafting data (see the {download-tooltip} button in the main crafting menu)",
                            JSONDescription2: "(Optional) select which specific new crafting items to import; defaults to all",
                            JSONDescription3: "(Optional) reorder the new crafting items via dragging and dropping them",
                            JSONUpload: "Import new crafting inventory",
                            JSONDownload: "Download all crafts",
                        });
                    }
                    return ret;
                });
                break;
            }
            default:
                MBS_MOD_API.patchFunction("CraftingJSON.eventListeners.changeFile", {
                    "}).slice(0, 80);":
                        "}).slice(0, 160);",
                });
                MBS_MOD_API.patchFunction("CraftingJSON.createRadioGroups", {
                    "Player.Crafting.length < 80 ? Array(80)":
                        "Player.Crafting.length < 160 ? Array(160)",
                });
                break;
        }

        if (!document.getElementById("mbs-backport-style")) {
            document.body.append(<style id="mbs-backport-style">{styles.toString()}</style>);
        }

        if (backportIDs.size) {
            logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
        } else {
            logger.log(`No R${BC_NEXT} backports`);
        }
    },
});
