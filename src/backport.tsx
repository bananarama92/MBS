/** Backports of R91 bug fixes */

import { sortBy } from "lodash-es";

// @ts-ignore
import { MBS_MOD_API } from "./common";
import { waitFor, logger } from "./common";
import { bcLoaded } from "./common_bc";
import { BC_MIN_VERSION } from "./sanity_checks";

import styles from "./backport.scss";

/** The next BC version */
const BC_NEXT = BC_MIN_VERSION + 1;

/** A set with the pull request IDs of all applied bug fix backports */
export const backportIDs: Set<number> = new Set();

waitFor(bcLoaded).then(() => {
    switch (GameVersion) {
        case "R110": {
            if (MBS_MOD_API.getOriginalHash("PropertyAutoPunishParseMessage") === "B0B55044") {
                backportIDs.add(5264);
                MBS_MOD_API.hookFunction("PropertyAutoPunishParseMessage", 0, ([sensitivity, msg, ...args], next) => {
                    const oocRanges = SpeechGetOOCRanges(msg).reverse();
                    const arrayMsg = Array.from(msg);
                    oocRanges.forEach(({ start, length }) => arrayMsg.splice(start, length));
                    msg = arrayMsg.join("");
                    return (next([sensitivity, msg, ...args]));
                });
            }

            if (!document.head.querySelector("meta[name='mobile-web-app-capable']")) {
                backportIDs.add(5272);
                const titleElem = document.head.querySelector("title");
                if (titleElem) {
                    document.head.insertBefore(<meta name="mobile-web-app-capable" content="yes" />, titleElem);
                } else {
                    document.head.append(<meta name="mobile-web-app-capable" content="yes" />);
                }
            }

            if (MBS_MOD_API.getOriginalHash("Shop2.Elements.InputSearch.Load") === "0F083C95") {
                backportIDs.add(5274);

                MBS_MOD_API.hookFunction("Shop2.Elements.InputSearch.Load", 0, (args, next) => {
                    const ret = next(args);
                    const elem = document.getElementById("Shop2InputSearch");
                    if (elem) {
                        elem.style.display = "";
                    }
                    return ret;
                });

                Layering._ExitCallbacks.pop();
                Layering.RegisterExitCallbacks({
                    screen: "Shop2",
                    callback: () => {
                        Shop2Vars.Mode = "Preview";
                        Shop2Load();
                    },
                });
            }

            if (MBS_MOD_API.getOriginalHash("DrawRoomBackground") === "5B829E54") {
                backportIDs.add(5290);
                MBS_MOD_API.patchFunction("DrawRoomBackground", {
                    "blur ??= 1.0;":
                        "blur ??= 0.0;",
                });
            }
            break;
        }
    }

    if (typeof CommandsChangelog === "undefined") {
        backportIDs.add(5254);
        document.body.appendChild(<style id="mbs-backport">{styles.toString()}</style>);

        const changelogNamespace = {
            _FilterContent: function _FilterContent(root: Element, startID: string, stopID: null | string = null) {
                let segmentState = "start" as "start" | "mid" | "end";
                let startTagName: null | string = null;

                const handleStartState = (e: Element): null | Element => {
                    const next = e.nextElementSibling;
                    if (e.id === startID) {
                        startTagName = e.tagName;
                        segmentState = "mid";
                    } else if (stopID && e.id === stopID) {
                        startTagName = e.tagName;
                        segmentState = "mid";
                        stopID = startID;
                    } else {
                        e.remove();
                    }
                    return next;
                };

                const handleMidState = (e: Element): null | Element => {
                    const next = e.nextElementSibling;
                    if (stopID) {
                        if (stopID === e.id) {
                            segmentState = "end";
                            e.remove();
                        }
                    } else if (e.tagName === startTagName) {
                        segmentState = "end";
                        e.remove();
                    }
                    return next;
                };

                let elem: null | Element = root.children[0];
                while (elem) {
                    switch (segmentState) {
                        case "start":
                            // Find the start of the version interval
                            elem = handleStartState(elem);
                            break;
                        case "mid":
                            // Find the end of the version interval
                            elem = handleMidState(elem);
                            break;
                        case "end": {
                            // We're past the version interval at this point; remove all remaining elements
                            const next: Element | null = elem.nextElementSibling;
                            elem.remove();
                            elem = next;
                            break;
                        }
                    }
                }
            },

            _GetH1Button: function _GetH1Button(id: string, header: HTMLHeadingElement, level: number): HTMLButtonElement {
                return ElementButton.Create(
                    `${id}-delete-${header.id}`,
                    function () { this.closest(".chat-room-changelog")?.remove(); },
                    {
                        tooltip: "Clear changelog",
                        tooltipPosition: "bottom",
                        noStyling: true,
                        label: "🗑",
                        labelPosition: "center",
                    },
                    { button: {
                        classList: ["chat-room-changelog-button", "chat-room-changelog-button-delete"],
                        attributes: { "aria-label": `Clear ${header.textContent} changelog` },
                        dataAttributes: { level },
                    } },
                );
            },

            _GetHNButton: function _GetHNButton(id: string, header: HTMLHeadingElement, level: number): HTMLButtonElement {
                return ElementButton.Create(
                    `${id}-collapse-${header.id}`,
                    function (event) {
                        if (event.shiftKey) {
                            const isExpanded = this.getAttribute("aria-expanded") === "true";
                            const parent = this.closest(".chat-room-changelog-section");
                            const children = parent?.querySelectorAll(`.chat-room-changelog-button-collapse[aria-expanded="${!isExpanded}"`);
                            children?.forEach(e => e.dispatchEvent(new Event("click")));
                            if (children?.length && !isExpanded) {
                                // Revert the collapsed state of the `h{n}` if not all `h{<n}` blocks are collapsed
                                this.dispatchEvent(new Event("click"));
                                return;
                            }
                        }

                        const label = this.querySelector(".button-label");
                        if (label) {
                            label.textContent = this.getAttribute("aria-expanded") === "true" ? "▼" : "▶";
                        }
                    },
                    {
                        tooltip: ["Collapse changelog", { tag: "br" }, { tag: "kbd", children: ["shift"] }, " to collapse all"],
                        tooltipPosition: "bottom",
                        noStyling: true,
                        role: "checkbox",
                        label: "▼",
                        labelPosition: "center",
                    },
                    { button: {
                        classList: ["chat-room-changelog-button", "chat-room-changelog-button-collapse"],
                        attributes: { "aria-label": `Collapse ${header.textContent} section`, "aria-checked": "true", "aria-expanded": "true" },
                        dataAttributes: { level },
                    } },
                );
            },

            _ParseHeader: function _ParseHeader(root: Element, id: string, href: string, headerLevel: number, headerPrefix: null | string = null) {
                const headerTag = `h${headerLevel - 1}` as "h1" | "h2" | "h3" | "h4" | "h5";
                const selector = `h${headerLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
                root.querySelectorAll(selector).forEach(header => {
                    // Collect all sibblings
                    const sibblings = [];
                    let sibbling = header.nextElementSibling;
                    while (sibbling && sibbling.tagName !== `H${headerLevel}`) {
                        sibblings.push(sibbling);
                        sibbling = sibbling.nextElementSibling;
                    }

                    const extraChildren: (string | Node | HTMLOptions<keyof HTMLElementTagNameMap>)[] = [];
                    if (headerTag === "h1") {
                        extraChildren.push(
                            { tag: "span", children: ["•"], attributes: { "aria-hidden": "true" }},
                            this._GetH1Button(id, header, headerLevel - 1),
                        );
                    }

                    const headerID = `${id}-h${headerLevel - 1}-${header.id}`;
                    header.parentElement?.replaceChild(
                        ElementCreate({
                            tag: "section",
                            classList: ["chat-room-changelog-section"],
                            attributes: { "aria-labelledby": headerID },
                            children: [
                                {
                                    tag: "div",
                                    classList: ["chat-room-changelog-header-div"],
                                    children: [
                                        this._GetHNButton(id, header, headerLevel - 1),
                                        { tag: "span", children: ["•"], attributes: { "aria-hidden": "true" }},
                                        {
                                            tag: headerTag,
                                            attributes: { id: headerID },
                                            children: [{
                                                tag: "a",
                                                attributes: { target: "_blank", href: `${href}#${header.id}` },
                                                children: [[headerPrefix, header.textContent].filter(Boolean).join(" ")],
                                            }],
                                        },
                                        ...extraChildren,
                                    ],
                                },
                                ...sibblings,
                            ],
                        }),
                        header,
                    );
                });
            },

            _ParseImg: function _ParseImg(root: Element) {
                root.querySelectorAll("img").forEach(img => {
                    const a = ElementCreate({
                        tag: "a",
                        attributes: { href: img.src, target: "_blank", class: "chat-room-changelog-image" },
                    });
                    img.parentElement?.replaceChild(a, img);
                    a.append(img);
                });
            },

            _ParseA: function _ParseA(root: Element) {
                root.querySelectorAll("a").forEach(a => a.target = "_blank");
            },

            _SetTranslationText: async function _SetTranslationText(changelog: Element) {
                const cache = await TextCache.buildAsync("Screens/Online/ChatRoom/Text_ChatRoom.csv");

                const clear = cache.get("CommandChangeLogClear");
                changelog.querySelectorAll(".chat-room-changelog-button-delete > .button-tooltip")?.forEach(e => e.textContent = clear);

                const collapse = cache.get("CommandChangeLogCollapse");
                const collapseShift = cache.get("CommandChangeLogCollapseShift").split("{shift}")[1] ?? "";
                changelog.querySelectorAll(".chat-room-changelog-button-collapse > .button-tooltip")?.forEach(e => {
                    e.append(collapse);
                    e.append(ElementCreate({ tag: "br" }));
                    e.append(ElementCreate({ tag: "kbd", children: ["shift"] }));
                    e.append(collapseShift);
                });

                changelog.removeAttribute("aria-busy");
            },

            Parse: function Parse(innerHTML: string, options: null | { id?: null | string, href?: null | string, startID?: null | string, stopID?: null | string } = null): HTMLDivElement {
                options ??= {};
                const id = options.id ?? "chat-room-changelog";
                const href = options.href ?? "./changelog.html";
                const startID = options.startID ?? `r${GameVersionFormat.exec(GameVersion)?.[1]}`;
                const stopID = options.stopID;

                let changelog = document.getElementById(id) as null | HTMLDivElement;
                if (changelog) {
                    console.error(`Element "${id}" already exists`);
                    return changelog;
                }

                // Ensure that any and all images are loaded lazily _before_ setting the innerHTML, lest they are all loaded right away
                changelog = ElementCreate({
                    tag: "div",
                    classList: ["chat-room-changelog"],
                    attributes: { id, "aria-busy": "true" },
                    dataAttributes: { start: startID, stop: stopID as string | undefined },
                    innerHTML: innerHTML.replace("<img", "<img loading='lazy'"),
                });

                // The original <h1> will eventually be removed, but keep hold of its text content for later
                const h1Content = changelog.querySelector("h1")?.textContent;
                if (h1Content) {
                    changelog.setAttribute("aria-label", h1Content);
                }

                // Perform any filtering and clean up of the changelog's elements
                this._FilterContent(changelog, startID, stopID);
                this._ParseA(changelog);
                this._ParseImg(changelog);
                [2, 3, 4, 5, 6].forEach(n => this._ParseHeader(changelog, id, href, n, n === 2 ? h1Content : null));
                return changelog;
            },

            Publish(innerHTML: string, options: null | { id?: null | string, href?: null | string, startID?: null | string, stopID?: null | string } = null): HTMLDivElement {
                const changelog = this.Parse(innerHTML, options);
                changelog.setAttribute("data-sender", Player.MemberNumber);
                changelog.setAttribute("data-time", ChatRoomCurrentTime());
                changelog.classList.add("ChatMessage");

                // Ensure that all requested changelogs except the most recent one are collapsed
                const buttons = changelog.querySelectorAll(".chat-room-changelog-button-collapse[data-level='1']");
                buttons.forEach((button, i) => {
                    if (i !== 0) {
                        button.dispatchEvent(new Event("click"));
                    }
                });
                ChatRoomAppendChat(changelog);
                return changelog;
            },
        };
        // @ts-ignore
        globalThis.CommandsChangelog = changelogNamespace;

        function loadHook() {
            if (CommonVersionUpdated) {
                CommonGet("./changelog.html", (xhr) => {
                    if (xhr.status === 200) {
                        const changelog = changelogNamespace.Publish(xhr.responseText);
                        changelog.querySelectorAll(".chat-room-changelog-button-collapse[data-level='2']").forEach(e => e.dispatchEvent(new Event("click")));
                        CommonVersionUpdated = false;
                    }
                });
            }
        }

        MBS_MOD_API.hookFunction("ChatRoomLoad", 0, (args, next) => {
            const ret = next(args);
            loadHook();
            return ret;
        });

        if (CurrentScreen === "ChatRoom") {
            loadHook();
        }

        CommandCombine({
            Tag: "changelog",
            Description: "[start][stop]: Show the Bondage Club changelog for the specified version(s); defaults to the latest version",
            Action: (_args, _msg, [start, stop]) => {
                const startArray = GameVersionFormat.exec(start?.toUpperCase());
                const stopArray = GameVersionFormat.exec(stop?.toUpperCase());
                const defaultVersion = GameVersionFormat.exec(GameVersion)?.[1];
                if (defaultVersion == null) {
                    console.error(`Invalid BC GameVersion: "${GameVersion}"`);
                    return;
                } else if ((!startArray && start) || (!stopArray && stop)) {
                    const Content = start ? `Invalid [start] version: "${start}"` : `Invalid [stop] version: "${stop}"`;
                    ChatRoomMessageDisplay({ Type: "LocalMessage", Content, Timeout: 5000 }, "", Player, {});
                    return;
                }

                const startID = `r${startArray?.[1] ?? defaultVersion}`;
                let stopID = stopArray?.[1] != null ? `r${stopArray[1]}` : null;
                if (stopID === startID) {
                    stopID = null;
                }

                const changelog = document.getElementById("chat-room-changelog");
                if (changelog) {
                    // Move a previously opened changelog to the end of the chat again
                    if (changelog.getAttribute("data-start") === startID && changelog.getAttribute("data-stop") === stopID) {
                        changelog.remove();
                        ChatRoomAppendChat(changelog);
                        return;
                    } else {
                        changelog.remove();
                    }
                }

                CommonGet("./changelog.html", (xhr) => {
                    if (xhr.status === 200) {
                        changelogNamespace.Publish(xhr.responseText, { id: "chat-room-changelog", startID, stopID });
                    }
                });
            },
        });
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} backports`);
    }
});
