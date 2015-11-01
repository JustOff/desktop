var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

var SSTART_MODULES = [
    "chrome://sstart/content/prefloader.js",
    "chrome://sstart/content/cache.js",
    "chrome://sstart/content/file.js",
    "chrome://sstart/content/url.js",
    "chrome://sstart/content/dom.js",
    "chrome://sstart/content/utils.js",
    "chrome://sstart/content/bookmark.js"
];

Cu.import("resource://gre/modules/Services.jsm");

var gWindowListener = null, linkToSStart, pageToSStart;
var sstartTabURI = "chrome://sstart/content/sstart.html";
var appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);

function BrowserWindowObserver(handlers) {
	this.handlers = handlers;
}

BrowserWindowObserver.prototype = {
	observe: function (aSubject, aTopic, aData) {
		if (aTopic == "domwindowopened") {
			aSubject.QueryInterface(Ci.nsIDOMWindow).addEventListener("DOMContentLoaded", this, false);
		} else if (aTopic == "domwindowclosed") {
			if (aSubject.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
				this.handlers.onShutdown(aSubject);
			}
		}
	},
	handleEvent: function (aEvent) {
		let aWindow = aEvent.currentTarget;
		aWindow.removeEventListener(aEvent.type, this, false);

		if (aWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser") {
			this.handlers.onStartup(aWindow);
		}
	}
};

function browserWindowStartup (aWindow) {
	var window = aWindow.document.getElementById("main-window");
	var hbox = aWindow.document.createElement("hbox");
	hbox.id = "sstart-container";
	hbox.setAttribute("style", "overflow:hidden; height: 0;");
	var vbox = aWindow.document.createElement("vbox");
	vbox.id = "sstart-hidden-box";
	hbox.appendChild(vbox);
	window.appendChild(hbox);
	var cmenu = aWindow.document.getElementById("contentAreaContextMenu");
	var smenu = aWindow.document.createElement("menu");
	smenu.id = "sstart-add-page-menu";
	smenu.className = "menu-iconic";
	smenu.setAttribute("image", "chrome://sstart/skin/icon.png");
	var smenupopup = aWindow.document.createElement("menupopup");
	smenu.appendChild(smenupopup);
	smenu.addEventListener("click", addPage, false);
	var csp = aWindow.document.getElementById("context-savepage");
	cmenu.insertBefore(smenu, csp);
	var smitem = aWindow.document.createElement("menuitem");
	smitem.id = "sstart-add-page";
	smitem.className = "menuitem-iconic";
	smitem.setAttribute("image", "chrome://sstart/skin/icon.png");
	smitem.addEventListener("click", addPage, false);
	cmenu.insertBefore(smitem, csp);
	cmenu.addEventListener("popupshowing", cPopupShowingListener, false);
	if (appInfo.ID == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}") {
		// SeaMonkey
		aWindow.gBrowser || aWindow.getBrowser();
		aWindow.gBrowserOrigAddTab = aWindow.gBrowser.addTab;
		aWindow.gBrowser.addTab = function () {
			if (arguments[0] && arguments[0] == "about:blank" && Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
				arguments[0] = sstartTabURI;
			}
			return aWindow.gBrowserOrigAddTab.apply(aWindow.gBrowser, arguments);
		}
	}
	// Blank address line for sstartTabURI
	if (Object.prototype.toString.call(aWindow.gInitialPages).slice(8, -1) == "Array"
		&& aWindow.gInitialPages.indexOf(sstartTabURI) == -1) {
		aWindow.gInitialPages.push(sstartTabURI);
	} else if (Object.prototype.toString.call(aWindow.gInitialPages).slice(8, -1) == "Set"
		&& !aWindow.gInitialPages.has(sstartTabURI)) {
		aWindow.gInitialPages.add(sstartTabURI);
	}
}

