import { waitFor, Version } from "../common";
import { bcLoaded } from "../common_bc";

import changelog from "../../CHANGELOG.md";

/** Construct a git tag and a tag for the `changelog.md` file given the current MBS version. */
function getGitTags(): [gitTag: string, mdTag: string] {
    const version = Version.fromVersion(MBS_VERSION);
    const mdTag = `#v${version.major}${version.minor}${version.micro}`;
    return version.beta ? ["blob/devel", ""] : ["blob/main", mdTag];
}

/** Return the URL to the MBS changelog */
export function getChangeLogURL(): string {
    const mbs_tags = getGitTags();
    return `https://github.com/bananarama92/MBS/${mbs_tags[0]}/CHANGELOG.md${mbs_tags[1]}`;
}

/**
 * Show the MBS changelog to the player for the specified versions.
 * Defaults to the latest version of no bounds are specified.
 */
export async function showChangelog(start: null | string = null, end: null | string = null) {
    const branch = Version.fromVersion(MBS_VERSION).beta ? "devel" : "main";
    const elem = <div class="ChatMessage mbs-changelog" data-sender={Player.MemberNumber} data-time={ChatRoomCurrentTime()} /> as HTMLDivElement;
    elem.innerHTML = changelog.replaceAll('<img src="static/images/', `<img loading="lazy" src="https://bananarama92.github.io/MBS/${branch}/images/`);

    let endVisited = false;
    const endCallback: (e: Element) => boolean = (end === null)
        ? (e) => e.tagName === "H2"
        : (e) => {
            if (e.tagName === "H2" && endVisited) {
                return true;
            } else if (e.id === end) {
                endVisited = true;
            }
            return false;
        };
    const startCallback: (e: Element) => boolean = (start === null)
        ? (e) => e.tagName === "H2"
        : (e) => e.id === start;

    const iter = Array.from(elem.children).values();
    let state: "start" | "mid" | "end" = "start";
    let elemResult = iter.next();
    while (!elemResult.done) {
        const elem = elemResult.value;
        switch (state) {
            case "start":
                if (startCallback(elem)) {
                    state = "mid";
                } else {
                    elem.remove();
                }
                break;
            case "mid":
                if (endCallback(elem)) {
                    state = "end";
                    elem.remove();
                }
                break;
            case "end":
                elem.remove();
                break;
        }
        elemResult = iter.next();
    }

    elem.querySelectorAll("a").forEach((a) => a.target = "_blank");

    elem.querySelectorAll("img").forEach((img) => {
        img.decoding = "async";
        img.loading = "eager";
        const a = <a href={img.src} target="_blank" class="mbs-changelog-image" />;
        img.replaceWith(a);
        a.appendChild(img);
    });

    elem.querySelectorAll("h2").forEach((h2, i) => {
        elem.replaceChild(
            <div class="mbs-changelog-header">
                <h1><a href={`https://github.com/bananarama92/MBS/blob/${branch}/CHANGELOG.md#${h2.id}`} target="_blank">{`MBS Changelog: ${h2.innerText}`}</a></h1>
                <span>•</span>
                {ElementButton.Create(
                    `mbs-changelog-delete-${i}-${Date.now()}`,
                    async function () { this.closest(".mbs-changelog")?.remove(); },
                    { tooltip: "Clear changelog", tooltipPosition: "bottom" },
                    { button: { children: ["🗑"], classList: ["mbs-changelog-delete"] } },
                )}
            </div>,
            h2,
        );
    });

    await waitFor(() => !!document.getElementById("TextAreaChatLog"), 1000);
    document.querySelectorAll("#TextAreaChatLog .mbs-changelog").forEach(e => e.remove());
    if (elem.children) {
        ChatRoomAppendChat(elem);
    }
}

const VERSION_PATTERN = /^(v?)([0-9]+)(\.([0-9]+))?(\.([0-9]+))?(\.\S+)?$/i;

function showChangelogSync(_args: string, _msg: string, parsed: (string | undefined)[]): void {
    const startReg = parsed[0] ? VERSION_PATTERN.exec(parsed[0]) : null;
    const endReg = parsed[1] ? VERSION_PATTERN.exec(parsed[1]) : null;

    // Swap the start and end if the start is greater than the latter
    let start: string | null = null;
    let end: string | null = null;
    if (startReg && endReg) {
        const versionStart = new Version(Number.parseInt(startReg[2], 10), Number.parseInt(startReg[4] || "0", 10), Number.parseInt(startReg[6] || "0", 10));
        const versionEnd = new Version(Number.parseInt(endReg[2], 10), Number.parseInt(endReg[4] || "0", 10), Number.parseInt(endReg[6] || "0", 10));
        if (versionStart.greater(versionEnd)) {
            start = `v${versionStart.major}${versionStart.minor}${versionStart.micro}`;
            end = `v${versionEnd.major}${versionEnd.minor}${versionEnd.micro}`;
        } else {
            start = `v${versionEnd.major}${versionEnd.minor}${versionEnd.micro}`;
            end = `v${versionStart.major}${versionStart.minor}${versionStart.micro}`;
        }
    } else if (startReg) {
        start = `v${startReg[2]}${startReg[4] || 0}${startReg[6] || 0}`;
    } else if (endReg) {
        start = `v${endReg[2]}${endReg[4] || 0}${endReg[6] || 0}`;
    }
    showChangelog(start, end);
}

waitFor(bcLoaded).then(() => {
    CommandCombine({
        Tag: "mbschangelog",
        Description: "[version-start] [version-end]: Show the changelog(s) of the specified MBS version or version range; defaults to the latest version",
        Action: showChangelogSync,
    });
});
