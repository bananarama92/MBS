/** @type {[number, number, number, number]} */
declare const AssetUpperOverflowAlpha: [number, number, number, number];
/** @type {[number, number, number, number]} */
declare const AssetLowerOverflowAlpha: [number, number, number, number];
/**
 * 3D Custom Girl based assets
 * @type {AssetGroupDefinition[]}
 */
declare var AssetFemale3DCG: AssetGroupDefinition[];
/** 3D Custom Girl based pose
 * @type {Pose[]}
 */
declare var PoseFemale3DCG: Pose[];
/**
 * List of all available pose names in the game
 * @constant {string[]}
 */
declare var PoseFemale3DCGNames: AssetPoseName[];
/**
 * 3D Custom Girl based activities
 *
 * The ordering is supposed to match what body part they use, in order:
 * mouth, hand, feet, whole-body, head, then the item-related ones.
 * Inside that, they get sorted by softest to harshest, when that makes sense.
 *
 * @type {Activity[]}
 */
declare var ActivityFemale3DCG: Activity[];
/**
 * Display order for activities.
 * @type string[]
 */
declare let ActivityFemale3DCGOrdering: string[];
/**
 * 3D Custom Girl based fetishes
 * @type {{Name: string; GetFactor(C: Character): number; }[]}
 */
declare var FetishFemale3DCG: {
    Name: string;
    GetFactor(C: Character): number;
}[];
