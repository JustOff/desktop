justoff.sstart.Installer = new function () {

	var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

	Cu.import("chrome://sstart/content/cache.js");
	Cu.import("chrome://sstart/content/dom.js");
	Cu.import("chrome://sstart/content/bookmark.js");
	Cu.import("chrome://sstart/content/file.js");
	Cu.import("chrome://sstart/content/utils.js");

	this.addonId = "SStart@Off.JustOff"
	this.newTabURI = "chrome://sstart/content/sstart.html"

	this.installed = false

	var SStartBeingUninstalled = false

	function install () {
		if (justoff.sstart.Installer.installed) return;
		justoff.sstart.Installer.installed = true;
		
		Cache.updateGridInterval();
		Cache.updateNewtabOnLockDrag();
		Cache.updateAutoZoom();
		attachContextMenu();

		var appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
		if (appInfo.ID == "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}") {
			// SeaMonkey
			gBrowser.addTab = (function () {
				var origAddTab = gBrowser.addTab;
				return function () {
					if (arguments[0] && arguments[0] == "about:blank" 
						&& Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
						arguments[0] = justoff.sstart.Installer.newTabURI;
					}
					return origAddTab.apply(gBrowser, arguments);
				}
			})();
		} else {
			if (typeof NewTabURL !== "object") {
				try {
					Cu.import("resource:///modules/NewTabURL.jsm");
				} catch (e) {}
			}
			if (Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
				justoff.sstart.Installer.browserPref("newtab.url", "set");
			}
		}

		if (Services.prefs.getBoolPref("extensions.sstart.overrideHomePage")) {
			justoff.sstart.Installer.browserPref("startup.homepage", "set");
		}

		// Blank address line for Speed Start
		if (Object.prototype.toString.call(gInitialPages).slice(8, -1) == "Array" 
			&& gInitialPages.indexOf(justoff.sstart.Installer.newTabURI) == -1) {
			gInitialPages.push(justoff.sstart.Installer.newTabURI);
		} else if (Object.prototype.toString.call(gInitialPages).slice(8, -1) == "Set" 
			&& !gInitialPages.has(justoff.sstart.Installer.newTabURI)) {
			gInitialPages.add(justoff.sstart.Installer.newTabURI);
		}
	}

	function attachContextMenu () {
		var linkToSStart = Utils.translate("linkToSStart");
		var pageToSStart = Utils.translate("pageToSStart");
		document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", 
			function(e) {
				var menu = document.getElementById("sstart-add-page-menu");
				var menuitem = document.getElementById("sstart-add-page");
				if (gContextMenu.linkURL) {
					menu.setAttribute("data-url", gContextMenu.linkURL);
					if (gContextMenu.link) {
						menu.setAttribute("data-title", gContextMenu.link.textContent.trim());
					} else {
						menu.setAttribute("data-title", gContextMenu.linkURL);
					}
					menu.setAttribute("label", linkToSStart);
					menuitem.setAttribute("label", linkToSStart);
				} else {
					menu.setAttribute("data-url", content.location.href);
					menu.setAttribute("data-title", content.document.title);
					menu.setAttribute("label", pageToSStart);
					menuitem.setAttribute("label", pageToSStart);
				}
				if (!Cache.isUpdateMenu() && menu.firstChild.hasChildNodes()) {
					return;
				}
				menuitem.hidden = initFoldersMenu(menu.firstChild);
				menu.hidden = !menuitem.hidden;
				Cache.setUpdateMenu(false);
			}, false);
	};
	
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
			document.getElementById("sstart-add-page").setAttribute("data-fid", rootId);
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
			var submenu = document.createElement("menupopup");
			submenu.addEventListener("popupshowing", function(e) { e.stopPropagation(); }, false);
			createFoldersMenu(bookmark.id, submenu);
			if (submenu.childNodes.length > 0) {
				menuitem = document.createElement("menu");
				menuitem.appendChild(submenu);
			} else {
				menuitem = document.createElement("menuitem");
			}
			menuitem.setAttribute("label", bookmark.title);
			menuitem.setAttribute("data-fid", bookmark.id);
			menupopup.appendChild(menuitem);
		}
	};

	this.addPage = function (e) {
		document.getElementById("contentAreaContextMenu").hidePopup();
		var folderId = e.target.getAttribute("data-fid") || 0;
		if (folderId > 0) {
			var data = document.getElementById("sstart-add-page-menu");
			var newId = Bookmark.createBookmark(data.getAttribute("data-url"), data.getAttribute("data-title"), folderId);
			var width = Cache.alignToGrid(content.innerWidth / 4);
			var height = Cache.alignToGrid(content.innerHeight / 4);
			var left = Cache.alignToGrid((content.innerWidth - width) / 2);
			var top = Cache.alignToGrid((content.innerHeight - height) / 2);
			Bookmark.setAnnotation(newId, "bookmarkProperties/description", 
				'{"left":' + left + ',"top":' + top + ',"width":' + width + ',"height":' + height +'}');
			File.delDataFile(newId);
			if (folderId == data.getAttribute("data-fid")) {
				Cache.clearCache();
				var ssurl = this.newTabURI;
			} else {
				var ssurl = this.newTabURI + "?folder=" + folderId;
			}
			Cache.setEditOn();
			Utils.getBrowser().loadOneTab(ssurl, {inBackground: false, relatedToCurrent: true});
		}
	};

	this.browserPref = function (pref, cmd) {
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
					NewTabURL.override(justoff.sstart.Installer.newTabURI);
				}
				try {
					bprefs.setCharPref(pref, justoff.sstart.Installer.newTabURI);
				} catch (e) {}
				break;
			case "clear":
				if (pref == "newtab.url" && typeof NewTabURL === "object" 
					&& typeof NewTabURL.get === "function" && typeof NewTabURL.reset === "function") {
					newTabURI = NewTabURL.get();
					if (newTabURI == justoff.sstart.Installer.newTabURI) {
						NewTabURL.reset();
					}
				}
				try {
					newTabURI = bprefs.getCharPref(pref);
					if (newTabURI == justoff.sstart.Installer.newTabURI) {
						bprefs.clearUserPref(pref);
					}
				} catch (e) {}
				break;
		}
	}
	
	var Watcher = new function () {
		this.observe = function (subject, topic, data) {
			if (topic != "nsPref:changed") return;
			switch (data) {
				case "bottomHeader":
					Utils.reloadEachSStartBrowser();
					break;
				case "overrideNewTab":
					var useOurNewTab = Services.prefs.getBoolPref("extensions.sstart.overrideNewTab");
					if (useOurNewTab) {
						justoff.sstart.Installer.browserPref("newtab.url", "set");
					} else {
						justoff.sstart.Installer.browserPref("newtab.url", "clear");
					}
					break;
				case "overrideHomePage":
					var useOurHomePage = Services.prefs.getBoolPref("extensions.sstart.overrideHomePage");
					if (useOurHomePage) {
						justoff.sstart.Installer.browserPref("startup.homepage", "set");
					} else {
						justoff.sstart.Installer.browserPref("startup.homepage", "clear");
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
		}
	}

	var BrowserWatcher = new function () {
		this.observe = function (subject, topic, data) {
			if (topic != "nsPref:changed") return;
			switch (data) {
				case "newtab.url":
					var newTabURI = justoff.sstart.Installer.browserPref("newtab.url", "get");
					if (newTabURI != justoff.sstart.Installer.newTabURI) {
						Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
					}
					break;
				case "startup.homepage":
					var homeURI = justoff.sstart.Installer.browserPref("startup.homepage", "get");
					if (homeURI != justoff.sstart.Installer.newTabURI) {
						Services.prefs.setBoolPref("extensions.sstart.overrideHomePage", false);
					}
					break;
			}
		}
	}

	var NewTabURLWatcher = new function () {
		this.observe = function (subject, topic, data) {
			if (topic == "newtab-url-changed" && data != justoff.sstart.Installer.newTabURI) {
					Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
			}
		}
	}

	var LifecycleWatcher = new function () {
		this.observe = function (subject, topic, data) {
			switch (topic) {
				case "profile-before-change":
					uninstall();
					if (SStartBeingUninstalled) {
						justoff.sstart.Installer.browserPref("newtab.url", "clear");
						justoff.sstart.Installer.browserPref("startup.homepage", "clear");
					}
					break;
			}
		}
	}

	var AddonListener = {
		onUninstalling:function (addon) {
			if (addon.id == justoff.sstart.Installer.addonId) {
				SStartBeingUninstalled = true;
			}
		},
		onDisabling:function (addon) {
			if (addon.id == justoff.sstart.Installer.addonId) {
				SStartBeingUninstalled = true;
			}
		},
		onOperationCancelled:function (addon) {
			if (addon.id == justoff.sstart.Installer.addonId) {
				SStartBeingUninstalled = 
					(addon.pendingOperations & (AddonManager.PENDING_UNINSTALL | AddonManager.PENDING_DISABLE)) != 0;
			}
		}
	}

	function init() {
		setTimeout(function () { install() }, 0);
		this.prefsService = Cc["@mozilla.org/preferences-service;1"]
			.getService(Ci.nsIPrefService)
		this.prefs = this.prefsService.getBranch("extensions.sstart.");
		this.prefs.QueryInterface(Ci.nsIPrefBranch2);
		this.prefs.addObserver("", Watcher, false);

		this.newTabPrefs = this.prefsService.getBranch("browser.");
		this.newTabPrefs.QueryInterface(Ci.nsIPrefBranch2);
		this.newTabPrefs.addObserver("", BrowserWatcher, false);

		this.observerService = Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService);
		this.observerService.addObserver(LifecycleWatcher, "profile-before-change", false)
		this.observerService.addObserver(NewTabURLWatcher, "newtab-url-changed", false)

		Cu.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.addAddonListener(AddonListener);
	}

	function uninstall () {
		this.observerService.removeObserver(NewTabURLWatcher, "newtab-url-changed");
		this.observerService.removeObserver(LifecycleWatcher, "profile-before-change");
		this.newTabPrefs.removeObserver("", BrowserWatcher);
		this.prefs.removeObserver("", Watcher);
	}

	this.load = function () {
		addEventListener("load", init, true);
	}

}
