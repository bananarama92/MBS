/**
 * Initialise notification variables on startup
 * @returns {void} - Nothing
 */
declare function NotificationLoad(): void;
/**
 * Create a handler instance to track and handle notifications of that event type
 * @param {NotificationEventType} eventType
 * @param {NotificationSetting} setting
 */
declare function NotificationEventHandlerSetup(eventType: NotificationEventType, setting: NotificationSetting): void;
/**
 * Create a new notification
 * @param {NotificationEventType} eventType - The type of event that occurred
 * @param {object} [data={}] - Data relating to the event that can be passed into a popup
 * @returns {void} - Nothing
 */
declare function NotificationRaise(eventType: NotificationEventType, data?: object): void;
/**
 * Clear all raised notifications of the specified type
 * @param {NotificationEventType} eventType - The type of event to be cleared
 * @returns {void} - Nothing
 */
declare function NotificationReset(eventType: NotificationEventType): void;
/**
 * Clear all raised notifications
 * @returns {void} - Nothing
 */
declare function NotificationResetAll(): void;
/**
 * Returns whether popup notifications are permitted
 * @param {NotificationEventType} eventType - The type of event that occurred
 * @param {object} [data={}] - Data relating to the event that can be passed into a popup
 * @returns {boolean} - Whether popups can appear
 */
declare function NotificationPopupsEnabled(eventType: NotificationEventType, data?: object): boolean;
/**
 * Returns the total number of notifications raised for a particular alert type
 * @param {NotificationAlertType} alertType - The type of alert to check
 * @returns {number} - The total number of notifications
 */
declare function NotificationGetTotalCount(alertType: NotificationAlertType): number;
/**
 * Sets or clears the notification number in the document header
 * @returns {void} - Nothing
 */
declare function NotificationTitleUpdate(): void;
/**
 * Redraws the icon in the tab/window header to show a red circle with the notification count
 * @param {boolean} resetingAll - If resetting all notifications, no need to redraw as the total decreases
 * @returns {void} - Nothing
 */
declare function NotificationDrawFavicon(resetingAll: boolean): void;
/**
 * An enum for the events in the game that notifications can be raised for
 */
type NotificationEventType = string;
declare namespace NotificationEventType {
    const CHATMESSAGE: string;
    const CHATJOIN: string;
    const BEEP: string;
    const DISCONNECT: string;
    const TEST: string;
    const LARP: string;
}
/**
 * An enum for the types of notifications that can be raised
 * @type {Record<"NONE"|"TITLEPREFIX"|"FAVICON"|"POPUP",NotificationAlertType>}
 */
declare const NotificationAlertType: Record<"NONE" | "TITLEPREFIX" | "FAVICON" | "POPUP", NotificationAlertType>;
/**
 * An enum for the audio settings for notifications
 * @type {Record<"NONE"|"FIRST"|"REPEAT", NotificationAudioType>}
 */
declare const NotificationAudioType: Record<"NONE" | "FIRST" | "REPEAT", NotificationAudioType>;
/**
 * An object defining the components of the player's settings for a particular notification event
 * @typedef {object} NotificationSetting
 * @property {NotificationAlertType} AlertType - The selected type of notification alert to use
 * @property {NotificationAudioType} Audio - The selected audio setting to apply
 */
/**
 * A class to track the state of each notification event type and handle actions based on the player's settings
 */
declare class NotificationEventHandler {
    /**
     * Creates a new NotificationEventHandler for the specified event type
     * @param {NotificationEventType} eventType - The
     * @param {NotificationSetting} settings - The player settings corresponding to the event type
     */
    constructor(eventType: NotificationEventType, settings: NotificationSetting);
    eventType: string;
    settings: NotificationSetting;
    raisedCount: number;
    popup: Notification;
    /**
     * Raise a notification
     * @param {object} data - Data relating to the event that can be passed into a popup
     * @returns {void} - Nothing
     */
    raise(data: object): void;
    /**
     * Raise a popup notification
     * @param {any} data - Data relating to the event passed into the popup
     * @returns {void} - Nothing
     */
    raisePopup(data: any): void;
    /**
     * Determines whether an audio alert shoud be played
     * @param {boolean} usingPopup - If TRUE this indicates that the audio will be played by a popup, rather than an in-game alert
     * @returns {boolean} - Whether audio should be played
     */
    playAudio(usingPopup: boolean): boolean;
    /**
     * Resets all raised notifications for this event
     * @param {boolean} resetingAll - Indicates if all notifications are being reset, to avoid unnecessarily repeating steps for each event type
     * @returns {void} - Nothing
     */
    reset(resetingAll: boolean): void;
}
declare let NotificationEventHandlers: any;
declare var NotificationAlertTypeList: any[];
declare var NotificationAudioTypeList: any[];
/**
 * An object defining the components of the player's settings for a particular notification event
 */
type NotificationSetting = {
    /**
     * - The selected type of notification alert to use
     */
    AlertType: NotificationAlertType;
    /**
     * - The selected audio setting to apply
     */
    Audio: NotificationAudioType;
};
