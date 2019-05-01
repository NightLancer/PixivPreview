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

You can:
- set `PREVIEW_SIZE = 1200;` (instead of standard 600 pixels)if you are using appropriate monitor(QHD or 4K).
- set `PREVIEW_ON_CLICK = true;` to change preview appearing condition to LMB-click.
- change `DELAY_BEFORE_PREVIEW = 0;` from 0 to the desired value in ms (1000 = 1 second) in order to increase delay before art preview appearing.
- set `ACCURATE_MANGA_PREVIEW = true;` to make more position-accurate(due to content) manga preview.
- set `SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE = false;` to disable scrollIntoView for single preview
- set `DISABLE_SINGLE_PREVIEW_BACKGROUND_SCROLLING = false;` to disable background scrolling for single preview (when `SCROLL_INTO_VIEW_FOR_SINGLE_IMAGE` set to `true`)

Works best with <a href="https://greasyfork.org/uk/scripts/3254-endless-pixiv-pages">"Endless Pixiv Pages"</a> ©Mango.<br>
