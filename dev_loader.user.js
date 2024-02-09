// ==UserScript==
// @name         MBS_dev - Maid's Bondage Scripts Development Version
// @namespace    MBS_dev
// @version      1.3.4.dev0
// @description  Loader of Bananarama92's "Maid's Bondage Scripts" mod (dev version)
// @author       Bananarama92
// @match        http://localhost:*/*
// @match        http://127.0.0.1:5500/*
// @homepage     https://github.com/bananarama92/MBS.git#readme
// @source       https://github.com/bananarama92/MBS.git
// @downloadURL  https://github.com/bananarama92/MBS/raw/main/dev_loader.user.js
// @run-at       document-end
// @grant        none
// ==/UserScript==

setTimeout(
    () => {
        const n = document.createElement("script");
        n.language = "JavaScript";
        n.crossorigin = "anonymous";
        n.src = `https://bananarama92.github.io/MBS/devel/mbs.js?_=${Date.now()}`;
        document.head.appendChild(n);
    },
    2000,
);
