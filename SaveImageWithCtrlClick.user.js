// ==UserScript==
// @name            Saving Pixiv Images with Ctrl+Click
// @name:ru         Saving Pixiv Images with Ctrl+Click
// @namespace       Pixiv
// @description     Additional script to «Pixiv Arts Preview & Followed Atrists Coloring» for saving images with Ctrl+Click on pixiv.
// @description:ru  Дополнительный скрипт для «Pixiv Arts Preview & Followed Atrists Coloring» для сохранения изображений с помощью Ctrl+Click на сайте pixiv.
// @author          NightLancerX
// @match           https://i.pximg.net/img-original/*
// @version         1.0
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @downloadURL     https://github.com/NightLancer/PixivPreview/raw/master/SaveImageWithCtrlClick.user.js
// @grant           none
// ==/UserScript==

(function() {
    'use strict';
    if (document.URL.slice(-3)=="s=1")
    {
        let anchor = document.createElement('a'),
            done = false;

        function save()
        {
            let imgSrc = document.querySelectorAll('img')[0].src;
            if (imgSrc === undefined || done) return;

            anchor.href = imgSrc;
            anchor.target = '_self';
            anchor.download = imgSrc.substring(imgSrc.lastIndexOf("/")+1, imgSrc.indexOf('?'));
            document.body.appendChild(anchor);
            anchor.click();
            done = true;
            let timerId = setTimeout(function(){window.close()}, 500);
        };

        document.addEventListener("DOMContentLoaded", save());
        save(); //just in case of missing DOMContentLoaded event(if script hasn't loaded in time for some reasons)
    }
})();
