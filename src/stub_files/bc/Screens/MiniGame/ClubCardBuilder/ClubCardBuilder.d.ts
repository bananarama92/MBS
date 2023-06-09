/**
 * Loads the deck # in memory so it can be edited
 * @returns {void} - Nothing
 */
declare function ClubCardBuilderLoadDeck(Deck: any): void;
/**
 * Saves the modified deck as a string on the server
 * @returns {void} - Nothing
 */
declare function ClubCardBuilderSaveChanges(): void;
/**
 * Loads the club card deck builder
 * @returns {void} - Nothing
 */
declare function ClubCardBuilderLoad(): void;
/**
 * Runs the club card deck builder
 * @returns {void} - Nothing
 */
declare function ClubCardBuilderRun(): void;
/**
 * Handles clicks during the club card game
 * @returns {void} - Nothing
 */
declare function ClubCardBuilderClick(): void;
declare var ClubCardBuilderBackground: string;
declare var ClubCardBuilderDeckIndex: number;
declare var ClubCardBuilderFocus: any;
declare var ClubCardBuilderDefaultDeck: number[];
declare var ClubCardBuilderList: any[];
declare var ClubCardBuilderOffset: number;
declare var ClubCardBuilderDeckCurrent: any[];
declare var ClubCardBuilderDeckSize: number;
