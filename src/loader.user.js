// ==UserScript==
// @name         MBS - Maid's Bondage Scripts
// @namespace    MBS
// @version      0.1.0
// @description  Loader of Bananarama92's "Maid's Bondage Scripts" mod
// @author       Bananarama92
// @include      /^https:\/\/(www\.)?bondageprojects\.elementfx\.com\/R\d+\/(BondageClub|\d+)(\/((index|\d+)\.html)?)?$/
// @include      /^https:\/\/(www\.)?bondage-europe\.com\/R\d+\/(BondageClub|\d+)(\/((index|\d+)\.html)?)?$/
// @homepage     https://github.com/bananarama92/MBS.git#readme
// @source       https://github.com/bananarama92/MBS.git
// @downloadURL  https://cdn.jsdelivr.net/gh/bananarama92/MBS/src/loader.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

// eslint-disable-next-line no-restricted-globals
setTimeout(
    () => {
        const n = document.createElement("script");
        n.language = "JavaScript";
        n.crossorigin = "anonymous";
        n.src = "https://bananarama92.github.io/MBS/dev0/mbs.js";
        document.head.appendChild(n);
    },
    2000,
);
