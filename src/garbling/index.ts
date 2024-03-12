import { MBS_MOD_API, waitFor, logger } from "../common";
import { bcLoaded } from "../common_bc";
import { convertToGagSpeak, GAG_LEVEL } from "./gag_speak";

waitFor(bcLoaded).then(() => {
    logger.log("Initializing garbling module");

    MBS_MOD_API.hookFunction("SpeechGarble", 0, (args, next) => {
        const [character, words, noDeaf] = args as Parameters<typeof SpeechGarble>;
        const gagLevel = SpeechGetTotalGagLevel(character, noDeaf);
        if (gagLevel === 0 || !words || !Player.MBSSettings.AlternativeGarbling) {
            return next(args);
        } else {
            let wordsGarbled = convertToGagSpeak(words, gagLevel, { dropChars: GAG_LEVEL.heavy });
            wordsGarbled = SpeechStutter(character, wordsGarbled);
            wordsGarbled = SpeechBabyTalk(character, wordsGarbled);
            return wordsGarbled;
        }
    });
});
