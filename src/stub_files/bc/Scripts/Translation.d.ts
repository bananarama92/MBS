/**
 * Checks if a file can be translated in the selected language
 * @param {string} FullPath - Full path of the file to check for a corresponding translation file
 * @returns {boolean} - Returns TRUE if a translation is available for the given file
 */
declare function TranslationAvailable(FullPath: string): boolean;
/**
 * Parse a TXT translation file and returns it as an array
 * @param {string} str - Content of the translation text file
 * @returns {string[]} - Array of strings with each line divided. For each translated line, the english string precedes the translated one in the array.
 */
declare function TranslationParseTXT(str: string): string[];
/**
 * Translates a string to another language from the array, the translation is always the one right after the english line
 * @param {string} S - The original english string to translate
 * @param {string[]} T - The active translation dictionary
 * @param {string} CharacterName - Name of the character if it is required to replace it within the string.
 * @returns {string} - The translated string
 */
declare function TranslationString(S: string, T: string[], CharacterName: string): string;
/**
 * Translates a character dialog from the specified array
 * @param {Character} C - The character for which we need to translate the dialog array.
 * @param {string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
declare function TranslationDialogArray(C: Character, T: string[]): void;
/**
 * Translates a set of tags. Rerenders the login message when on the login page.
 * @param {Array.<{Tag: string, Value: string}>} S - Array of current tag-value pairs
 * @param {string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
declare function TranslationTextArray(S: Array<{
    Tag: string;
    Value: string;
}>, T: string[]): void;
/**
 * Translate a character dialog if the file is in the dictionary
 * @param {Character} C - The character for which we want to translate the dialog
 * @returns {void} - Nothing
 */
declare function TranslationDialog(C: Character): void;
/**
 * Translate an array of tags in the current selected language
 * @param {Array.<{Tag: string, Value: string}>} Text - Array of current tag-value pairs
 * @returns {void} - Nothing
 */
declare function TranslationText(Text: Array<{
    Tag: string;
    Value: string;
}>): void;
/**
 * Translates the asset group and asset descriptions based on the given dictionary
 * @param {string[]} T - The active translation dictionary
 * @returns {void} - Nothing
 */
declare function TranslationAssetProcess(T: string[]): void;
/**
 * Translates the description of the assets and groups of an asset family
 * @param {string} Family - Name of the asset family to translate
 * @returns {void} - Nothing
 */
declare function TranslationAsset(Family: string): void;
/**
 * Changes the current language and save the new selected language to local storage
 * @returns {void} - Nothing
 */
declare function TranslationNextLanguage(): void;
/**
 * Loads the previous translation language from local storage if it exists
 * @returns {void} - Nothing
 */
declare function TranslationLoad(): void;
declare var TranslationLanguage: string;
/** @type {Record<string, string[]>} */
declare var TranslationCache: Record<string, string[]>;
/**
 * Dictionary for all supported languages and their files
 * @constant
 */
declare var TranslationDictionary: {
    LanguageCode: string;
    LanguageName: string;
    EnglishName: string;
    Files: string[];
}[];
