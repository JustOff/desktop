justoff.sstart.Widget = function () {

	var Utils = justoff.sstart.Utils
	var Dom = justoff.sstart.Dom
	var Bookmark = justoff.sstart.Bookmark
	var Drag = justoff.sstart.Drag
	var Prefs = justoff.sstart.Prefs
	var SStart = justoff.sstart.SStart
	var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	
	const SEARCH_URL = "sstart://search/";

	Components.utils.import("resource://sstart/cache.js", justoff.sstart);

	this.properties;
	this.view;

	this.setProperties = function (properties) {
		this.properties = properties;
	}

	this.setStorage = function (storage) {
		this.storage = storage;
	}

	this.updateView = function () {
		this.view.style.left = this.properties.left || "";
		this.view.style.top = this.properties.top || "";
		this.view.style.width = this.properties.width || "";
		this.view.style.height = this.properties.height || "";

		var icon = Dom.child(this.view, "icon");
//		icon.style.background = "url(" + this.getIconURL() + ")";

		if (this.properties.url != SEARCH_URL && this.properties.background) {
			this.view.style.background = this.properties.background;
		}

		if (this.properties.isFolder) {
			icon.style.background = "url(chrome://sstart/skin/folder.png)";
		} else if (this.properties.url == SEARCH_URL) {
			icon.style.background = "url(" + this.getIconURL() + ")";
		} else if (this.properties.url) {
//			console.log("url: " + this.properties.url);
			uri = ios.newURI(this.properties.url, null, null);
			fis.getFaviconURLForPage(uri, 
				function (furi, len, data, mimeType) {
					if (furi) {
//						console.log("favicon: " + furi.spec);
						icon.style.background = "url(moz-anno:favicon:" + furi.spec + ")";
					}
				}
			);
		}

		var title = Dom.child(this.view, "title");
		title.innerHTML = this.properties.title || "";
	}

	this.renderView = function () {
		this.view = Dom.get("widget").cloneNode(true);
		Dom.child(this.view, "body").appendChild(this.createView());
		this.view.id = this.properties.id;
		if (this.properties.url == SEARCH_URL) {
			Dom.addClass(this.view, "s-widget");
		}

		Drag.enable(this.view);
//		console.log("[1] renderView->updateView");
		this.updateView();
		if (this.properties.title == Prefs.getString("focus")) {
			var view = this.view;
			setTimeout(function () {
				var node = Dom.child(view, "search");
				if (node) node.focus();
			}, 110);
		}
		var self = this;
		var title = Dom.child(this.view, "title");
		title.addEventListener("dblclick", function () {
			self.editTitle.call(self);
		}, false);

		var remove = Dom.child(this.view, "remove");
		remove.addEventListener("click", function () {
			self.remove.call(self);
		}, false);

		var refresh = Dom.child(this.view, "refresh");
		refresh.addEventListener("click", function () {
			self.refresh.call(self);
		}, false);

		var properties = Dom.child(this.view, "properties");
		properties.addEventListener("click", function () {
			self.openProperties.call(self);
		}, false);

		this.view.addEventListener("drop", function (e) {
			if (self.view.offsetTop < 0 || self.view.offsetLeft < 0) {
				if (document.location != "chrome://sstart/content/sstart.html") {
					if (Utils.confirm(SStart.translate("dialogMoveUpWidget"))) {
						var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
							.getService(Components.interfaces.nsINavBookmarksService);
						var params = Utils.getQueryParams(document.location);
						bookmarksService.moveItem(self.view.id, bookmarksService.getFolderIdForItem(params.folder), 
							bookmarksService.DEFAULT_INDEX);
						Dom.remove(self.view);
						justoff.sstart.cache.fragment = false;
						return;
					}
				}
			}
			Dom.addClass(self.view, "hide");
			var hoverEl = document.elementFromPoint(e.detail.clientX, e.detail.clientY);
			Dom.removeClass(self.view, "hide");
			while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
			if (hoverEl && hoverEl.id) {
				var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
					.getService(Components.interfaces.nsINavBookmarksService);
				if (bookmarksService.getItemType(hoverEl.id) == bookmarksService.TYPE_FOLDER) {
					if (Utils.confirm(SStart.translate("dialogMoveWidget"))) {
						bookmarksService.moveItem(self.view.id, hoverEl.id, bookmarksService.DEFAULT_INDEX);
						Dom.remove(self.view);
						var c = document.getElementById(hoverEl.id);
						var r = Dom.child(c, "refresh");
						if (r) {
							r.click()
						}
						return;
					}
				}
			}
/*
			self.properties.left = self.view.offsetLeft;
			self.properties.top = self.view.offsetTop;
			var resized = (self.properties.width != self.view.clientWidth || self.properties.height != self.view.clientHeight);
			self.properties.width = self.view.clientWidth;
			self.properties.height = self.view.clientHeight;
*/
			if (self.properties.top != self.view.offsetTop)
				self.view.style.top = SStart.alignToGrid(self.view.offsetTop);
			if (self.properties.left != self.view.offsetLeft)
				self.view.style.left = SStart.alignToGrid(self.view.offsetLeft);
			self.properties.top = parseInt(self.view.style.top, 10);
			self.properties.left = parseInt(self.view.style.left, 10);
			if (self.properties.width != self.view.clientWidth)
				self.view.style.width = SStart.alignToGrid(self.view.clientWidth);
			if (self.properties.height != self.view.clientHeight)
				self.view.style.height = SStart.alignToGrid(self.view.clientHeight);
			var resized = (self.properties.width != parseInt(self.view.style.width, 10) 
				|| self.properties.height != parseInt(self.view.style.height, 10));
			self.properties.width = parseInt(self.view.style.width, 10);
			self.properties.height = parseInt(self.view.style.height, 10);
			self.save.call(self);
//			console.log("[2] renderView->updateView");
			self.updateView.call(self);
			if (resized) {
				self.refresh.call(self);
			}
		}, false);

		this.view.addEventListener("align", function (e) {
			self.view.style.top = self.properties.top = SStart.alignToGrid(self.properties.top);
			self.view.style.left = self.properties.left = SStart.alignToGrid(self.properties.left);
			self.save.call(self);
		}, false);

		return this.view;
	}

	this.remove = function () {
		if (Utils.confirm("\"" + this.properties.title + "\"\n" + SStart.translate("dialogRemoveWidget"))) {
			if (this.view) Dom.remove(this.view);
			this.storage.removeObject(this.properties.id);
			return true;
		}
	}

	this.refresh = function () {
	}
	this.openProperties = function () {
	}

	this.save = function () {
		this.storage.saveObject(this.properties);
	}

	this.getIconURL = function () {
		return Bookmark.getFaviconURL(this.properties.url);
	}

	this.editTitle = function () {
//		if (SStart.isLocked()) return;
		if (SStart.isLocked())
			Dom.addClass(document.body, 'no-hlink');
		var self = this;
		var title = Dom.child(self.view, "title");

		function removeInput() {
			title.innerHTML = self.properties.title;
			Dom.removeClass(document.body, 'no-hlink');
		}

		function updateTitle() {
			self.properties.title = title.firstChild.value;
			self.save.call(self);
			removeInput();
		}

		function onKeyUp(e) {
			switch (e.keyCode) {
				case e.DOM_VK_RETURN:
					updateTitle();
					break;
				case e.DOM_VK_ESCAPE:
					removeInput();
					break;
			}
		}

		title.innerHTML = "<input type='text'>";
		var input = title.firstChild;
		input.value = this.properties.title;
		input.focus();
//		input.select();
		input.addEventListener("blur", updateTitle, false);
		input.addEventListener("keyup", onKeyUp, false);
	}
}

justoff.sstart.Widget.HEADER_HEIGHT = 20;
