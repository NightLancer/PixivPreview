// ==UserScript==
// @name            Pixiv Arts Preview & Followed Atrists Coloring
// @name:ru         Pixiv Arts Preview & Followed Atrists Coloring
// @namespace       Pixiv
// @description     Enlarged preview of arts and manga on mouse hovering on most pages. Click on image preview to open original art in new tab, or MMB-click to open art illustration page, Alt+LMB-click to to add art to bookmarks, Ctrl+LMB-click for saving originals of artworks. The names of the authors you are already subscribed to are highlighted with green. Settings can be changed in proper menu.
// @description:ru  Увеличённый предпросмотр артов и манги по наведению мышки на большинстве страниц. Клик ЛКМ по превью арта для открытия исходника в новой вкладке, СКМ для открытия страницы с артом, Alt + клик ЛКМ для добавления в закладки, Ctrl + клик ЛКМ для сохранения оригиналов артов. Имена авторов, на которых вы уже подписаны, подсвечиваются зелёным цветом. Настройки можно изменить в соответствующем меню.
// @version         2.11
// @match           https://www.pixiv.net/bookmark_new_illust.php*
// @match           https://www.pixiv.net/discovery*
// @match           https://www.pixiv.net/bookmark_detail.php?illust_id=*
// @match           https://www.pixiv.net/ranking.php*
// @match           https://www.pixiv.net/bookmark.php*
// @match           https://www.pixiv.net/search.php*
// @match           https://www.pixiv.net/*
// @match           https://www.pixiv.net/stacc*
// @match           https://www.pixiv.net/*artworks/*
// @match           https://www.pixiv.net/*tags/*
// @match           https://www.pixiv.net/*users/*
// @connect         i.pximg.net
// @connect         techorus-cdn.com
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @downloadURL     https://github.com/NightLancer/PixivPreview/raw/master/PixivPreview.user.js
// @license         MIT License
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// ==/UserScript==
//=======================================================================================
(function ()
{
  'use strict';

  if (window.top == window.self && window.jQuery) jQuery(function($)
  {
    console.log('MyPixivJS');

    //---------------------------***CUSTOM PREFERENCES***--------------------------------
    let propList = [
        {paramIndex:0, array:[false,true], name:"PREVIEW_ON_CLICK"},
        {paramIndex:0, array:[0, 500, 1000, 1500, 2000, 3000], name:"DELAY_BEFORE_PREVIEW"},
        {paramIndex:0, array:[0, 600, 1200], name:"PREVIEW_SIZE"},
        {paramIndex:0, array:[false,true], name:"ACCURATE_MANGA_PREVIEW"},
        {paramIndex:0, array:[false,true], name:"DISABLE_MANGA_PREVIEW_SCROLLING_PROPAGATION"},
        {paramIndex:1, array:[false,true], name:"SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE"},
        {paramIndex:0, array:[false,true], name:"DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING"}
    ];
    //---------------------------------DEFAULT VALUES------------------------------------
    // ■ PREVIEW_ON_CLICK =
    // false : showing preview on mouseover (default)
    // true : showing preview after LMB-click
    //
    // ■ DELAY_BEFORE_PREVIEW =
    // 0 : no delay before preview (default)
    // 1000 : 1 second delay (2000 for 2 seconds, etc)
    //
    // ■ PREVIEW_SIZE =
    // 0 : automatically calculate preview size (1200 or 600) depending of current screen size (default)
    // 600 : up to 600px x 600px
    // 1200 : up to 1200px x 1200px
    //
    // ■ ACCURATE_MANGA_PREVIEW =
    // false : quicker, but less accurate in some cases (default)
    // true : takes 1sec before preview showing for more accurate positioning
    //
    // ■ DISABLE_MANGA_PREVIEW_SCROLLLING_PROPAGATION =
    // false : keeping page scrolling after end of manga preview scrolling (default)
    // true : disable page scrolling when viewing manga preview (move mouse out of preview to re-enable scrolling)
    //
    // ■ SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE =
    // true : preview of single image will smoothly fit to vertical screen border after one scroll (default)
    // false : manually scrolling (may need in case of forced 1200px vertical preview with small user screen)
    //
    // ■ DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING =
    // false: standard behavior (default)
    // true : disable page scrolling when viewing single preview (works only if previous setting set to true)

    let currentSettings = {};
    //-----------------------------------------------------------------------------------
    let hoverImg = document.createElement('img');

    let imgContainer = document.createElement('div');
        imgContainer.style = 'position:absolute; display:block; z-index:1000; background:#222; padding:5px; margin:-5px;';
        imgContainer.appendChild(hoverImg);

    let mangaContainer = document.createElement('div');
        mangaContainer.id = 'mangaContainer';
        mangaContainer.style = 'display:block; z-index:1500; background:#111; overflow-x:auto; maxWidth:1200px; white-space:nowrap;';

    let mangaOuterContainer = document.createElement('div');
        mangaOuterContainer.style = 'position:absolute; display:block; visibility:hidden; z-index:1000; padding:5px; background:#111; maxWidth:1200px; marginY:-5px; marginX: auto; left: 30px;';
        mangaOuterContainer.appendChild(mangaContainer);

    let imgsArr = [], //for manga-style image packs...
        followedUsersId = {}, //storing followed users pixiv ID
        BOOKMARK_URL = 'https://www.pixiv.net/bookmark.php',
        CheckedPublic = false,
        CheckedPrivate = false,
        artsLoaded = 0,
        lastHits = 0,
        lastImgId = -1,
        previewSize,
        siteImgMaxWidth = 184, //2,7,12 [NEW]| quite useless on this pages because of square previews...
        mangaWidth = 1200,
        maxRequestTime = 30000,
        bookmarkObj,
        isBookmarked = false, //rework or delete. Arts can be bookmarked on art page.
        DELTASCALE = ('mozInnerScreenX' in window)?70:4,
        previewEventType,
        PAGETYPE = checkPageType();

    var timerId, tInt;
    //-----------------------------------------------------------------------------------
    Storage.prototype.setObj = function(key, obj){
      return this.setItem(key, JSON.stringify(obj))
    }
    Storage.prototype.getObj = function(key){
      return JSON.parse(this.getItem(key))
    }
    //===================================================================================
    //************************************PageType***************************************
    //===================================================================================
    function checkPageType()
    {
      if (document.URL.match('https://www.pixiv.net/bookmark_new_illust.php?'))                             return 0; //New illustrations - Old +
      if (document.URL==='https://www.pixiv.net/discovery')                                                 return 1; //Discovery page(works) - Old +
      if (document.URL.match('https://www.pixiv.net/bookmark_detail.php?'))                                 return 4; //Bookmark information - Old +
      if (document.URL.match('https://www.pixiv.net/ranking.php?'))                                         return 6; //Daily rankings - Old +
      if (document.URL.match('https://www.pixiv.net/bookmark.php?'))                                        return 9; //Your bookmarks page - Old + -> 7
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?users\/\d+\/bookmarks\/artworks/))        return 7; //Bookmarks page - New +
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?users/))                                  return 2; //Artist works page - New +
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?tags/))                                   return 8; //Search page - New +
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?artworks/))                               return 12; //Illust page - New* +
      if (document.URL.match('https://www.pixiv.net/discovery/users?'))                                     return 13; //Discovery page(users) New +
      if (document.URL.match('https://www.pixiv.net/stacc?'))                                               return 11; //Feed ('stacc') Old + - currently broken
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?/))                                       return 10; //Home page
      //if (document.URL.match('https://www.pixiv.net/member.php?'))                                          return 3; //Artist "Home" page - New +  | Todo: merge 2 and 3 pages?...

      return -1;
    }
    console.log('PAGETYPE: '+ PAGETYPE);
    //Old: 0,1,4,6,9,11
    //New: 2,7,12,13,8

    //===================================================================================
    function setCurrentSettings(){
      for (let i = 0; i < propList.length; i++){
        currentSettings[propList[i].name] = propList[i].array[propList[i].paramIndex];
      }
      resetPreviewSize(); //needed because of "auto" feature
    }
    //-----------------------------------------------------------------------------------
    function saveSettings(){
      for (let i = 0; i < propList.length; i++){
        localStorage.setObj(propList[i].name, propList[i].paramIndex);
      }
      console.log("Settings saved");
    }
    //-----------------------------------------------------------------------------------
    function loadSavedSettings(){
      for (let i = 0; i < propList.length; i++){
        propList[i].paramIndex = localStorage.getObj(propList[i].name) || propList[i].paramIndex; //load saved setting value, or let default if not found

        if ((propList[i].paramIndex < 0) || (propList[i].paramIndex >= propList[i].array.length)){
          propList[i].paramIndex = 0;
          console.error(`localStorage error! Setting ${propList[i].name} has been reset to default value! [${propList[i].array[propList[i].paramIndex]}]`);
        }
      }
      console.log("Settings loaded");
    }
    //-----------------------------------------------------------------------------------
    loadSavedSettings();
    setCurrentSettings();
    //-----------------------------------------------------------------------------------
    previewEventType = (currentSettings["PREVIEW_ON_CLICK"])?'click':'mouseenter';

    function resetPreviewSize(){previewSize = (currentSettings["PREVIEW_SIZE"])?currentSettings["PREVIEW_SIZE"]:(window.innerHeight>1200 & document.body.clientWidth>1200)?1200:600}
    //===================================================================================
    //**********************************ColorFollowed************************************
    //===================================================================================
    if ([1,4,6,7].includes(PAGETYPE)) //+12 in initMutationParentObject -> user may not scroll to bottom, so it is better to stay in mutaionObserver
    {
      checkFollowedArtistsInit();
    }

    function checkFollowedArtistsInit()
    {
      if ((Date.now()-23*60*60*1000)>localStorage.getItem('followedCheckDate') && !localStorage.getObj('followedCheckStarted')) //forcing update followed list(in case of errors) at least every 23 hours
      {
        console.log('followedCheckStarted');
        localStorage.setObj('followedCheckCompleted', false);
        localStorage.setObj('followedCheckStarted', true);
        checkFollowedArtists(BOOKMARK_URL+'?type=user');           //public
        checkFollowedArtists(BOOKMARK_URL+'?type=user&rest=hide'); //private
      }
      else if ([6].includes(PAGETYPE)) colorFollowed();
    }
    //-----------------------------------------------------------------------------------
    async function checkFollowedArtists(url)
    {
      if (url === undefined || url.length === 0) return; //just in case

      let xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = 15000;
      xhr.onreadystatechange = function ()
      {
        if (xhr.readyState == 4 && xhr.status == 200)
        {
          console.log("XHR done");

          let doc = document.implementation.createHTMLDocument("Followed");
          doc.documentElement.innerHTML = xhr.responseText;

          let followedProfiles = doc.querySelectorAll('div>a.ui-profile-popup');
          for(let i = 0; i < followedProfiles.length; i++)
          {
            //followedUsersId.push(followedProfiles[i].getAttribute("data-user_id"));
            followedUsersId[followedProfiles[i].getAttribute("data-user_id")] = true;
          }
          console.log(Object.keys(followedUsersId).length);

          let urlTail = $(doc).find('a[rel="next"]').attr('href');
          if (urlTail !== undefined && urlTail.length)
          {
            console.log(urlTail);
            checkFollowedArtists(BOOKMARK_URL+urlTail);
          }
          else
          {
            if      (doc.querySelectorAll('li.current')[0].textContent==='Public')  CheckedPublic  = true;
            else if (doc.querySelectorAll('li.current')[0].textContent==='Private') CheckedPrivate = true;

            if (CheckedPublic && CheckedPrivate)
            {
              localStorage.setObj('followedCheckCompleted', true);
              localStorage.setObj('followedCheckStarted', false);
              localStorage.setObj('followedUsersId', followedUsersId);
              localStorage.setObj('followedCheckDate', Date.now());
              localStorage.setObj('followedCheckError', false);
              console.log('Followed check completed');

              if (PAGETYPE===6) colorFollowed(); //only for daily rankings? | for loading on same page case
            }
          }
          doc = followedProfiles = null;
        }
      };
      xhr.onerror = function()
      {
        console.error('ERROR while GETTING subscriptions list!');
        localStorage.setObj('followedCheckError', true);
        localStorage.setObj('followedCheckCompleted', false);
        localStorage.setObj('followedCheckStarted', false);
      };
      xhr.send();
    }
    //-----------------------------------------------------------------------------------
    async function colorFollowed(artsContainers)
    {
      let c = 0, d = 0;
      while (!artsContainers || artsContainers.length === 0) //first call -> daily rankings, illust page
      {
        console.log('waiting for arts...');
        await sleep(2000);

        artsContainers = getArtsContainers();
        ++c;
        if (c>5)
        {
          console.error('Error while waiting for arts loading! [Timeout 10s]');
          break;
        }
      }

      let artsContainersLength = artsContainers.length;
      //console.log(artsContainersLength);

      //wait until last XHR completed if it is not---------------------------------------
      if (localStorage.getObj('followedCheckCompleted') === null || localStorage.getObj('followedCheckCompleted') === false)
      {
        if (localStorage.getObj('followedCheckStarted'))
        {
          while (!localStorage.getObj('followedCheckCompleted'))
          {
            console.log("waiting for followed users..."); //this could happen in case of huge followed users amount
            await sleep(2000);

            if (localStorage.getObj('followedCheckError'))
            {
              console.error('ERROR while RECEIVING subscriptions list!');
              break;
            }

            ++d;
            if (d*2000>maxRequestTime)
            {
              console.error('ERROR while EXPECTING for subscriptions list!');
              localStorage.setObj('followedCheckError', true);
              localStorage.setObj('followedCheckCompleted', false);
              localStorage.setObj('followedCheckStarted', false);
              break;
            }
          }
          followedUsersId = localStorage.getObj('followedUsersId');
          console.log('Successfully received followedUsersId: '+ Object.keys(followedUsersId).length);
        }
        else console.error('Subscriptions check was not STARTED for some reason!');
      }
      else
      {
        followedUsersId = localStorage.getObj('followedUsersId');
        console.log('Successfully loaded cached followedUsersId: '+ Object.keys(followedUsersId).length);
      }
      //---------------------------------------------------------------------------------
      //artsLoaded = (PAGETYPE===12)?$('.gtm-illust-recommend-user-name').length:$('.ui-profile-popup').length; //if it brokes - get info from getArtsContainers()
      //console.log('arts loaded: '+artsContainersLength + ' (Total: '+(artsLoaded)+')');
      console.log(`arts loaded: ${artsContainersLength} Total: ${getArtsContainers().length}`);

      let currentHits = 0;
      let userId = 0;
      //console.dir(artsContainers);
      for(let i = 0; i < artsContainersLength; i++)
      {
        userId = getUserId(artsContainers[i]);
        //console.log(userId);
        //if (followedUsersId.indexOf(userId)>=0)
        if (followedUsersId[userId]==true)
        {
          ++currentHits;
          artsContainers[i].setAttribute("style", "background-color: green; !important");
        }
      }
      lastHits += currentHits;
      console.log('hits: '+currentHits + ' (Total: '+(lastHits)+')');
    }
    //-----------------------------------------------------------------------------------
    function getArtsContainers()
    {
      switch (PAGETYPE){
        case 1,4: return document.querySelectorAll('.gtm-illust-recommend-user-name');
        case 12:  return document.querySelectorAll('.gtm-illust-recommend-title');
        case 6:   return document.querySelectorAll('.ui-profile-popup');
        case 7:   return document.querySelectorAll('li > div > a'); //('a[href*="/en/artworks/"]'); excessive - need to filter every 2 selectors
        default:  console.error('Unprocessed PAGETYPE in getArtsContainers()!');
      }
      return null;
    }
    //-----------------------------------------------------------------------------------
    let getUserId = (artContainer) =>
    {
      let userId = -1;

      if (typeof artContainer.hasAttribute !== 'function'){
        console.log(artContainer,'has been filtered out.');
      }
      else if (PAGETYPE===1 || PAGETYPE===6 || PAGETYPE===4){
        userId = (artContainer.hasAttribute('data-user_id'))
          ?artContainer.getAttribute('data-user_id')
          :artContainer.querySelectorAll('.ui-profile-popup')[0].getAttribute('data-user_id');
      }
      else if (PAGETYPE===12){
        //artContainer = artContainer.querySelectorAll('.gtm-illust-recommend-title')[0] || artContainer; // -_-' //for 4?
        userId = artContainer.querySelectorAll('[href*="/users/"]')[0].getAttribute('href').split('/').pop();
      }
      else if (PAGETYPE===7){
        userId = artContainer.parentNode.querySelectorAll('[href*="/users/"]')[0].getAttribute('href').split('/').pop();
      }
      else{
        console.error('UNPROCESSED getUserId() call!');
      }

      return +userId;
    }
    //-----------------------------------------------------------------------------------
    function sleep(ms)
    {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    //-----------------------------------------------------------------------------------
    function getElementByXpath(path)
    {
      return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }
    //-----------------------------------------------------------------------------------
    let getArtSectionContainers =
    ([1,4,12].includes(PAGETYPE))? () => $('.gtm-illust-recommend-zone')[0]
    :                              () => $('.ranking-items')[0]; //6
    //-----------------------------------------------------------------------------------
    function createObserver(mainDiv)
    {
      let observer = new MutationObserver(function(mutations)
      {
        let arr = [];
        mutations.forEach(function(mutation)
        {
          mutation.addedNodes.forEach(function(node)
          {
            //console.log(mutation);
            arr.push(node);
          });
        });
        colorFollowed(arr);
      });

      let options = {
        'childList': true
      };

      observer.observe(mainDiv, options);
      console.log('Observer has been set');
    }
    //-----------------------------------------------------------------------------------
    async function initMutationObject()
    {
      let mainDiv = getArtSectionContainers();
      while(!mainDiv)
      {
        console.log('Waiting for arts container...');
        await sleep(1000);
        mainDiv = getArtSectionContainers();
      }
      console.log(mainDiv);
      createObserver(mainDiv);
    }
    //-----------------------------------------------------------------------------------
    async function initMutationParentObject(parentSelector, nodesSelector)
    {
      let observerParent = new MutationObserver(function(mutations)
      {
        let mainDiv;
        mutations.forEach(function(mutation)
        {
          mainDiv = mutation.addedNodes[0].getElementsByClassName(nodesSelector);
          console.log(mainDiv);
          if (mainDiv.length>0)
          {
            checkFollowedArtistsInit();

            createObserver(mainDiv[0]);
            observerParent.disconnect();
            observerParent = null;
          }
        });
      });
      let options2 = {
        'childList': true
      };

      let parentDiv = getElementByXpath(parentSelector);
      while(!parentDiv)
      {
        console.log('Waiting for getElementByXpath [main]');
        await sleep(1000);
        parentDiv = getElementByXpath(parentSelector);
      }
      console.log(parentDiv);

      observerParent.observe(parentDiv, options2);
      console.log('observerParent set');
    }
    //-----------------------------------------------------------------------------------
    /*
    function initGallery() {
      let _ttt = $('figure > div[role="presentation"]');
      let _sss = _ttt[0].textContent.split("⧸").pop(); //NOT slash! charCodeAt(0) == 10744
      console.log(_ttt);
      console.log(_sss);
    }
    */
    //-----------------------------------------------------------------------------------
    function followage(thisObj, toFollow, isNew) //In case of followed check lasting too long, async queue may be a solution
    {
      console.log('toFollow: '+ toFollow);
      let userId;
      switch (isNew){
        case 0: userId = thisObj.parentNode.parentNode.querySelectorAll('a.user-name')[0].getAttribute('href').split('&')[0].split('=')[1]; break; //OLD
        case 1: userId = thisObj.parentNode.parentNode.parentNode.querySelectorAll('[href*="/users/"]')[0].getAttribute('href').split('/').pop(); break; //NEW
        case 2: userId = thisObj.getAttribute('data-user-id'); break; //recommended users
      }

      if (!(userId>0)) console.error(`Wrong userId! ${userId}`);

      if (localStorage.getObj('followedCheckCompleted')) //at least basic check until queue is developed
      {
        let followedUsersId = localStorage.getObj('followedUsersId'); //local
        if (toFollow){
          followedUsersId[userId] = true;
          //if ([2,7,12].includes(PAGETYPE)) initFollowagePreview();
        }
        else
          delete followedUsersId[userId];

        localStorage.setObj('followedUsersId', followedUsersId);
        console.log('userId ' + userId + [(toFollow)?' added to':' deleted from'] + ' localStorage. Followed: '+ Object.keys(followedUsersId).length);
      }
      else console.error('Slow down! You have subscribed too many to handle this by now! Wait for the next updates or let me know.');
    }
    //===================================================================================
    if      (PAGETYPE===0 || PAGETYPE===1)                  siteImgMaxWidth = 198;
    else if (PAGETYPE===4 || PAGETYPE===9 || PAGETYPE===10) siteImgMaxWidth = 150;
    else if (PAGETYPE===6 || PAGETYPE===11)                 siteImgMaxWidth = 240;
    //-----------------------------------------------------------------------------------
    $(document).ready(function ()
    {
      console.log('$(document).ready');
      mangaWidth = document.body.clientWidth - 80;
      mangaContainer.style.maxWidth = mangaOuterContainer.style.maxWidth = mangaWidth+'px';
      document.body.appendChild(imgContainer);
      document.body.appendChild(mangaOuterContainer);
      //---------------------------------Settings menu-----------------------------------
      let menu = document.createElement("div");
          menu.id = "menu";
          menu.style = `
                        position: absolute;
                        display: none;
                        top: 60px;
                        left: 10px;
                        padding: 5px 5px 5px 20px;
                        border: 2px solid deepskyblue;
                        border-radius: 15px;
                        background: white;
                        font-size: 14px;
                        line-height: 22px;
                        color: rgb(0, 0, 0);
                        border-radius: 15px;
          `;

      //filling menu fields with values and property names
      for (let i = 0; i < propList.length; i++){
        menu.innerHTML += `<li><button style = 'width: 40px; margin-right: 5px;'>${propList[i].array[propList[i].paramIndex]}</button>${propList[i].name}</li>`
      }

      document.body.appendChild(menu);
      //---------------------------------------------------------------------------------
      function changeMenuValues(menuDiv){
        let index = Array.prototype.indexOf.call(menuDiv.parentNode.parentNode.children, menuDiv.parentNode);
        propList[index].paramIndex+=1;
        if (propList[index].paramIndex >= propList[index].array.length) propList[index].paramIndex = 0;
        menuDiv.textContent = propList[index].array[propList[index].paramIndex];

        //foolproof protection
        if (propList[0].paramIndex == 1){
          menu.childNodes[1].childNodes[0].disabled = true;
          propList[1].paramIndex = 0;
          menu.childNodes[1].childNodes[0].textContent = "0";
        }
        else{
          menu.childNodes[1].childNodes[0].disabled = false;
        }
      }

      $('#menu').on('click', 'button', function(){
        changeMenuValues(this);
      });
      //---------------------------------------------------------------------------------
      async function initMenu(){
        let buttons, menuButton; //put to global scope if (menuButton) is needed elsewhere

        while (!menuButton){
          buttons = $('#js-mount-point-header button');
          menuButton = buttons[buttons.length - 1]; // last is the menu button
          console.log(menuButton);
          await sleep(1000);
        }

        menuButton.addEventListener("click", function()
        {
          //save setting when menu is "closed"(display == none)
          if (menu.style.display == 'block'){
            menu.style.display = 'none';
            saveSettings();
            setCurrentSettings();
          }
          else{
            menu.style.display = 'block';
          }
        });
      }
      initMenu();
      //-------------------------------Follow onclick------------------------------------
      let toFollow, isNew, followSelector;
      if ([2,7,12].includes(PAGETYPE)){
        followSelector = '[data-click-label*="follow"]';
        isNew = 1;
      }
      else if([13].includes(PAGETYPE)){
        followSelector = '.follow-button';
        isNew = 2;
      }
      else {
        followSelector = '.follow-button';
        isNew = 0;
      }

      $('body').on('mouseup', followSelector, function(){
        toFollow = (this.textContent == 'Follow');
        followage(this, toFollow, isNew);
      });
      //----------------------------Bookmark detail page cleaning------------------------
      if (PAGETYPE===4)
      {
        let _bkmrklst = $('.bookmark-list-unit')[0];
        _bkmrklst.parentNode.removeChild(_bkmrklst);
        _bkmrklst = null;
      }
      //------------------------------Dayli rankings ad cleaning-------------------------
      if (PAGETYPE===6)
      {
        $('.ad-printservice').remove();
      }
      //-------------------------------Illust page extra check---------------------------
      if (PAGETYPE===12)
      {
        //replace with selector if possible
        let parentSelector = '/html/body/div[1]/div[2]/div/aside[2]/div',
            zoneSelector = 'gtm-illust-recommend-zone',
            zone = document.getElementsByClassName(zoneSelector)[0];

        if (zone === undefined) initMutationParentObject(parentSelector, zoneSelector);
        else
        {
          console.log(zone);
          checkFollowedArtistsInit();
          colorFollowed(); //process missed arts containers
          createObserver(zone);
        }
      }
      //-----------------------------Init illust fetch listener--------------------------
      if (PAGETYPE===1 || PAGETYPE===4 || PAGETYPE===6)
      {
        initMutationObject();
      }
      //---------------------------------Pixiv Member pages------------------------------
      if (PAGETYPE===2|| PAGETYPE===3 || PAGETYPE===7)
      {
        $('body').on('mouseup', 'a[href*="bookmarks/artworks"]', function(){
          console.log('PAGETYPE: '+ PAGETYPE+' -> 7');
          PAGETYPE = 7;
          bookmarksInit();
        });
        // $('body').on('mouseup', 'a[href*="/member.php?id="]', function(){
        //   console.log('PAGETYPE: '+ PAGETYPE+' -> 3');
        //   PAGETYPE = 3;
        // });
        //
        // $('body').on('mouseup', 'a[href*="&type=illust"]', function(){
        //   console.log('PAGETYPE: '+ PAGETYPE+' -> 2');
        //   PAGETYPE = 2;
        // });
      }
      //-------------------------------
      async function bookmarksInit()
      {
        checkFollowedArtistsInit();
        let mainSelector = '/html/body/div[1]/div[2]/div/div[2]/div[1]/section/ul';
        let mainDiv = getElementByXpath(mainSelector);
        while(!mainDiv)
        {
          console.log('Waiting for getElementByXpath [bookmarksInit]');
          await sleep(1000);
          mainDiv = getElementByXpath(mainSelector);
        }
        console.log(mainDiv);

        colorFollowed();
      }
      //------------------------------------Bookmarks------------------------------------
      if (PAGETYPE===7)
      {
        bookmarksInit();
      }
      //=================================================================================
      //***************************************HOVER*************************************
      //=================================================================================
      //------------------------------------Profile card--------------------------------- //0,1,4,6,8,9,11
      if ([0,1,4,6,9,10,11].includes(PAGETYPE))
      {
        $('body').on(previewEventType, 'a[href*="/artworks/"]', function(e)
        {
          e.preventDefault();
          if (this.childNodes.length === 0) //for preventing issues with 4 and 6 pages
          {
            setHover(this);
            imgContainer.style.top = getOffsetRect(this).top+200+'px';
          }
        });
      }
      //-------------------------------------Followage----------------------------------- //2,7,12
      function initFollowagePreview() //todo: broken
      {
        $('body').on(previewEventType, '.gtm-recommend-user-thumbnail', function(e)
        {
          e.preventDefault();

          let top = window.innerHeight - previewSize - 5 + window.scrollY + 'px';
          setHover(this.firstChild.firstChild, top);

          let scroll = getElementByXpath('/html/body/div[6]/div/div/div/div/ul');
          scroll.onwheel = function(ev)
          {
            ev.preventDefault();
            scroll.scrollLeft += ev.deltaY*DELTASCALE;
          };
        });
      }
      //--------------------NEW ILLUSTRATIONS, DISCOVERY[ARTWORKS] AND SEARCH------------ //0,1,8
      function setPreviewEventListeners()
      {
        //single art hover---------------------------------------------------------------
        $('body').on(previewEventType, 'a[href*="/artworks/"] > div:only-child', function(e)
        {
          e.preventDefault();
          bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
          checkBookmark(this);
          setHover(this);
        });

        //manga-style arts hover---------------------------------------------------------
        $('body').on(previewEventType, 'a[href*="/artworks/"] > div:nth-child(2) ', function(e)
        {
          e.preventDefault();
          if (this.parentNode.firstChild.childNodes.length)
          {
            bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
            checkBookmark(this);
            setMangaHover(this, this.parentNode.firstChild.firstChild.textContent);
          }
        });
      }
      //-----------------------------------DISCOVERY[USERS]------------------------------ //13
      function setDiscoveryUsersPreviewEventListeners()
      {
        $('body').on(previewEventType, 'a[href*="/artworks/"]', function(e)
        {
          e.preventDefault();
          if      (this.childNodes.length == 0)  setHover(this); //single art
          else if (this.childNodes.length == 1)  setMangaHover(this, this.firstChild.textContent); //manga
        });
      }
      //--------------------------------------------------------------------------------- //1->13
      function setTabSwitchingListenerW_U()
      {
        $('body').on('mouseup','a[href="/discovery/users"]', function()
        {
          console.log('Works -> Users');
          PAGETYPE = 13;
          artsLoaded = lastHits = 0; //clearing loaded arts count when switching on tabs
          $('body').off(); //may cause some removal of timeout events?
          setDiscoveryUsersPreviewEventListeners();
          setTabSwitchingListenerU_W();
        });
      }
      //--------------------------------------------------------------------------------- //13->1
      function setTabSwitchingListenerU_W()
      {
        $('body').on('mouseup','a[href="/discovery"]', function()
        {
          console.log('Users -> Works');
          PAGETYPE = 1;
          artsLoaded = lastHits = 0; //not necessary
          checkFollowedArtistsInit();
          initMutationObject();

          $('body').off();//(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="]', discoveryUsersPreview);
          setPreviewEventListeners();
          setTabSwitchingListenerW_U();
        });
      }
      //--------------------------------DISCOVERY[Artworks]------------------------------ //1
      if (PAGETYPE === 1) //Works
      {
        setTabSwitchingListenerW_U();
        setPreviewEventListeners();
      }
      //----------------------------------DISCOVERY[Users]------------------------------- //13
      else if (PAGETYPE === 13) //Users
      {
        setTabSwitchingListenerU_W();
        setDiscoveryUsersPreviewEventListeners();
      }
      //----------------------------NEW ILLUSTRATIONS AND SEARCH------------------------- //0,8
      else if (PAGETYPE === 0)
      {
        setPreviewEventListeners();
      }
      //--------------------ARTIST WORKS, "TOP" PAGES, Someone's Bookmarks--------------- //2,7,12
      else if (PAGETYPE === 2 || PAGETYPE === 7 || PAGETYPE === 12 || PAGETYPE === 8)     //TODO!!! do smthng with that amorphous pixiv styleshit!
      {
        /*
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="] > div:only-child', function()
        {
          //single art hover-------------------------------------------------------------
          if (this.firstChild.childNodes.length===1) //single
          {
            //console.log('single');
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            //checkBookmark_NewLayout(this);
            setHover(this.childNodes[1]);
          }
          //manga-style arts hover-------------------------------------------------------
          else
          {
            //console.log('manga');
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            //checkBookmark_NewLayout(this);
            setMangaHover(this.childNodes[1], this.firstChild.childNodes[1].textContent);
          }
        });
        */
        $('body').on(previewEventType, 'a[href*="/artworks/"] > div:nth-child(2) ', function(e)
        {
          e.preventDefault();
          //single art hover-------------------------------------------------------------
          if (this.parentNode.firstChild.childNodes.length===1) //single
          {
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            setHover(this.childNodes[0]); //todo? - zero child-node trying?
          }
          //manga-style arts hover-------------------------------------------------------
          else
          {
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            setMangaHover(this.childNodes[0], this.parentNode.firstChild.childNodes[1].textContent);
          }
        });
      }
      //----------------------DAILY RANKINGS & BOOKMARK INFORMATION PAGES---------------- //4,6 [10]
      else if (PAGETYPE === 4 || PAGETYPE === 6 || PAGETYPE === 10)
      {
        $('body').on(previewEventType, 'a[href*="/artworks/"]', function(e) //direct div selector works badly with "::before"
        {
          e.preventDefault();

          if (this.childNodes.length == 1 && this.childNodes[0].nodeName=="DIV") //single art
          {
            bookmarkObj = $(this.firstChild.firstChild).parent().children("._one-click-bookmark");
            checkBookmark(this);
            setHover(this.firstChild.firstChild);
          }
          else if (this.children[1] && this.children[1].className == 'page-count') //manga
          {
            bookmarkObj = $(this.firstChild.firstChild).parent().children("._one-click-bookmark");
            checkBookmark(this);
            setMangaHover(this.firstChild.firstChild, this.children[1].children[1].textContent);
          }
        });
      }
      //--------------------------------------BOOKMARKS---------------------------------- //9
      else if (PAGETYPE === 9)
      {
        $('body').on(previewEventType, '.work', function(e) //direct div selector works badly with "::before"
        {
          e.preventDefault();

          if (this.childNodes.length == 1 && this.childNodes[0].nodeName=="DIV") //single art
          {
            bookmarkObj = $(this.firstChild.firstChild).parent().children("._one-click-bookmark");
            checkBookmark(this);
            setHover(this.firstChild.firstChild);
          }
          else if (this.children[1] && this.children[1].className == 'page-count') //manga
          {
            bookmarkObj = $(this.firstChild.firstChild).parent().children("._one-click-bookmark");
            checkBookmark(this);
            setMangaHover(this.firstChild.firstChild, this.children[1].children[1].textContent);
          }
        });
      }
      //------------------------------------Feed('stacc')-------------------------------- //11 - currently broken
      /*
      else if (PAGETYPE === 11)
      {
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="]', function(e)
        {
          e.preventDefault();

          if (this.childNodes.length == 1 && this.childNodes[0].nodeName=="DIV")
          {
            if ($(this).hasClass('multiple')) //manga
            {
              let link = 'https://www.pixiv.net/ajax/illust/' + this.href.split('&')[1].split('=')[1];
              let that = this;

              let xhr = new XMLHttpRequest();
              xhr.responseType = 'json';
              xhr.open("GET", link, true);
              xhr.onreadystatechange = function ()
              {
                if (xhr.readyState == 4 && xhr.status == 200)
                {
                  let count = this.response.body.pageCount;
                  console.log(count);
                  setMangaHover(that.childNodes[1].childNodes[1], count);

                  if (!(that.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('imageCount').length>0)) //todo?..
                  {
                    let s = document.createElement('span');
                    s.className = 'imageCount';
                    s.style = 'position:relative; display: inline-block; float: right; top:-240px;'
                    s.textContent = count;
                    that.parentNode.parentNode.parentNode.parentNode.appendChild(s);
                  }
                }
              };
              xhr.send();
            }
            else setHover(this.childNodes[1].childNodes[1]); //single art
          }
        });
      }
      */
      //---------------------------------------------------------------------------------
      if (currentSettings["DELAY_BEFORE_PREVIEW"]>0) $('body').on('mouseleave', 'a[href*="member_illust.php?mode=medium&illust_id="]', function()
      {
        clearTimeout(timerId);
      });
    });
    //===================================================================================
    //-----------------------------------------------------------------------------------
    function checkDelay(callback)
    {
      if (currentSettings["DELAY_BEFORE_PREVIEW"]>0){
        clearTimeout(timerId);
        timerId = setTimeout(callback, currentSettings["DELAY_BEFORE_PREVIEW"]);
      }
      else callback();
    }
    //-----------------------------------------------------------------------------------
    function setHover(thisObj, top)
    {
      clearTimeout(timerId);
      clearTimeout(tInt);
      mangaOuterContainer.style.visibility = 'hidden';

      hoverImg.src = parseImgUrl(thisObj, previewSize);
      imgContainer.style.top = top || getOffsetRect(thisObj.parentNode.parentNode).top+'px';

      //adjusting preview position considering expected image width
      //---------------------------------------------------------------------------------
      let l = (![2,7,12,13].includes(PAGETYPE)) //more accurate on discovery users
          ?getOffsetRect(thisObj.parentNode.parentNode).left
          :getOffsetRect(thisObj).left;
      let dcw = document.body.clientWidth;
      let previewWidth = 0;

      if (hoverImg.naturalWidth>0){ //cached (previously viewed)
        adjustSinglePreview(dcw, l, hoverImg.naturalWidth);
      }
      else{
        if (![2,7,12,13].includes(PAGETYPE)){
          let previewWidth = previewSize*(((PAGETYPE==6)?thisObj.clientWidth:thisObj.parentNode.parentNode.clientWidth)/siteImgMaxWidth)+5; //if not on NEW layout - width is predictable
          adjustSinglePreview(dcw, l, previewWidth);
        }
        else{
          if (dcw - l - previewSize - 5 > 0){ //if it is obvious that preview will fit on the screen then there is no need in setInterval(trying to use as minimun setInterval`s as possible)
            imgContainer.style.left = l+'px';
            checkDelay(function(){imgContainer.style.display='block';});
          }else{ //when on NEW layout - need to wait until image width is received
            let tLimit;
            tInt = setInterval(function(){
              if (hoverImg.naturalWidth>0){
                clearTimeout(tInt);
                //elementMouseIsOver = document.elementFromPoint(x, y); if (thisObj != elementMouseIsOver) break;
                adjustSinglePreview(dcw, l, hoverImg.naturalWidth); //position mismatching due to old `thisObj` => clearing in hoverImg.mouseleave
                ++tLimit;
              }
              if (tLimit*20>3000){ //in case of loading errors
                clearTimeout(tInt);
                hoverImg.src='';
                console.error('setInterval error');
              }
            }, 20);
          }
        }
      }
      //---------------------------------------------------------------------------------
      if (isBookmarked) $(imgContainer).css("background", "rgb(255, 64, 96)");
      else $(imgContainer).css("background", "rgb(34, 34, 34)");
    }
    //-----------------------------------------------------------------------------------
    function adjustSinglePreview(dcw, l, contentWidth)
    {
      let d = dcw - l - contentWidth - 5; //5 - padding - todo...
      imgContainer.style.left = (d>=0)?l+'px':l+d+'px';
      checkDelay(function(){imgContainer.style.display='block';});
    }
    //-----------------------------------------------------------------------------------
    function setMangaHover(thisObj, count)
    {
      clearTimeout(timerId);
      clearTimeout(tInt);
      imgContainer.style.display='none'; //just in case

      mangaOuterContainer.style.top = getOffsetRect(thisObj.parentNode.parentNode).top+'px';
      if (!currentSettings["ACCURATE_MANGA_PREVIEW"]) mangaOuterContainer.style.left = '30px';

      if (isBookmarked) $(mangaOuterContainer).css("background", "rgb(255, 64, 96)");
      else $(mangaOuterContainer).css("background", "rgb(34, 34, 34)");

      imgsArrInit(parseImgUrl(thisObj, previewSize), +count);
    }
    //-----------------------------------------------------------------------------------
    function imgsArrInit(primaryLink, l)
    {
      let currentImgId = getImgId(primaryLink);
      //console.log('lastImgId: ' + lastImgId);
      //console.log('currentImgId: ' + currentImgId);
      //---------------------------------------------------------------------------------
      if (currentImgId != lastImgId)
      {
        for(let j=0; j<imgsArr.length; j++)
        {
          imgsArr[j].src = '';
        }

        lastImgId = currentImgId;

        for(let i=0; i<l; i++)
        {
          if (!(!!imgsArr[i])) //if [i] img element doesn't exist
          {
            imgsArr[i] = document.createElement('img');
            mangaContainer.appendChild(imgsArr[i]);
          }
          imgsArr[i].src = primaryLink.replace('p0','p'+i);
        }

        if (currentSettings["ACCURATE_MANGA_PREVIEW"] == true || currentSettings["DELAY_BEFORE_PREVIEW"] > 1000) //more accurate frame adjusting
        {
          setTimeout(function()
          {
            adjustMargins(mangaOuterContainer.scrollWidth);
            checkDelay(function(){mangaOuterContainer.style.visibility='visible';});
          }, 1000);
        }
        else //some blind frame adjusting
        {
          adjustMargins(l*previewSize);
          checkDelay(function(){mangaOuterContainer.style.visibility='visible';});
        }
      }
      //---------------------------------------------------------------------------------
      else
      {
        adjustMargins(mangaOuterContainer.scrollWidth);
        checkDelay(function(){mangaOuterContainer.style.visibility='visible';});
      }
    }
    //-----------------------------------------------------------------------------------
    function parseImgUrl(thisObj, previewSize)
    {
      let url = (thisObj.src)? thisObj.src: thisObj.style.backgroundImage.slice(5,-2);
      url = url.replace(/\/...x..[0|8]/, '/'+previewSize+'x'+previewSize).
                replace('_80_a2','').
                replace('_square1200','_master1200').
                replace('_70','').
                replace('_custom1200','_master1200').
                replace('custom-thumb','img-master')
      ;
      return url;
    }
    //-----------------------------------------------------------------------------------
    function adjustMargins(width)
    {
      let margins = document.body.clientWidth - width;
      if (margins > 0) mangaOuterContainer.style.left = margins/2-10+'px';
      else mangaOuterContainer.style.left = '30px';
    }
    //-----------------------------------------------------------------------------------
    function checkBookmark(thisObj) //let this be until it works
    {
      isBookmarked = ($(bookmarkObj).hasClass("on"));
    }
    //-----------------------------------------------------------------------------------
    function getImgId(str)
    {
      return str.substring(str.lastIndexOf("/")+1, str.indexOf("_"));
    }
    //-----------------------------------------------------------------------------------
    function getOffsetRect(elem)
    {
      // (1)
      let box = elem.getBoundingClientRect();
      // (2)
      let body = document.body;
      let docElem = document.documentElement;
      // (3)
      let scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
      let scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
      // (4)
      let clientTop = docElem.clientTop || body.clientTop || 0;
      let clientLeft = docElem.clientLeft || body.clientLeft || 0;
      // (5)
      let top  = box.top +  scrollTop - clientTop;
      let left = box.left + scrollLeft - clientLeft;

      return { top: Math.round(top), left: Math.round(left) };
    }
    //===================================================================================
    //**************************************Hide*****************************************
    //===================================================================================
    imgContainer.onmouseleave = function()
    {
      imgContainer.style.display='none';
      hoverImg.src='';
      clearTimeout(timerId);
      clearTimeout(tInt);
    };
    //-----------------------------------------------------------------------------------
    mangaOuterContainer.onmouseleave = function()
    {
      mangaOuterContainer.style.visibility='hidden';
      clearTimeout(timerId);
    };
    //===================================================================================
    //***********************************Art Clicks**************************************
    //===================================================================================
    //-----------------------------Single arts onclick actions---------------------------
    hoverImg.onmouseup = function (event)
    {
      onClickActions(this, event, false);
    };
    //-----------------------------Manga arts onclick actions----------------------------
    $('body').on('mouseup', 'div#mangaContainer > img', function(event)
    {
      onClickActions(this, event, true);
    });
    //---------------------------------onClickActions------------------------------------
    async function onClickActions(imgContainerObj, event, isManga)
    {
      event.preventDefault();
      let illustId = getImgId(imgContainerObj.src);
      //----------------------------Middle Mouse Button click----------------------------
      if (event.button == 1)
      {
        let illustPageUrl = 'https://www.pixiv.net/artworks/' + illustId;
        window.open(illustPageUrl,'_blank'); //open illust page in new tab(in background — with FF pref "browser.tabs.loadDivertedInBackground" set to "true")
      }
      //----------------------------Left Mouse Button clicks...--------------------------
      else if (event.button == 0)
      {
        //----------------------------Single LMB-click-----------------------------------
        if (!event.altKey)
        {
          let toSave = event.ctrlKey;// Ctrl + LMB-click -> saving image
          let pageNum = 0;

          //Single (general url)
          let ajaxIllustUrl = 'https://www.pixiv.net/ajax/illust/' + illustId;

          //Manga
          if (isManga)
          {
            let src = imgContainerObj.src;
            pageNum = src.substring(src.indexOf("_")+2, src.lastIndexOf("_"));
          }

          getOriginalUrl(ajaxIllustUrl, event, pageNum, toSave);
        }
        //-----------------------------Alt + LMB-click-----------------------------------
        else if (event.altKey) {
          $(bookmarkObj).click();
          if (!isManga) $(imgContainerObj).parent().css("background", "rgb(255, 64, 96)");
          else $(mangaOuterContainer).css("background", "rgb(255, 64, 96)");
        }
        //-------------------------------------------------------------------------------
      }
      //---------------------------------------------------------------------------------
    }
    //---------------------------------getOriginalUrl------------------------------------
    async function getOriginalUrl(illustPageUrl, event, pageNum, toSave)
    {
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open("GET", illustPageUrl, true);
      xhr.onreadystatechange = function ()
      {
        if (xhr.readyState == 4 && xhr.status == 200)
        {
          let originalArtUrl = this.response.body.urls.original;
          if (pageNum>0) originalArtUrl = originalArtUrl.replace('p0','p'+pageNum);

          if (toSave)    saveImgByUrl(originalArtUrl);
          else           window.open(originalArtUrl, '_blank');
        }
      };
      xhr.send();
    }
    //-----------------------------------------------------------------------------------
    async function saveImgByUrl(sourceUrl)
    {
      const filename = sourceUrl.split('/').pop();
      const illustId = filename.split('_')[0];
      const ext = filename.split('.').pop().toLowerCase();
      const GMR = (typeof(GM_xmlhttpRequest)==='function')?GM_xmlhttpRequest:GM.xmlHttpRequest;

      //Thanx to FlandreKawaii(c)
      GMR({
        method: 'GET',
        url: sourceUrl,
        responseType: 'arraybuffer', //TM
        binary: true, //GM
        headers: {
          Referer: `https://www.pixiv.net/en/artworks/${illustId}`,
        },
        onload: function(response)
        {
          if (ext === 'jpg' || ext === 'jpeg')
            saveAs(new File([response.response], filename, { type: 'image/jpeg' }));
          else if (ext === 'png')
            saveAs(new File([response.response], filename, { type: 'image/png' }));
        }
      });
    }
    //===================================================================================
    //**************************************Other****************************************
    //===================================================================================
    mangaContainer.onwheel = function(e)
    {
      if (e.deltaY<0 && (mangaOuterContainer.getBoundingClientRect().top < 0))
      {
        mangaOuterContainer.scrollIntoView({block: "start", behavior: "smooth"}); //aligning to top screen side on scrollUp if needed
      }
      else if (e.deltaY>0 && (mangaOuterContainer.getBoundingClientRect().bottom > document.documentElement.clientHeight))
      {
        mangaOuterContainer.scrollIntoView({block: "end", behavior: "smooth"}); //aligning to bottom screen side on scrollDown if needed
      }

      let scrlLft = mangaContainer.scrollLeft;
      if ((currentSettings["DISABLE_MANGA_PREVIEW_SCROLLING_PROPAGATION"]) || ((scrlLft>0 && e.deltaY<0) || ((scrlLft<(mangaContainer.scrollWidth-mangaContainer.clientWidth)) && e.deltaY>0)))
      {
        e.preventDefault();
        mangaContainer.scrollLeft += e.deltaY*DELTASCALE;
      }
    };
    //-----------------------------------------------------------------------------------
    if (currentSettings["SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE"]) imgContainer.onwheel = function(e)
    {
      if (currentSettings["DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING"]) e.preventDefault();

      if (e.deltaY<0 && (imgContainer.getBoundingClientRect().top < 0))
      {
        imgContainer.scrollIntoView({block: "start", behavior: "smooth"}); //aligning to top screen side on scrollUp if needed
      }
      else if (e.deltaY>0 && (imgContainer.getBoundingClientRect().bottom > document.documentElement.clientHeight))
      {
        imgContainer.scrollIntoView({block: "end", behavior: "smooth"}); //aligning to bottom screen side on scrollDown if needed
      }
    };
    //-----------------------------------------------------------------------------------
    window.onresize = function()
    {
      mangaWidth = document.body.clientWidth - 80;
      mangaContainer.style.maxWidth = mangaOuterContainer.style.maxWidth = mangaWidth+'px';
      resetPreviewSize();
    };
    //-----------------------------------------------------------------------------------
    document.onkeyup = function(e) //Enlarge with shift
    {
      //console.log(e.keyCode);
      if (e.keyCode == 16 && hoverImg.src && previewSize<1200)
      {
        let l = getOffsetRect(imgContainer).left;
        let w = hoverImg.naturalWidth*2+5;
        hoverImg.src = hoverImg.src.replace(/\/...x..[0|8]/, '/1200x1200');
        imgContainer.style.left = (document.body.clientWidth-l < w)? document.body.clientWidth-w +'px': l +'px';
      }
    }
    //===================================================================================
    //***********************************************************************************
    //===================================================================================
  });
}) (); //function
