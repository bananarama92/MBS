import { MBS_MOD_API, waitFor, logger } from "../common";
import { bcLoaded } from "../common_bc";

import { convertToGagSpeak, GarbleOptions } from "./gag_speak";
import { json as garblingJSON } from "./json";

export { garblingJSON };

waitFor(bcLoaded).then(() => {
    logger.log("Initializing garbling module");

    // Only use this hook for ring gags
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
                fallback: next,
                ignoreOOC,
            };
            return convertToGagSpeak(words, gagLevel, options);
        }
    });
});
