var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var _gWindowListener = null;
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
	var window = aWindow.document.getElementById("main-window");
	var hbox = aWindow.document.getElementById("sstart-container");
	window.removeChild(hbox);
}

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
			try {
				bprefs.setCharPref(pref, sstartTabURI);
			} catch (e) {}
			break;
		case "clear":
			if (pref == "newtab.url" && typeof NewTabURL === "object" 
				&& typeof NewTabURL.get === "function" && typeof NewTabURL.reset === "function") {
				newTabURI = NewTabURL.get();
				if (newTabURI == sstartTabURI) {
					NewTabURL.reset();
				}
			}
			try {
				newTabURI = bprefs.getCharPref(pref);
				if (newTabURI == sstartTabURI) {
					bprefs.clearUserPref(pref);
				}
			} catch (e) {}
			break;
	}
}

function reloadEachSStartBrowser () {
	var gBrowser = Services.wm.getMostRecentWindow("navigator:browser").getBrowser();
	for (var i = 0; i < gBrowser.browsers.length; i++) {
		var br = gBrowser.browsers[i];
		if (br.contentDocument && br.contentDocument.location
			&& /chrome:\/\/sstart\/content\/sstart.html(\?.*)?/.test(br.contentDocument.location.href)) {
			br.reload(false);
		}
	}
};

var myPrefsWatcher = {
	observe: function (subject, topic, data) {
		if (topic != "nsPref:changed") return;
		switch (data) {
			case "bottomHeader":
				reloadEachSStartBrowser();
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
			case "gridInterval":
				cache.updateGridInterval(true);
				break;
			case "showGridOnUnlock":
				cache.updateGridOnUnlock();
				break;
			case "newtabOnLockDrag":
				cache.updateNewtabOnLockDrag();
				break;
			case "autoZoom":
				cache.updateAutoZoom();
				reloadEachSStartBrowser();
				break;
		}
	},
	register: function () {
		var prefsService = Cc["@mozilla.org/preferences-service;1"]
			.getService(Ci.nsIPrefService);
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
		var prefsService = Cc["@mozilla.org/preferences-service;1"]
			.getService(Ci.nsIPrefService);
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
		this.observerService = Cc["@mozilla.org/observer-service;1"]
			.getService(Ci.nsIObserverService);
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
	PrefLoader.loadDefaultPrefs(params.installPath, "sstart.js");

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

	var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
	_gWindowListener = new BrowserWindowObserver({
		onStartup: browserWindowStartup,
		onShutdown: browserWindowShutdown
	});
	ww.registerNotification(_gWindowListener);
	
	var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
	var winenu = wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowStartup(winenu.getNext());
	}

	Cu.import("chrome://sstart/content/cache.js");
	
	myPrefsWatcher.register();
	browserPrefsWatcher.register();
	newTabURLWatcher.register();

	cache.updateGridInterval();
	cache.updateNewtabOnLockDrag();
	cache.updateAutoZoom();
/*
	attachContextMenu();
*/
}

function shutdown (params, reason)
{
	if (reason == APP_SHUTDOWN) return;

	newTabURLWatcher.unregister();
	browserPrefsWatcher.unregister();
	myPrefsWatcher.unregister();

	var ww = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
	ww.unregisterNotification(_gWindowListener);
	_gWindowListener = null;

	var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
	var winenu = wm.getEnumerator("navigator:browser");
	while (winenu.hasMoreElements()) {
		browserWindowShutdown(winenu.getNext());
	}
	
	browserPref("newtab.url", "clear");
	browserPref("startup.homepage", "clear");
	
	Cu.unload("chrome://sstart/content/cache.js");
	
	PrefLoader.clearDefaultPrefs();
	Cu.unload("chrome://sstart/content/prefloader.js");
	
	Services.obs.notifyObservers(null, "chrome-flush-caches", null);
}
