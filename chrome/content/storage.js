justoff.sstart.Storage = function (folderId) {

    var File = justoff.sstart.File
    var Utils = justoff.sstart.Utils
    var Bookmark = justoff.sstart.Bookmark

    const ROOT_TITLE = "SStart";
    const DESKTOP_ROOT = "Desktop";
    const ANNOTATION = "bookmarkProperties/description";

    if (!folderId) folderId = getRootId();

    function getRootId() {
        var bookmarks = Bookmark.getBookmarks();
        for (var i in bookmarks) {
            if (bookmarks[i].isFolder &&
                bookmarks[i].title == ROOT_TITLE) return bookmarks[i].id;
        }
        return importFromDesktop(bookmarks);
    }

    function importFromDesktop(bookmarks) {
        for (var i in bookmarks) {
            if (bookmarks[i].isFolder && bookmarks[i].title == DESKTOP_ROOT) {
				var newId = Bookmark.createFolder(ROOT_TITLE);
				var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
					.getService(Components.interfaces.nsINavBookmarksService);
				var callback = {
					runBatched: function() {
						copyFolder(bookmarks[i].id, newId);
					}
				}
				bookmarksService.runInBatchMode(callback, null);
				return newId;
			}
        }
		return Bookmark.createFolder(ROOT_TITLE);
    }
	
    function copyFolder(srcId, dstId) {
        var bookmarks = Bookmark.getBookmarks(srcId);
		var newId, annotation;
        for (var i in bookmarks) {
            if (bookmarks[i].isFolder) {
				newId = Bookmark.createFolder(bookmarks[i].title, dstId);
				annotation = Bookmark.getAnnotation(bookmarks[i].id, ANNOTATION);
				Bookmark.setAnnotation(newId, ANNOTATION, annotation);
				copyFolder(bookmarks[i].id, newId);
			} else {
				if (bookmarks[i].url == "desktop://search/")
					bookmarks[i].url = "sstart://search/";
				newId = Bookmark.createBookmark(bookmarks[i].url, bookmarks[i].title, dstId);
				annotation = Bookmark.getAnnotation(bookmarks[i].id, ANNOTATION);
				Bookmark.setAnnotation(newId, ANNOTATION, annotation);
			}
        }
    }

    function refreshFolder() {
        try {
            File.getDataFile(folderId).remove(false)
        } catch (e) {
        }
    }

    this.getTitle = function () {
        return Bookmark.getTitle(folderId);
    }

    this.getObjects = function () {
        var bookmarks = Bookmark.getBookmarks(folderId);
        for (var i in bookmarks) {
            var bookmark = bookmarks[i];
            try {
                var annotation = Bookmark.getAnnotation(bookmark.id, ANNOTATION);
                Utils.merge(bookmark, Utils.fromJSON(annotation));
            }
            catch (e) {
                alert(e);
            }
        }
        return bookmarks;
    }

    this.getProperties = function () {
        var annotation = Bookmark.getAnnotation(folderId, ANNOTATION);
        return Utils.fromJSON(annotation);
    }

    this.saveObject = function (object) {
        if (object.id) {
            if (object.isFolder) Bookmark.updateFolder(object.id, object.title);
            else Bookmark.updateBookmark(object.id, object.url, object.title);
        }
        else {
            if (object.isFolder) object.id = Bookmark.createFolder(object.title, folderId);
            else object.id = Bookmark.createBookmark(object.url, object.title, folderId);
        }
        var annotation = Utils.clone(object);
        var exclude = ["id", "url", "title", "isFolder"];
        for (var i in exclude) {
            delete annotation[exclude[i]];
        }
        Bookmark.setAnnotation(object.id, ANNOTATION, Utils.toJSON(annotation));
        refreshFolder.call(this);
    }

    this.removeObject = function (id) {
        Bookmark.removeAnnotation(id, ANNOTATION);
        Bookmark.removeBookmark(id);
        refreshFolder.call(this);
    }

}

