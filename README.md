# PixivPreview

Script is written for better www.pixiv.net usability. (![Install](https://github.com/NightLancer/PixivPreview/raw/master/PixivPreview.user.js))

### General features:
• Showing enlarged preview of artworks on mouse hovering*.<br>
• Highlighting authors from your "Followed" list, so you can quickly distinguish them.<br>
• Non-premium history that can store ~10x more amount of records without time limit.<br>
• Auto-Pagination on Following and Users pages.<br>
• Makes recommendation block(appearing after follow) scrollable, arts preview also available.<br>
• Enlarging also works on users profiles preview.<br>

### Mouse features on previews:
• LMB-Click - Opens source of artwork in new tab.<br>
• MMB-Click - Opens corresponding artwork page in new tab.<br>
• CTRL+LMB - Instantly download the original of artwork.<br>
• Shift+LMB - Delete artwork from history.<br>
• ALT+LMB - Add artwork to bookmarks.<br>

■ Preview of single artworks appears aligning to left top corner of image block, or screen border(if it doesn't fit).
![](https://user-images.githubusercontent.com/19971564/159192783-a6412253-1d1a-4f72-a25f-f98bbf612496.jpg)

■ Preview for multiple artworks viewed as gallery and positioned in the center of the screen (with scrollbar if needed).
![](https://user-images.githubusercontent.com/19971564/159192968-3e99a064-d0f0-4328-bddc-820a2b2f6dad.png)

■ The names of the authors you are already subscribed to are highlighted with green.
<img src=https://user-images.githubusercontent.com/19971564/140511941-bb87fd1e-a21e-4ce9-9e8e-a4c00b7aa283.png><br>

■ History is not limited to the time, only to localStorage space(which can be increased). Approximate amount of records without other scripts - 100 000. History can be exported to script manager storage by pressing `Shift+E` on history page for backup/transferring to another browser.
<img src=https://user-images.githubusercontent.com/19971564/140512333-97576bbc-3bb9-4687-a0b3-97e87d578312.png><br>

■ Settings menu is available by the clicking on "Related services" icon, that is located in right top corner of site page. Settings are saved and (if possible) immediately applied after menu is closed by the clicking on any other space.
![](https://user-images.githubusercontent.com/19971564/159194686-4f28a206-4241-42d6-a54e-17d40200524a.jpg)

## Preferences:

■ PREVIEW_ON_CLICK =<br>
false : showing preview on mouseover (\*default)<br>
true : showing preview after LMB-Click<br>
<br>
■ DELAY_BEFORE_PREVIEW =<br>
0 : no delay before preview <br>
100 : 0.1 second delay (1000 for 1 second, etc) (default)<br>
<br>
■ PREVIEW_SIZE =<br>
auto : automatically calculate preview size (1200 or 600) depending on current screen size (default)<br>
600 : up to 600px x 600px<br>
1200 : up to 1200px x 1200px<br>
<br>
■ ENABLE_AUTO_PAGINATION =<br>
false: disable auto pagination<br>
true: enable auto-pagination on Following and Users pages (default)<br>
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
