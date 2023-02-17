/**
 * Sets the new title of the player, if the title has changed
 * @param {string} NewTitle - The new title for the player
 * @returns {string} - The new title of the player
 */
declare function TitleSet(NewTitle: string): string;
/**
 * Returns the current title of the given player. If an invalid title is found or the player has to wear a certain title
 * the correct title is pushed to the player's attributes
 * @param {Character} C - The player, whose title we want to get
 * @returns {string} - The title of the given player
 */
declare function TitleGet(C: Character): string;
/**
 * Checks, if the given title is forced a forced title like 'Club Slave' or 'Escaped Patient'
 * @param {string} Title - The title to check
 * @returns {boolean} - Result of the check
 */
declare function TitleIsForced(Title: string): boolean;
/**
 * Checks, if the given title is earned a earned title is any title that doesn't always return true such as 'Switch', 'Doll' & 'Angel'
 * @param {string} Title - The title to check
 * @returns {boolean} - Result of the check
 */
declare function TitleIsEarned(Title: string): boolean;
/**
 * When the title screen is loaded
 * @returns {void} - Nothing
 */
declare function TitleLoad(): void;
/**
 * Runs the title selection screen. This function is called dynamically on a repeated basis,
 * so don't use complex loops or call extended functions from here.
 * @returns {void} - Nothing
 */
declare function TitleRun(): void;
/**
 * Handles the click events in the title selection screen. Clicks are forwarded from CommonClick()
 * @returns {void} - Nothing
 */
declare function TitleClick(): void;
/**
 * Exits the title selection screen and brings the player back to the InformationSheet
 * @returns {void} - Nothing
 */
declare function TitleExit(): void;
declare var TitleBackground: string;
/** @type {{ Name: string; Requirement: () => boolean; Earned?: boolean, Force?: boolean }[]} */
declare var TitleList: {
    Name: string;
    Requirement: () => boolean;
    Earned?: boolean;
    Force?: boolean;
}[];
/** @type {null | string} */
declare var TitleSelectedTitle: null | string;
declare var TitleCanEditNickname: boolean;
/** @type {null | string} */
declare var TitleNicknameStatus: null | string;
declare let TitleOffset: number;
/** @type {{ Name: string; Requirement: () => boolean; Earned?: boolean, Force?: boolean }[]} */
declare let TitleListFiltered: {
    Name: string;
    Requirement: () => boolean;
    Earned?: boolean;
    Force?: boolean;
}[];
declare const TitlePerPage: 28;
