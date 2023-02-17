/**
 *removes all buttons from the lists
 */
declare function ClearButtons(): void;
/**
 * adds a button to the lists
 * @param {number} X X value of the button
 * @param {number} Y Y value of the button
 */
declare function setButton(X: number, Y: number): void;
/**
 * checks, whether a button is already in the lists (I realize now, that I could have used .includes but it works)
 * @param {number} X X value of the button
 * @param {number} Y Y value of the button
 * @returns {boolean}
 */
declare function ButtonExists(X: number, Y: number): boolean;
/**
 * handles the sitck input
 * @param {readonly number[]} axes the raw data of all axes of the controller
 */
declare function ControllerAxis(axes: readonly number[]): void;
/**
 * Returns TRUE if current screen is a game that handles the controller, sends the input to that screen
 * @param {any} Buttons - The raw button data
 * @return {boolean}
 */
declare function ControllerManagedByGame(Buttons: any): boolean;
/**
 * handles button input
 * @param {any} buttons raw buttons data
 */
declare function ControllerButton(buttons: any): void;
/**
 * handles keyboard inputs in controller mode
 * @returns {void} Nothing
 */
declare function ControllerSupportKeyDown(): void;
/**
 * A -> Click
 */
declare function ControllerClick(): void;
/**
 * moves the pointer to either a button in a straight line above it or the closest one above
 * (all the commented stuff in the function is for debugging)
 */
declare function ControllerUp(): void;
/**
 * same as ControllerUp()
 */
declare function ControllerDown(): void;
/**
 * same as ControllerUp()
 */
declare function ControllerLeft(): void;
/**
 * same as ControllerUp()
 */
declare function ControllerRight(): void;
/** @type {number[]} */
declare var ControllerButtonsX: number[];
/** @type {number[]} */
declare var ControllerButtonsY: number[];
declare var ControllerActive: boolean;
declare var ControllerCurrentButton: number;
declare var ControllerButtonsRepeat: boolean;
declare var ControllerAxesRepeat: boolean;
declare var ControllerIgnoreButton: boolean;
declare var ControllerAxesRepeatTime: number;
declare var ControllerA: number;
declare var ControllerB: number;
declare var ControllerX: number;
declare var ControllerY: number;
declare var ControllerTriggerRight: number;
declare var ControllerTriggerLeft: number;
declare var ControllerStart: number;
declare var ControllerSelect: number;
declare var ControllerDPadPressLeft: number;
declare var ControllerDPadPressRight: number;
declare var ControllerStickUpDown: number;
declare var ControllerStickLeftRight: number;
declare var ControllerStickRight: number;
declare var ControllerStickDown: number;
declare var ControllerDPadUp: number;
declare var ControllerDPadDown: number;
declare var ControllerDPadLeft: number;
declare var ControllerDPadRight: number;
declare var Calibrating: boolean;
declare var ControllerStick: boolean;
declare var waitasec: boolean;
declare var ControllerSensitivity: number;
/** @type {number[]} */
declare var ControllerIgnoreStick: number[];
declare var ControllerDeadZone: number;
/** @type {Record<string, boolean>} */
declare var ControllerGameActiveButttons: Record<string, boolean>;
