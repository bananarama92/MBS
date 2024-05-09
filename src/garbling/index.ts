import { MBS_MOD_API, waitFor, logger } from "../common";
import { settingsMBSLoaded } from "../common_bc";

import { convertToGagSpeak, GarbleOptions } from "./gag_speak";
import { json as garblingJSON } from "./json";

export { garblingJSON };

waitFor(settingsMBSLoaded).then(() => {
    logger.log("Initializing garbling module");

    // Only use this hook for ring gags
    switch (GameVersion) {
        case "R103":
            MBS_MOD_API.hookFunction("SpeechGarble", 0, ([character, words, noDeaf, ...args], next) => {
                const gagLevel = SpeechGetTotalGagLevel(character, noDeaf);
                if (
                    !gagLevel
                    || !character
                    || !words
                    || !Player.MBSSettings.AlternativeGarbling
                    || !(character.HasEffect("OpenMouth") && !character.HasEffect("BlockMouth"))
                ) {
                    return next([character, words, noDeaf, ...args]);
                } else {
                    const options: GarbleOptions.Base = {
                        dropChars: Player.MBSSettings.DropTrailing ? {} : undefined,
                        perSyllable: Player.MBSSettings.GarblePerSyllable,
                        character,
                    };
                    let ret = convertToGagSpeak(words, gagLevel, options);
                    ret = SpeechStutter(character, ret);
                    ret = SpeechBabyTalk(character, ret);
                    return ret;
                }
            });

            // Fallback in case another mod bypasses `SpeechGarble`;
            // there's a lot of hooking into this function in other mods that would otherwise break things here
            MBS_MOD_API.hookFunction("SpeechGarbleByGagLevel", 0, ([gagLevel, words, ignoreOOC, ...args], next) => {
                if (!gagLevel || !words || !Player.MBSSettings.AlternativeGarbling) {
                    return next([gagLevel, words, ...args]);
                } else {
                    const options: GarbleOptions.Base = {
                        dropChars: Player.MBSSettings.DropTrailing ? {} : undefined,
                        perSyllable: Player.MBSSettings.GarblePerSyllable,
                        fallback: (arg: [words: string, gagLevel: number, ignoreOOC?: boolean]) => next([arg[1], arg[0], arg[2], ...args]),
                        ignoreOOC,
                    };
                    return convertToGagSpeak(words, gagLevel, options);
                }
            });
            break;
        default:
            // Pass the character along to `SpeechTransformGagGarble` as we need it for detecting ring gags
            MBS_MOD_API.patchFunction("SpeechTransformProcess", {
                "text = SpeechTransformGagGarble(text, intensity, ignoreOOC);":
                    "text = SpeechTransformGagGarble(text, intensity, ignoreOOC, C);",
            });

            MBS_MOD_API.hookFunction("SpeechTransformGagGarble", 0, ([words, gagLevel, ignoreOOC, ...args], next) => {
                const character = (args as [C?: Character])[0];
                if (!gagLevel || !words || !Player.MBSSettings.AlternativeGarbling) {
                    return next([words, gagLevel, ignoreOOC, ...args]);
                } else {
                    const options: GarbleOptions.Base = {
                        dropChars: Player.MBSSettings.DropTrailing ? {} : undefined,
                        perSyllable: Player.MBSSettings.GarblePerSyllable,
                        fallback: next,
                        ignoreOOC,
                        character,
                    };
                    return convertToGagSpeak(words, gagLevel, options);
                }
            });
            break;
    }
});
