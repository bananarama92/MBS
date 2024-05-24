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

    /**  Click event listener for collapsing one or more chat room separators */
    async function _ClickCollapse(this: HTMLButtonElement, event: MouseEvent | TouchEvent) {
        // (un)collapse all separators if the `shift` key is held down while clicking
        const displayState = this.innerText === "˅" ? "none" : "";
        if (event.shiftKey) {
            const chatArea = this.parentElement?.parentElement?.parentElement as HTMLDivElement;
            let firstSepVisited = false;
            for (const elem of Array.from(chatArea.children)) {
                if (elem.classList.contains("chat-room-sep")) {
                    const button = elem.children[0].children[0] as HTMLButtonElement;
                    button.innerText = displayState ? "˃" : "˅";
                    firstSepVisited = true;
                } else if (firstSepVisited) {
                    (elem as HTMLElement).style.display = displayState;
                }
            }
        } else {
            this.innerText = displayState ? "˃" : "˅";
            let sibbling = this.parentElement?.parentElement?.nextSibling as null | HTMLElement;
            while (sibbling && !sibbling.classList.contains("chat-room-sep")) {
                sibbling.style.display = displayState;
                sibbling = sibbling.nextSibling as null | HTMLElement;
            }
        }
    }

    /** Click event listener for scrolling towards chat room seperator */
    async function _ClickScrollUp(this: HTMLButtonElement) {
        const chatRoomSep = this.parentElement?.parentElement as HTMLDivElement;
        const sibbling = chatRoomSep.nextSibling as null | HTMLElement;
        if (sibbling) {
            const chatArea = chatRoomSep.parentElement as HTMLDivElement;
            chatArea.scroll({ top: sibbling.offsetTop - chatRoomSep.offsetHeight });
        }
    }

    /** Create a dividing element serving as seperator for different chat rooms */
    export function Create(): HTMLDivElement {
        const elem = (
            <div
                class="ChatMessage ChatMessageAction chat-room-sep"
                data-time={ChatRoomCurrentTime()}
                data-sender={Player.MemberNumber ?? ""}
            >
                <div class="chat-room-sep-div">
                    <button class="blank-button chat-room-sep-collapse" onClick={_ClickCollapse}>˅</button>
                    <button class="blank-button chat-room-sep-header" onClick={_ClickScrollUp}></button>
                </div>
            </div>
        ) as HTMLDivElement;
        elem.style.setProperty("--label-color", Player.LabelColor as string);
        ChatRoomAppendChat(elem);
        chatRoomSep.ActiveElem = elem;
        return elem;
    }

    /** Return a {@link HTMLElement.InnerHTML} representation of the passed button's room name */
    function _GetDisplayName(button: HTMLButtonElement): string {
        const segments = [
            button.dataset.space?.replace("Asylum", InterfaceTextGet("ChatRoomSpaceAsylum")),
            button.dataset.private ? InterfaceTextGet("PrivateRoom") : undefined,
            ChatRoomHTMLEntities(ChatSearchMuffle(button.dataset.room as string)),
        ];
        return segments.filter(Boolean).join(" - ");
    }

    /** Set the room-specific of the currently active chat room separator */
    export async function SetRoomData(roomSep: HTMLDivElement, data: Pick<ServerChatRoomData, "Name" | "Private" | "Space">) {
        const button = roomSep.getElementsByClassName("chat-room-sep-header")[0] as HTMLButtonElement;
        button.dataset.room = data.Name;
        button.dataset.space = data.Space;
        button.dataset.private = (data.Private || "").toString();
        button.innerHTML = _GetDisplayName(button);
    }

    /** Update all the displayed room names based on the player's degree of sensory deprivation. */
    export async function UpdateDisplayNames() {
        const roomLabels = Array.from(document.getElementsByClassName("chat-room-sep-header")) as HTMLButtonElement[];
        roomLabels.forEach(e => e.innerHTML = _GetDisplayName(e));
    }
}

declare const ChatRoomSep: undefined | typeof chatRoomSep;

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
						"if (ChatRoomCharacter.length === 0 && Player.ChatSettings?.PreserveChat) {",
                    ['const div = document.createElement("div");']: "",
                    ['div.setAttribute("class", "ChatEnterBorder");']: "",
                    ["ChatRoomAppendChat(div);"]: "_chatRoomSep.Create();",
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
            }
            break;
        }
    }

    if (backportIDs.size) {
        logger.log(`Initializing R${BC_NEXT} bug fix backports`, sortBy(Array.from(backportIDs)));
    } else {
        logger.log(`No R${BC_NEXT} bug fix backports`);
    }
});
