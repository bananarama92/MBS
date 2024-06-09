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

const applyAssetPriority: typeof Layering._ApplyAssetPriority = function applyAssetPriority(priority: number, defaultPriority: string) {
    const old = Layering.OverridePriority;
    if (!Number.isInteger(old)) {
        Layering._UpdateInputColors("asset-priority");
    }

    if (!Number.isNaN(priority) && priority.toString() !== defaultPriority) {
        Layering.OverridePriority = CommonClamp(Math.round(priority), -99, 99);
    } else {
        // @ts-ignore
        Layering.OverridePriority = undefined;
    }

    if (old !== Layering.OverridePriority) {
        Layering._CharacterRefresh(Layering.Character as Character, false, false);
    }
};

/**
 * Namespace with functions for creating chat room separators.
 * @namespace
 */
namespace chatRoomSep {
    /** The most recently created chat room separator */
    // eslint-disable-next-line prefer-const
    export let ActiveElem: null | HTMLDivElement = null;

    async function _TouchStart(this: HTMLButtonElement) {
        this.classList.add("chat-room-sep-touch");
    }

    async function _TouchEnd(this: HTMLButtonElement) {
        this.classList.remove("chat-room-sep-touch");
    }

    /** Click event listener for collapsing one or more chat room separators */
    async function _ClickCollapse(this: HTMLButtonElement, event: MouseEvent | TouchEvent) {
        const mode = this.innerText === "˅" ? "Collapse" : "Uncollapse";
        const roomSep = this.parentElement?.parentElement as HTMLDivElement;
        if (event.shiftKey) {
            // (un)collapse all separators if the `shift` key is held down while clicking
            const roomSeps = Array.from(roomSep.parentElement?.getElementsByClassName("chat-room-sep") ?? []) as HTMLDivElement[];
            roomSeps.forEach(e => chatRoomSep[mode](e));
        } else {
            chatRoomSep[mode](roomSep);
        }
    }

    /** Click event listener for scrolling towards chat room seperator */
    async function _ClickScrollUp(this: HTMLButtonElement) {
        // Workaround as we can't directly use `chatArea.scrollIntoView` due to the seperators position being sticky
        const chatRoomSep = this.parentElement?.parentElement as HTMLDivElement;
        const sibbling = chatRoomSep.nextSibling as null | HTMLElement;
        if (sibbling) {
            const chatArea = chatRoomSep.parentElement as HTMLDivElement;
            chatArea.scroll({ top: sibbling.offsetTop - chatRoomSep.offsetHeight });
        }
    }

    /** Return a `innerHTML` representation of the passed button's room name */
    function _GetDisplayName(button: HTMLButtonElement): string {
        const segments = [
            button.dataset.space?.replace("Asylum", InterfaceTextGet("ChatRoomSpaceAsylum")),
            button.dataset.private ? InterfaceTextGet("PrivateRoom") : undefined,
            ChatRoomHTMLEntities(ChatSearchMuffle(button.dataset.room ?? "")),
            button.dataset.messages ? `✉<sup>${button.dataset.messages}</sup>` : undefined,
        ];
        return segments.filter(Boolean).join(" - ");
    }

    /** Create a dividing element serving as seperator for different chat rooms */
    export function Create(appendChat: boolean = true): HTMLDivElement {
        const elem = (
            <div
                class="ChatMessage ChatMessageAction chat-room-sep"
                data-time={ChatRoomCurrentTime()}
                data-sender={Player.MemberNumber ?? ""}
            >
                <div class="chat-room-sep-div">
                    <button class="blank-button chat-room-sep-collapse" onClick={_ClickCollapse} onTouchEnd={_TouchEnd} onTouchCancel={_TouchEnd} onTouchStart={_TouchStart}>˅</button>
                    <button class="blank-button chat-room-sep-header" onClick={_ClickScrollUp} onTouchEnd={_TouchEnd} onTouchCancel={_TouchEnd} onTouchStart={_TouchStart} />
                </div>
            </div>
        ) as HTMLDivElement;
        elem.style.setProperty("--label-color", Player.LabelColor as string);
        if (appendChat) {
            ChatRoomAppendChat(elem);
            chatRoomSep.ActiveElem = elem;
        }
        return elem;
    }