function browserWindowShutdown (aWindow) {
	if (Object.prototype.toString.call(aWindow.gInitialPages).slice(8, -1) == "Array"
		&& aWindow.gInitialPages.indexOf(sstartTabURI) > -1) {
		aWindow.gInitialPages.splice(aWindow.gInitialPages.indexOf(sstartTabURI), 1);
	} else if (Object.prototype.toString.call(aWindow.gInitialPages).slice(8, -1) == "Set"
		&& aWindow.gInitialPages.has(sstartTabURI)) {
		aWindow.gInitialPages.delete(sstartTabURI);
	}
	if (appInfo.ID == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}") {
		aWindow.gBrowser.addTab = aWindow.gBrowserOrigAddTab;
		aWindow.gBrowserOrigAddTab = null;
	}
	var cmenu = aWindow.document.getElementById("contentAreaContextMenu");
	cmenu.removeEventListener("popupshowing", cPopupShowingListener);
	var smenu = aWindow.document.getElementById("sstart-add-page-menu");
	smenu.removeEventListener("click", addPage);
	var smitem = aWindow.document.getElementById("sstart-add-page");
	smitem.removeEventListener("click", addPage);
	cmenu.removeChild(smenu);
	cmenu.removeChild(smitem);
	var window = aWindow.document.getElementById("main-window");
	var hbox = aWindow.document.getElementById("sstart-container");
	window.removeChild(hbox);
}

function cPopupShowingListener (e) {
	var menu = Utils.getBrowserWindow().document.getElementById("sstart-add-page-menu");
	var menuitem = Utils.getBrowserWindow().document.getElementById("sstart-add-page");
	if (Utils.getBrowserWindow().gContextMenu.linkURL) {
		menu.setAttribute("data-url", Utils.getBrowserWindow().gContextMenu.linkURL);
		if (Utils.getBrowserWindow().gContextMenu.link) {
			menu.setAttribute("data-title", Utils.getBrowserWindow().gContextMenu.link.textContent.trim());
		} else {
			menu.setAttribute("data-title", Utils.getBrowserWindow().gContextMenu.linkURL);
		}
		menu.setAttribute("label", linkToSStart);
		menuitem.setAttribute("label", linkToSStart);
	} else {
		menu.setAttribute("data-url", Utils.getBrowserWindow().content.location.href);
		menu.setAttribute("data-title", Utils.getBrowserWindow().content.document.title);
		menu.setAttribute("label", pageToSStart);
		menuitem.setAttribute("label", pageToSStart);
	}
	if (!Cache.isUpdateMenu() && menu.firstChild.hasChildNodes()) {
		return;
	}
	menuitem.hidden = initFoldersMenu(menu.firstChild);
	menu.hidden = !menuitem.hidden;
	Cache.setUpdateMenu(false);
}
	
function initFoldersMenu (menupopup) {
	Dom.clear(menupopup);
	var rootId = 0;
	var bookmarks = Bookmark.getBookmarks();
	for (var i in bookmarks) {
		if (bookmarks[i].isFolder && bookmarks[i].title == "SStart") {
			rootId = bookmarks[i].id;
			break;
		}
	}
	if (rootId > 0) {
		menupopup.parentNode.setAttribute("data-fid", rootId);
		Utils.getBrowserWindow().document.getElementById("sstart-add-page").setAttribute("data-fid", rootId);
		createFoldersMenu(rootId, menupopup);
	}
	return menupopup.childNodes.length > 0;
};

function createFoldersMenu (folderId, menupopup) {
	var bookmarks = Bookmark.getBookmarks(folderId);
	for (var i in bookmarks) {
		var bookmark = bookmarks[i];
		if (!bookmark.isFolder) continue;
		var menuitem;
		var submenu = Utils.getBrowserWindow().document.createElement("menupopup");
		submenu.addEventListener("popupshowing", function(e) { e.stopPropagation(); }, false);
		createFoldersMenu(bookmark.id, submenu);
		if (submenu.childNodes.length > 0) {
			menuitem = Utils.getBrowserWindow().document.createElement("menu");
			menuitem.appendChild(submenu);
		} else {
			menuitem = Utils.getBrowserWindow().document.createElement("menuitem");
		}
		menuitem.setAttribute("label", bookmark.title);
		menuitem.setAttribute("data-fid", bookmark.id);
		menupopup.appendChild(menuitem);
	}
};

