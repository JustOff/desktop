justoff.sstart.Widget = function () {

	var Utils = justoff.sstart.Utils
	var Dom = justoff.sstart.Dom
	var Bookmark = justoff.sstart.Bookmark
	var Prefs = justoff.sstart.Prefs
	var SStart = justoff.sstart.SStart
	var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	
	const SEARCH_URL = "sstart://search/";

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

		if (this.properties.url != SEARCH_URL && this.properties.background) {
			this.view.style.background = this.properties.background;
		}

		if (this.properties.isFolder) {
			icon.style.background = "url(chrome://sstart/skin/folder.png)";
		} else if (this.properties.url == SEARCH_URL) {
			icon.style.background = "url(" + this.getIconURL() + ")";
		} else if (this.properties.url) {
			uri = ios.newURI(this.properties.url, null, null);
			fis.getFaviconURLForPage(uri, 
				function (furi, len, data, mimeType) {
					if (furi) {
						icon.style.background = "url(moz-anno:favicon:" + furi.spec + ")";
					}
				}
			);
		}

		var title = Dom.child(this.view, "title");
		var titletext = document.createTextNode(this.properties.title ? this.properties.title : "");
		if (title.firstChild) title.removeChild(title.firstChild);
		title.appendChild(titletext);
	}

	this.renderView = function () {
		this.view = Dom.get("widget").cloneNode(true);
		Dom.child(this.view, "body").appendChild(this.createView());
		this.view.id = this.properties.id;
		if (this.properties.url == SEARCH_URL) {
			this.view.setAttribute("data-search", "true");
		}

		this.updateView();

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
				if (!(document.location.href.lastIndexOf("?") == -1)) {
					if (Utils.confirm(SStart.translate("dialogMoveUpWidget"))) {
						var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
							.getService(Components.interfaces.nsINavBookmarksService);
						var params = Utils.getQueryParams(document.location);
						bookmarksService.moveItem(self.view.id, bookmarksService.getFolderIdForItem(params.folder), 
							bookmarksService.DEFAULT_INDEX);
						Dom.remove(self.view);
						SStart.clearCache();
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
			if (self.properties.top != self.view.offsetTop)
				self.view.style.top = SStart.alignToGrid(self.view.offsetTop);
			if (self.properties.left != self.view.offsetLeft)
				self.view.style.left = SStart.alignToGrid(self.view.offsetLeft);
			var moved = (self.properties.top != parseInt(self.view.style.top, 10) 
				|| self.properties.left != parseInt(self.view.style.left, 10));
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
			self.updateView.call(self);
			if (resized) {
				self.refresh.call(self);
			}
			if (SStart.getZoom() && SStart.getPageId() == 0 && (resized || moved)) {
				SStart.clearCache();
			}
		}, false);

		this.view.addEventListener("align", function (e) {
			self.view.style.top = self.properties.top = SStart.alignToGrid(self.properties.top);
			self.view.style.left = self.properties.left = SStart.alignToGrid(self.properties.left);
			self.view.style.width = self.properties.width = SStart.alignToGrid(self.properties.width);
			if (self.properties.url != SEARCH_URL)
				self.view.style.height = self.properties.height = SStart.alignToGrid(self.properties.height);
			self.save.call(self);
		}, false);

		return this.view;
	}

	this.remove = function () {
		if (Utils.confirm("\"" + this.properties.title + "\"\n" + SStart.translate("dialogRemoveWidget"))) {
			if (this.view) Dom.remove(this.view);
			this.storage.removeObject(this.properties.id);
			if (SStart.getZoom() && SStart.getPageId() == 0) {
				SStart.clearCache();
			}
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
		if (SStart.isLocked())
			Dom.addClass(document.body, 'no-hlink');
		var self = this;
		var title = Dom.child(self.view, "title");

		function removeInput() {
			var titletext = document.createTextNode(self.properties.title);
			title.removeChild(title.firstChild);
			title.appendChild(titletext);
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

		var input = document.createElement("input");
		input.type = "text";
		input.style = "background: #FFFFFF";
		input.value = this.properties.title;
		title.removeChild(title.firstChild);
		title.appendChild(input);
		input.focus();
		input.addEventListener("blur", updateTitle, false);
		input.addEventListener("keyup", onKeyUp, false);
	}
}

justoff.sstart.Widget.HEADER_HEIGHT = 20;