    /** Return a {@link HTMLElement.innerHTML} representation of the separators room name */
    export function GetDisplayName(roomSep: HTMLDivElement): string {
        const button = roomSep?.querySelector(".chat-room-sep-header") as null | HTMLButtonElement;
        return button ? _GetDisplayName(button) : "";
    }

    /** Return whether the passed room separator is collapsed or not */
    export function IsCollapsed(roomSep: HTMLDivElement): boolean {
        const button = roomSep?.querySelector(".chat-room-sep-collapse") as null | HTMLButtonElement;
        return !!button && button.innerText === "˃";
    }

    /** Uncollapse the passed room separator */
    export async function Uncollapse(roomSep: HTMLDivElement) {
        const button = roomSep?.querySelector(".chat-room-sep-collapse")  as null | HTMLButtonElement;
        if (!button || button.innerText === "˅") {
            return;
        }

        button.innerText = "˅";
        let sibbling = roomSep.nextSibling as null | HTMLElement;
        while (sibbling && !sibbling.classList.contains("chat-room-sep")) {
            sibbling.style.display = "";
            sibbling = sibbling.nextSibling as null | HTMLElement;
        }

        const headerButton = button.nextSibling as null | HTMLButtonElement;
        if (headerButton) {
            headerButton.dataset.messages = "";
            headerButton.innerHTML = chatRoomSep.GetDisplayName(roomSep);
        }
    }

    /** Collapse the passed room separator */
    export async function Collapse(roomSep: HTMLDivElement) {
        const button = roomSep?.querySelector(".chat-room-sep-collapse") as null | HTMLButtonElement;
        if (!button || button.innerText === "˃") {
            return;
        }

        button.innerText = "˃";
        let sibbling = roomSep.nextSibling as null | HTMLElement;
        while (sibbling && !sibbling.classList.contains("chat-room-sep")) {
            sibbling.style.display = "none";
            sibbling = sibbling.nextSibling as null | HTMLElement;
        }
    }

    /** Set the room-specific of the currently active chat room separator */
    export async function SetRoomData(roomSep: HTMLDivElement, data: Pick<ServerChatRoomData, "Name" | "Private" | "Space">) {
        const button = roomSep?.querySelector(".chat-room-sep-header") as null | HTMLButtonElement;
        if (!button) {
            return;
        }

        button.dataset.room = data.Name;
        button.dataset.space = data.Space;
        button.dataset.private = (data.Private || "").toString();
        button.innerHTML = _GetDisplayName(button);
    }

    /** Update all the displayed room names based on the player's degree of sensory deprivation. */
    export async function UpdateDisplayNames() {
        const roomLabels = Array.from(document.querySelectorAll("#TextAreaChatLog .chat-room-sep-header")) as HTMLButtonElement[];
        roomLabels.forEach(e => e.innerHTML = _GetDisplayName(e));
    }
}

declare const ChatRoomSep: undefined | typeof chatRoomSep;

declare const ElementCreateSearchInput: undefined | ((
    id: string,
    dataCallback: () => Iterable<string>,
    options?: null | { value?: null | string, parent?: null | Node, maxLength?: null | number },
) => HTMLInputElement);

