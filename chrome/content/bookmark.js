justoff.sstart.Bookmark = new function () {

	var Bookmark = this
	var URL = justoff.sstart.URL

	this.query = function (folderId) {
		var historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"]
			.getService(Components.interfaces.nsINavHistoryService);

		var options = historyService.getNewQueryOptions();
		var query = historyService.getNewQuery();
		query.setFolders([folderId], 1);

		return historyService.executeQuery(query, options);
	};

	this.getBookmarks = function (folderId) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		var result = Bookmark.query(folderId || bookmarksService.bookmarksMenuFolder);
		result.root.containerOpen = true;

		var bookmarks = [];
		for (var i = 0; i < result.root.childCount; i++) {
			var bookmark = result.root.getChild(i);
			bookmarks.push({
				id:bookmark.itemId,
				url:bookmark.uri,
				title:bookmark.title,
				isFolder:bookmark.type == bookmark.RESULT_TYPE_FOLDER
			});
		}
		result.root.containerOpen = false;
		return bookmarks;
	};

	this.getTitle = function (id) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		return bookmarksService.getItemTitle(id);
	};

	this.createFolder = function (title, parentId) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		return bookmarksService.createFolder(parentId || bookmarksService.bookmarksMenuFolder, title, -1);
	};

	this.createBookmark = function (uri, title, folderId) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		return bookmarksService.insertBookmark(folderId || bookmarksService.bookmarksMenuFolder,
			URL.getNsiURL(uri), -1, title);
	};

	this.updateFolder = function (id, title) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		bookmarksService.setItemTitle(id, title);
	};

	this.updateBookmark = function (id, uri, title) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		bookmarksService.setItemTitle(id, title);
		bookmarksService.changeBookmarkURI(id, URL.getNsiURL(uri));
	};

	this.removeBookmark = function (id) {
		var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Components.interfaces.nsINavBookmarksService);
		bookmarksService.removeItem(id);
	};

	this.getAnnotation = function (idOrUri, name) {
		var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"]
			.getService(Components.interfaces.nsIAnnotationService);
		try {
			return idOrUri instanceof Components.interfaces.nsIURI
				? annotationService.getPageAnnotation(idOrUri, name)
				: annotationService.getItemAnnotation(idOrUri, name);
		} catch (e) {
			return null;
		}
	};

	this.setAnnotation = function (idOrUri, name, value) {
		var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"]
			.getService(Components.interfaces.nsIAnnotationService);
		idOrUri instanceof Components.interfaces.nsIURI
			? annotationService.setPageAnnotation(idOrUri, name, value, 0, annotationService.EXPIRE_NEVER)
			: annotationService.setItemAnnotation(idOrUri, name, value, 0, annotationService.EXPIRE_NEVER);
	};

	this.removeAnnotation = function (idOrUri, name) {
		var annotationService = Components.classes["@mozilla.org/browser/annotation-service;1"]
			.getService(Components.interfaces.nsIAnnotationService);
		idOrUri instanceof Components.interfaces.nsIURI
			? annotationService.removePageAnnotation(idOrUri, name)
			: annotationService.removeItemAnnotation(idOrUri, name);
	};

	this.getFaviconURL = function (url) {
		try {
		  var faviconService = Components.classes["@mozilla.org/browser/favicon-service;1"]
			  .getService(Components.interfaces.nsIFaviconService);
		  var nsiUrl = URL.getNsiURL(url);
		  var faviconUrl = faviconService.getFaviconImageForPage(nsiUrl);
		  return faviconUrl.spec;
		} catch(e) {
		  // Synchronous API is not supported in Firefox 21 and later
		  return null;
		}
	};

};

