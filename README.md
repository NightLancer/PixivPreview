# PixivPreview

Script is written for better www.pixiv.net usability.

### General features:
• Showing enlarged preview of artworks on mouse hovering*.<br>
• Highlighting authors from your "Followed" list, so you can quickly distinguish them.<br>
• Non-premium history that can store ~10x more amount of records without time limit.<br>
• Auto-Pagination on Following and Users pages.<br>
• Makes recommendation block(appearing after follow) scrollable, arts preview also available.<br>
• Enlarging also works on users profiles preview(doesn't work on pages with auto-pagination).<br>

### Mouse features on previews:
• LMB-Click - Opens source of artwork in new tab.<br>
• MMB-Click - Opens corresponding artwork page in new tab.<br>
• CTRL+LMB - Instantly download the original of artwork.<br>
• Shift+LMB - Delete artwork from history.<br>
• ALT+LMB - Add artwork to bookmarks.<br>

■ Preview of single artworks appears in left top corner of image block.
<img src=http://i.prntscr.com/4LvnU6EITOmbB8VKMmBcog.png><br>
<img src=http://i.prntscr.com/9ooSkWZLQq6oDalnXD9DjA.png><br>
..or along right screen side, if it doesn't fit on screen in initial position. 
<img src=http://i.prntscr.com/nfXf04wdSuaZeedB1DDExw.png><br>

■ Preview gallery for few manga artworks is positioned mainly in the center of the screen.
<img src=http://i.prntscr.com/7mI9ZYnXSjytYsQRNl5qzw.png><br>
For larger amount of artworks, horizontal scrollbar is appeared, but scrolling via mouse wheel is supported too(note: page scroll is disabled while this, move mouse out of preview to re-enable it). Preview gallery is located 40px from horizontal page edges(considering small screens and window resizing).
<img src=http://i.prntscr.com/td_hJncaSZueEf3hx3mXrA.png><br>

■ The names of the authors(users) you are already subscribed to are highlighted with green.
<img src=https://user-images.githubusercontent.com/19971564/140511941-bb87fd1e-a21e-4ce9-9e8e-a4c00b7aa283.png><br>

■ History is not limited to the time, only to localStorage space(which can be increased). Approximate amount of records without other scripts - 100 000. 
<img src=https://user-images.githubusercontent.com/19971564/140512333-97576bbc-3bb9-4687-a0b3-97e87d578312.png><br>

■ Settings menu is available by the clicking on "Related services" icon, that is located in right top corner of site page. Settings are saved and immediately applied after menu is closed by the clicking on any other space.
<img src=http://i.prntscr.com/22_SOQ3kQBSj_IW-uvvVnw.png><br>

## Preferences:

■ PREVIEW_ON_CLICK =<br>
false : showing preview on mouseover (\*default)<br>
true : showing preview after LMB-Click<br>
<br>
■ DELAY_BEFORE_PREVIEW =<br>
0 : no delay before preview (default)<br>
1000 : 1 second delay (2000 for 2 seconds, etc)<br>
<br>
■ PREVIEW_SIZE =<br>
auto : automatically calculate preview size (1200 or 600) depending on current screen size (default)<br>
600 : up to 600px x 600px<br>
1200 : up to 1200px x 1200px<br>
<br>
■ ACCURATE_MANGA_PREVIEW =<br>
false : quicker, but less accurate in some cases (default)<br>
true : takes 1sec before preview showing for more accurate positioning<br>
<br>
■ DISABLE_MANGA_PREVIEW_SCROLLING_PROPAGATION =<br>
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
■ HIDE_PEOPLE_WHO_BOOKMARKED_THIS =<br>
false: don't change `bookmark_detail.php` page (default)<br>
true: hide "People who bookmarked this" section<br>
<br>
■ KEEP_OLD_DATE_OF_ALREADY_VIEWED_ARTWORKS =<br>
false: update date every time artwork page opens (default)<br>
true: don't renew date and keep first one (NOTE: art will not appear at the top of the history)<br>
<br>
■ ENABLE_AUTO_PAGINATION =<br>
false: disable auto pagination<br>
true: enable auto-pagination on Following and Users pages (default)<br>
### Supported pages:

- New illustrations<br>
- Discovery<br>
- Daily rankings<br>
- Artwork page<br>
- Users pages<br>
- Bookmarks<br>
- History<br>
- Search<br>
- Main page<br>