waitFor(bcLoaded).then(() => {
    switch (GameVersion) {
        case "R104": {
            if (MBS_MOD_API.getOriginalHash("PreferenceSubscreenExtensionsClear") === "BA474ADD") {
                backportIDs.add(5052);
                MBS_MOD_API.patchFunction("PreferenceSubscreenExtensionsClear", {
                    ["PreferenceExtensionsCurrent.unload();"]:
                        "PreferenceExtensionsCurrent.unload?.();",
                });
            }

            if (MBS_MOD_API.getOriginalHash("AppearanceClick") === "4E3937AA") {
                backportIDs.add(5055);
                MBS_MOD_API.patchFunction("AppearanceClick", {
                    ["const asset = CharacterAppearanceNextItem(C, Group.Name, MouseX > 1500);"]:
                        "const asset = CharacterAppearanceNextItem(C, Group.Name, MouseX > 1410);",
                });
            }

            // `patchFunction` doesnt play nice with bound methods, so use a dirty override instead
            if (MBS_MOD_API.getOriginalHash("Layering._ApplyAssetPriority") === "B738E4DD") {
                backportIDs.add(5055);
                MBS_MOD_API.hookFunction("Layering._ApplyAssetPriority", 99, (args) => applyAssetPriority(...args));
            }

            if (MBS_MOD_API.getOriginalHash("DialogMenuButtonBuild") === "AC1C6466") {
                backportIDs.add(5055);
                MBS_MOD_API.patchFunction("DialogMenuButtonBuild", {
                    ["if (Item != null && !C.IsNpc() && Player.CanInteract()) {"]:
                        "if (Item != null && !C.IsNpc() && (InventoryItemHasEffect(Item, 'Lock') ? DialogCanUnlock(C, Item) : Player.CanInteract())) {",
                });
            }

            if (typeof ChatRoomSep === "undefined") {
                backportIDs.add(5058);
                // @ts-ignore
                globalThis._chatRoomSep = chatRoomSep;
                document.body.appendChild(<style id="mbs-backport-style">{styles.toString()}</style>);

                MBS_MOD_API.patchFunction("ChatRoomLoad", {
                    ["if (ChatRoomCharacter.length === 0 && ChatRoomHelpSeen && Player.ChatSettings?.PreserveChat) {"]:
                        "if (ChatRoomCharacter.length === 0) {",
                    ['const div = document.createElement("div");']: "",
                    ['div.setAttribute("class", "ChatEnterBorder");']: "",
                    ["ChatRoomAppendChat(div);"]: `
                        const elem = _chatRoomSep.Create();
                        elem.style.display = (Player.ChatSettings?.PreserveChat ?? true) ? "" : "none";
                    `.trim(),
                });

                MBS_MOD_API.patchFunction("ChatRoomMenuClick", {
                    ['const roomDIVs = document.getElementsByClassName("ChatEnterBorder");']:
                        'const roomDIVs = document.getElementsByClassName("chat-room-sep");',
                });

                MBS_MOD_API.patchFunction("ChatRoomSync", {
                    ["ChatRoomData = data;"]:
                        "ChatRoomData = data; if (_chatRoomSep.ActiveElem) { _chatRoomSep.SetRoomData(_chatRoomSep.ActiveElem, data); }",
                });

                MBS_MOD_API.patchFunction("ChatRoomSyncRoomProperties", {
                    ["Object.assign(ChatRoomData, data);"]:
                        "Object.assign(ChatRoomData, data); if (_chatRoomSep.ActiveElem) { _chatRoomSep.SetRoomData(_chatRoomSep.ActiveElem, data); }",
                });

                MBS_MOD_API.patchFunction("ChatRoomRefreshChatSettings", {
                    ["if (Player.ChatSettings) {"]:
                        "if (Player.ChatSettings) { _chatRoomSep.UpdateDisplayNames();",
                });

                MBS_MOD_API.patchFunction("PreferenceSubscreenChatClick", {
                    ["if (MouseYIn(732, 64)) Player.ChatSettings.PreserveChat = !Player.ChatSettings.PreserveChat;"]: `
                        if (MouseYIn(732, 64)) {
                            Player.ChatSettings.PreserveChat = !Player.ChatSettings.PreserveChat;
                            const roomSeps = /** @type {HTMLDivElement[]} */(Array.from(document.querySelectorAll("#TextAreaChatLog .chat-room-sep")));
                            if (Player.ChatSettings.PreserveChat) {
                                roomSeps.forEach(e => e.style.display = "");
                            }
                        }
                    `.trim(),
                });

                MBS_MOD_API.hookFunction("ChatRoomAppendChat", 0, ([div, ...args], next) => {
                    const isPlayerMessage = (
                        div.dataset.sender === Player.MemberNumber?.toString()
                        && !div.classList.contains("ChatMessageNonDialogue")
                    );

                    const elem = chatRoomSep.ActiveElem as HTMLDivElement;
                    if (chatRoomSep.IsCollapsed(elem)) {
                        if (isPlayerMessage) {
                            chatRoomSep.Uncollapse(elem);
                        } else {
                            div.style.display = "none";
                            const button = elem.querySelector(".chat-room-sep-header") as null | HTMLButtonElement;
                            if (button) {
                                button.dataset.messages = ((Number.parseInt(button.dataset.messages ?? "0", 10) || 0) + 1).toString();
                                button.innerHTML = chatRoomSep.GetDisplayName(elem);
                            }
                        }
                    }
                    if (isPlayerMessage) {
                        ElementScrollToEnd("TextAreaChatLog");
                    }
                    return next([div, ...args]);
                });

                MBS_MOD_API.hookFunction("ChatRoomMenuClick", 11, (args, next) => {
                    const cutIndex = ChatRoomMenuButtons.findIndex(i => i === "Cut");
                    if (cutIndex === -1) {
                        return next(args);
                    }

                    const space = 992 / ChatRoomMenuButtons.length;
                    if (!MouseXIn(1005 + space * cutIndex, space - 2)) {
                        return next(args);
                    }

                    const roomSeps = document.querySelectorAll("#TextAreaChatLog .chat-room-sep");
                    switch (roomSeps.length) {
                        case 0:
                            break;
                        case 1: {
                            const roomSep = roomSeps[0];
                            const parent = roomSep.parentElement as HTMLElement;
                            while (roomSep.nextSibling && parent.childElementCount > 20) {
                                parent.removeChild(roomSep.nextSibling);
                            }
                            break;
                        }
                        default: {
                            const roomSep = roomSeps[1];
                            const parent = roomSep.parentElement as HTMLElement;
                            while (roomSep.previousSibling) {
                                parent.removeChild(roomSep.previousSibling);
                            }
                            break;
                        }
                    }
                    ElementScrollToEnd("TextAreaChatLog");
                });
            }

            if (MBS_MOD_API.getOriginalHash("PoseCanChangeUnaidedStatus") === "08672286") {
                backportIDs.add(5059);
                MBS_MOD_API.patchFunction("PoseCanChangeUnaidedStatus", {
                    ['} else if (C.HasEffect("Freeze") || ChatRoomOwnerPresenceRule("BlockChangePose", C)) {']:
                        '} else if (ChatRoomOwnerPresenceRule("BlockChangePose", C)) {',
                    ['} else if (C.IsStanding() && PoseAllStanding.some(p => PoseSetByItems(C, "BodyLower", p))) {']:
                        '} else if (C.IsStanding() && (C.HasEffect("Freeze") || PoseAllStanding.some(p => PoseSetByItems(C, "BodyLower", p)))) {',
                    ['} else if (C.IsKneeling() && PoseAllKneeling.some(p => PoseSetByItems(C, "BodyLower", p))) {']:
                        '} else if (C.IsKneeling() && (C.HasEffect("Freeze") || PoseAllKneeling.some(p => PoseSetByItems(C, "BodyLower", p)))) {',
                });
            }

            if (typeof ElementCreateSearchInput === "undefined") {
                backportIDs.add(5065);

                function toSearchInput(elem: HTMLInputElement, callback: () => Iterable<string>) {
                    elem.appendChild(<datalist id={`${elem.id}-datalist`}/>);
                    elem.setAttribute("list", `${elem.id}-datalist`);
                    elem.setAttribute("type", "search");
                    elem.addEventListener("focus", async function() {
                        if (this.list?.children.length !== 0) {
                            return;
                        }
                        for (const value of callback()) {
                            this.list.appendChild(<option value={value} />);
                        }
                    });
                }

                MBS_MOD_API.hookFunction("CraftingModeSet", 0, ([mode, ...args], next) => {
                    const ret = next([mode, ...args]);
                    const elem = document.getElementById("InputSearch") as null | HTMLInputElement;
                    if (mode === "Item" && elem) {
                        toSearchInput(elem, () => {
                            const visited: Set<string> = new Set();
                            return Object.values(CraftingAssets).flat().sort((asset1, asset2) => {
                                return asset1.Description.localeCompare(asset2.Description);
                            }).filter((asset) => {
                                const status = InventoryAvailable(Player, asset.Name, asset.Group.Name) && !visited.has(asset.Description);
                                if (status) {
                                    visited.add(asset.Description);
                                }
                                return status;
                            }).map((asset) => asset.Description);
                        });
                    }
                    return ret;
                });

                MBS_MOD_API.hookFunction("Shop2.Elements.InputSearch.Load", 0, (args, next) => {
                    const ret = next(args);
                    const elem = document.getElementById("Shop2InputSearch") as null | HTMLInputElement;
                    if (elem) {
                        toSearchInput(elem, () => {
                            switch (Shop2Vars.Mode) {
                                case "Preview":
                                    return new Set(Shop2Vars.PreviewItems.map(i => i.Asset.Description).sort());
                                case "Buy":
                                    return new Set(Shop2Vars.BuyItems.map(i => i.Asset.Description).sort());
                                case "Sell":
                                    return new Set(Shop2Vars.SellItems.map(i => i.Asset.Description).sort());
                                default:
                                    return new Set();
                            }
                        });
                    }
                    return ret;
                });

                MBS_MOD_API.hookFunction("Shop2.ApplyItemFilters", 0, (args, next) => {
                    const ret = next(args);
                    ElementContent("Shop2InputSearch-datalist", "");
                    return ret;
                });

                Shop2Vars._Mode = "Buy";
                // @ts-expect-error
                Shop2Vars.Defaults._Mode = "Buy";
                // @ts-expect-error
                delete Shop2Vars.Mode;
                Object.defineProperty(Shop2Vars, "Mode", {
                    get() { return Shop2Vars._Mode; },
                    set(value) {
                        ElementContent("Shop2InputSearch-datalist", "");
                        Shop2Vars._Mode = value;
                    },
                });

                MBS_MOD_API.hookFunction("BackgroundSelectionLoad", 0, (args, next) => {
                    const ret = next(args);
                    const elem = document.getElementById("InputBackground") as null | HTMLInputElement;
                    if (elem) {
                        toSearchInput(elem, () => BackgroundSelectionList.map(i => BackgroundsTextGet(i)).sort());
                    }
                    return ret;
                });

                MBS_MOD_API.hookFunction("BackgroundSelectionTagChanged", 0, (args, next) => {
                    const ret = next(args);
                    ElementContent("InputBackground-datalist", "");
                    return ret;
                });

                for (const funcName of ["ChatSearchLoad", "ChatSearchToggleHiddenMode", "ChatSearchToggleHelpMode"] as const) {
                    MBS_MOD_API.hookFunction(funcName, 0, (args, next) => {
                        const ret = next(args);
                        const elem = document.getElementById("InputSearch") as null | HTMLInputElement;
                        if (elem) {
                            toSearchInput(elem, () => {
                                const rooms = ChatSearchShowHiddenRoomsActive ? ChatSearchHiddenResult : ChatSearchResult;
                                return rooms.map(i => i.DisplayName).sort();
                            });
                        }
                        return ret;
                    });
                }

                for (const funcName of ["ChatSearchResultResponse", "ChatSearchApplyFilterTerms"] as const) {
                    MBS_MOD_API.hookFunction(funcName, 0, (args, next) => {
                        const ret = next(args);
                        ElementContent("InputSearch-datalist", "");
                        return ret;
                    });
                }
            }
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} backports`);
    }
});
