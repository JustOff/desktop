(function () {
	var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;
	
	var Prefs = justoff.sstart.Prefs
	var Storage = justoff.sstart.Storage
	var Factory = justoff.sstart.Factory
	var ContextMenu = justoff.sstart.ContextMenu
	var SStart = justoff.sstart.SStart
	var Drag = justoff.sstart.Drag

	Cu.import("resource://gre/modules/Services.jsm");

	Cu.import("chrome://sstart/content/cache.js");
	Cu.import("chrome://sstart/content/utils.js");
	Cu.import("chrome://sstart/content/file.js");
	Cu.import("chrome://sstart/content/dom.js");

	var params = Utils.getQueryParams(document.location);

	if (params.folder) {
		var storage = new Storage(params.folder);
		var pageId = params.folder;
	} else {
		var storage = new Storage(false);
		var pageId = 0;
	}

	SStart.setPageId(pageId);

	if (params.internal) {
		SStart.setInternal(params.internal == "yes");
	}

	document.title = storage.getTitle();
	if (document.title == "" || document.title == "SStart") {
		document.title = Utils.translate("SStart");
	}
	
	if (pageId == 0 && window.history.length == 1) {
		window.history.replaceState(null, "SStart", "chrome://sstart/content/sstart.html");
	}

	var factory = new Factory(storage);
	var hasWidgets = factory.createWidgets(pageId, true);

	var quickstart = document.getElementById("quickstart");
	if (!hasWidgets) {
		var qscontent = document.createTextNode(Utils.translate("quickstart"));
		quickstart.appendChild(qscontent);
		quickstart.style.display = "block";
	}

	var properties = storage.getProperties();
	if (properties) {
		if (properties.background) {
			document.body.style.backgroundColor = properties.background;
		}
		if (properties.headerColor) {
			document.styleSheets[1].cssRules[6].style.backgroundColor = properties.headerColor;
			document.styleSheets[1].cssRules[4].style.border = "1px solid " + properties.headerColor;
		}
		if (properties.titleColor) {
			document.styleSheets[1].cssRules[11].style.color = properties.titleColor;
		}
	}

	function updateBgImage (properties, pageId) {
		if (pageId > 0 && properties.useMainBgImage != "0" && SStart.isMainBgImage()) {
			document.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
			Dom.addClass(document.body, 'background-style-' + Prefs.getInt('backgroundStyle'));
		} else if (properties.backgroundImage && properties.backgroundImage == "1") {
			document.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + pageId) + ")";
			Dom.addClass(document.body, 'background-style-' + (properties.backgroundStyle || 1));
		}
	}
	
	updateBgImage (properties, pageId);

	if (Prefs.getBool("hideDecorations")) {
		Dom.addClass(document.body, 'no-decorations');
	}

	if (Prefs.getBool("bottomHeader")) {
			Dom.addClass(document.body, 'b-head');
	}

	function updateLockStatus (skipgrid) {
		var s = SStart.isLocked();
		Dom.removeClass(document.body, s ? 'unlock-edits' : 'lock-edits');
		Dom.addClass(document.body, s ? 'lock-edits' : 'unlock-edits');
		if (!skipgrid && Prefs.getBool("showGridOnUnlock")) {
			Cache.updateGridStatus(!s);
		}
	}
		
	ContextMenu.enable(document, document.getElementById("menu"));
	
	function refreshAll (rclass, revent) {
		var c = document.body.getElementsByClassName("widget");
		for (var i = 0; i < c.length; i++) {
			var r = Dom.child(c[i], rclass);
			if (r) {
				var event = new Event(revent);
				r.dispatchEvent(event);
			}
		}
	};

	function alignAll () {
		var c = document.body.getElementsByClassName("widget");
		var event = new Event("align");
		var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
			.getService(Ci.nsINavBookmarksService);
		var callback = {
			runBatched: function() {
				for (var i = 0; i < c.length; i++) {
					c[i].dispatchEvent(event);
				}
			}
		}
		bookmarksService.runInBatchMode(callback, null);
	};

	document.getElementById("menu-add").addEventListener("click", function (e) {
		var lockStatus = SStart.isLocked();
		if (lockStatus) {
			SStart.setLocked(false);
		}
		if (SStart.isCacheDOM() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			factory.createWidgets(pageId);
		}
		if (factory.createWidget(e.target.type, Cache.alignToGrid(ContextMenu.click.x), Cache.alignToGrid(ContextMenu.click.y))) {
			quickstart.style.display = "none";
		} else {
			SStart.setLocked(lockStatus);
		}
		updateLockStatus();
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-prefs").addEventListener("click", function (e) {
		openDialog("chrome://sstart/content/options.xul", "sstart-preferences-window", SStart.getDialogFeatures());
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-lock").addEventListener("click", function (e) {
		SStart.setLocked(true);
		updateLockStatus();
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-unlock").addEventListener("click", function (e) {
		SStart.setLocked(false);
		if (SStart.isCacheDOM() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			factory.createWidgets(pageId);
		}
		updateLockStatus();
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-alignall").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
		}
		SStart.setLocked(false);
		alignAll();
		updateLockStatus();
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-refresh").addEventListener("click", function (e) {
		if (e.target.type == "thumbnails") {
			var confirm = Utils.translate("contextRefreshAll") + " " + Utils.translate("contextThumbnails").toLowerCase();
		} else {
			var confirm = Utils.translate("contextRefreshAll") + " " + Utils.translate("contextIcons").toLowerCase();
		}
		if (Utils.confirm("\n" + confirm + "?\n\n")) {
			if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
				var widgets = document.getElementById("widgets");
				Dom.remove(widgets);
				SStart.setLocked(false);
				factory.createWidgets(pageId);
				SStart.setLocked(true);
			}
			if (e.target.type == "thumbnails") {
				refreshAll("refresh", "click");
			} else {
				refreshAll("icon", "refresh");
			}
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-refreshone").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
		if (e.target.type == "thumbnail") {
			var r = Dom.child(document.getElementById(hoverEl.id), "refresh");
			if (r) {
				var event = new Event("click");
				r.dispatchEvent(event);
			}
		} else {
			var r = Dom.child(document.getElementById(hoverEl.id), "icon");
			if (r) {
				var event = new Event("refresh");
				r.dispatchEvent(event);
			}
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-properties").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
		var r = Dom.child(document.getElementById(hoverEl.id), "properties");
		if (r) {
			var event = new Event("click");
			r.dispatchEvent(event);
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-remove").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
		var r = Dom.child(document.getElementById(hoverEl.id), "remove");
		if (r) {
			var event = new Event("click");
			r.dispatchEvent(event);
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-rename").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
		var r = Dom.child(document.getElementById(hoverEl.id), "title");
		if (r) {
			var event = new MouseEvent('dblclick', {
				'view': window,
				'bubbles': true,
				'cancelable': true
				});
			r.dispatchEvent(event);
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-props").addEventListener("click", function (e) {
		var param = { properties: properties, pageId: pageId, body: document.body, sSheet: document.styleSheets[1], doc: document };
		var xul = 'properties.xul';
		openDialog(xul, "properties", SStart.getDialogFeatures(250, 290), param);
		if (param.properties) {
			properties = param.properties;
			storage.setProperties(properties);
			if (properties.background) {
				document.body.style.backgroundColor = properties.background;
			}
			if (properties.headerColor) {
				document.styleSheets[1].cssRules[6].style.backgroundColor = properties.headerColor;
				document.styleSheets[1].cssRules[4].style.border = "1px solid " + properties.headerColor;
			}
			if (properties.titleColor) {
				document.styleSheets[1].cssRules[11].style.color = properties.titleColor;
			}
		} else {
			document.body.style.backgroundImage = "";
			Dom.removeClass(document.body, 'background-style-1');
			Dom.removeClass(document.body, 'background-style-2');
			updateBgImage (properties, pageId);
			var dir = File.getDataDirectory();
			dir.append("bg_" + pageId + "t");
			if (dir.exists()) {
				dir.remove(false);
			}
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-paste").addEventListener("click", function (e) {
		var hoverEl = ContextMenu.click.el;
		while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
		try {
			var input = Dom.child(hoverEl.lastElementChild.firstElementChild, "search");
		} catch (e) {}
		if (input) {
			var trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
			trans.init(null); trans.addDataFlavor("text/unicode");
			Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
			var str = {}; var strLength = {};
			try {
				trans.getTransferData("text/unicode", str, strLength);
			} catch (e) {}
			if (str) {
				input.value = str.value.QueryInterface(Ci.nsISupportsString).data;
			}
			SStart.focusSearch(hoverEl);
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);
	document.getElementById("menu-paste-search").addEventListener("click", function (e) {
		var hoverEl = ContextMenu.click.el;
		while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
		try {
			var input = Dom.child(hoverEl.lastElementChild.firstElementChild, "search");
		} catch (e) {}
		if (input) {
			var trans = Cc["@mozilla.org/widget/transferable;1"].createInstance(Ci.nsITransferable);
			trans.init(null); trans.addDataFlavor("text/unicode");
			Services.clipboard.getData(trans, Services.clipboard.kGlobalClipboard);
			var str = {}; var strLength = {};
			try {
				trans.getTransferData("text/unicode", str, strLength);
			} catch (e) {}
			if (str) {
				input.value = str.value.QueryInterface(Ci.nsISupportsString).data;
			}
			SStart.focusSearch(hoverEl);
			SStart.doSearch(input, e.ctrlKey || e.metaKey);
		}
		ContextMenu.close();
		e.stopPropagation();
	}, false);

	document.addEventListener("click", function (e) {
		if (e.button != 0 || e.clientX == 0 || (!Cache.getNewtabOpenAlways() && (!e.altKey || SStart.isLocked()))) return;
		var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
		if (!Utils.isOverWidget(hoverEl)) return;
		if (e.altKey && !SStart.isLocked()) {
			while (!hoverEl.classList.contains("widget") && hoverEl.parentElement) { hoverEl = hoverEl.parentElement }
			if (hoverEl) {
				if (e.ctrlKey || e.metaKey) {
					Prefs.setInt("thumbnail.width", parseInt(hoverEl.style.width, 10));
					if (!hoverEl.classList.contains("swidget")) {
						Prefs.setInt("thumbnail.height", parseInt(hoverEl.style.height, 10));
					}
					Utils.alert(Utils.translate("newDefSize") + " " + Prefs.getInt("thumbnail.width") + " x " + Prefs.getInt("thumbnail.height"));
				} else {
					hoverEl.style.width = Prefs.getInt("thumbnail.width");
					if (!hoverEl.classList.contains("swidget")) {
						hoverEl.style.height = Prefs.getInt("thumbnail.height");
					}
					var event = new CustomEvent("drop", {'detail':{'clientX':e.clientX, 'clientY':e.clientY}});
					hoverEl.dispatchEvent(event);
				}
			}
		} else if (Cache.getNewtabOpenAlways()) {
			if (hoverEl.parentElement && hoverEl.parentElement.nodeName == "A" && hoverEl.parentElement.href) {
				if (e.ctrlKey || e.metaKey) {
					Utils.getBrowser().loadURI(hoverEl.parentElement.href);
				} else {
					Utils.getBrowser().loadOneTab(hoverEl.parentElement.href, {inBackground: false, relatedToCurrent: true});
				}
			}
		}
		e.stopPropagation();
		e.preventDefault();
		return false;
	}, false);

	document.addEventListener("dblclick", function (e) {
		var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
		if (e.clientX == 0 || Utils.isOverWidget(hoverEl))
			return;
		SStart.toggleLocked();
		if (SStart.isCacheDOM() && !SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			Dom.remove(widgets);
			factory.createWidgets(pageId);
		}
		updateLockStatus();
	}, false);

	Drag.enable(document);
	
	if (Cache.isEditOn()) {
		SStart.setLocked(false);
		Cache.setEditOff();
		updateLockStatus();
		var widgets = document.getElementById("widgets");
		Dom.addClass(widgets.lastChild, "new");
	} else {
		updateLockStatus(true);
	}

	// Disable bfcache
	window.addEventListener("beforeunload", function () {} );
})();
