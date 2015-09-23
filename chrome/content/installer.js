justoff.sstart.Installer = new function () {

	var SStart = justoff.sstart.SStart
	var Installer = this

	this.addonId = "SStart@Off.JustOff"
	this.newTabURI = "chrome://sstart/content/sstart.html"

	this.installed = false

	var SStartBeingUninstalled = false

	function install() {
		if (Installer.installed) return;
		Installer.installed = true;
		
		SStart.updateGridInterval();

		if (Services.prefs.getBoolPref("extensions.sstart.overrideNewTab")) {
			try {
				Components.utils.import("resource:///modules/NewTabURL.jsm");
				NewTabURL.override(justoff.sstart.Installer.newTabURI);
			} catch(e) {
				Services.prefs.setCharPref("browser.newtab.url", justoff.sstart.Installer.newTabURI);
			}
		}

		if (Services.prefs.getBoolPref("extensions.sstart.overrideHomePage"))
			Services.prefs.setCharPref("browser.startup.homepage", justoff.sstart.Installer.newTabURI);

		// Blank address line for Speed Start
		if (gInitialPages.indexOf(justoff.sstart.Installer.newTabURI) == -1) {
			gInitialPages.push(justoff.sstart.Installer.newTabURI);
		}
	}

	var Watcher = new function () {
		this.observe = function (subject, topic, data) {
			if (topic != "nsPref:changed") return;
			switch (data) {
				case "backgroundStyle":
				case "bottomHeader":
					SStart.forEachSStartBrowser(SStart.reloadPage);
					break;
				case "overrideNewTab":
					var useOurNewTab = Services.prefs.getBoolPref("extensions.sstart.overrideNewTab");
					if (useOurNewTab) {
						try {
							Components.utils.import("resource:///modules/NewTabURL.jsm");
							NewTabURL.override(justoff.sstart.Installer.newTabURI);
						} catch(e) {
							Services.prefs.setCharPref("browser.newtab.url", justoff.sstart.Installer.newTabURI);
						}
					} else {
						try {
							Components.utils.import("resource:///modules/NewTabURL.jsm");
							NewTabURL.reset();
						} catch(e) {
							var newTabURI = Services.prefs.getCharPref("browser.newtab.url");
							if (newTabURI == justoff.sstart.Installer.newTabURI)
								Services.prefs.clearUserPref("browser.newtab.url");
						}
					}
					break;
				case "overrideHomePage":
					var useOurHomePage = Services.prefs.getBoolPref("extensions.sstart.overrideHomePage");
					if (useOurHomePage) {
						Services.prefs.setCharPref("browser.startup.homepage", justoff.sstart.Installer.newTabURI);
					} else {
						var homeURI = Services.prefs.getCharPref("browser.startup.homepage");
						if (homeURI == justoff.sstart.Installer.newTabURI)
							Services.prefs.clearUserPref("browser.startup.homepage");
					}
					break;
				case "gridInterval":
					SStart.updateGridInterval();
					break;
			}
		}
	}

	var BrowserWatcher = new function () {
		this.observe = function (subject, topic, data) {
			if (topic != "nsPref:changed") return;
			switch (data) {
				case "newtab.url":
					try {
						Components.utils.import("resource:///modules/NewTabURL.jsm");
						var newTabURI = NewTabURL.get();
					} catch(e) {
						var newTabURI = Services.prefs.getCharPref("browser.newtab.url");
					}
					if (newTabURI != justoff.sstart.Installer.newTabURI)
						Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
					break;
				case "startup.homepage":
					var homeURI = Services.prefs.getCharPref("browser.startup.homepage");
					if (homeURI != justoff.sstart.Installer.newTabURI)
						Services.prefs.setBoolPref("extensions.sstart.overrideHomePage", false);
					break;
			}
		}
	}


	var LifecycleWatcher = new function () {
		this.observe = function (subject, topic, data) {
			switch (topic) {
				case "profile-before-change":
					uninstall();
					if (SStartBeingUninstalled) {
						try {
							Components.utils.import("resource:///modules/NewTabURL.jsm");
							NewTabURL.reset();
						} catch(e) {
							var newTabURI = Services.prefs.getCharPref("browser.newtab.url");
							if (newTabURI == justoff.sstart.Installer.newTabURI)
								Services.prefs.clearUserPref("browser.newtab.url");
						}
						var homeURI = Services.prefs.getCharPref("browser.startup.homepage");
						if (homeURI == justoff.sstart.Installer.newTabURI)
							Services.prefs.clearUserPref("browser.startup.homepage");
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
				SStartBeingUninstalled = (addon.pendingOperations & (AddonManager.PENDING_UNINSTALL | AddonManager.PENDING_DISABLE)) != 0;
			}
		}
	}

	function init() {
		setTimeout(install, 0);
		this.prefsService = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
		this.prefs = this.prefsService.getBranch("extensions.sstart.");
		this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.prefs.addObserver("", Watcher, false);

		this.newTabPrefs = this.prefsService.getBranch("browser.");
		this.newTabPrefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this.newTabPrefs.addObserver("", BrowserWatcher, false);

		this.observerService = Components.classes["@mozilla.org/observer-service;1"]
			.getService(Components.interfaces.nsIObserverService);
		this.observerService.addObserver(LifecycleWatcher, "profile-before-change", false)

		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.addAddonListener(AddonListener);
	}

	function uninstall() {
		this.observerService.removeObserver(LifecycleWatcher, "profile-before-change");
		this.newTabPrefs.removeObserver("", BrowserWatcher);
		this.prefs.removeObserver("", Watcher);
	}

	this.load = function () {
		addEventListener("load", init, true);
	}

}
