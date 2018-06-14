// ==UserScript==
// @name            Saving Pixiv Images with Ctrl+Click
// @name:ru         Saving Pixiv Images with Ctrl+Click
// @namespace       Pixiv
// @description     Additional script to «Pixiv Arts Preview & Followed Atrists Coloring» for saving images with Ctrl+Click on pixiv. If you've opened original from other page, you can save it here too, by pressing the same Ctrl+Click combination.
// @description:ru  Дополнительный скрипт для «Pixiv Arts Preview & Followed Atrists Coloring» для сохранения изображений с помощью Ctrl+Click на сайте pixiv. Если вы открыли оригинал с другой страницы, вы также можете сохранить его здесь, нажав Ctrl + Click.
// @author          NightLancerX
// @match           https://i.pximg.net/img-original/*
// @version         1.11
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @downloadURL     https://github.com/NightLancer/PixivPreview/raw/master/SaveImageWithCtrlClick.user.js
// @license         MIT License
// @grant           none
// ==/UserScript==

(function() {
    'use strict';
    let TIMEOUT = 1000; //you may change it from ~500 or less, while downloading is still works and you want to wait less
                        //or increase it over 1000 until downloading starts to work.

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
            let timerId = setTimeout(function(){window.close()}, TIMEOUT);
        };

        document.addEventListener("DOMContentLoaded", save());
        save(); //just in case of missing DOMContentLoaded event(if script hasn't loaded in time for some reasons)
    }
    else //saving with ctrl+click on current page
    {
        let img = document.querySelectorAll('img')[0];
        img.onclick = function(e)
        {
            if (e.ctrlKey)
            {
                e.preventDefault();
                let anchor = document.createElement('a');
                anchor.href = img.src;
                anchor.target = '_self';
                anchor.download = img.src.substring(img.src.lastIndexOf("/")+1);
                document.body.appendChild(anchor);
                anchor.click();
            };
        };
    }
})();
