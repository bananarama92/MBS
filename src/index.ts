"use strict";

import bcModSdk from "bondage-club-mod-sdk";

export const MBS_VERSION = "0.1.0.dev0";

export const MBS_MOD_API = bcModSdk.registerMod({
    name: "MBS",
    fullName: "Maid's Bondage Scripts",
    repository: "https://github.com/bananarama92/MBS",
    version: MBS_VERSION,
});

console.log(`MBS: Initializing MBS version ${MBS_VERSION}`);
