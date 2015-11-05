justoff.sstart.Storage = function (folderId) {

	var Prefs = justoff.sstart.Prefs

	Components.utils.import("chrome://sstart/content/file.js");
	Components.utils.import("chrome://sstart/content/utils.js");
	Components.utils.import("chrome://sstart/content/bookmark.js");

	var ROOT_TITLE = "SStart";
	var DESKTOP_ROOT = "Desktop";
	var ANNOTATION = "bookmarkProperties/description";

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
		this.fileProtocolHandler = Components.classes["@mozilla.org/network/protocol;1?name=file"]
			.createInstance(Components.interfaces.nsIFileProtocolHandler);
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
				var ddir = Components.classes["@mozilla.org/file/directory_service;1"]
					.getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
				ddir.append("desktop"); ddir.append("background");
				if (ddir.exists()) {
					var sdir = File.getDataDirectory();
					try {
						ddir.copyTo(sdir, "bg_0");
					} catch (e) {}
					var properties = {backgroundImage: "1"};
					var dprefs = Components.classes["@mozilla.org/preferences-service;1"]
						.getService(Components.interfaces.nsIPrefService).getBranch("extensions.desktop.");
					try {
						properties.backgroundStyle = dprefs.getIntPref("backgroundStyle");
					} catch (e) {
						properties.backgroundStyle = 1;
					}
					Bookmark.setAnnotation(newId, ANNOTATION, Utils.toJSON(properties));
					Prefs.setInt('backgroundStyle', properties.backgroundStyle);
				}
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
				if (annotation) {
					if (annotation.indexOf("file://") > -1) {
						annotation = importCustomImage(annotation);
					}
					Bookmark.setAnnotation(newId, ANNOTATION, annotation);
				}
				copyFolder(bookmarks[i].id, newId);
			} else {
				if (bookmarks[i].url == "desktop://search/")
					bookmarks[i].url = "sstart://search/";
				newId = Bookmark.createBookmark(bookmarks[i].url, bookmarks[i].title, dstId);
				annotation = Bookmark.getAnnotation(bookmarks[i].id, ANNOTATION);
				if (annotation) {
					if (annotation.indexOf("file://") > -1) {
						annotation = importCustomImage(annotation);
					}
					Bookmark.setAnnotation(newId, ANNOTATION, annotation);
				}
			}
		}
	}
	
	function importCustomImage(annotation) {
		var properties = Utils.fromJSON(annotation);
		try {
			var cif = this.fileProtocolHandler.getFileFromURLSpec(properties.customImage);
			if (cif.exists()) {
				var hashWord = (Math.random().toString(36)+'00000000000000000').slice(2, 10);
				cif.copyTo(File.getDataDirectory(), hashWord + "." + cif.leafName);
				properties.customImage = hashWord + "." + cif.leafName;
			}
		} catch (e) {}
		return Utils.toJSON(properties);
	}

	this.refreshFolder = function () {
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
				Utils.alert(e);
			}
		}
		return bookmarks;
	}

	this.getProperties = function () {
		var annotation = Bookmark.getAnnotation(folderId, ANNOTATION);
		return Utils.fromJSON(annotation);
	}

	this.setProperties = function (object) {
		if (Object.getOwnPropertyNames(object).length > 0)
			Bookmark.setAnnotation(folderId, ANNOTATION, Utils.toJSON(object));
	}

	this.saveObject = function (object) {
		if (object.id) {
			if (object.isFolder) {
				Bookmark.updateFolder(object.id, object.title);
			} else {
				Bookmark.updateBookmark(object.id, object.url, object.title);
			}
		}
		else {
			if (object.isFolder) {
				object.id = Bookmark.createFolder(object.title, folderId);
				if (object.title == "") {
					object.title = "Folder " + object.id;
					Bookmark.updateFolder(object.id, object.title);
				}
			} else {
				object.id = Bookmark.createBookmark(object.url, object.title, folderId);
			}
		}
		var annotation = Utils.clone(object);
		var exclude = ["id", "url", "title", "isFolder"];
		for (var i in exclude) {
			delete annotation[exclude[i]];
		}
		if (Object.getOwnPropertyNames(annotation).length > 0)
			Bookmark.setAnnotation(object.id, ANNOTATION, Utils.toJSON(annotation));
		this.refreshFolder.call(this);
	}

	this.removeObject = function (id) {
		Bookmark.removeAnnotation(id, ANNOTATION);
		Bookmark.removeBookmark(id);
		this.refreshFolder.call(this);
	}

}

