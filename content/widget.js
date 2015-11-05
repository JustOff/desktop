justoff.sstart.Widget = function () {

	var SStart = justoff.sstart.SStart

	Components.utils.import("chrome://sstart/content/cache.js");
	Components.utils.import("chrome://sstart/content/utils.js");
	Components.utils.import("chrome://sstart/content/dom.js");

	var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	
	var SEARCH_URL = "sstart://search/";

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
			var body = Dom.child(this.view, "body");
			body.style.backgroundColor = this.properties.background;
		}

		if (this.properties.isFolder) {
			icon.style.backgroundImage = "url(chrome://sstart/skin/folder.png)";
		} else if (this.properties.url == SEARCH_URL) {
			icon.style.backgroundImage = "url(" + SStart.getSearchEngine(this.properties.title).iconURI.spec + ")";
		} else if (this.properties.url) {
			SStart.incFVC();
			var uri = ios.newURI(this.properties.url, null, null);
			fis.getFaviconURLForPage(uri, 
				function (furi, len, data, mimeType) {
					if (furi) {
						icon.style.backgroundImage = "url(moz-anno:favicon:" + furi.spec + ")";
					}
					if (SStart.decFVC() == 0) {
						var factory = document.getElementById("factory");
						var event = new Event("savecache");
						factory.dispatchEvent(event);
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
		this.view = document.getElementById("widget").cloneNode(true);
		Dom.child(this.view, "body").appendChild(this.createView());
		this.view.id = this.properties.id;
		if (this.properties.url == SEARCH_URL) {
			Dom.addClass(this.view, "swidget");
		}

		this.updateView();

		var self = this;
		var title = Dom.child(this.view, "title");
		title.addEventListener("dblclick", function () {
			self.editTitle.call(self);
		}, false);

		var remove = Dom.child(this.view, "remove");
		remove.addEventListener("click", function (e) {
			self.remove.call(self);
			e.stopPropagation();
		}, false);

		var refresh = Dom.child(this.view, "refresh");
		refresh.addEventListener("click", function (e) {
			self.refresh.call(self);
			e.stopPropagation();
		}, false);

		var icon = Dom.child(this.view, "icon");
		icon.addEventListener("refresh", function () {
			self.irefresh.call(self);
		}, false);

		var properties = Dom.child(this.view, "properties");
		properties.addEventListener("click", function (e) {
			self.openProperties.call(self);
			e.stopPropagation();
		}, false);

		this.view.addEventListener("drop", function (e) {
			var grid = document.getElementById("grid");
			if (grid) {
				grid.style.display = "none";
				grid.style.width = document.body.scrollWidth + "px";
				grid.style.height = document.body.scrollHeight + "px";
				grid.style.display = "block";
			}
			Dom.addClass(self.view, "hide");
			var hoverEl = document.elementFromPoint(e.detail.clientX, e.detail.clientY);
			Dom.removeClass(self.view, "hide");
			while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
			if (hoverEl && hoverEl.id) {
				var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
					.getService(Components.interfaces.nsINavBookmarksService);
				if (bookmarksService.getItemType(hoverEl.id) == bookmarksService.TYPE_FOLDER) {
					if (Utils.confirm(Utils.translate("dialogMoveWidget"))) {
						bookmarksService.moveItem(self.view.id, hoverEl.id, bookmarksService.DEFAULT_INDEX);
						Dom.remove(self.view);
						var c = document.getElementById(hoverEl.id);
						var r = Dom.child(c, "refresh");
						if (r) {
							var event = new Event("click");
							r.dispatchEvent(event);
						}
						return;
					}
				}
			} else if (self.view.offsetTop < 0 || self.view.offsetLeft < 0) {
				if (!(document.location.href.lastIndexOf("?") == -1)) {
					if (Utils.confirm(Utils.translate("dialogMoveUpWidget"))) {
						var bookmarksService = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"]
							.getService(Components.interfaces.nsINavBookmarksService);
						var params = Utils.getQueryParams(document.location);
						bookmarksService.moveItem(self.view.id, bookmarksService.getFolderIdForItem(params.folder), 
							bookmarksService.DEFAULT_INDEX);
						Dom.remove(self.view);
						self.refreshFolder.call(self);
						Cache.clearCache();
						return;
					}
				}
			}
			if (self.properties.top != self.view.offsetTop)
				self.view.style.top = Cache.alignToGrid(self.view.offsetTop);
			if (self.properties.left != self.view.offsetLeft)
				self.view.style.left = Cache.alignToGrid(self.view.offsetLeft);
			var moved = (self.properties.top != parseInt(self.view.style.top, 10) 
				|| self.properties.left != parseInt(self.view.style.left, 10));
			self.properties.top = parseInt(self.view.style.top, 10);
			self.properties.left = parseInt(self.view.style.left, 10);
			if (self.properties.width != self.view.clientWidth)
				self.view.style.width = Cache.alignToGrid(self.view.clientWidth, self.view.clientWidth == 20);
			if (self.properties.height != self.view.clientHeight)
				self.view.style.height = Cache.alignToGrid(self.view.clientHeight, self.view.clientHeight == 20);
			var resized = (self.properties.width != parseInt(self.view.style.width, 10) 
				|| self.properties.height != parseInt(self.view.style.height, 10));
			self.properties.width = parseInt(self.view.style.width, 10);
			self.properties.height = parseInt(self.view.style.height, 10);
			self.save.call(self);
			self.updateView.call(self);
			Dom.removeClass(self.view, "new");
			if (resized) {
				self.updateDefaultSize.call(self);
				self.refresh.call(self);
			}
			if ((SStart.getZoom() && SStart.getPageId() == 0 && resized) || moved) {
				Cache.clearCache();
			}
		}, false);

		this.view.addEventListener("align", function (e) {
			self.view.style.top = self.properties.top = Cache.alignToGrid(self.properties.top);
			self.view.style.left = self.properties.left = Cache.alignToGrid(self.properties.left);
			self.view.style.width = self.properties.width = Cache.alignToGrid(self.properties.width, self.properties.width == 20);
			if (self.properties.url != SEARCH_URL)
				self.view.style.height = self.properties.height = Cache.alignToGrid(self.properties.height, self.properties.height == 20);
			self.save.call(self);
		}, false);

		return this.view;
	}

	this.remove = function () {
		if (Utils.confirm("\n\"" + this.properties.title + "\"\n\n" + Utils.translate("dialogRemoveWidget") + "\n\n")) {
			if (this.view) Dom.remove(this.view);
			this.storage.removeObject(this.properties.id);
			if (SStart.getZoom() && SStart.getPageId() == 0) {
				Cache.clearCache();
			}
			if (this.properties.isFolder) {
				Cache.setUpdateMenu(true);
			}
		}
	}

	this.refresh = function () {
	}

	this.irefresh = function () {
	}

	this.updateDefaultSize = function () {
	}

	this.openProperties = function () {
	}

	this.save = function () {
		this.storage.saveObject(this.properties);
	}

	this.refreshFolder = function () {
		this.storage.refreshFolder();
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
			if (self.properties.isFolder) {
				Cache.setUpdateMenu(true);
			}
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

		if (title.firstChild && title.firstChild.nodeName == "INPUT") return;
		var input = document.createElement("input");
		input.type = "text";
		input.style = "background: #F0F0F0";
		input.value = this.properties.title;
		title.removeChild(title.firstChild);
		title.appendChild(input);
		input.focus();
		input.addEventListener("blur", updateTitle, false);
		input.addEventListener("keyup", onKeyUp, false);
	}
}