function addPage (e) {
	Utils.getBrowserWindow().document.getElementById("contentAreaContextMenu").hidePopup();
	var folderId = e.target.getAttribute("data-fid") || 0;
	if (folderId > 0) {
		var data = Utils.getBrowserWindow().document.getElementById("sstart-add-page-menu");
		var newId = Bookmark.createBookmark(data.getAttribute("data-url"), data.getAttribute("data-title"), folderId);
		var cont = Utils.getBrowserWindow().content;
		var width = Services.prefs.getIntPref("extensions.sstart.thumbnail.width");
		var height = Services.prefs.getIntPref("extensions.sstart.thumbnail.height");
		var left = Cache.alignToGrid((cont.innerWidth - width) / 2);
		var top = Cache.alignToGrid((cont.innerHeight - height) / 2);
		Bookmark.setAnnotation(newId, "bookmarkProperties/description", 
			'{"left":' + left + ',"top":' + top + ',"width":' + width + ',"height":' + height +'}');
		File.delDataFile(newId);
		if (folderId == data.getAttribute("data-fid")) {
			Cache.clearCache();
			var ssurl = sstartTabURI;
		} else {
			var ssurl = sstartTabURI + "?folder=" + folderId;
		}
		Cache.setEditOn();
		Utils.getBrowser().loadOneTab(ssurl, {inBackground: false, relatedToCurrent: true});
	}
};

function browserPref (pref, cmd) {
	var bprefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch("browser."), newTabURI;
	switch (cmd) {
		case "get":
			try {
				newTabURI = bprefs.getCharPref(pref);
			} catch (e) {
				newTabURI = "";
			}
			return newTabURI;
			break;
		case "set":
			if (pref == "newtab.url" && typeof NewTabURL === "object" && typeof NewTabURL.override === "function") {
				NewTabURL.override(sstartTabURI);
			}
			if (pref == "pagethumbnails") {
				try {
					bprefs.setBoolPref("pageThumbs.enabled", false);
					bprefs.setBoolPref("pagethumbnails.capturing_disabled", true);
				} catch (e) {}
				if (typeof PageThumbsStorage === "object" && typeof PageThumbsStorage.wipe === "function") {
					PageThumbsStorage.wipe();
				}
			} else {
				try {
					bprefs.setCharPref(pref, sstartTabURI);
				} catch (e) {}
			}
			break;
		case "clear":
			if (pref == "newtab.url" && typeof NewTabURL === "object" 
				&& typeof NewTabURL.get === "function" && typeof NewTabURL.reset === "function") {
				newTabURI = NewTabURL.get();
				if (newTabURI == sstartTabURI) {
					NewTabURL.reset();
				}
			}
			if (pref == "pagethumbnails") {
				try {
					bprefs.clearUserPref("pageThumbs.enabled");
					bprefs.clearUserPref("pagethumbnails.capturing_disabled");
				} catch (e) {}
			} else {
				try {
					newTabURI = bprefs.getCharPref(pref);
					if (newTabURI == sstartTabURI) {
						bprefs.clearUserPref(pref);
					}
				} catch (e) {}
			}
			break;
	}
}

var myPrefsWatcher = {
	observe: function (subject, topic, data) {
		if (topic != "nsPref:changed") return;
		switch (data) {
			case "bottomHeader":
				Utils.reloadEachSStartBrowser();
				break;
			case "overrideNewTab":
				var useOurNewTab = Services.prefs.getBoolPref("extensions.sstart.overrideNewTab");
				if (useOurNewTab) {
					browserPref("newtab.url", "set");
				} else {
					browserPref("newtab.url", "clear");
				}
				break;
			case "overrideHomePage":
				var useOurHomePage = Services.prefs.getBoolPref("extensions.sstart.overrideHomePage");
				if (useOurHomePage) {
					browserPref("startup.homepage", "set");
				} else {
					browserPref("startup.homepage", "clear");
				}
				break;
			case "disableSysThumbs":
				var disableSysThumbs = Services.prefs.getBoolPref("extensions.sstart.disableSysThumbs");
				if (disableSysThumbs) {
					browserPref("pagethumbnails", "set");
				} else {
					browserPref("pagethumbnails", "clear");
				}
				break;
			case "gridInterval":
				Cache.updateGridInterval(true);
				break;
			case "showGridOnUnlock":
				Cache.updateGridOnUnlock();
				break;
			case "newtabOnLockDrag":
				Cache.updateNewtabOnLockDrag();
				break;
			case "autoZoom":
				Cache.updateAutoZoom();
				Utils.reloadEachSStartBrowser();
				break;
		}
	},
	register: function () {
		var prefsService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		this.prefBranch = prefsService.getBranch("extensions.sstart.");
		this.prefBranch.addObserver("", this, false);
	},
	unregister: function () {
		this.prefBranch.removeObserver("", this);
	}
}

