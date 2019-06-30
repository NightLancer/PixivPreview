// ==UserScript==
// @name            Pixiv Arts Preview & Followed Atrists Coloring
// @name:ru         Pixiv Arts Preview & Followed Atrists Coloring
// @namespace       Pixiv
// @description     Enlarged preview of arts and manga on mouse hovering on most pages. Click on image preview to open original art in new tab, or MMB-click to open art illustration page, Alt+LMB-click to to add art to bookmarks, Ctrl+LMB-click for saving originals of artworks. The names of the authors you are already subscribed to are highlighted with green.
// @description:ru  Увеличённый предпросмотр артов и манги по наведению мышки на большинстве страниц. Клик ЛКМ по превью арта для открытия исходника в новой вкладке, СКМ для открытия страницы с артом, Alt + клик ЛКМ для добавления в закладки, Ctrl + клик ЛКМ для сохранения оригиналов артов. Имена авторов, на которых вы уже подписаны, подсвечиваются зелёным цветом.
// @author          NightLancerX
// @version         1.38.1
// @match           https://www.pixiv.net/bookmark_new_illust.php*
// @match           https://www.pixiv.net/discovery*
// @match           https://www.pixiv.net/bookmark_detail.php?illust_id=*
// @match           https://www.pixiv.net/member_illust.php*
// @match           https://www.pixiv.net/ranking.php?mode=*
// @match           https://www.pixiv.net/member.php?id=*
// @match           https://www.pixiv.net/bookmark.php*
// @match           https://www.pixiv.net/search.php*
// @match           https://www.pixiv.net/
// @match           https://www.pixiv.net/stacc*
// @exclude         https://www.pixiv.net/member_illust.php?mode=manga_big&illust_id=*
// @connect         i.pximg.net
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
    const PREVIEW_ON_CLICK = false; //if "true" — showing arts preview after LMB-click on art instead of hovering over it
    const DELAY_BEFORE_PREVIEW = 0; //if you need delay before showing art preview, set it here (1000 = 1 second)
    const PREVIEW_SIZE = 600; //if you have "4K" or "QHD" monitor, you can set preview size to 1200(which can't fit at 1920*1080 monitor, so stay at 600 if you have that one)
    const ACCURATE_MANGA_PREVIEW = false; //if `true` - increases time before manga preview appearing(to 1sec) but shows it at more accurate position considering width(for case of few arts)
    const DISABLE_MANGA_PREVIEW_SCROLLLING_PROPAGATION = false; //defines whether to keep on scrolling propagation when reaching end of manga preview container
    const SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE = true; //apply scrollIntoView for single preview
    const DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING = false; //defines background scrolling for single preview when `SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE` set to `true`
    //-----------------------------------------------------------------------------------
    //const EXPERIMENTAL_WORKSPAGE_RESTYLE = false; //currently raw style adjustment on illust page; may broke at any time, so turn it on your risk (yet) --> currently broken
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
        siteImgMaxWidth = 184, //2,3,7,12 [NEW]| //todo: quite useless on this pages because of square previews...
        mangaWidth = 1200,
        //prevSize = PREVIEW_SIZE,
        maxRequestTime = 30000,
        bookmarkObj,
        isBookmarked = false, //todo: rework or delete. Arts can be bookmarked on art page.
        DELTASCALE = ('mozInnerScreenX' in window)?70:4,
        previewEventType = (PREVIEW_ON_CLICK)?'click':'mouseenter',
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
      if (document.URL.match('https://www.pixiv.net/bookmark_new_illust.php?'))                             return 0; //Works from favourite artists
      if (document.URL==='https://www.pixiv.net/discovery')                                                 return 1; //Discovery page(works)
      if (document.URL.match('https://www.pixiv.net/member.php?'))                                          return 3; //Artist "Home" page - New
      if (document.URL.match('https://www.pixiv.net/bookmark_detail.php?'))                                 return 4; //Bookmark information
      if (document.URL.match('https://www.pixiv.net/ranking.php?'))                                         return 6; //Daily rankings
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/bookmark\.php\?id/))                               return 7; //Someone's bookmarks page - New
      if (document.URL.match('https://www.pixiv.net/search.php?'))                                          return 8; //Search page
      if (document.URL.match('https://www.pixiv.net/bookmark.php?'))                                        return 9; //Your bookmarks page
      if (document.URL==='https://www.pixiv.net/')                                                          return 10; //Home page
      if (document.URL.match('https://www.pixiv.net/stacc?'))                                               return 11; //Feed ('stacc')
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/member_illust\.php\?mode\=medium\&illust_id\=/))   return 12; //Illust page - New
      if (document.URL.match('https://www.pixiv.net/member_illust.php?'))                                   return 2; //Artist works page - New
      if (document.URL.match('https://www.pixiv.net/discovery/users?'))                                     return 13; //Discovery page(users)

      return -1;
    }
    console.log('PAGETYPE: '+ PAGETYPE);
    //===================================================================================
    //**********************************ColorFollowed************************************
    //===================================================================================
    if ([1,4,6].includes(PAGETYPE)) //+12 in initMutationParentObject(TODO: does it needed now?) | todo: 7
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
      else if ([6].includes(PAGETYPE))  colorFollowed(); //only for daily rankings? todo: 7 | for cached case
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
              localStorage.setObj('followedCheckCompleted', true); //todo: check if there is a difference in command order
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
        await sleep(1000);

        artsContainers = getArtsContainers();
        ++c;
        if (c>5)
        {
          console.error('Error while waiting for atrs loading! [Timeout 5s]');
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
          console.log('Succesfully received followedUsersId: '+ Object.keys(followedUsersId).length);
        }
        else console.error('Subscriptions check was not STARTED for some reason!');
      }
      else
      {
        followedUsersId = localStorage.getObj('followedUsersId');
        console.log('Succesfully loaded cached followedUsersId: '+ Object.keys(followedUsersId).length);
      }
      //---------------------------------------------------------------------------------
      artsLoaded = (PAGETYPE===12)?$('.gtm-illust-recommend-user-name').length:$('.ui-profile-popup').length;
      console.log('arts loaded: '+artsContainersLength + ' (Total: '+(artsLoaded)+')');

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
        };
      }
      lastHits += currentHits;
      console.log('hits: '+currentHits + ' (Total: '+(lastHits)+')');
    }
    //-----------------------------------------------------------------------------------
    let getArtsContainers = ([1,4].includes(PAGETYPE)) //??? TODO!!!
    ?                           function() {return document.querySelectorAll('.gtm-illust-recommend-user-name');}
    :([12].includes(PAGETYPE))? function() {return document.querySelectorAll('.gtm-illust-recommend-title');}
    :                           function() {return $('.ui-profile-popup');};
    //-----------------------------------------------------------------------------------
    let getUserId = (PAGETYPE===6 || PAGETYPE===1 || PAGETYPE===13) //1,6
    ?function (artContainer)
    {
      let userId = (artContainer.hasAttribute('data-user_id'))
      ?artContainer.getAttribute('data-user_id')
      :artContainer.querySelectorAll('.ui-profile-popup')[0].getAttribute('data-user_id');
      return userId;
    }
    :function (artContainer) //2,4
    {
      artContainer = artContainer.querySelectorAll('.gtm-illust-recommend-title')[0] || artContainer; // -_-'
      let userId = artContainer.parentNode.querySelectorAll('[href*="/member.php?id="]')[0].getAttribute('href').split('=').pop();
      return userId;
    };
    //-----------------------------------------------------------------------------------
    function sleep(ms)
    {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    //-----------------------------------------------------------------------------------
    function getElementByXpath(path)
    {
      return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    };
    //-----------------------------------------------------------------------------------
    let getArtSectionContainers = ([1,12,4,13].includes(PAGETYPE))
    ?function() {return $('.gtm-illust-recommend-zone');}
    :function() {return $('.ranking-items');};
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
      let mainDiv = getArtSectionContainers()[0];
      while(!mainDiv)
      {
        console.log('Waiting for arts container...');
        await sleep(1000);
        mainDiv = getArtSectionContainers()[0];
      }
      console.log(mainDiv);
      createObserver(mainDiv);
    }
    //-----------------------------------------------------------------------------------
    async function initMutationParentObject()
    {
      let observerParent = new MutationObserver(function(mutations)
      {
        let mainDiv;
        mutations.forEach(function(mutation)
        {
          mainDiv = mutation.addedNodes[0].getElementsByClassName('gtm-illust-recommend-zone');
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

      let parentDiv = getElementByXpath('/html/body/div[1]/div[1]/div/aside[3]');
      while(!parentDiv)
      {
        console.log('Waiting for getElementByXpath');
        await sleep(1000);
        parentDiv = getElementByXpath('/html/body/div[1]/div[1]/div/aside[3]');
      }
      console.log(parentDiv);
      observerParent.observe(parentDiv, options2);
      console.log('observerParent set');

      //initGallery(); TODO (preview on the illust page???) - no need? - pixiv has released own 'gallery'
    }
    //-----------------------------------------------------------------------------------
    function initGallery() {
      let _ttt = $('figure > div[role="presentation"]');
      let _sss = _ttt[0].textContent.split("⧸").pop(); //NOT slash! charCodeAt(0) == 10744
      console.log(_ttt);
      console.log(_sss);
    }
    //-----------------------------------------------------------------------------------
    function followage(thisObj, toFollow, isNew) //TODO: into async queue
    {
      console.log('toFollow: '+ toFollow);
      let userId;
      switch (isNew){
        case 0: userId = thisObj.parentNode.parentNode.querySelectorAll('a.user-name')[0].getAttribute('href').split('&')[0].split('=')[1]; break; //OLD
        case 1: userId = document.querySelectorAll('[href*="/member.php?id="]')[0].getAttribute('href').split('=').pop(); break; //NEW
        case 2: userId = thisObj.getAttribute('data-user-id'); break; //recommended users
      }
      //console.log(userId);

      if (localStorage.getObj('followedCheckCompleted')) //at least basic check until queue is developed
      {
        let followedUsersId = localStorage.getObj('followedUsersId'); //local
        if (toFollow){
          followedUsersId[userId] = true;
          //if (!PAGETYPE===13) initFollowagePreview(); //TODO - broken
        }
        else
          delete followedUsersId[userId];

        localStorage.setObj('followedUsersId', followedUsersId);
        console.log('userId ' + userId + [(toFollow)?' added to':' deleted from'] + ' localStorage. Followed: '+ Object.keys(followedUsersId).length);
      }
      else console.error('Slow down! You have subscribed too many to handle this by now! Wait for the next updates');
    }
    //-----------------------------------------------------------------------------------
    /*
    function initFollowagePreview() //TODO!!!
    {
      $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="]', function(e)
      {
        e.preventDefault();
        setHover(this.firstChild);
        //---
        //hoverImg.onload = function(){imgContainer.scrollIntoView({block: "start", behavior: "smooth"});}; //!!! TODO - only to follow case

        let scroll = getElementByXpath('/html/body/div[6]/div/div/div/div/ul');
        scroll.onwheel = function(ev)
        {
          ev.preventDefault();
          scroll.scrollLeft += ev.deltaY*DELTASCALE;
        };
      });
    }
    */
    //===================================================================================
    if      (PAGETYPE===0 || PAGETYPE===1 || PAGETYPE===8)  siteImgMaxWidth = 198;
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

      //------------------------------Style changing-------------------------------------
      /*
      if (EXPERIMENTAL_WORKSPAGE_RESTYLE===true && PAGETYPE===2){
        setTimeout(function(){
          var aaa= document.getElementsByClassName('gW2sMCp')[0];
          aaa.style = 'max-Width:'+ document.body.clientWidth + 'px;';

          var bbb = document.getElementsByClassName('sc-kjoXOD dYMASP');
          for (let item of bbb) {
            console.log(item.id);
            item.style.width = '250px';
          }

          var ccc = document.getElementsByClassName('sc-bRBYWo dHdfgU');
          for (let item2 of ccc) {
            console.log(item2.id);
            item2.style.width = '250px';
            item2.style.height = '250px';
          }

          var ddd = document.getElementsByClassName('_2WwRD0o _2WyzEUZ')[0];
          ddd.style = 'margin:-12px -24px; padding: 0px;';
        }, 2000);

        //todo: meed to restyle after reload
        ///html/body/div[1]/div[1]/div/div[2] - parent?
      }
      */
      //-------------------------------Follow onclick------------------------------------
      let toFollow, isNew, followSelector;
      if ([2,3,7,12].includes(PAGETYPE)){
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
      //-----------------------------Bookmarks ------------------------------------------
      /*
      if (PAGETYPE===7) //TODO -> launch form tab
      {
        setTimeout(function(){
          let ttt = $('[href*="/member.php?id="]');
          console.dir(ttt);
        }, 4000); -> await while
      }
      */
      //---------------------------------------------------------------------------------
      $('body').on(previewEventType, 'a[href*="ref=profile_card"]', function(e) //TODO
      {
        e.preventDefault();;
        setHover(this);

        imgContainer.style.top = getOffsetRect(this).top+200+'px';
        //$(imgContainer).css('zIndex', 3000);
      });
      //--------------------------------Bookmark detail----------------------------------
      if (PAGETYPE===4)
      {
        let _bkmrklst = $('.bookmark-list-unit')[0];
        _bkmrklst.parentNode.removeChild(_bkmrklst);
        _bkmrklst = null;
      }
      //-----------------------------------Illust page-----------------------------------
      if (PAGETYPE===12)
      {
        let zone = document.getElementsByClassName('gtm-illust-recommend-zone')[0];
        if (zone === undefined)
          initMutationParentObject();
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
      //=================================================================================
      //**************************************Hover**************************************
      //=================================================================================
      //-----------------------------FEED, DISCOVERY AND SEARCH-------------------------- //0,1,8
      function setPreviewEventListeners()
      {
        //single art hover---------------------------------------------------------------
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="] > div:only-child', function(e)
        {
          e.preventDefault();
          bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
          checkBookmark(this);
          setHover(this);
        });

        //manga-style arts hover---------------------------------------------------------
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="] > div:nth-child(2) ', function(e)
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
      //---------------------------------------------------------------------------------
      let discoveryUsersPreview = function(e)
      {
        e.preventDefault();
        if      (this.childNodes.length == 0)  setHover(this); //single art
        else if (this.childNodes.length == 1)  setMangaHover(this, this.firstChild.textContent); //manga
      };
      //---------------------------------------------------------------------------------
      function setDiscoveryUsersPreviewEventListeners()
      {
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="]', discoveryUsersPreview);
      };
      //---------------------------------------------------------------------------------
      function setTabSwitchingListenerW_U()
      {
        $('body').on('mouseup','a[href="/discovery/users"]', function() //todo:make into single event handler
        {
          console.log('Works -> Users');
          PAGETYPE = 13;
          artsLoaded = lastHits = 0; //clearing loaded arts count when switching on tabs
          $('body').off(); //may cause some removal of timeout events? todo
          setDiscoveryUsersPreviewEventListeners();
          setTabSwitchingListenerU_W();
        });
      };
      //---------------------------------------------------------------------------------
      function setTabSwitchingListenerU_W()
      {
        $('body').on('mouseup','a[href="/discovery"]', function() //todo:make into single event handler
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
      };
      //------------------------------------Discovery------------------------------------
      if (PAGETYPE === 1) //Works
      {
        setTabSwitchingListenerW_U();
        setPreviewEventListeners();
      }
      else if (PAGETYPE === 13) //Users
      {
        setTabSwitchingListenerU_W();
        setDiscoveryUsersPreviewEventListeners();
      }
      //---------------------------------FEED AND SEARCH---------------------------------
      else if ((PAGETYPE === 0) || (PAGETYPE===8))
      {
        setPreviewEventListeners();
      }
      //--------------------ARTIST WORKS, "TOP" PAGES, Someone's Bookmarks--------------- //2,3,7,12[2]
      else if (PAGETYPE===2 || PAGETYPE===3 || PAGETYPE===7 || PAGETYPE===12) //TODO!!! do smthng with that amorphous pixiv styleshit!
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
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="] > div:nth-child(2) ', function(e)
        {
          e.preventDefault();
          //single art hover-------------------------------------------------------------
          if (this.parentNode.firstChild.childNodes.length===1) //single
          {
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            //checkBookmark_NewLayout(this);
            setHover(this.childNodes[0]); //todo? - zero child-node trying?
          }
          //manga-style arts hover-------------------------------------------------------
          else
          {
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            //checkBookmark_NewLayout(this);
            setMangaHover(this.childNodes[0], this.parentNode.firstChild.childNodes[1].textContent);
          }
        });
      }
      //----------------------DAILY RANKINGS & BOOKMARKS & HOME PAGES-------------------- //4,[5],6,9,10
      else if (PAGETYPE == 4 || PAGETYPE == 6 || PAGETYPE == 9 || PAGETYPE == 10)
      {
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="]', function(e) //direct div selector works badly with "::before"
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
          };
        });
      }
      //-----------------------------------Feed('stacc')--------------------------------- //11
      else if  (PAGETYPE == 11)
      {
        $('body').on(previewEventType, 'a[href*="member_illust.php?mode=medium&illust_id="]', function(e)
        {
          e.preventDefault();

          if (this.childNodes.length == 1 && this.childNodes[0].nodeName=="DIV")
          {
            if ($(this).hasClass('multiple')) //manga
            {
              let link = this.href.replace('medium','manga');
              let that = this;

              let xhr = new XMLHttpRequest();
              xhr.responseType = 'document';
              xhr.open("GET", link, true);
              xhr.onreadystatechange = function ()
              {
                if (xhr.readyState == 4 && xhr.status == 200)
                {
                  let count = xhr.responseXML.getElementsByClassName("total")[0].textContent;
                  setMangaHover(that.firstChild.firstChild, count);

                  if (!(that.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('imageCount').length>0)) //todo?..
                  {
                    let s = document.createElement('span');
                    s.className = 'imageCount';
                    s.style = 'position:relative; display: inline-block; float: right; top:-240px;'
                    s.textContent = count;
                    that.parentNode.parentNode.parentNode.parentNode.appendChild(s);
                    //console.log(count); delete
                  }
                }
              };
              xhr.send();
            }
            else setHover(this.firstChild.firstChild); //single art
          }
        });
      }
      //-----------------------------------------------------------------------------------
      if (DELAY_BEFORE_PREVIEW>0) $('body').on('mouseleave', 'a[href*="member_illust.php?mode=medium&illust_id="]', function()
      {
        clearTimeout(timerId);
      });
    });
    //===================================================================================
    //-----------------------------------------------------------------------------------
    function checkDelay(callback) {
      if (DELAY_BEFORE_PREVIEW>0){
        clearTimeout(timerId);
        timerId = setTimeout(callback, DELAY_BEFORE_PREVIEW);
      }
      else callback();
    }
    //-----------------------------------------------------------------------------------
    function setHover(thisObj)
    {
      clearTimeout(timerId);
      clearTimeout(tInt);
      mangaOuterContainer.style.visibility = 'hidden';

      hoverImg.src = parseImgUrl(thisObj, PREVIEW_SIZE);
      imgContainer.style.top = getOffsetRect(thisObj.parentNode.parentNode).top+'px';

      //adjusting preview position considering expected image width
      //---------------------------------------------------------------------------------
      let l = (![2,3,7,12,13].includes(PAGETYPE)) //more accurate on discovery users
          ?getOffsetRect(thisObj.parentNode.parentNode).left
          :getOffsetRect(thisObj).left;
      let dcw = document.body.clientWidth;
      let previewWidth = 0;

      if (hoverImg.naturalWidth>0){ //cached (previously viewed)
        adjustSinglePreview(dcw, l, hoverImg.naturalWidth);
      }
      else{
        if (![2,3,7,12,13].includes(PAGETYPE)){
          let previewWidth = PREVIEW_SIZE*(((PAGETYPE==6)?thisObj.clientWidth:thisObj.parentNode.parentNode.clientWidth)/siteImgMaxWidth)+5; //if not on NEW layout - width is predictable
          adjustSinglePreview(dcw, l, previewWidth);
        }
        else{
          if (dcw - l - PREVIEW_SIZE - 5 > 0){ //if it is obvious that preview will fit on the screen then there is no need in setInterval(trying to use as minimun setInterval`s as possible)
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
      if (!ACCURATE_MANGA_PREVIEW) mangaOuterContainer.style.left = '30px';

      if (isBookmarked) $(mangaOuterContainer).css("background", "rgb(255, 64, 96)");
      else $(mangaOuterContainer).css("background", "rgb(34, 34, 34)");

      imgsArrInit(parseImgUrl(thisObj, PREVIEW_SIZE), +count);
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
          };
          imgsArr[i].src = primaryLink.replace('p0','p'+i);
        }

        if (ACCURATE_MANGA_PREVIEW == true || DELAY_BEFORE_PREVIEW > 1000) //more accurate frame adjusting
        {
          setTimeout(function()
          {
            adjustMargins(mangaOuterContainer.scrollWidth);
            checkDelay(function(){mangaOuterContainer.style.visibility='visible';});
          }, 1000);
        }
        else //some blind frame adjusting
        {
          adjustMargins(l*PREVIEW_SIZE);
          checkDelay(function(){mangaOuterContainer.style.visibility='visible';});
        }
      }
      //---------------------------------------------------------------------------------
      else
      {
        adjustMargins(mangaOuterContainer.scrollWidth);
        checkDelay(function(){mangaOuterContainer.style.visibility='visible';});
      }
    };
    //-----------------------------------------------------------------------------------
    function parseImgUrl(thisObj, PREVIEW_SIZE)
    {
      let url = (thisObj.src)? thisObj.src: thisObj.style.backgroundImage.slice(5,-2);
      url = url.replace(/\/...x..[0|8]/, '/'+PREVIEW_SIZE+'x'+PREVIEW_SIZE).replace('_80_a2','').replace('_square1200','_master1200').replace('_70',''); //TODO - '1200x1200' variant
      return url;
    };
    //-----------------------------------------------------------------------------------
    function adjustMargins(width)
    {
      let margins = document.body.clientWidth - width;
      if (margins > 0) mangaOuterContainer.style.left = margins/2-10+'px';
      else mangaOuterContainer.style.left = '30px';
    }
    //-----------------------------------------------------------------------------------
    function checkBookmark(thisObj) //seems excessive -> todo delete
    {
      isBookmarked = ($(bookmarkObj).hasClass("on"));
      //let ch = (thisObj.querySelectorAll('._one-click-bookmark')[0] && thisObj.querySelectorAll('._one-click-bookmark')[0].classList.length === 3); //delete?
    }
    //-----------------------------------------------------------------------------------
    function checkBookmark_NewLayout(thisObj) //TODO - broken
    {
      //isBookmarked = thisObj.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0].childNodes[0].classList.length === 3;
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
    };
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
    hoverImg.onmouseup = function (event) //single arts onclick actions
    {
      onClickActions(this, event, false);
    };
    //-----------------------------------------------------------------------------------
    $('body').on('mouseup', 'div#mangaContainer > img', function(event) //manga arts onclick actions
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
        let illustPageUrl = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + illustId;
        window.open(illustPageUrl,'_blank'); //open illust page in new tab(in background — with FF pref "browser.tabs.loadDivertedInBackground" set to "true")
      }
      //----------------------------Left Mouse Button clicks...--------------------------
      else if (event.button == 0)
      {
        //----------------------------Single LMB-click-----------------------------------
        if (!event.altKey)
        {
          let toSave = event.ctrlKey;// Ctrl + LMB-click -> saving image
          if (!isManga) //single art original
          {
            let ajaxIllustUrl = 'https://www.pixiv.net/ajax/illust/' + illustId;
            getOriginalUrl(ajaxIllustUrl, event, false, toSave);
          }
          else //manga art original
          {
            let src = imgContainerObj.src;
            let pageNum = src.substring(src.indexOf("_")+2, src.lastIndexOf("_"));
            let singleIllustPageUrl = 'https://www.pixiv.net/member_illust.php?mode=manga_big&illust_id=' + illustId + '&page=' + pageNum;
            getOriginalUrl(singleIllustPageUrl, event, true, toSave);
          }
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
    };
    //---------------------------------getOriginalUrl------------------------------------
    async function getOriginalUrl(illustPageUrl, event, isManga, toSave)
    {
      let xhr = new XMLHttpRequest();
      xhr.responseType = (isManga)?'document':'json';
      xhr.open("GET", illustPageUrl, true);
      xhr.onreadystatechange = function ()
      {
        if (xhr.readyState == 4 && xhr.status == 200)
        {
          let originalArtUrl = "";

          if (!isManga) originalArtUrl = this.response.body.urls.original;
          else          originalArtUrl = this.responseXML.querySelectorAll('img')[0].src;

          if (toSave)   saveImgByUrl(originalArtUrl);
          else          window.open(originalArtUrl, '_blank');
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
          Referer: `https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illustId}`,
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
      if ((DISABLE_MANGA_PREVIEW_SCROLLLING_PROPAGATION) || ((scrlLft>0 && e.deltaY<0) || ((scrlLft<(mangaContainer.scrollWidth-mangaContainer.clientWidth)) && e.deltaY>0)))
      {
        e.preventDefault();
        mangaContainer.scrollLeft += e.deltaY*DELTASCALE;
      }
    };
    //-----------------------------------------------------------------------------------
    if (SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE) imgContainer.onwheel = function(e)
    {
      if (DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING) e.preventDefault();

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
    };
    //-----------------------------------------------------------------------------------
    document.onkeyup = function(e) //Enlarge with shift
    {
      //console.log(e.keyCode);
      if (e.keyCode == 16 && hoverImg.src && PREVIEW_SIZE<1200)
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
