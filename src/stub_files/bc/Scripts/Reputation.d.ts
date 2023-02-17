/**
 * Alters a given reputation value for the player
 * @param {string} RepType - The name/type of the reputation to alter
 * @param {number} RepValue - Reputation to add/subtract to the current reputation value.
 * @param {boolean} [Push=true] - Pushes the reputation to the server if TRUE
 * @returns {void} - Nothing
 */
declare function ReputationChange(RepType: string, RepValue: number, Push?: boolean): void;
/**
 * Loads the reputation data from the server
 * @param {readonly {Type: string, Value: number}[]} NewRep - The array of reputation-value pairs to load for the current player
 * @returns {void} - Nothing
 */
declare function ReputationLoad(NewRep: readonly {
    Type: string;
    Value: number;
}[]): void;
/**
 * Returns a specific reputation value for the player
 * @param {string} RepType - Type/name of the reputation to get the value of.
 * @returns {number} - Returns the value of the reputation. It can range from 100 to -100, and it defaults to 0 if the player never earned this type of reputation before.
 */
declare function ReputationGet(RepType: string): number;
/**
 * Returns a specific reputation value for a given character
 * @param {Character} C - Character to get the reputation for.
 * @param {string} RepType - Type/name of the reputation to get the value of.
 * @returns {number} - Returns the value of the reputation. It can range from 100 to -100, and it defaults to 0 if the given character never earned this type of reputation before.
 */
declare function ReputationCharacterGet(C: Character, RepType: string): number;
/**
 * Alter the reputation progress by a factor. The higher the rep, the slower it gets, a reputation is easier to break than to build. Takes the cheater version factor into account.
 * @param {string} RepType - Type/name of the reputation
 * @param {number|string} Value - Value of the reputation change before the factor is applied
 * @return {void} - Nothing
 */
declare function ReputationProgress(RepType: string, Value: number | string): void;
declare var ReputationValidReputations: string[];
