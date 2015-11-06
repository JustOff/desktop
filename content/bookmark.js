var EXPORTED_SYMBOLS = ["Bookmark"];

var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

Cu.import("chrome://sstart/content/url.js");

var Bookmark = {

	bookmarksService: Cc["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Ci.nsINavBookmarksService),
	
	historyService: Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService),
	
	annotationService: Cc["@mozilla.org/browser/annotation-service;1"].getService(Ci.nsIAnnotationService),

	query: function (folderId) {

		var options = this.historyService.getNewQueryOptions();
		var query = this.historyService.getNewQuery();
		query.setFolders([folderId], 1);

		return this.historyService.executeQuery(query, options);
	},

	getBookmarks: function (folderId) {
		var result = this.query(folderId || this.bookmarksService.bookmarksMenuFolder);
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
	},

	getTitle: function (id) {
		return this.bookmarksService.getItemTitle(id);
	},

	createFolder: function (title, parentId) {
		return this.bookmarksService.createFolder(parentId || this.bookmarksService.bookmarksMenuFolder, title, -1);
	},

	createBookmark: function (uri, title, folderId) {
		return this.bookmarksService.insertBookmark(folderId
			|| this.bookmarksService.bookmarksMenuFolder, URL.getNsiURL(uri), -1, title);
	},

	updateFolder: function (id, title) {
		this.bookmarksService.setItemTitle(id, title);
	},

	updateBookmark: function (id, uri, title) {
		this.bookmarksService.setItemTitle(id, title);
		this.bookmarksService.changeBookmarkURI(id, URL.getNsiURL(uri));
	},

	removeBookmark: function (id) {
		this.bookmarksService.removeItem(id);
	},

	getAnnotation: function (idOrUri, name) {
		try {
			return idOrUri instanceof Ci.nsIURI
				? this.annotationService.getPageAnnotation(idOrUri, name)
				: this.annotationService.getItemAnnotation(idOrUri, name);
		} catch (e) {
			return null;
		}
	},

	setAnnotation: function (idOrUri, name, value) {
		idOrUri instanceof Ci.nsIURI
			? this.annotationService.setPageAnnotation(idOrUri, name, value, 0, this.annotationService.EXPIRE_NEVER)
			: this.annotationService.setItemAnnotation(idOrUri, name, value, 0, this.annotationService.EXPIRE_NEVER);
	},

	removeAnnotation: function (idOrUri, name) {
		idOrUri instanceof Ci.nsIURI
			? this.annotationService.removePageAnnotation(idOrUri, name)
			: this.annotationService.removeItemAnnotation(idOrUri, name);
	}

};
