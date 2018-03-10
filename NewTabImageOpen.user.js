// ==UserScript==
// @name            NewTabImageOpen
// @namespace       Pixiv
// @description     additional script for "Pixiv Arts Preview & Followed Atrists Coloring" for propper new tab original images opening
// @author          NightLancerX
// @match           https://i.pximg.net/img-original/*
// @version         0.21
// @downloadURL     https://github.com/NightLancer/PixivPreview/raw/master/NewTabImageOpen.user.js
// @grant           none
// ==/UserScript==

(function ()
{
  document.addEventListener("DOMContentLoaded", function()
  {
    var url = document.URL,
        s = url.slice(-3);    
    if (document.body.innerText.substring(0,3)==='404') 
    {
      window.close();
    }
  });  
}) ();
