// ==UserScript==
// @name            Pixiv Arts Preview & Followed Atrists Coloring
// @name:ru         Pixiv Arts Preview & Followed Atrists Coloring
// @namespace       Pixiv
// @description     Enlarged preview of arts and manga on mouse hovering on most pages. Click on image preview to open original art in new tab, or MMB-click to open art illustration page, Alt+LMB-click to to add art to bookmarks, Ctrl+LMB-click for saving originals of artworks. The names of the authors you are already subscribed to are highlighted with green.
// @description:ru  Увеличённый предпросмотр артов и манги по наведению мышки на большинстве страниц. Клик ЛКМ по превью арта для открытия исходника в новой вкладке, СКМ для открытия страницы с артом, Alt + клик ЛКМ для добавления в закладки, Ctrl + клик ЛКМ для сохранения оригиналов артов. Имена авторов, на которых вы уже подписаны, подсвечиваются зелёным цветом.
// @author          NightLancerX
// @version         1.30.2
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

    var hoverImg = document.createElement('img');

    var imgContainer = document.createElement('div');
        imgContainer.style = 'position:absolute; display:block; z-index:1000; background:#222; padding:5px; margin:-5px;';
        imgContainer.appendChild(hoverImg);

    var mangaContainer = document.createElement('div');
        mangaContainer.id = 'mangaContainer';
        mangaContainer.style = 'display:block; z-index:1500; background:#111; overflow-x:auto; maxWidth:1200px; white-space:nowrap;';

    var mangaOuterContainer = document.createElement('div');
        mangaOuterContainer.style = 'position:absolute; display:block; z-index:1000; padding:5px; background:#111; maxWidth:1200px; marginY:-5px; marginX: auto;';
        mangaOuterContainer.appendChild(mangaContainer);

    var imgsArr = [], //for manga-style image packs...
        followedUsersId = [], //storing followed users pixiv ID
        BOOKMARK_URL = 'https://www.pixiv.net/bookmark.php',
        CheckedPublic = false,
        CheckedPrivate = false,
        //artsContainers,
        artsLoaded = 0,
        lastHits = 0,
        //isRunning = false,
        lastImgId = " ",
        siteImgMaxWidth = 150,
        mangaWidth = 1200,
        bookmarkObj,
        isBookmarked = false, //todo: rework or delete. Arts can be bookmarked on art page.
        DELTASCALE = ('mozInnerScreenX' in window)?70:4,
        PAGETYPE = checkPageType();
    //===================================================================================
    //************************************PageType***************************************
    //===================================================================================
    function checkPageType()
    {
      if (document.URL.match('https://www.pixiv.net/bookmark_new_illust.php?'))                             return 0; //Works from favourite artists
      if (document.URL.match('https://www.pixiv.net/discovery?'))                                           return 1; //Discovery page
      if (document.URL.match('https://www.pixiv.net/member.php?'))                                          return 3; //Artist "top" page - New
      if (document.URL.match('https://www.pixiv.net/bookmark_detail.php?'))                                 return 4; //Bookmark information
      if (document.URL.match('https://www.pixiv.net/ranking.php?'))                                         return 6; //Daily rankings
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/bookmark\.php\?id/))                               return 7; //Someone's bookmarks page - New
      if (document.URL.match('https://www.pixiv.net/search.php?'))                                          return 8; //Search page
      if (document.URL.match('https://www.pixiv.net/bookmark.php?'))                                        return 9; //Your bookmarks page
      if (document.URL==='https://www.pixiv.net/')                                                          return 10; //Home page
      if (document.URL.match('https://www.pixiv.net/stacc?'))                                               return 11; //Feed ('stacc')
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/member_illust\.php\?mode\=medium\&illust_id\=/))   return 12; //Illust page
      if (document.URL.match('https://www.pixiv.net/member_illust.php?'))                                   return 2; //Artist works page - New

      return -1;
    }
    console.log('PAGETYPE: '+ PAGETYPE);
    //===================================================================================
    //**********************************ColorFollowed************************************
    //===================================================================================
    if ([1,4,6].includes(PAGETYPE)) //+2 in initMutationParentOnject
    {
      checkFollowedArtists(BOOKMARK_URL+'?type=user');           //public
      checkFollowedArtists(BOOKMARK_URL+'?type=user&rest=hide'); //private
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
            followedUsersId.push(followedProfiles[i].getAttribute("data-user_id"));
          }
          console.log(followedUsersId.length);

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

            if (CheckedPublic && CheckedPrivate && [6].includes(PAGETYPE)) colorFollowed(); //only for daily rankings?
          }
          doc = followedProfiles = null;
        }
      };
      xhr.onerror = function()
      {
        console.error('ERROR WHILE GETTING SUBSCRIPTIONS LIST!');
        CheckedPrivate = CheckedPublic = true; //to stop while loop; (make diff flag or smth if needed)
      };
      xhr.send();
    }
    //-----------------------------------------------------------------------------------
    async function colorFollowed(artsContainers)
    {
      let c = 0;
      while (!artsContainers || artsContainers.length === 0) //first call -> only for daily rankings?
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

      while (!CheckedPrivate || !CheckedPublic) //wait until last XHR completed if it is not
      {
        console.log("waiting for followed users..."); //this could happen in case of huge followed users amount
        await sleep(2000);
      }

      artsLoaded = (PAGETYPE===2)?$('.gtm-illust-recommend-user-name').length:$('.ui-profile-popup').length;
      console.log('arts loaded: '+artsContainersLength + ' (Total: '+(artsLoaded)+')');

      let currentHits = 0;
      let userId = 0;
      for(let i = 0; i < artsContainersLength; i++)
      {
        userId = getUserId(artsContainers[i]);
        if (followedUsersId.indexOf(userId)>=0)
        {
          ++currentHits;
          artsContainers[i].setAttribute("style", "background-color: green; !important");
        };
      }
      lastHits += currentHits;
      console.log('hits: '+currentHits + ' (Total: '+(lastHits)+')');
    }
    //-----------------------------------------------------------------------------------
    let getArtsContainers = ([1,12,4].includes(PAGETYPE))
    ?function() {return $('.gtm-illust-recommend-user-name');}
    :function() {return $('.ui-profile-popup');};
    //-----------------------------------------------------------------------------------
    let getUserId = (PAGETYPE===6)
    ?function (artContainer)
    {
      let userId = (artContainer.hasAttribute('data-user_id'))
      ?artContainer.getAttribute('data-user_id')
      :artContainer.querySelectorAll('.ui-profile-popup')[0].getAttribute('data-user_id');
      return userId;
    }
    :function (artContainer) //1,2,4
    {
      let userId = (artContainer.hasAttribute('href'))
      ?artContainer.getAttribute('href').split('=').pop()
      :artContainer.querySelectorAll('.gtm-illust-recommend-user-name')[0].getAttribute('href').split('=').pop();
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
    let getArtSectionContainers = ([1,12,4].includes(PAGETYPE))
    ?function() {return $('.gtm-illust-recommend-zone');}
    :function() {return $('.ranking-items');};
    //-----------------------------------------------------------------------------------
    function createObserver(mainDiv)
    {
      var observer = new MutationObserver(function(mutations)
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
    async function initMutationParentOnject()
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
            checkFollowedArtists(BOOKMARK_URL+'?type=user');           //public
            checkFollowedArtists(BOOKMARK_URL+'?type=user&rest=hide'); //private

            colorFollowed();
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
    }
    //===================================================================================
    //**************************************Hover****************************************
    //===================================================================================
    if      (PAGETYPE===0 || PAGETYPE===1 || PAGETYPE===8)  siteImgMaxWidth = 198;
    else if (PAGETYPE===2 || PAGETYPE===3 || PAGETYPE===7 || PAGETYPE===12)  siteImgMaxWidth = 184; //todo: quite useless on this pages because of square previews...
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
      //--------------------------------Bookmark detail----------------------------------
      if (PAGETYPE===4)
      {
        let _bkmrklst = $('.bookmark-list-unit')[0];
        _bkmrklst.parentNode.removeChild(_bkmrklst);
        _bkmrklst = null;
      }
      //---------------------------------------------------------------------------------
      if (PAGETYPE===12)
      {
        initMutationParentOnject();
      }
      //-----------------------------Init illust fetch listener--------------------------
      if (PAGETYPE===1 || PAGETYPE===4 || PAGETYPE===6)
      {
        initMutationObject();
      }
      //=================================================================================
      //-----------------------------FEED, DISCOVERY AND SEARCH-------------------------- //0,1,8
      if ((PAGETYPE === 0) || (PAGETYPE === 1) || (PAGETYPE===8)) //TODO - simplify!!
      {
        //single art hover---------------------------------------------------------------
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="] > div:only-child', function()
        {
          bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
          checkBookmark(this);
          setHover(this);
        });

        //manga-style arts hover---------------------------------------------------------
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="] > div:nth-child(2) ', function()
        {
          if (this.parentNode.firstChild.childNodes.length)
          {
            bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
            checkBookmark(this);
            setMangaHover(this, this.parentNode.firstChild.firstChild.textContent);
          }
        });

        //clearing loaded arts count when switching on tabs------------------------------
        if (PAGETYPE === 1) $('body').on('mouseup','a[href="/discovery/users"]', function() //todo:make into single event handler
        {
          console.log('leaving works page...');
          artsLoaded = lastHits = 0;
        });
      }
      //--------------------ARTIST WORKS, "TOP" PAGES, Someone's Bookmarks--------------- //2,3,7,12[2]
      else if (PAGETYPE===2 || PAGETYPE===3 || PAGETYPE===7 || PAGETYPE===12)
      {
        //single art hover---------------------------------------------------------------
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="] > div:only-child', function()
        {
          bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
          //checkBookmark_NewLayout(this);
          setHover(this);
        });

        //manga-style arts hover---------------------------------------------------------
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="] > div:nth-child(2) ', function()
        {
          if (this.parentNode.firstChild.childNodes.length)
          {
            bookmarkObj = this.parentNode.parentNode.childNodes[1].childNodes[0].childNodes[0];
            //checkBookmark_NewLayout(this);
            setMangaHover(this, this.parentNode.firstChild.firstChild.textContent);
          }
        });
      }
      //----------------------DAILY RANKINGS & BOOKMARKS & HOME PAGES-------------------- //4,[5],6,9,10
      else if (PAGETYPE == 4 || PAGETYPE == 6 || PAGETYPE == 9 || PAGETYPE == 10)
      {
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="]', function() //direct div selector works badly with "::before"
        {
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
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="]', function()
        {
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
                  }
                }
              };
              xhr.send();
              console.log(count);
            }
            else setHover(this.firstChild.firstChild); //single art
          }
        });
      }
    });
    //===================================================================================
    //-----------------------------------------------------------------------------------
    function setHover(thisObj)
    {
      mangaOuterContainer.style.display='none';

      hoverImg.src = parseImgUrl(thisObj);
      imgContainer.style.top = getOffsetRect(thisObj.parentNode.parentNode).top+'px';

      //adjusting preview position considering expected image width
      let l = getOffsetRect(thisObj.parentNode.parentNode).left;
      let w = 600*(((PAGETYPE==6)?thisObj.clientWidth:thisObj.parentNode.parentNode.clientWidth)/siteImgMaxWidth)+5;
      imgContainer.style.left = (document.body.clientWidth-l < w)? document.body.clientWidth-w +'px': l +'px';

      if (isBookmarked) $(imgContainer).css("background", "rgb(255, 64, 96)");
      else $(imgContainer).css("background", "rgb(34, 34, 34)");

      imgContainer.style.display='block';
    }
    //-----------------------------------------------------------------------------------
    function setMangaHover(thisObj, count)
    {
      imgContainer.style.display='none'; //just in case

      mangaOuterContainer.style.top = getOffsetRect(thisObj.parentNode.parentNode).top+'px';
      mangaOuterContainer.style.left = '30px';

      if (isBookmarked) $(mangaOuterContainer).css("background", "rgb(255, 64, 96)");
      else $(mangaOuterContainer).css("background", "rgb(34, 34, 34)");

      imgsArrInit(parseImgUrl(thisObj), +count);
    }
    //-----------------------------------------------------------------------------------
    function imgsArrInit(primaryLink, l)
    {
      let margins = document.body.clientWidth - l*600; //some blind frame adjusting
      if (margins > 0) mangaOuterContainer.style.left = margins/2-10+'px';

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
        mangaOuterContainer.style.display='block';
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
      }
      //---------------------------------------------------------------------------------
      else mangaOuterContainer.style.display='block';
    };
    //-----------------------------------------------------------------------------------
    function parseImgUrl(thisObj)
    {
      let url = (thisObj.src)? thisObj.src: thisObj.style.backgroundImage.slice(5,-2);
      url = url.replace(/\/...x..[0|8]/, '/600x600').replace('_80_a2','').replace('_square1200','_master1200').replace('_70',''); //TODO - '1200x1200' variant
      return url;
    };
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
    };
    //-----------------------------------------------------------------------------------
    mangaOuterContainer.onmouseleave = function ()
    {
      mangaOuterContainer.style.display='none';
    };
    //===================================================================================
    //*************************************Clicks****************************************
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
      if ((scrlLft>0 && e.deltaY<0) || ((scrlLft<(mangaContainer.scrollWidth-mangaContainer.clientWidth)) && e.deltaY>0))
      {
        e.preventDefault();
        mangaContainer.scrollLeft += e.deltaY*DELTASCALE;
      }
    };
    //-----------------------------------------------------------------------------------
    window.onresize = function()
    {
      mangaWidth = document.body.clientWidth - 80;
      mangaContainer.style.maxWidth = mangaOuterContainer.style.maxWidth = mangaWidth+'px';
    };
    //===================================================================================
    //***********************************************************************************
    //===================================================================================
  });
}) (); //function
