"use strict";

import { waitFor } from "common";

waitFor(() => CraftingSlotMax != null).then(() => {
    CraftingSlotMax = 100;
    console.log(`MBS: Initializing crafting module (BC ${GameVersion})`);
});