var browserPrefsWatcher = {
	observe: function (subject, topic, data) {
		if (topic != "nsPref:changed") return;
		switch (data) {
			case "newtab.url":
				var newTabURI = browserPref("newtab.url", "get");
				if (newTabURI != sstartTabURI) {
					Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
				}
				break;
			case "startup.homepage":
				var homeURI = browserPref("startup.homepage", "get");
				if (homeURI != sstartTabURI) {
					Services.prefs.setBoolPref("extensions.sstart.overrideHomePage", false);
				}
				break;
		}
	},
	register: function () {
		var prefsService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
		this.prefBranch = prefsService.getBranch("browser.");
		this.prefBranch.addObserver("", this, false);
	},
	unregister: function () {
		this.prefBranch.removeObserver("", this);
	}
}

var newTabURLWatcher = {
	observe: function (subject, topic, data) {
		if (topic == "newtab-url-changed" && data != sstartTabURI) {
				Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
		}
	},
	register: function () {
		this.observerService = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
		this.observerService.addObserver(this, "newtab-url-changed", false)
	},
	unregister: function () {
		this.observerService.removeObserver(this, "newtab-url-changed");
	}
}

function install (params, reason)
{
}

function uninstall (params, reason)
{
}

function startup (params, reason)
{
	Cu.import("chrome://sstart/content/prefloader.js");
	Cu.import("chrome://sstart/content/cache.js");
    Cu.import("chrome://sstart/content/file.js");
    Cu.import("chrome://sstart/content/dom.js");
    Cu.import("chrome://sstart/content/utils.js");
    Cu.import("chrome://sstart/content/bookmark.js");
	
	PrefLoader.loadDefaultPrefs(params.installPath, "sstart.js");

	try {
		Cu.import("resource://gre/modules/PageThumbs.jsm");
	} catch (e) {}

	if (appInfo.ID != "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}") {
		// != SeaMonkey
		if (typeof NewTabURL !== "object") {
			try {
				Cu.import("resource:///modules/NewTabURL.jsm");
			} catch (e) {}
		}
		if (Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
			browserPref("newtab.url", "set");
		}
	}

	if (Services.prefs.getBoolPref("extensions.sstart.overrideHomePage")) {
		browserPref("startup.homepage", "set");
	}
	
	if (Services.prefs.getBoolPref("extensions.sstart.disableSysThumbs")) {
		browserPref("pagethumbnails", "set");
	}

	linkToSStart = Utils.translate("linkToSStart");
	pageToSStart = Utils.translate("pageToSStart");

	var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
	gWindowListener = new BrowserWindowObserver({
		onStartup: browserWindowStartup,
		onShutdown: browserWindowShutdown
	});
	ww.registerNotification(gWindowListener);
	
	var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
	var winenu = wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowStartup(winenu.getNext());
	}
	
	myPrefsWatcher.register();
	browserPrefsWatcher.register();
	newTabURLWatcher.register();

	Cache.updateGridInterval();
	Cache.updateNewtabOnLockDrag();
	Cache.updateAutoZoom();
	
	if (reason != APP_STARTUP) {
		Utils.reloadEachSStartBrowser();
	}
}

function shutdown (params, reason)
{
	if (reason == APP_SHUTDOWN) return;

	newTabURLWatcher.unregister();
	browserPrefsWatcher.unregister();
	myPrefsWatcher.unregister();

	var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
	ww.unregisterNotification(gWindowListener);
	gWindowListener = null;

	var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
	var winenu = wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowShutdown(winenu.getNext());
	}
	
	browserPref("newtab.url", "clear");
	browserPref("startup.homepage", "clear");
	browserPref("pagethumbnails", "clear");
	
	PrefLoader.clearDefaultPrefs();

	SSTART_MODULES.forEach(Cu.unload, Cu);
	
	Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}
