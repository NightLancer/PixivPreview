// ==UserScript==
// @name            Image Saving with Ctrl+Click/Shift [GLOBAL]
// @namespace       imageSaving
// @description     Ctrl+Click/Shift image saving for most single-image pages
// @author          NightLancerX
// @match           *://*/*.jpg*
// @match           *://*/*.png*
// @version         2.1
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @downloadURL     https://github.com/NightLancer/PixivPreview/raw/master/SaveImageWithCtrlClick.user.js
// @license         MIT License
// @grant           none
// @run-at          document-end
// ==/UserScript==

(function() {
    'use strict';
    
    let img = document.querySelectorAll('img')[0];
    let imgSrc = img.src;
    
    function main()
    {
        let anchor = document.createElement('a');
        anchor.href = img.src;
        anchor.target = '_self';
        anchor.download = (imgSrc.indexOf('?')>-1)? imgSrc.substring(imgSrc.lastIndexOf("/")+1, imgSrc.indexOf('?')): imgSrc.substring(imgSrc.lastIndexOf("/")+1);
        document.body.appendChild(anchor);
        anchor.click();
    };
    
    img.onclick = function(e)
    {
        if (e.ctrlKey) //save with Ctrl+Click
        {
            e.preventDefault();
	    main();
        };           
    };
    
    document.onkeyup = function(e)
    {
        if (e.keyCode == 16) //save with shift
        {
            main();
        }
    };
})();
