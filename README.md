# PixivPreview

Script is written for www.pixiv.net site usability.

Features:<br>
• Showing enlarged preview of artworks and manga on mouse hovering* on most site pages.<br>
• Highlighting names of users from your "Followed" list.<br>
• Opening source of artwork in new tab in one click (LMB).<br>
• MMB-click on preview opens corresponding artwork page.<br>
• Instantly save the original art by clicking Ctrl+LMB on the art preview.<br>
• Quick add to bookmarks by clicking ALT+LMB on the art preview.<br>
• Repeat ALT-LMB combination again for quick unfavoriting/opening bookmark tags edition page.<br>

■ Preview of single artworks appears in left top corner of image block.
<img src=http://i.prntscr.com/4LvnU6EITOmbB8VKMmBcog.png><br>
<img src=http://i.prntscr.com/9ooSkWZLQq6oDalnXD9DjA.png><br>
..or along rigth screen side, if it doesn't fit on screen in initial position. 
<img src=http://i.prntscr.com/nfXf04wdSuaZeedB1DDExw.png><br>

■ Preview gallery for few manga artworks is positioned mainly in the center of the screen.
<img src=http://i.prntscr.com/7mI9ZYnXSjytYsQRNl5qzw.png><br>
For larger amount of artworks, horisontal scrollbar is appeared, but scrolling via mouse wheel is supported too(note: page scroll is disabled while this, move mouse out of preview to reenable it). Preview gallery is located 40px from horizontal page edges(considering small screens and window resizing).
<img src=http://i.prntscr.com/td_hJncaSZueEf3hx3mXrA.png><br>

■ The names of the authors(users) you are already subscribed to are highlighted with green.
<img src=http://i.prntscr.com/xa2ErFzkQOGLloz9kAHRZQ.png><br>

Settings menu is available by the clicking on "Related services" icon, that is located in right top corner of site page. Settings are saved and immediately applied after menu is closed by the clicking on any other space.
<img src=http://i.prntscr.com/22_SOQ3kQBSj_IW-uvvVnw.png><br>

Preferences:<br>
<br>

■ PREVIEW_ON_CLICK =<br>
false : showing preview on mouseover (default)<br>
true : showing preview after LMB-click<br>
<br>
■ DELAY_BEFORE_PREVIEW =<br>
0 : no delay before preview (default)<br>
1000 : 1 second delay (2000 for 2 seconds, etc)<br>
<br>
■ previewSize =<br>
0 : automatically calculate preview size (1200 or 600) depending of current screen size (default)<br>
600 : up to 600px x 600px<br>
1200 : up to 1200px x 1200px<br>
<br>
■ ACCURATE_MANGA_PREVIEW =<br>
false : quicker, but less accurate in some cases (default)<br>
true : takes 1sec before preview showing for more accurate positioning<br>
<br>
■ DISABLE_MANGA_PREVIEW_SCROLLLING_PROPAGATION =<br>
false : keeping page scrolling after end of manga preview scrolling (default)<br>
true : disable page scrolling when viewing manga preview (move mouse out of preview to re-enable scrolling)<br>
<br>
■ SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE =<br>
true : preview of single image will smoothly fit to vertical screen border after one scroll (default)<br>
false : manually scrolling (may need in case of forced 1200px vertical preview with small user screen)<br>
<br>
■ DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING =<br>
false: standard behavior (default)<br>
true : disable page scrolling when viewing single preview (works only if previous setting set to `true`)<br>
<br>
Supported pages:<br>
- New illustrations<br>
- Discovery<br>
- Daily rankings<br>
- Artwork page<br>
- Pixiv member pages<br>
- Search<br>
- Bookmarked artworks<br>
- Bookmark information<br>
- Main page<br>

Works best with <a href="https://greasyfork.org/uk/scripts/3254-endless-pixiv-pages">"Endless Pixiv Pages"</a> ©Mango.<br>
