// ==UserScript==
// @name         MBS - Maid's Bondage Scripts
// @namespace    MBS
// @version      1.10.14
// @description  Loader of Bananarama92's "Maid's Bondage Scripts" mod
// @author       Bananarama92
// @match        https://*.bondageprojects.elementfx.com/R*/*
// @match        https://*.bondage-europe.com/R*/*
// @match        https://*.bondageprojects.com/R*/*
// @match        https://*.bondage-asia.com/club/R*
// @homepage     https://github.com/bananarama92/MBS.git#readme
// @source       https://github.com/bananarama92/MBS.git
// @downloadURL  https://github.com/bananarama92/MBS/raw/main/loader.user.js
// @updateURL    https://github.com/bananarama92/MBS/raw/main/loader.user.js
// @run-at       document-end
// @grant        none
// @license      GPL-3.0
// ==/UserScript==

setTimeout(
    () => {
        const n = document.createElement("script");
        n.type = "text/javascript";
        n.crossOrigin = "anonymous";
        n.src = `https://bananarama92.github.io/MBS/main/mbs.js?_=${Date.now()}`;
        document.head.appendChild(n);
    },
    2000,
);
