// ==UserScript==
// @name         MBS - Maid's Bondage Scripts
// @namespace    MBS
// @version      1.1.3
// @description  Loader of Bananarama92's "Maid's Bondage Scripts" mod
// @author       Bananarama92
// @include      /^https:\/\/(www\.)?bondageprojects\.elementfx\.com\/R\d+\/(BondageClub|\d+)(\/((index|\d+)\.html)?)?$/
// @include      /^https:\/\/(www\.)?bondage-europe\.com\/R\d+\/(BondageClub|\d+)(\/((index|\d+)\.html)?)?$/
// @homepage     https://github.com/bananarama92/MBS.git#readme
// @source       https://github.com/bananarama92/MBS.git
// @downloadURL  https://github.com/bananarama92/MBS/raw/main/loader.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

setTimeout(
    () => {
        const n = document.createElement("script");
        n.language = "JavaScript";
        n.crossorigin = "anonymous";
        n.src = `https://bananarama92.github.io/MBS/main/mbs.js?_=${Date.now()}`;
        document.head.appendChild(n);
    },
    2000,
);