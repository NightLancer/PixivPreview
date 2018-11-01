# PixivPreview

Script is written for www.pixiv.net site usability.

Features:<br>
• Showing enlarged preview of artworks and manga on mouse hovering on most pages.<br>
• Highlighting names of users from "Followed" list.<br>
• Opening source of artwork in new tab in one click(LMB).<br>
• Quickly save the original art by clicking Ctrl+LMB-Click on the art preview.<br>
• Quick add to bookmarks by clicking Alt+LMB-Click on the art preview.<br>

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

■ Click left mouse button on image preview to open original art in new tab, or middle mouse button to open art illustration page. 

■ Press Alt and left mouse button click for quick adding artwork into bookmarks. Repeat combination again for opening bookmark (tags) edition page(on pages with old pixiv layout).

You can set `PREVIEW_ON_CLICK = true;` to change preview appearing condition to LMB-click.

Works best with <a href="https://greasyfork.org/uk/scripts/3254-endless-pixiv-pages">"Endless Pixiv Pages"</a> ©Mango.<br>
