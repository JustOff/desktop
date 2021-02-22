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
Cu.import("resource://gre/modules/Timer.jsm");

var gWindowListener = null, linkToSStart, pageToSStart;
var sstartTabURI = "chrome://sstart/content/sstart.html";
var styleSheetService = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
var hideSStart = Services.io.newURI("chrome://sstart/skin/hidesstart.css", null, null);

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
	if (Utils.isSeaMonkey) {
		aWindow.gBrowser || aWindow.getBrowser();
		aWindow.gBrowserOrigAddTab = aWindow.gBrowser.addTab;
		aWindow.gBrowser.addTab = function () {
			if (arguments[0] && arguments[0] == "about:blank" && Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
				arguments[0] = sstartTabURI;
			}
			return aWindow.gBrowserOrigAddTab.apply(aWindow.gBrowser, arguments);
		}
	}
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
	if (Utils.isSeaMonkey) {
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
	var gcmenu = Utils.getBrowserWindow().gContextMenu;
	if (gcmenu.isTextSelected || gcmenu.onTextInput) {
		menuitem.hidden = true;
		menu.hidden = true;
		Cache.setUpdateMenu(true);
		return;
	}
	var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
	if (prefService.getBoolPref("extensions.sstart.hideContextMenu")) {
		menuitem.hidden = true;
		menu.hidden = true;
		return;
	}
	if (gcmenu.linkURL) {
		menu.setAttribute("data-url", gcmenu.linkURL);
		if (gcmenu.link) {
			menu.setAttribute("data-title", gcmenu.link.textContent.trim());
		} else {
			menu.setAttribute("data-title", gcmenu.linkURL);
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
	while (menupopup.firstChild) {
		menupopup.removeChild(menupopup.firstChild);
	}
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

var newtabAPI = {
	init: function () {
		try {
			Cc["@mozilla.org/browser/aboutnewtab-service;1"].getService(Ci.nsIAboutNewTabService);
			this.type = 1; //FF44+
		} catch (e) {
			try {
				Cu.import("resource:///modules/NewTabURL.jsm");
				this.type = 2; //FF41+
			} catch (e) {
				this.type = 0;
			}
		}
	},
	set: function () {
		switch (this.type) {
			case 1:
				var aboutNewTabService = Cc["@mozilla.org/browser/aboutnewtab-service;1"].getService(Ci.nsIAboutNewTabService);
				aboutNewTabService.newTabURL = sstartTabURI;
				break;
			case 2:
				NewTabURL.override(sstartTabURI);
				break;
		}
	},
	reset: function () {
		switch (this.type) {
			case 1:
				var aboutNewTabService = Cc["@mozilla.org/browser/aboutnewtab-service;1"].getService(Ci.nsIAboutNewTabService);
				if (aboutNewTabService.newTabURL == sstartTabURI) {
					aboutNewTabService.resetNewTabURL();
				}
				break;
			case 2:
				if (NewTabURL.get() == sstartTabURI) {
					NewTabURL.reset();
				}
				break;
		}
	}
}

function browserPref (pref, cmd) {
	var bprefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("browser.");
	switch (cmd) {
		case "get":
			try {
				return  bprefs.getCharPref(pref);
			} catch (e) {
				return  "";
			}
			break;
		case "set":
			if (pref == "pagethumbnails") {
				try {
					bprefs.setBoolPref("pageThumbs.enabled", false);
					bprefs.setBoolPref("pagethumbnails.capturing_disabled", true);
				} catch (e) {}
				if (typeof PageThumbsStorage === "object" && typeof PageThumbsStorage.wipe === "function") {
					PageThumbsStorage.wipe();
				}
			} else {
				if (Utils.isFirefox && pref == "newtab.url") {
					newtabAPI.set();
				}
				try {
					bprefs.setCharPref(pref, sstartTabURI);
				} catch (e) {}
			}
			break;
		case "clear":
			if (pref == "pagethumbnails") {
				try {
					bprefs.clearUserPref("pageThumbs.enabled");
					bprefs.clearUserPref("pagethumbnails.capturing_disabled");
				} catch (e) {}
			} else {
				if (Utils.isFirefox && pref == "newtab.url") {
					newtabAPI.reset();
				}
				try {
					if (bprefs.getCharPref(pref) == sstartTabURI) {
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
			case "autoZoom":
			case "hideDecorations":
				Cache.clearCache();
				Utils.reloadEachSStartBrowser();
				break;
			case "overrideNewTab":
				if (Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
					browserPref("newtab.url", "set");
				} else {
					browserPref("newtab.url", "clear");
				}
				break;
			case "overrideHomePage":
				if (Services.prefs.getBoolPref("extensions.sstart.overrideHomePage")) {
					browserPref("startup.homepage", "set");
				} else {
					browserPref("startup.homepage", "clear");
				}
				break;
			case "disableSysThumbs":
				if (Services.prefs.getBoolPref("extensions.sstart.disableSysThumbs")) {
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
			case "hideContextMenu":
				Cache.setUpdateMenu(true);
				break;
			case "newtabOpen":
			case "newtabOnLockDrag":
				Cache.updateNewtabOpen();
				break;
			case "thumbnail.width":
				var twidth = Services.prefs.getIntPref("extensions.sstart.thumbnail.width");
				if (twidth < 20) {
					if (twidth <= 0) { twidth = 224; } else { twidth = 20; }
					Services.prefs.setIntPref("extensions.sstart.thumbnail.width", twidth);
				}
				break;
			case "thumbnail.height":
				var theight = Services.prefs.getIntPref("extensions.sstart.thumbnail.height");
				if (theight < 20) {
					if (theight <= 0) { theight = 128; } else { theight = 20; }
					Services.prefs.setIntPref("extensions.sstart.thumbnail.height", theight);
				}
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
				if (browserPref("newtab.url", "get") != sstartTabURI) {
					Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
				}
				break;
			case "startup.homepage":
				if (browserPref("startup.homepage", "get") != sstartTabURI) {
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
    Cu.import("chrome://sstart/content/utils.js");
    Cu.import("chrome://sstart/content/bookmark.js");
	
	PrefLoader.loadDefaultPrefs(params.installPath, "sstart.js");

	try {
		Cu.import("resource://gre/modules/PageThumbs.jsm");
	} catch (e) {}
	
	if (!styleSheetService.sheetRegistered(hideSStart, styleSheetService.USER_SHEET)) {
		styleSheetService.loadAndRegisterSheet(hideSStart, styleSheetService.USER_SHEET);
	}

	var appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
	Utils.isFirefox = (appInfo.ID == "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}");
	Utils.isSeaMonkey = (appInfo.ID == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}" || appInfo.ID == "{a3210b97-8e8a-4737-9aa0-aa0e607640b9}");

	if (Utils.isFirefox) {
		newtabAPI.init();
	}

	if (Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
		browserPref("newtab.url", "set");
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
	Cache.updateNewtabOpen();
	
	if (reason != APP_STARTUP) {
		Utils.reloadEachSStartBrowser();
	} else {
		Cc["@mozilla.org/browser/search-service;1"].getService(Ci.nsIBrowserSearchService).init();
	}

setTimeout(function() { // migrate to GitHub
  Cu.import("resource://gre/modules/Services.jsm");
  var migrate;
  try { migrate = Services.prefs.getBoolPref("extensions.justoff-migration"); } catch(e) {}
  if (typeof migrate == "boolean") return;
  Services.prefs.getDefaultBranch("extensions.").setBoolPref("justoff-migration", true);
  Cu.import("resource://gre/modules/AddonManager.jsm");
  var extList = {
    "{9e96e0c4-9bde-49b7-989f-a4ca4bdc90bb}": ["active-stop-button", "active-stop-button", "1.5.15", "md5:b94d8edaa80043c0987152c81b203be4"],
    "abh2me@Off.JustOff": ["add-bookmark-helper", "add-bookmark-helper", "1.0.10", "md5:f1fa109a7acd760635c4f5afccbb6ee4"],
    "AdvancedNightMode@Off.JustOff": ["advanced-night-mode", "advanced-night-mode", "1.0.13", "md5:a1dbab8231f249a3bb0b698be79d7673"],
    "behind-the-overlay-me@Off.JustOff": ["dismiss-the-overlay", "dismiss-the-overlay", "1.0.7", "md5:188571806207cef9e6e6261ec5a178b7"],
    "CookiesExterminator@Off.JustOff": ["cookies-exterminator", "cookexterm", "2.9.10", "md5:1e3f9dcd713e2add43ce8a0574f720c7"],
    "esrc-explorer@Off.JustOff": ["esrc-explorer", "esrc-explorer", "1.1.6", "md5:2727df32c20e009219b20266e72b0368"],
    "greedycache@Off.JustOff": ["greedy-cache", "greedy-cache", "1.2.3", "md5:a9e3b70ed2a74002981c0fd13e2ff808"],
    "h5vtuner@Off.JustOff": ["html5-video-tuner", "html5-media-tuner", "1.2.5", "md5:4ec4e75372a5bc42c02d14cce334aed1"],
    "location4evar@Off.JustOff": ["L4E", "location-4-evar", "1.0.8", "md5:32e50c0362998dc0f2172e519a4ba102"],
    "lull-the-tabs@Off.JustOff": ["lull-the-tabs", "lull-the-tabs", "1.5.2", "md5:810fb2f391b0d00291f5cc341f8bfaa6"],
    "modhresponse@Off.JustOff": ["modify-http-response", "modhresponse", "1.3.8", "md5:5fdf27fd2fbfcacd5382166c5c2c185c"],
    "moonttool@Off.JustOff": ["moon-tester-tool", "moon-tester-tool", "2.1.3", "md5:553492b625a93a42aa541dfbdbb95dcc"],
    "password-backup-tool@Off.JustOff": ["password-backup-tool", "password-backup-tool", "1.3.2", "md5:9c8e9e74b1fa44dd6545645cd13b0c28"],
    "pmforum-smart-preview@Off.JustOff": ["pmforum-smart-preview", "pmforum-smart-preview", "1.3.5", "md5:3140b6ba4a865f51e479639527209f39"],
    "pxruler@Off.JustOff": ["proxy-privacy-ruler", "pxruler", "1.2.4", "md5:ceadd53d6d6a0b23730ce43af73aa62d"],
    "resp-bmbar@Off.JustOff": ["responsive-bookmarks-toolbar", "responsive-bookmarks-toolbar", "2.0.3", "md5:892261ad1fe1ebc348593e57d2427118"],
    "save-images-me@Off.JustOff": ["save-all-images", "save-all-images", "1.0.7", "md5:fe9a128a2a79208b4c7a1475a1eafabf"],
    "tab2device@Off.JustOff": ["send-link-to-device", "send-link-to-device", "1.0.5", "md5:879f7b9aabf3d213d54c15b42a96ad1a"],
    "SStart@Off.JustOff": ["speed-start", "speed-start", "2.1.6", "md5:9a151e051e20b50ed8a8ec1c24bf4967"],
    "youtubelazy@Off.JustOff": ["youtube-lazy-load", "youtube-lazy-load", "1.0.6", "md5:399270815ea9cfb02c143243341b5790"]
  };
  AddonManager.getAddonsByIDs(Object.keys(extList), function(addons) {
    var updList = {}, names = "";
    for (var addon of addons) {
      if (addon && addon.updateURL == null) {
        var url = "https://github.com/JustOff/" + extList[addon.id][0] + "/releases/download/" + extList[addon.id][2] + "/" + extList[addon.id][1] + "-" + extList[addon.id][2] + ".xpi";
        updList[addon.name] = {URL: url, Hash: extList[addon.id][3]};
        names += '"' + addon.name + '", ';
      }
    }
    if (names == "") {
      Services.prefs.setBoolPref("extensions.justoff-migration", false);
      return;
    }
    names = names.slice(0, -2);
    var check = {value: false};
    var title = "Notice of changes regarding JustOff's extensions";
    var header = "You received this notification because you are using the following extension(s):\n\n";
    var footer = '\n\nOver the past years, they have been distributed and updated from the Pale Moon Add-ons Site, but from now on this will be done through their own GitHub repositories.\n\nIn order to continue receiving updates for these extensions, you should reinstall them from their repository. If you want to do it now, click "Ok", or select "Cancel" otherwise.\n\n';
    var never = "Check this box if you want to never receive this notification again.";
    var mrw = Services.wm.getMostRecentWindow("navigator:browser");
    if (mrw) {
      var result = Services.prompt.confirmCheck(mrw, title, header + names + footer, never, check);
      if (result) {
        mrw.gBrowser.selectedTab.linkedBrowser.contentDocument.defaultView.InstallTrigger.install(updList);
      } else if (check.value) {
        Services.prefs.setBoolPref("extensions.justoff-migration", false);
      }
    }
  });
}, (10 + Math.floor(Math.random() * 10)) * 1000);

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

	if (styleSheetService.sheetRegistered(hideSStart, styleSheetService.USER_SHEET)) {
		styleSheetService.unregisterSheet(hideSStart, styleSheetService.USER_SHEET);
	}

	SSTART_MODULES.forEach(Cu.unload, Cu);
	
	Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}
