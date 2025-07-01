// ==UserScript==
// @name            Image Download with Ctrl+Click/Shift/MMB [GLOBAL]
// @namespace       imageSaving
// @description     Image downloading for most single-image pages, with Ctrl+Click, Shift or MMB-Click combinations
// @author          NightLancerX
// @match           *://*/*.jpg*
// @match           *://*/*.png*
// @match           *://*/*.jpeg*
// @match           *://*/*.gif*
// @match           *://*/*.webp*
// @match           https://pbs.twimg.com/media/*
// @version         2.5
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @license         MIT License
// @grant           none
// @run-at          document-end
// ==/UserScript==

(function() {
    'use strict';

    let img = document.querySelectorAll('img')[0];
    let imgSrc = img.src;

    let main = function()
    {
        let anchor = document.createElement('a'), name, ext;
        name = (imgSrc.indexOf('?')>-1)? imgSrc.substring(imgSrc.lastIndexOf("/")+1, imgSrc.indexOf('?')): imgSrc.substring(imgSrc.lastIndexOf("/")+1);
        try {name = decodeURI(name);} catch(e){}
        ext = imgSrc.match(/(?<=format=)[a-z]+/)?.[0];
        if (ext) name += '.' + ext;
        anchor.href = img.src;
        anchor.target = '_self';
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        main = ()=>{};
    };

    //save with Ctrl+Click
    img.onclick = function(e){
        if (e.ctrlKey){
            e.preventDefault();
            main();
        }
    };

    //save with Shift
    document.onkeyup = function(e){
        if (e.keyCode == 16){
            main();
        }
    };

    //save with MMB-click
    img.onmouseup = function(e){
        if (e.button == 1){
            main();
        }
    };
})();
