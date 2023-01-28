interface BCXVersion {
	major: number;
	minor: number;
	patch: number;
	extra?: string;
	dev?: boolean;
}

//#region Rules
interface BCX_RuleStateAPI_Generic {
	/** The name of the rule */
	readonly rule: string;
	/** Definition of the rule */
	readonly ruleDefinition: any;

	/** Current condition data of the rule */
	readonly condition: any | undefined;

	/** If the rule is in effect (active and all conditions valid) */
	readonly inEffect: boolean;
	/** If the rule is enforced (inEffect and enforce enabled) */
	readonly isEnforced: boolean;
	/** If the rule is logged (inEffect and logging enabled) */
	readonly isLogged: boolean;

	/** Rule setttings */
	readonly customData: any;
	/** Rule internal data */
	readonly internalData: any;

	/**
	 * Triggers and logs that Player violated this rule
	 * @param targetCharacter - If the rule is against specific target different than player (e.g. sending message/beep), this adds it to log
	 * @param dictionary - Dictionary of rule-specific text replacements in logs and notifications; see implementation of individual rules
	 */
	trigger(targetCharacter?: number | null, dictionary?: Record<string, string>): void;

	/**
	 * Triggers and logs that Player attempted to violate this rule, but the attempt was blocked (for enforced rules)
	 * @param targetCharacter - If the rule is against specific target different than player (e.g. sending message/beep), this adds it to log
	 * @param dictionary - Dictionary of rule-specific text replacements in logs and notifications; see implementation of individual rules
	 */
	triggerAttempt(targetCharacter?: number | null, dictionary?: Record<string, string>): void;
}

// If not using full BCX declarations (uncomment if not)
type BCX_Rule =
	| "block_remoteuse_self"
	| "block_remoteuse_others"
	| "block_keyuse_self"
	| "block_keyuse_others"
	| "block_lockpicking_self"
	| "block_lockpicking_others"
	| "block_lockuse_self"
	| "block_lockuse_others"
	| "block_wardrobe_access_self"
	| "block_wardrobe_access_others"
	| "block_restrict_allowed_poses"
	| "block_creating_rooms"
	| "block_entering_rooms"
	| "block_leaving_room"
	| "block_freeing_self"
	| "block_tying_others"
	| "block_blacklisting"
	| "block_whitelisting"
	| "block_antiblind"
	| "block_difficulty_change"
	| "block_activities"
	| "block_mainhall_maidrescue"
	| "block_action"
	| "block_BCX_permissions"
	| "block_room_admin_UI"
	| "block_using_ggts"
	| "block_club_slave_work"
	| "block_using_unowned_items"
	| "block_changing_emoticon"
	| "block_ui_icons_names"
	| "alt_restrict_hearing"
	| "alt_restrict_sight"
	| "alt_eyes_fullblind"
	| "alt_field_of_vision"
	| "alt_blindfolds_fullblind"
	| "alt_always_slow"
	| "alt_set_leave_slowing"
	| "alt_control_orgasms"
	| "alt_secret_orgasms"
	| "alt_room_admin_transfer"
	| "alt_room_admin_limit"
	| "alt_set_profile_description"
	| "alt_set_nickname"
	| "alt_force_suitcase_game"
	| "alt_hearing_whitelist"
	| "alt_seeing_whitelist"
	| "alt_restrict_leashability"
	| "alt_hide_friends"
	| "alt_forced_summoning"
	| "alt_allow_changing_appearance"
	| "rc_club_owner"
	| "rc_lover_new"
	| "rc_lover_leave"
	| "rc_sub_new"
	| "rc_sub_leave"
	| "speech_specific_sound"
	| "speech_garble_whispers"
	| "speech_block_gagged_ooc"
	| "speech_block_ooc"
	| "speech_doll_talk"
	| "speech_ban_words"
	| "speech_ban_words_in_emotes"
	| "speech_forbid_open_talking"
	| "speech_limit_open_talking"
	| "speech_forbid_emotes"
	| "speech_limit_emotes"
	| "speech_restrict_whisper_send"
	| "speech_restrict_whisper_receive"
	| "speech_restrict_beep_send"
	| "speech_restrict_beep_receive"
	| "speech_greet_order"
	| "speech_block_antigarble"
	// | "speech_replace_spoken_words"
	// | "speech_using_honorifics"
	| "speech_force_retype"
	| "greet_room_order"
	| "greet_new_guests"
	// | "speech_restrained_speech"
	| "speech_alter_faltering"
	| "speech_mandatory_words"
	| "speech_mandatory_words_in_emotes"
	| "speech_partial_hearing"
	| "other_forbid_afk"
	| "other_track_time"
	| "other_constant_reminder"
	| "other_log_money"
	// | "other_restrict_console_usage"
	| "other_track_BCX_activation"
	| "setting_item_permission"
	| "setting_forbid_lockpicking"
	| "setting_forbid_SP_rooms"
	| "setting_forbid_safeword"
	| "setting_arousal_meter"
	| "setting_block_vibe_modes"
	| "setting_arousal_stutter"
	| "setting_show_afk"
	| "setting_allow_body_mod"
	| "setting_forbid_cosplay_change"
	| "setting_sensdep"
	| "setting_hide_non_adjecent"
	| "setting_blind_room_garbling"
	| "setting_relog_keeps_restraints"
	| "setting_leashed_roomchange"
	| "setting_room_rejoin"
	| "setting_plug_vibe_events"
	| "setting_allow_tint_effects"
	| "setting_allow_blur_effects"
	| "setting_upsidedown_view"
	| "setting_random_npc_events"
	;
type BCX_RuleStateAPI<_ extends BCX_Rule> = BCX_RuleStateAPI_Generic;

//#endregion

interface BCX_ModAPI {
	/** Name of the mod this API was requested for */
	readonly modName: string;

	/** Returns state handler for a rule or `null` for unknown rule */
	getRuleState<ID extends BCX_Rule>(rule: ID): BCX_RuleStateAPI<ID> | null;
}

interface BCX_ConsoleInterface {
	/** Version of loaded BCX */
	readonly version: string;

	/** Version parsed to components */
	readonly versionParsed: Readonly<BCXVersion>;

	/**
	 * Gets BCX version of another character in room
	 * @param target - The membernumber of character to get; undefined = Player
	 */
	getCharacterVersion(target?: number): string | null;

	/** Gets if BCX runs in development mode */
	readonly isDevel: boolean;

	/**
	 * Get access to BCX Mod API.
	 * @param mod - Same identifier of your mod as used for ModSDK
	 */
	getModApi(mod: string): BCX_ModAPI;
}

declare const bcx: undefined | BCX_ConsoleInterface;
