import { MBS_MOD_API, Version } from "../common";
import { waitForBC } from "../common_bc";

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
export async function showChangelog(startID: string, stopID: null | string = null) {
    const changelogElem = document.getElementById("mbs-changelog");
    if (changelogElem) {
        // Move a previously opened changelog to the end of the chat again
        if (changelogElem.getAttribute("data-start") === startID && changelogElem.getAttribute("data-stop") === stopID) {
            changelogElem.remove();
            ChatRoomAppendChat(changelogElem);
            return;
        } else {
            changelogElem.remove();
        }
    }

    const branch = Version.fromVersion(MBS_VERSION).beta ? "devel" : "main";
    const innerHTML = changelog.replaceAll('<img src="static/images/', `<img src="https://bananarama92.github.io/MBS/${branch}/images/`);
    if (document.getElementById("TextAreaChatLog")) {
        CommandsChangelog.Publish(
            innerHTML,
            {
                id: "mbs-changelog",
                href: `https://github.com/bananarama92/MBS/blob/${branch}/CHANGELOG.md`,
                startID,
                stopID,
            },
        );
    } else {
        let published = false;
        MBS_MOD_API.hookFunction("ChatRoomCreateElement", 0, (args, next) => {
            const ret = next(args);
            if (!published) {
                published = true;
                CommandsChangelog.Publish(
                    innerHTML,
                    {
                        id: "mbs-changelog",
                        href: `https://github.com/bananarama92/MBS/blob/${branch}/CHANGELOG.md`,
                        startID,
                        stopID,
                    },
                );
            }
            return ret;
        });
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
    } else {
        const version = Version.fromVersion(MBS_VERSION);
        start = `v${version.major}${version.minor}${version.beta ? version.micro - 1 : version.micro}`;
    }
    showChangelog(start, end);
}

waitForBC("changelog", {
    async afterLoad() {
        CommandCombine({
            Tag: "mbschangelog",
            Description: "[version-start] [version-end]: Show the changelog(s) of the specified MBS version or version range; defaults to the latest version",
            Action: showChangelogSync,
        });
    },
});
