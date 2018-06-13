// ==UserScript==
// @name            Pixiv Arts Preview & Followed Atrists Coloring
// @name:ru         Pixiv Arts Preview & Followed Atrists Coloring
// @namespace       Pixiv
// @description     Enlarged preview of arts and manga on mouse hovering on most pages. Click on image preview to open original art in new tab, or MMB-click to open art illustration page, Alt+LMB-click to to add art to bookmarks. Install "Saving Pixiv Images with Ctrl+Click" for enabling saving originals of art via Ctrl+LMB-click. The names of the authors you are already subscribed to are highlighted with green. Preview of bookmarked artworks are outlined with magenta.
// @description:ru  Увеличённый предпросмотр артов и манги по наведению мышки на большинстве страниц. Клик ЛКМ по превью арта для открытия исходника в новой вкладке, СКМ для открытия страницы с артом, Alt + клик ЛКМ для добавления в закладки. Установите «Saving Pixiv Images with Ctrl+Click» для возможности сохранения оригиналов артов с помощью Ctrl + клик ЛКМ. Имена авторов, на которых вы уже подписаны, подсвечиваются зелёным цветом. Превью добавленных в закладки иллюстраций выделены розовым цветом.
// @author          NightLancerX
// @match           https://www.pixiv.net/bookmark_new_illust.php*
// @match           https://www.pixiv.net/discovery*
// @match           https://www.pixiv.net/bookmark_detail.php?illust_id=*
// @match           https://www.pixiv.net/bookmark_add.php?id=*
// @match           https://www.pixiv.net/member_illust.php*
// @match           https://www.pixiv.net/ranking.php?mode=*
// @match           https://www.pixiv.net/member.php?id=*
// @match           https://www.pixiv.net/bookmark.php*
// @match           https://www.pixiv.net/search.php*
// @version         1.16
// @homepageURL     https://github.com/NightLancer/PixivPreview
// @downloadURL     https://github.com/NightLancer/PixivPreview/raw/master/PixivPreview.user.js
// @license         MIT License
// @grant           none
// ==/UserScript==
//---------------------------------------------------------------------------------------
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
        Checked = false,
        artsContainers,
        artsLoaded = 0,
        hits = 0,
        isRunning = false,
        lastImgId = " ",
        siteImgMaxWidth = 150, //for now it is used for pagetype==7
        mangaWidth = 1200,
        bookmarkObj,
        PAGETYPE = checkPageType();
    //-----------------------------------------------------------------------------------
    //************************************PageType***************************************
    //-----------------------------------------------------------------------------------
    function checkPageType()
    {
      if (document.URL.match('https://www.pixiv.net/bookmark_new_illust.php?'))          return 0; //Works from favourite artists
      if (document.URL.match('https://www.pixiv.net/discovery?'))                        return 1; //Discovery page
      if (document.URL.match('https://www.pixiv.net/member_illust.php?'))                return 2; //Artist works page
      if (document.URL.match('https://www.pixiv.net/member.php?'))                       return 3; //Artist "top" page
      if (document.URL.match('https://www.pixiv.net/bookmark_detail.php?'))              return 4; //Bookmark information
      if (document.URL.match('https://www.pixiv.net/bookmark_add.php?'))                 return 5; //Added new bookmarks
      if (document.URL.match('https://www.pixiv.net/ranking.php?'))                      return 6; //Daily rankings
      if (document.URL.match(/https:\/\/www\.pixiv\.net\/bookmark\.php\?id/))            return 7; //Someone's bookmarks page
      if (document.URL.match('https://www.pixiv.net/search.php'))                        return 8; //Search page
      if (document.URL.match('https://www.pixiv.net/bookmark.php?'))                     return 9; //Your bookmarks page

      return -1;
    }
    console.log('PAGETYPE: '+ PAGETYPE);
    //-----------------------------------------------------------------------------------
    //**********************************ColorFollowed************************************
    //-----------------------------------------------------------------------------------
    if (PAGETYPE==1 || PAGETYPE>=4 && PAGETYPE!=9)
    {
      checkFollowedArtists(BOOKMARK_URL+'?type=user');

      $.ajaxSetup(
      {
        success: function(data)
        {
          let condition = !!((PAGETYPE===6 && typeof(data)=="object" && data.contents && data.contents.length>1 && data.contents[0].illust_id)||(PAGETYPE!=6 && Array.isArray(data) && data.length && data[0].illust_id));
          console.log(condition);
          if (condition) colorFollowed();
        }
      });
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
          if (urlTail !== undefined && urlTail.length && !CheckedPublic) //todo: rewrite condition when multiple private followed pages supported
          {
            console.log(urlTail);
            checkFollowedArtists(BOOKMARK_URL+urlTail);
          }
          else
          {
            if (!CheckedPublic) checkFollowedArtists('https://www.pixiv.net/bookmark.php?type=user&rest=hide'); //works for 1 page only (yet)
            else
            {
              Checked = true;
              console.log('XHR querying ended.');
              colorFollowed(); //extra call for heavy load case skipping ajaxSucess
            }
            CheckedPublic = true;
          }
          doc = followedProfiles = null;
        }
      };
      xhr.onerror = function()
      {
        console.log('ERROR WHILE GETTING SUBSCRIPTIONS LIST!');
        Checked = CheckedPublic = true; //to stop while loop; (make diff flag or smth if needed)
      };
      xhr.send();
    }
    //-----------------------------------------------------------------------------------
    async function colorFollowed()
    {
      if (isRunning) return;
      isRunning = true;

      while (!Checked) //wait until last XHR completed if it is not
      {
        console.log("waiting for followed users...");
        await sleep(2000);
      }
      checkArtists();

      let c = 0;
      while (!artsContainers||artsContainers.length<=artsLoaded)
      {
        console.log('waiting for arts...');
        await sleep(1000);
        checkArtists();
        ++c;
        if (c>5) break; //we may wait until next update if smth goes wrong
      }
      console.log('arts loaded: '+artsContainers.length + ' (new: '+(artsContainers.length - artsLoaded)+')');

      let h = 0;
      for(let i = 0; i < artsContainers.length; i++) //from 0 - 'cause "More like this" insert objects inside array
      {
        if (followedUsersId.indexOf(artsContainers[i].getAttribute('data-user_id'))>=0)
        {
          ++h;
          artsContainers[i].setAttribute("style", "background-color: green;");
        };
      }
      artsLoaded = artsContainers.length;
      console.log('hits: '+h + ' (new: '+(h-hits)+')');
      hits = h;

      c = h = null;
      isRunning = false;
    }
    //-----------------------------------------------------------------------------------
    function checkArtists()
    {
      artsContainers = $('.ui-profile-popup');
    }
    //-----------------------------------------------------------------------------------
    function sleep(ms)
    {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    //-----------------------------------------------------------------------------------
    //**************************************Hover****************************************
    //-----------------------------------------------------------------------------------
    if (PAGETYPE==0 || PAGETYPE==1 || PAGETYPE==8) siteImgMaxWidth = 200;
    else if (PAGETYPE>=2 && PAGETYPE<=5 || PAGETYPE==9) siteImgMaxWidth = 150;
    else if (PAGETYPE==6) siteImgMaxWidth = 240;
    //-----------------------------------------------------------------------------------
    $(document).ready(function ()
    {
      console.log('$(document).ready');
      mangaWidth = document.body.clientWidth - 80;
      mangaContainer.style.maxWidth = mangaOuterContainer.style.maxWidth = mangaWidth+'px';
      document.body.appendChild(imgContainer);
      document.body.appendChild(mangaOuterContainer);

      //feed, discovery and search-------------------------------------------------------
      if ((PAGETYPE === 0) || (PAGETYPE === 1) || (PAGETYPE===8))
      {
        //single art hover
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="] > div:only-child', function()
        {
          bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
          setHover(this);
        });

        //manga-style arts hover
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="] > div:nth-child(2) ', function()
        {
          bookmarkObj = $(this).parent().parent().children(".thumbnail-menu").children("._one-click-bookmark");
          if (this.parentNode.firstChild.childNodes.length) setMangaHover(this, this.parentNode.firstChild.firstChild.textContent);
        });

        //clearing loaded arts count when switching on tabs
        if (PAGETYPE === 1) $('body').on('mouseup','a[href="/discovery/users"]', function() //todo:make into single event handler
        {
          console.log('leaving works page...');
          artsLoaded = hits = 0;
        });
      }
      //artist works page and daily rankings & rest of pages-----------------------------
      else if ((PAGETYPE >= 2)&&(PAGETYPE <= 7) || (PAGETYPE == 9))
      {
        $('body').on('mouseenter', 'a[href*="member_illust.php?mode=medium&illust_id="]', function() //direct div selector works badly with "::before"
        {
          if (this.childNodes.length == 1 && this.childNodes[0].nodeName=="DIV") //single art
          {
            bookmarkObj = $(this.firstChild.firstChild).parent().children("._one-click-bookmark");
            setHover(this.firstChild.firstChild);
          }
          else if (this.children[1] && this.children[1].className == 'page-count') //manga
          {
            bookmarkObj = $(this.firstChild.firstChild).parent().children("._one-click-bookmark");
            setMangaHover(this.firstChild.firstChild, this.children[1].children[1].textContent);
          };
        });
      }
    });
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

      if($(bookmarkObj).hasClass("on")) {
        $(imgContainer).css("background", "rgb(255, 64, 96)");
      }
      else {
        $(imgContainer).css("background", "rgb(34, 34, 34)");
      }

      imgContainer.style.display='block';
    }
    //-----------------------------------------------------------------------------------
    function setMangaHover(thisObj, count)
    {
      imgContainer.style.display='none'; //just in case

      mangaOuterContainer.style.top = getOffsetRect(thisObj.parentNode.parentNode).top+'px';
      mangaOuterContainer.style.left = '30px';

      if($(bookmarkObj).hasClass("on")) {
        $(mangaOuterContainer).css("background", "rgb(255, 64, 96)");
      }
      else {
        $(mangaOuterContainer).css("background", "rgb(34, 34, 34)");
      }

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
      let url = (thisObj.src)? thisObj.src: thisObj.style.backgroundImage.slice(5,-2); //pixiv changes layout randomly
      url = url.replace(/\/...x...\//, '/600x600/'); //both feed and artist works case | TODO: '1200x1200' variant
      return url;
    };
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
    //-----------------------------------------------------------------------------------
    //**************************************Hide*****************************************
    //-----------------------------------------------------------------------------------
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
    //-----------------------------------------------------------------------------------
    //*************************************Clicks****************************************
    //-----------------------------------------------------------------------------------
    hoverImg.onmouseup = function (event) //single arts onclick actions
    {
      onClickActions(this, event, false);
    };
    //-----------------------------------------------------------------------------------
    $('body').on('mouseup', 'div#mangaContainer > img', function(event) //manga arts onclick actions
    {
      onClickActions(this, event, true);
    });
    //-----------------------------------------------------------------------------------
    async function onClickActions(imgContainerObj, event, isManga)
    {
      event.preventDefault();
      let strId = getImgId(imgContainerObj.src);
      let illustPageUrl = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=' + strId;

      //----------------------------Middle Mouse Button click----------------------------
      if (event.button  == 1)
      {
        window.open(illustPageUrl,'_blank'); //open illust page in new tab(in background — with FF pref "browser.tabs.loadDivertedInBackground" set to "true")
      }
      //----------------------------Left Mouse Button clicks...--------------------------
      else if (event.button  == 0)
      {
        //----------------------------Single LMB-click-----------------------------------
        if (!event.altKey)
        {
          let toSave = event.ctrlKey;// Ctrl + LMB-click - saving image
          if (!isManga) //single art original
          {
            getOriginalUrl(illustPageUrl, event, false, toSave);
          }
          else //manga art original
          {
            let src = imgContainerObj.src;
            let pageNum = src.substring(src.indexOf("_")+2, src.lastIndexOf("_"));
            let singleIllustPageUrl = 'https://www.pixiv.net/member_illust.php?mode=manga_big&illust_id=' + strId + '&page=' + pageNum;
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
    //-----------------------------------------------------------------------------------
    async function getOriginalUrl(illustPageUrl, event, isManga, toSave)
    {
      let xhr = new XMLHttpRequest();
      xhr.open("GET", illustPageUrl, true);
      xhr.onreadystatechange = function ()
      {
        if (xhr.readyState == 4 && xhr.status == 200)
        {
          let originalArtUrl = "";
          if (!isManga)
          {
            let scripts = xhr.responseXML.head.getElementsByTagName("script");
            for(let i = 0; i < scripts.length; i++)
            {
              let originalURL = scripts[i].textContent.match(/"original":"(http[^"]+)"/); //thanks to Mango
              if (originalURL) originalArtUrl = originalURL[1].replace(/\\\//g,'/');
            }
          }
          else
          {
            originalArtUrl = xhr.responseXML.querySelectorAll('img')[0].src;
          }
          if (toSave) window.open(originalArtUrl+'?s=1', '_blank');
          else window.open(originalArtUrl, '_blank');
        }
      };
      xhr.responseType = "document";
      xhr.send();
    }
    //-----------------------------------------------------------------------------------
    //**************************************Other****************************************
    //-----------------------------------------------------------------------------------
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
        mangaContainer.scrollLeft += e.deltaY*70; // TODO - find better value for opera/chrome
      }
    };
    //-----------------------------------------------------------------------------------
    window.onresize = function()
    {
      mangaWidth = document.body.clientWidth - 80;
      mangaContainer.style.maxWidth = mangaOuterContainer.style.maxWidth = mangaWidth+'px';
    };
    //-----------------------------------------------------------------------------------
    //***********************************************************************************
    //-----------------------------------------------------------------------------------
  });
}) (); //function
