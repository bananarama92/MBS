/**
 * Builds the selectable background arrays based on the tags supplied
 * @param {string[]} BackgroundTagList - An array of string of all the tags to load
 * @returns {string[]} - The list of all background names
 */
declare function BackgroundsGenerateList(BackgroundTagList: string[]): string[];
/**
 * All tags
 * @constant
 * @type {string}
 */
declare var BackgroundsTagNone: string;
declare var BackgroundsTagIndoor: string;
declare var BackgroundsTagOutdoor: string;
declare var BackgroundsTagAquatic: string;
declare var BackgroundsTagSpecial: string;
declare var BackgroundsTagSciFiFantasy: string;
declare var BackgroundsTagClub: string;
declare var BackgroundsTagHouse: string;
declare var BackgroundsTagDungeon: string;
declare var BackgroundsTagAsylum: string;
/**
 * List of all tags to create online chat rooms
 * @constant
 * @type {string[]}
 */
declare var BackgroundsTagList: string[];
/**
 * List of all tags to setup your main hall or private room
 * @constant
 * @type {string[]}
 */
declare var BackgroundsPrivateRoomTagList: string[];
/**
 * List of all the common backgrounds.
 * @constant
 * @type {{ Name: string; Tag: string[]; }[]}
 */
declare var BackgroundsList: {
    Name: string;
    Tag: string[];
}[];
