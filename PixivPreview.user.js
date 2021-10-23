// ==UserScript==
// @name            Pixiv Arts Preview & Followed Atrists Coloring
// @name:ru         Pixiv Arts Preview & Followed Atrists Coloring
// @namespace       Pixiv
// @description     Enlarged preview of arts and manga on mouse hovering on most pages. Click on image preview to open original art in new tab, or MMB-click to open art illustration page, Alt+LMB-click to to add art to bookmarks, Ctrl+LMB-click for saving originals of artworks. The names of the authors you are already subscribed to are highlighted with green. Settings can be changed in proper menu.
// @description:ru  Увеличённый предпросмотр артов и манги по наведению мышки на большинстве страниц. Клик ЛКМ по превью арта для открытия исходника в новой вкладке, СКМ для открытия страницы с артом, Alt + клик ЛКМ для добавления в закладки, Ctrl + клик ЛКМ для сохранения оригиналов артов. Имена авторов, на которых вы уже подписаны, подсвечиваются зелёным цветом. Настройки можно изменить в соответствующем меню.
// @author          NightLancerX
// @version         2.55
// @match           https://www.pixiv.net/bookmark_new_illust.php*
// @match           https://www.pixiv.net/discovery*
// @match           https://www.pixiv.net/ranking.php*
// @match           https://www.pixiv.net/*artworks/*
// @match           https://www.pixiv.net/*users/*
// @match           https://www.pixiv.net/history.php*
// @match           https://www.pixiv.net/bookmark_detail.php?illust_id=*
// @match           https://www.pixiv.net/*tags/*
// @match           https://www.pixiv.net/*
// @connect         i.pximg.net
// @connect         techorus-cdn.com
// @connect         i-cf.pximg.net
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @supportURL      https://greasyfork.org/uk/users/167506-nightlancerx
// @downloadURL     https://greasyfork.org/scripts/39387-pixiv-arts-preview-followed-atrists-coloring/code/Pixiv%20Arts%20Preview%20%20Followed%20Atrists%20Coloring.user.js
// @license         MIT; https://github.com/NightLancer/PixivPreview/blob/master/LICENSE
// @copyright       NightLancerX
// @grant           GM_xmlhttpRequest
// @grant           GM.xmlHttpRequest
// @require         https://code.jquery.com/jquery-3.3.1.min.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/1.3.8/FileSaver.min.js
// @noframes
// ==/UserScript==
//=======================================================================================
(function ()
{
  'use strict';

  if (window.top == window.self && window.jQuery) jQuery(function($) //window.top check may be useless because of @noframes
  {
    console.log('MyPixivJS');

    //---------------------------***CUSTOM PREFERENCES***--------------------------------
    let propList = [
        {paramIndex:0, array:[false,true], name:"PREVIEW_ON_CLICK"},
        {paramIndex:0, array:[0, 100, 200, 300, 500, 1000, 1500], name:"DELAY_BEFORE_PREVIEW"},
        {paramIndex:0, array:["auto", 600, 1200], name:"PREVIEW_SIZE"},
        {paramIndex:0, array:[false,true], name:"ACCURATE_MANGA_PREVIEW"},
        {paramIndex:0, array:[false,true], name:"DISABLE_MANGA_PREVIEW_SCROLLING_PROPAGATION"},
        {paramIndex:1, array:[false,true], name:"SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE"},
        {paramIndex:0, array:[false,true], name:"DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING"},
        {paramIndex:0, array:[false,true], name:"HIDE_PEOPLE_WHO_BOOKMARKED_THIS"},
        {paramIndex:0, array:[false,true], name:"HIDE_FOLLOWED_USERS_ON_DISCOVERY_PAGE"}
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
    // auto : automatically calculate preview size (1200 or 600) depending of current screen size (default)
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
    //
    // ■ HIDE_PEOPLE_WHO_BOOKMARKED_THIS =
    // false: don't change `bookmark_detail.php` page (default)
    // true: hide "People who bookmarked this" section

    let currentSettings = {};
    //-----------------------------------------------------------------------------------
    let hoverImg = document.createElement('img');

    let imgContainer = document.createElement('div');
        imgContainer.style = 'position:absolute; display:block; visibility:visible; z-index:1000; background:#222; padding:5px; margin:-5px;';
        imgContainer.appendChild(hoverImg);

    let mangaContainer = document.createElement('div');
        mangaContainer.id = 'mangaContainer';
        mangaContainer.style = 'display:block; z-index:1500; background:#111; overflow-x:auto; maxWidth:1200px; white-space:nowrap;';

    let mangaOuterContainer = document.createElement('div');
        mangaOuterContainer.style = 'position:absolute; display:block; visibility:hidden; z-index:1000; padding:5px; background:#111; maxWidth:1200px; marginY:-5px; marginX: auto; left: 30px;';
        mangaOuterContainer.appendChild(mangaContainer);

    let imgsArr = [], //for manga-style image packs...
        followedUsersId = {}, //storing followed users pixiv ID
        BOOKMARK_URL = 'https://www.pixiv.net/ajax/user/XXXXXXXX/following?limit=100&tag=&lang=en',//&offset=0&rest=show'
        USER_ID,
        artsLoaded = 0,
        totalHits = 0,
        lastImgId = -1,
        PREVIEWSIZE,
        siteImgMaxWidth = 184, //2,7,12 [NEW]| quite useless on this pages because of square previews...
        mangaWidth = 1200,
        maxRequestTime = 30000,
        bookmarkObj,
        isBookmarked = false, //rework or delete. Arts can be bookmarked on art page.
        DELTASCALE = ('mozInnerScreenX' in window)?70:4,
        previewEventType,
        PAGETYPE = checkPageType(),
        followedCheck = {
          id:0,                                                                          //backuping user id in case of cookie errors
          status:0,                                                                      //-1: error, 0:default, 1:in progress, 2:done
          date:0,                                                                        //date of last successful check
          saveState(){
            localStorage.setObj('followedCheck', this);
          },
          loadState(){
            this.id     = localStorage.getObj('followedCheck') && localStorage.getObj('followedCheck').id     || 0;
            this.status = localStorage.getObj('followedCheck') && localStorage.getObj('followedCheck').status || 0;
            this.date   = localStorage.getObj('followedCheck') && localStorage.getObj('followedCheck').date   || 0;
            //this.status = localStorage.getObj('followedCheck')?.status || 0;           //wanna use this,
            //this.date   = localStorage.getObj('followedCheck')?.date   || 0;           //but compatibility... -_-
          }
        };

    var timerId, tInt, menuTimer;
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
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?users\/\d+\/bookmarks\/artworks/))        return 7; //Bookmarks page - New +
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?users/))                                  return 2; //Artist works page - New +
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?tags/))                                   return 8; //Search page - New +
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?artworks/))                               return 12; //Illust page - New* +
      if (document.URL.match('https://www.pixiv.net/discovery/users?'))                                     return 13; //Discovery page(users) New +
      if (document.URL.match('https://www.pixiv.net/history.php'))                                          return 14; //History - Old +~
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/(?:en\/)?/))                                       return 10; //Home page - New + | actually matches any page...

      return -1;
    }
    console.log('PAGETYPE:',PAGETYPE);
    //Old:          0 1   4 6              14
    //New:              2     7 8 10 12 13
    //==============----------------------------
    //Coloring:     = 1 = 4 6 7 8 10 12 == ~~ //
    //Profile card: 0 1 = 4 6 7 8 10 12 == == //
    //On following: = 1 2 4 6 7 8 ?? 12 13 == //
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
          propList[i].paramIndex = 0; // "0" is not default for all settings...
          console.error(`localStorage error! Setting ${propList[i].name} has been reset to default value! [${propList[i].array[propList[i].paramIndex]}]`);
        }
      }
      console.log("Settings loaded");
    }
    //-----------------------------------------------------------------------------------
    loadSavedSettings();
    setCurrentSettings();
    //-----------------------------------------------------------------------------------
    previewEventType = (currentSettings["PREVIEW_ON_CLICK"])?'click':'mouseenter';       //need to be 'click' for overwriting default site event handlers

    function resetPreviewSize(){PREVIEWSIZE = (currentSettings["PREVIEW_SIZE"] > 0)?currentSettings["PREVIEW_SIZE"]:(window.innerHeight>1200 & document.body.clientWidth>1200)?1200:600}
    //===================================================================================
    //**********************************ColorFollowed************************************
    //===================================================================================
    if ([1,4,6,7,8,10,12].includes(PAGETYPE))
    {
      checkFollowedArtists();
    }
    //-----------------------------------------------------------------------------------
    function makeArgs(baseUrl, total){
      let arr = [];
      for(let i = 1; i < Math.ceil(total / 100); i++){                                   //from 1 - because we already have first 100 users
        arr.push(baseUrl + "&offset=" + i + "00");
      }
      return arr;
    }
    //-----------------------------------------------------------------------------------
    async function getUserId(){
      USER_ID = USER_ID
      || Object.keys(localStorage).filter(e => e.match('viewed_illust')).map(a => a.match(/\d+/)).flat()[0]
      || (followedCheck && followedCheck.id) && followedCheck.id
      || (document.cookie.match(/user_id=\d+/)) && document.cookie.match(/user_id=\d+/)[0].split("=").pop()
      || (await fetch('https://www.pixiv.net/bookmark.php')).url.match(/\d{3,}/)[0];

      if (!USER_ID) return Promise.reject('FATAL ERROR in obtaining user ID! Please report this on GitHub "Issues"');
    }
    //-----------------------------------------------------------------------------------
    async function checkFollowedArtists()
    {
      followedCheck.loadState();

      if (((Date.now()-23*60*60*1000) > followedCheck.date) || (followedCheck.status < 2) || !localStorage['followedUsersId']){
        console.log('*Followed check started*');

        followedCheck.status = 1;
        followedCheck.saveState();

        await getUserId().catch(e => followedCheckError(e));
        if (USER_ID>0){
          BOOKMARK_URL = BOOKMARK_URL.replace("XXXXXXXX", USER_ID);
        }
        else return -1;

        //make first requestFollowed separately for obtaining count of followed users, both public/private
        let response0 = [];
        try{
          response0 = await Promise.all([requestFollowed(BOOKMARK_URL+'&rest=show&offset=0'), requestFollowed(BOOKMARK_URL+'&rest=hide&offset=0')]);
        }
        catch(error){
          console.error("Error with initial bookmark url!");
          followedCheckError(error);
          return -1;
        }
        for(const i of response0) i.body.users.forEach(user => followedUsersId[user.userId] = true); //todo: '1' instead -> less localStorage space

        let args = [];
        let len = response0.map(r => r.body.total);

        args =      makeArgs(BOOKMARK_URL+'&rest=show', len[0]);  //public
        args.concat(makeArgs(BOOKMARK_URL+'&rest=hide', len[1])); //private

        //100 parallel requests in case of 10K users. TODO: find maximum amount and part requests
        let responseArray = [];
        try{
          responseArray = await Promise.all(args.map(requestFollowed));
        }
        catch(error){
          followedCheckError(error);
          return -1;
        }
        for(const r of responseArray) r.body.users.forEach(user => followedUsersId[user.userId] = true);

        localStorage.setObj('followedUsersId', followedUsersId);
        followedCheck.id = USER_ID;
        followedCheck.status = 2;
        followedCheck.date = Date.now();
        followedCheck.saveState();
        console.log('*Followed check completed*');
        console.log('Obtained', Object.keys(followedUsersId).length, 'followed users');
      }
      else{
        followedUsersId = localStorage.getObj('followedUsersId');
        console.log(`followedCheck is up to date of ${new Date(followedCheck.date).toLocaleString()}`);
      }
    }
    //-----------------------------------------------------------------------------------
    async function requestFollowed(url)
    {
      return new Promise(function (resolve, reject){
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.timeout = 10000;
        xhr.open('GET', url, true);

        xhr.onload = function(){
          if (xhr.status == 200)
            resolve(this.response);
          else
            reject({status: this.status, message: this.response.message, url:this.responseURL});
        };

        xhr.onerror = xhr.ontimeout = function(){
          reject({status: this.status, message: this.response.message, url:this.responseURL});
        };

        xhr.send();
      });
    }
    //-----------------------------------------------------------------------------------
    function followedCheckError(error){
      console.error(error);
      followedCheck.status = -1;
      followedCheck.saveState();
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

      //wait until last XHR completed if it is not---------------------------------------
      followedCheck.loadState();

      if (followedCheck.status == 1){
        while (!(followedCheck.status == 2)){
          console.log("waiting for followed users..."); //this could happen in case of huge followed users amount
          await sleep(2000);
          followedCheck.loadState();

          ++d;
          if (d*2000 > maxRequestTime || followedCheck.status == -1){
            console.error(`ERROR while EXPECTING for subscriptions list! [${d*2000/1000}s]`);
            break;
          }
        }
      }

      //load from localStorage in any errors
      if (followedCheck.status <= 0 || Object.keys(followedUsersId).length == 0){
        console.error(`There was some error during followed users check [Error Code: ${followedCheck.status}]`);
        console.log(`Trying to load cached followedUsersId by date of ${new Date(followedCheck.date).toLocaleString()} ...`);

        followedUsersId = localStorage.getObj('followedUsersId');
        if (followedUsersId && Object.keys(followedUsersId).length > 0){
          console.log("Loaded cached", Object.keys(followedUsersId).length, "followed users");
        }
        else{
          console.error('There is no locally stored followed users entries!');
          return -1;
        }
      }
      //---------------------------------------------------------------------------------
      console.log('arts loaded:', artsContainersLength, 'Total:', getArtsContainers().length);

      let hitContainers = [];
      let currentHits = 0;

      hitContainers = [].filter.call(artsContainers, container => followedUsersId[getAuthorIdFromContainer(container)] === true); // -> '1' -> '=='

      if (currentSettings["HIDE_FOLLOWED_USERS_ON_DISCOVERY_PAGE"] && PAGETYPE===1)
        hitContainers.forEach(container => container.remove());
      else
        hitContainers.forEach(container => container.setAttribute("style", "background-color: green; !important"));

      currentHits = hitContainers.length;
      totalHits += currentHits;

      console.log('hits: '+currentHits + ' (Total: '+(totalHits)+')');
    }
    //-----------------------------------------------------------------------------------
    function getArtsContainers()
    {
      switch (PAGETYPE){
        case 1:
        case 4:
        case 6:  return document.querySelectorAll('.ui-profile-popup'); //document.querySelectorAll('.gtm-illust-recommend-user-name');

        case 12: return document.querySelectorAll('.gtm-illust-recommend-title');

        case 7:
        case 8:
        case 10: return document.querySelectorAll('a[href*="/artworks/"]:only-child'); //('li > div > div > a'); Done?

        default:  console.error('Unprocessed PAGETYPE in getArtsContainers()!');
      }
      return null;
    }
    //-----------------------------------------------------------------------------------
    function getAuthorIdFromContainer(artContainer)
    {
      let userId = -1;

      if(!artContainer){
        console.error('UNPROCESSED getAuthorIdFromContainer() call!');
      }
      else if (typeof artContainer.hasAttribute !== 'function'){
        console.log(artContainer, 'has been filtered out.');
      }
      else if (PAGETYPE===1 || PAGETYPE===4 || PAGETYPE===6){
        userId = artContainer.getAttribute('data-user_id') || artContainer.querySelector('.ui-profile-popup').getAttribute('data-user_id');
      }
      else if (PAGETYPE===12){
        userId = artContainer.querySelector('[href*="/users/"]').getAttribute('href').split('/').pop(); //searchNearestNode if needed
      }
      else if (PAGETYPE===7 || PAGETYPE===10){
        userId = searchNearestNode(artContainer,'[href*="/users/"]').getAttribute('href').split('/').pop();
        //Array.slice(artcontainers).map((e) => searchNearestNode(e,'[href*="/users/"]').getAttribute('href').split('/').pop() )
      }
      else if(PAGETYPE===8){
        let node = searchNearestNode(artContainer,'[href*="/users/"]');
        userId = (node)? node.getAttribute('href').split('/').pop(): -1;
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
    function getArtSectionContainers()
    {
      switch(PAGETYPE)
      {
        case 1:
        case 4:  return $('.gtm-illust-recommend-zone')[0]

        case 6:  return $('.ranking-items')[0]
        case 8:  return $("section>div>ul")[0]
        case 10: return $("div[id='root']>div>div:nth-child(2)")[0]
        case 12: return $('.gtm-illust-recommend-zone ul')[0]

        default: return 0;
      }
    }
    //-----------------------------------------------------------------------------------
    let observer = {
      mutationObserver: null,

      init(func){
        this.mutationObserver = new MutationObserver((mutations)=>{func(mutations)});
      },

      observe(mainDiv, options){
        this.mutationObserver.observe(mainDiv, options);
        console.log('Observer has been set');
      },

      disconnect(){
        this.mutationObserver.disconnect();
      }
    }
    //-----------------------------------------------------------------------------------
    let renewObserver = Object.assign({}, observer); //copy new instance of object
    //-----------------------------------------------------------------------------------
    function observerBody(mutations)
    {
      let arr = [];
      mutations.forEach(function(mutation)
      {
        mutation.addedNodes.forEach(function(node)
        {
          if (PAGETYPE == 10){
            if (node.nodeName == "IMG" && node.matches('img:not([class*=" "])')){    //todo: very unstable condition(>=2 img classes)
              arr.push(searchNearestNode(node, 'a[href*="/artworks/"]'));
            }
            else if (node.nodeName == "DIV"){
              node.querySelectorAll('a[href*="/artworks/"]:only-child').forEach((el)=>arr.push(el));
            }
          }
          else if (PAGETYPE == 12 && (!!node.querySelector('iframe'))){
            node.remove(); //filtering promo blocks
          }
          else{
            arr.push(node);
          }

        });
      });

      if (arr.length>0) colorFollowed(arr);
    }
    //-----------------------------------------------------------------------------------
    observer.init(observerBody);
    //-----------------------------------------------------------------------------------
    async function initMutationObject(options)
    {
      let mainDiv = getArtSectionContainers();
      let c = 0;
      while(!mainDiv)
      {
        console.log('Waiting for arts container...');
        await sleep(1000);
        mainDiv = getArtSectionContainers();

        ++c;
        if (c>10) {console.error('Error while waiting for arts containers! [Timeout 10s]'); return -1}
      }
      console.log(mainDiv);
      observer.observe(mainDiv, options)
    }
    //-----------------------------------------------------------------------------------
    function searchNearestNode(el, selector)
    {
      let nearestNode = el.querySelector(selector);
      while ((!nearestNode) && (el != document.body)){
        el = el.parentNode;
        nearestNode = el.querySelector(selector);
      }
      return nearestNode;
    }
    //-----------------------------------------------------------------------------------
    function followage(thisObj, toFollow, isNew) //In case of followed check lasting too long, async queue may be a solution
    {
      console.log('toFollow: '+ toFollow);
      let userId = searchNearestNode(thisObj, '[href*="/users/"]').getAttribute('href').split('/').filter(el => el.match(/\d+/))[0];

      if (!(userId>0)) console.error(`Wrong userId! ${userId}`);

      if (localStorage.getObj('followedCheck').status == 2) //at least basic check until queue is developed
      {
        if (Object.keys(followedUsersId).length == 0)
          followedUsersId = localStorage.getObj('followedUsersId');

        if (toFollow){
          followedUsersId[userId] = true; // '1'
          if ([2,12].includes(PAGETYPE)){
            initFollowagePreview();
          }
        }
        else
          delete followedUsersId[userId];

        localStorage.setObj('followedUsersId', followedUsersId);
        console.log('userId ' + userId + [(toFollow)?' added to':' deleted from'] + ' localStorage. Followed: '+ Object.keys(followedUsersId).length);
      }
      else console.error('Slow down! You have subscribed too many to handle this by now! Wait for the next updates or let me know.');
    }
    //-------------------------------------Followage-------------------------------------
    async function initFollowagePreview()
    {
      let recommendationBlock;
      let c = 0;

      while(!recommendationBlock)
      {
        console.log('Waiting for FollowagePreview');
        await sleep(1000);
        recommendationBlock = getElementByXpath("//div[contains(., 'Recommended users')]");

        ++c;
        if (c>10) {console.error("Error while waiting for recommendationBlock! [Timeout 10s]"); return -1}
      }
      console.log('*FollowagePreview loaded*');

      //let recommendationObserver = Object.assign({}, observer);

      let scrollBackward = recommendationBlock.querySelector('div:nth-child(3) > div:nth-child(2) > button:nth-child(1)');
      let scrollForward  = recommendationBlock.querySelector('div:nth-child(3) > div:nth-child(2) > button:nth-child(2)');

      recommendationBlock.onwheel = function(e){
        e.preventDefault(); //no need
        if (e.deltaY > 0) scrollForward.click()
        else scrollBackward.click();
      };

      $(recommendationBlock).on(previewEventType, 'a:not([href*="/users/"]) img', function(e)
      {
        e.preventDefault();
        //let top = window.innerHeight - PREVIEWSIZE - 5 + window.scrollY + 'px';
        let top = window.scrollY + 5 + 'px';
        setHover(this, top);
      });
    }
    //---------------------------------------History-------------------------------------
    // let illust_history = {
    //   ids: [],
    //   timestamp: {},
    //
    //   init(){
    //     this.ids = localStorage.getObj('viewed_illust_ids') || USER_ID && localStorage.getObj('viewed_illust_ids_' + USER_ID).data || [];
    //     this.timestamp = localStorage.getObj('viewed_illust_timestamp') || USER_ID && localStorage.getObj('viewed_illust_timestamp_' + USER_ID).data || {};
    //     console.log('History initialized');
    //   },
    //
    //   save(){
    //     localStorage.setObj('viewed_illust_ids', this.ids);             //viewed_illust_ids
    //     localStorage.setObj('viewed_illust_timestamp', this.timestamp); //viewed_illust_timestamp
    //   },
    //
    //   add_record(illust_id, view_date){
    //     if (this.ids.indexOf(illust_id.toString()) == -1){
    //       this.ids.push(illust_id.toString());
    //     }
    //     this.timestamp[illust_id] = view_date || Date.now()/1000;
    //
    //     this.save();
    //     console.log(illust_id, "has been added to history record");
    //   },
    //
    //   delete_record(illust_id){
    //     let index = this.ids.indexOf(illust_id.toString());
    //     if (index > -1){
    //       this.ids.splice(index, 1);
    //     }
    //     delete this.timestamp[illust_id];
    //
    //     this.save();
    //     console.log(illust_id, "has been deleted from history record");
    //   }
    // }
    // getUserId().then(v => illust_history.init()).catch(e => console.error('History not initialized: no userID'));
    //===================================================================================
    if      (PAGETYPE===0 || PAGETYPE===1)  siteImgMaxWidth = 198;
    else if (PAGETYPE===4)                  siteImgMaxWidth = 150;
    else if (PAGETYPE===6 || PAGETYPE===14) siteImgMaxWidth = 240;
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
                        display: block;
                        visibility: hidden;
                        top: 60px;
                        left: 10px;
                        padding: 5px 5px 5px 20px;
                        border: 2px solid deepskyblue;
                        border-radius: 15px;
                        background: white;
                        font-size: 14px;
                        line-height: 17px;
                        color: rgb(0, 0, 0);
                        border-radius: 15px;
                        word-wrap: normal;
          `;

      //filling menu fields with values and property names
      for (let i = 0; i < propList.length; i++){
        menu.innerHTML += `<li style = 'font:inherit;'><button style = 'width: 40px; padding: 0px; margin-right: 5px;'>${propList[i].array[propList[i].paramIndex]}</button>${propList[i].name}</li>`
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

        let c = 0;
        while (!menuButton){
          if ([2,7,8,10,12].includes(PAGETYPE))
            buttons = document.querySelectorAll('body > div#root > div > div:nth-child(1) button');
          else
            buttons = document.querySelectorAll('body > div#js-mount-point-header > div:nth-child(1) button'); //$('#js-mount-point-header button'); (Replace with own button later?...)

          menuButton = buttons[buttons.length - 1]; // last is the menu button
          console.log(menuButton);
          await sleep(1000);
          ++c;
          if (c>5){
            console.log('*Setting menu currently unavailable on this page*');
            break;
          }
        }

        if (menuButton)
          menuButton.addEventListener("click", function(){
            menu.style.visibility = 'visible';
            clearTimeout(menuTimer);
            menuTimer = setTimeout(()=>{menu.style.visibility = 'hidden'}, 60*1000); //closing menu after 60s to prevent "hanging" it in one tab
          });
        else
          console.error("menuButton is undefined!");
      }
      //---------------------------------------------------------------------------------
      $(document).mouseup(function (e){
        if (!($(menu).has(e.target).length) && (menu.style.visibility == 'visible')){
          menu.style.visibility = 'hidden';
          saveSettings();
          setCurrentSettings();
          clearTimeout(menuTimer);
        }
      });
      //---------------------------------------------------------------------------------
      initMenu();
      //-------------------------------Follow onclick------------------------------------
      let toFollow, followSelector;
      //---------------------------------------------------------------------------------
      function reInitFollowagePreview()
      {
        if ([2,7,8,12].includes(PAGETYPE)){
          followSelector = 'button:contains("Follow")';
        }
        else if([1,4,6,13].includes(PAGETYPE)){
          followSelector = '.follow-button';
        }
        else return 0;

        $('body').off('mouseup', followSelector); //clearing previous events

        if([1,2,4,6,7,8,12,13].includes(PAGETYPE))
        {
          $('body').on('mouseup', followSelector, function(){
            toFollow = (this.textContent == 'Follow'); //~mustn't work on non-English locale| todo: add some locale-specific text condition?
            followage(this, toFollow);
          });
        }
      }
      //---------------------------------------------------------------------------------
      reInitFollowagePreview();
      //=================================================================================
      function reInitMutationObservers()
      {
        //----------------------------Bookmark detail page cleaning----------------------
        if (PAGETYPE===4)
        {
          if (currentSettings["HIDE_PEOPLE_WHO_BOOKMARKED_THIS"])
            $('.bookmark-list-unit')[0].remove();
        }
        //------------------------------Daily rankings ad cleaning-----------------------
        if (PAGETYPE===6)
        {
          colorFollowed();
          $('.ad-printservice').remove();
        }
        //-------------------------------Illust page extra check-------------------------
        if (PAGETYPE===12)
        {
          initMutationObject({'childList': true});
          //illust_history.add_record(location.href.match(/\d+/)[0]); //todo: revoke in case of no ID
        }
        //-----------------------------Init illust fetch listener------------------------
        if (PAGETYPE===1 || PAGETYPE===4 || PAGETYPE===6)
        {
          initMutationObject({'childList': true});
        }
        //----------------------------------Search (tags)--------------------------------
        if (PAGETYPE===8)
        {
          initMutationObject({'childList': true});
        }
        //-------------------------------Home page listener------------------------------
        if (PAGETYPE===10)
        {
          initMutationObject({'childList': true, 'subtree': true});
        }
        //---------------------------------Pixiv Member pages----------------------------
        if (PAGETYPE===2 || PAGETYPE===7)
        {
          $('body').off('mouseup', 'a[href*="bookmarks/artworks"]');
          $('body').off('mouseup', 'a[href*="/illustrations"]');

          $('body').on('mouseup', 'a[href*="bookmarks/artworks"]', function(){
            console.log('PAGETYPE: '+ PAGETYPE+' -> 7');
            PAGETYPE = 7;
            bookmarksInit();
          });
          $('body').on('mouseup', 'a[href*="/illustrations"]', function(){
            console.log('PAGETYPE: '+ PAGETYPE+' -> 2');
            PAGETYPE = 2;
          });
        }
        //-------------------------------------------------------------------------------
        async function bookmarksInit()
        {
          await checkFollowedArtists();
          let c = 0;
          let mainDiv = document.querySelector('section');
          while(!mainDiv)
          {
            console.log('Waiting for arts section [bookmarksInit]');
            await sleep(1000);
            mainDiv = document.querySelector('section');

            ++c;
            if (c>10) {console.error('Error while waiting for arts section [bookmarksInit]! [Timeout 10s]'); return -1;}
          }
          console.log(mainDiv);

          colorFollowed();
          //Promise.all([checkFollowedArtists(), getArtsSection()]).then(v => colorFollowed(), e => {console.log(e); console.trace();}); //TODO
        }
        //------------------------------------Bookmarks----------------------------------
        if (PAGETYPE===7)
        {
          bookmarksInit();
        }
      } //reInitMutationObservers()
      //-------------------------------------------------------------------------------
      reInitMutationObservers();
      //=================================================================================
      //***************************************HOVER*************************************
      //=================================================================================
      //------------------------------------Profile card--------------------------------- //0,1,4,6,9 [2,7,8,10,12]
      function initProfileCard()
      {
        if ([0,1,4,6,9].includes(PAGETYPE))
        {
          $('body').on(previewEventType, 'section._profile-popup a[href*="/artworks/"]', function(e)
          {
            console.log('Profile card');
            e.preventDefault();

            setHover(this, getOffsetRect(this).top+200+'px', true);
          });
        }
      }

      initProfileCard();
      //-------------------------NEW ILLUSTRATIONS, DISCOVERY[ARTWORKS] ----------------- //0,1
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
        $('body').on(previewEventType, 'a[href*="/artworks/"] > div:nth-child(2)', function(e)
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
      function setTabSwitchingListenerW_U() //no need anymore? - excessive for now
      {
        $('body').off('mouseup','a[href="/discovery"]');

        $('body').on('mouseup','a[href="/discovery/users"]', function()
        {
          console.log('Works -> Users');
          PAGETYPE = 13;
          artsLoaded = totalHits = 0; //clearing loaded arts count when switching on tabs

          $('body').off(previewEventType, 'a[href*="/artworks/"]');
          $('body').off(previewEventType, 'a[href*="/artworks/"] > div:only-child');
          $('body').off(previewEventType, 'a[href*="/artworks/"] > div:nth-child(2)');

          setDiscoveryUsersPreviewEventListeners();
          setTabSwitchingListenerU_W();
        });
      }
      //--------------------------------------------------------------------------------- //13->1
      function setTabSwitchingListenerU_W() //no need anymore? - excessive for now
      {
        $('body').off('mouseup','a[href="/discovery/users"]');

        $('body').on('mouseup','a[href="/discovery"]', function()
        {
          console.log('Users -> Works');
          PAGETYPE = 1;
          artsLoaded = totalHits = 0; //not necessary
          checkFollowedArtists();
          initMutationObject({'childList': true});

          $('body').off(previewEventType, 'a[href*="/artworks/"]');
          $('body').off(previewEventType, 'a[href*="/artworks/"] > div:only-child');
          $('body').off(previewEventType, 'a[href*="/artworks/"] > div:nth-child(2)');

          setPreviewEventListeners();
          setTabSwitchingListenerW_U();
        });
      }
      //=================================================================================
      //*******************************Initialize Preview Listeners**********************
      //=================================================================================
      function initPreviewListeners()
      {
        //--------------------------------DISCOVERY[Artworks]---------------------------- //1
        if (PAGETYPE === 1) //Works
        {
          setTabSwitchingListenerW_U(); //pixiv has deleted async loading from this pages?
          setPreviewEventListeners();
        }
        //----------------------------------DISCOVERY[Users]----------------------------- //13
        else if (PAGETYPE === 13) //Users
        {
          setTabSwitchingListenerU_W(); //pixiv has deleted async loading from this pages?
          setDiscoveryUsersPreviewEventListeners();
        }
        //----------------------------------NEW ILLUSTRATIONS---------------------------- //0
        else if (PAGETYPE === 0)
        {
          setPreviewEventListeners();
        }
        //---------ARTIST WORKS, "TOP" PAGES, Home page, Search, Bookmarks--------------- //2,7,8,10,12
        else if (PAGETYPE === 2 || PAGETYPE === 7 || PAGETYPE === 12 || PAGETYPE === 8 || PAGETYPE === 10)
        {
          $('body').on(previewEventType, 'a[href*="/artworks/"] img', function(e)
          {
            e.preventDefault();

            //filtering preview card-----------------------------------------------------
            if (getElementByXpath("//a[text()='View Profile']")){
              //multiple
              if (this.parentNode.parentNode.querySelector('span'))
                setMangaHover(this, this.parentNode.parentNode.textContent);
              else
                setHover(this, getOffsetRect(this).top+112+5+'px', true);
            }
            else{
              //manga-style arts hover---------------------------------------------------
              if (this.parentNode.parentNode.querySelector('span')){
                setMangaHover(this, this.parentNode.parentNode.textContent.replace(/R-18(G)?/,""));
              }
              //single art hover---------------------------------------------------------
              else{
                setHover(this);
              }

              bookmarkObj = searchNearestNode(this, 'button');
            }
          });
        }
        //----------------------DAILY RANKINGS & BOOKMARK INFORMATION PAGES-------------- //4,6
        else if (PAGETYPE === 4 || PAGETYPE === 6)
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
        //-------------------------------------History----------------------------------- //14
        else if (PAGETYPE === 14)
        {
          $('body').on(previewEventType, '._history-item', function(e){
            e.preventDefault();
            setHover(this, getOffsetRect(this).top + 'px');
          });
        }
      }
      //---------------------------------------------------------------------------------
      initPreviewListeners();
      //=================================================================================
      if (currentSettings["DELAY_BEFORE_PREVIEW"]>0) $('body').on('mouseleave', 'a[href*="/artworks/"]', function()
      {
        clearTimeout(timerId);
      });
      //---------------------------------Async page change-------------------------------
      function renewAll()
      {
        if (PAGETYPE != checkPageType())
        {
          console.log('PAGETYPE:', PAGETYPE, '->', PAGETYPE = checkPageType());

          clearTimeout(timerId);
          clearInterval(tInt);
          observer.disconnect();
          $('body').off(previewEventType, 'a[href*="/artworks/"]');
          $('body').off(previewEventType, 'a[href*="/artworks/"] img');

          if ([8,10].includes(PAGETYPE)) colorFollowed(); //extra coloring for missing arts

          reInitMutationObservers();
          initPreviewListeners();
          initMenu();

          reInitFollowagePreview();
          initProfileCard();
        }
      }
      //---------------------------------------------------------------------------------
      renewObserver.init(renewAll);
      renewObserver.observe($('body')[0], {childList: true, subtree: true});
      //---------------------------------------------------------------------------------
    }); //end of document.ready
    //===================================================================================
    //-----------------------------------------------------------------------------------
    function checkDelay(container, thisObj)
    {
      if (currentSettings["DELAY_BEFORE_PREVIEW"]>0){
        clearTimeout(timerId);
        timerId = setTimeout(()=>{
          if ([].indexOf.call(document.querySelectorAll(':hover'), thisObj) > -1) container.style.visibility = 'visible'
        }, currentSettings["DELAY_BEFORE_PREVIEW"]);

      }
      else container.style.visibility = 'visible';
    }
    //-----------------------------------------------------------------------------------
    function setHover(thisObj, top, profileCard)
    {
      clearTimeout(timerId);
      clearInterval(tInt);
      imgContainer.style.visibility = 'hidden';
      mangaOuterContainer.style.visibility = 'hidden';
      hoverImg.src=''; //just in case

      hoverImg.src = parseImgUrl(thisObj, PREVIEWSIZE);
      imgContainer.style.top = top || getOffsetRect(thisObj.parentNode.parentNode).top+'px';

      //adjusting preview position considering expected image width
      //---------------------------------------------------------------------------------
      let l = (![2,7,10,12,13,14].includes(PAGETYPE)) //more accurate on discovery users and history
          ?getOffsetRect(thisObj.parentNode.parentNode).left
          :getOffsetRect(thisObj).left;
      let dcw = document.body.clientWidth;
      let previewWidth = PREVIEWSIZE;

      if (hoverImg.naturalWidth>0){ //cached (previously viewed)
        adjustSinglePreview(dcw, l, hoverImg.naturalWidth, thisObj);
        //console.log("cached");
      }
      else{
        if ([0,1,4,6,14].includes(PAGETYPE) && !profileCard){
          previewWidth = PREVIEWSIZE*(((PAGETYPE==6 || PAGETYPE==14)?thisObj.clientWidth:thisObj.parentNode.parentNode.clientWidth)/siteImgMaxWidth)+5; //if not on NEW layout - width is predictable
          adjustSinglePreview(dcw, l, previewWidth, thisObj);
          //console.log("count");
        }
        else{
          if (dcw - l - PREVIEWSIZE - 5 > 0){ //if it is obvious that preview will fit on the screen then there is no need in setInterval(trying to use as minimun setInterval`s as possible)
            imgContainer.style.left = l+'px';
            checkDelay(imgContainer, thisObj);
            //console.log("excessive");
          }
          else{ //when on NEW layout - need to wait until image width is received
            let tLimit = 0;

            tInt = setInterval(function(){
              if (hoverImg.naturalWidth>0){
                clearInterval(tInt);
                adjustSinglePreview(dcw, l, hoverImg.naturalWidth, thisObj); //position mismatching due to old `thisObj` => clearing in hoverImg.mouseleave
              }
              ++tLimit;
              //console.log(tInt, tLimit);

              if (tLimit*40>3000){ //timeout 3s in case of loading errors
                clearInterval(tInt);
                hoverImg.src='';
                console.error('setInterval error');
                return;
              }
            }, 40);
          }
        }
      }
      //---------------------------------------------------------------------------------
      if (isBookmarked) $(imgContainer).css("background", "rgb(255, 64, 96)");
      else $(imgContainer).css("background", "rgb(34, 34, 34)");
    }
    //-----------------------------------------------------------------------------------
    function adjustSinglePreview(dcw, l, contentWidth, thisObj)
    {
      if (l<0) l = 5; //followage preview
      let d = dcw - l - contentWidth - 5; //5 - padding - todo...
      imgContainer.style.left = (d>=0)?l+'px':l+d+'px';
      checkDelay(imgContainer, thisObj);
    }
    //-----------------------------------------------------------------------------------
    function setMangaHover(thisObj, count)
    {
      clearTimeout(timerId);
      clearInterval(tInt);
      imgContainer.style.visibility = 'hidden'; //just in case

      mangaOuterContainer.style.top = getOffsetRect(thisObj.parentNode.parentNode).top+'px';
      if (!currentSettings["ACCURATE_MANGA_PREVIEW"]) mangaOuterContainer.style.left = '30px';

      if (isBookmarked) $(mangaOuterContainer).css("background", "rgb(255, 64, 96)");
      else $(mangaOuterContainer).css("background", "rgb(34, 34, 34)");

      imgsArrInit(parseImgUrl(thisObj, PREVIEWSIZE), +count, thisObj);
    }
    //-----------------------------------------------------------------------------------
    function imgsArrInit(primaryLink, count, thisObj)
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

        for(let i=0; i<count; i++)
        {
          if (!(!!imgsArr[i])) //if [i] img element doesn't exist
          {
            imgsArr[i] = document.createElement('img');
            mangaContainer.appendChild(imgsArr[i]);
          }
          imgsArr[i].src = primaryLink.replace('p0','p'+i);
        }

        if (currentSettings["ACCURATE_MANGA_PREVIEW"] == true || currentSettings["DELAY_BEFORE_PREVIEW"] >= 1000) //more accurate frame adjusting
        {
          setTimeout(function()
          {
            adjustMargins(mangaOuterContainer.scrollWidth);
            checkDelay(mangaOuterContainer, thisObj);
          }, Math.max(1000, currentSettings["DELAY_BEFORE_PREVIEW"]));
        }
        else //some blind frame adjusting
        {
          adjustMargins(count*PREVIEWSIZE);
          checkDelay(mangaOuterContainer, thisObj);
        }
      }
      //---------------------------------------------------------------------------------
      else
      {
        adjustMargins(mangaOuterContainer.scrollWidth);
        checkDelay(mangaOuterContainer, thisObj);
      }
    }
    //-----------------------------------------------------------------------------------
    function parseImgUrl(thisObj, PREVIEWSIZE)
    {
      let url = (thisObj.src)? thisObj.src: thisObj.style.backgroundImage.slice(5,-2);
      url = url.replace(/\/...x..[0|8]/, '/'+PREVIEWSIZE+'x'+PREVIEWSIZE).
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
      imgContainer.style.visibility = 'hidden';
      hoverImg.src='';
      clearTimeout(timerId);
      clearInterval(tInt);
    };
    //-----------------------------------------------------------------------------------
    mangaOuterContainer.onmouseleave = function()
    {
      mangaOuterContainer.style.visibility = 'hidden';
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
        // if (event.shiftKey){
        //   illust_history.delete_record(illustId); //Shift + LMB-click -> delete record from history //todo
        // }
        // else
        if (!event.altKey)
        {
          let toSave = event.ctrlKey;// Ctrl + LMB-click -> saving image
          let pageNum = 0;

          //Single (general url)
          let ajaxIllustUrl = 'https://www.pixiv.net/ajax/illust/' + illustId;
          //https://www.pixiv.net/rpc/index.php?mode=get_illust_detail_by_ids&illust_ids=

          //Manga
          if (isManga)
          {
            let src = imgContainerObj.src;
            pageNum = src.substring(src.indexOf("_")+2, src.lastIndexOf("_"));
          }

          getOriginalUrl(ajaxIllustUrl, pageNum, toSave);
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
    async function getOriginalUrl(illustPageUrl, pageNum, toSave)
    {
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open("GET", illustPageUrl, true);
      xhr.onload = function ()
      {
        let originalArtUrl = this.response.body.urls.original; //this.response.body.url.big;
        if (pageNum>0) originalArtUrl = originalArtUrl.replace('p0','p'+pageNum);

        if (toSave)    saveImgByUrl(originalArtUrl);
        else           window.open(originalArtUrl, '_blank');
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
      if (e.keyCode == 16 && hoverImg.src && PREVIEWSIZE<1200)
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
//Global TODO: hiding already viewed arts on Daily Rankings when moving to older dates
//             arts viewed history extending for 10000 entries(as in premium) with no time limit
