justoff.sstart.Installer = new function () {

    var SStart = justoff.sstart.SStart
    var Installer = this

    this.addonId = "SStart@Off.JustOff"
    this.newTabURI = "chrome://sstart/content/sstart.html"

    this.installed = false
    this.oldURLBarSetURI
    this.oldGBrowserAddTab

    var beingUninstalled = false

    function installPre13() {
        Installer.oldURLBarSetURI = window.URLBarSetURI;
        window.URLBarSetURI = function () {
            var result = justoff.sstart.Installer.oldURLBarSetURI.apply(this, arguments);
            if (gURLBar.value.substr(0, justoff.sstart.Installer.newTabURI.length) === justoff.sstart.Installer.newTabURI) gURLBar.value = "";
            return result;
        }
        Installer.oldGBrowserAddTab = gBrowser.addTab;
        gBrowser.addTab = function () {
            if (arguments.length > 0 && arguments[0] == 'about:blank')
                arguments[0] = justoff.sstart.Installer.newTabURI;
            return justoff.sstart.Installer.oldGBrowserAddTab.apply(this, arguments);
        }
    }

    function installNormal() {
        if (Installer.installed) return;
        Installer.installed = true;

        var hasNewTab = false;
        try {
            var newTabURL = Services.prefs.getDefaultBranch("browser.newtab.url").getCharPref("");
            hasNewTab = true;
        } catch (ex) {
        }
        if (!hasNewTab) return installPre13();

        if (Services.prefs.getBoolPref("extensions.sstart.overrideNewTab"))
            Services.prefs.setCharPref("browser.newtab.url", justoff.sstart.Installer.newTabURI);
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
                    SStart.forEachSStartBrowser(SStart.reloadPage);
                    break;
                case "overrideNewTab":
                    var useOurNewTab = Services.prefs.getBoolPref("extensions.sstart.overrideNewTab");
                    if (useOurNewTab) {
                        Services.prefs.setCharPref("browser.newtab.url", justoff.sstart.Installer.newTabURI);
                    } else {
                        var newTabURL = Services.prefs.getCharPref("browser.newtab.url");
                        if (newTabURL == justoff.sstart.Installer.newTabURI)
                            Services.prefs.clearUserPref("browser.newtab.url");
                    }
                    break;
                case "overrideHomePage":
                    var useOurHomePage = Services.prefs.getBoolPref("extensions.sstart.overrideHomePage");
                    if (useOurHomePage) {
                        Services.prefs.setCharPref("browser.startup.homepage", justoff.sstart.Installer.newTabURI);
                    } else {
                        var homeURL = Services.prefs.getCharPref("browser.startup.homepage");
                        if (homeURL == justoff.sstart.Installer.newTabURI)
                            Services.prefs.clearUserPref("browser.startup.homepage");
                    }
                    break;
            }
        }
    }

    var BrowserWatcher = new function () {
        this.observe = function (subject, topic, data) {
            if (topic != "nsPref:changed") return;
            switch (data) {
                case "newtab.url":
                    var newTabURL = Services.prefs.getCharPref("browser.newtab.url");
                    if (newTabURL != justoff.sstart.Installer.newTabURI)
                        Services.prefs.setBoolPref("extensions.sstart.overrideNewTab", false);
                    break;
                case "startup.homepage":
                    var homeURL = Services.prefs.getCharPref("browser.startup.homepage");
                    if (homeURL != justoff.sstart.Installer.newTabURI)
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
                    if (beingUninstalled) {
                        var newTabURL = Services.prefs.getCharPref("browser.newtab.url");
                        if (newTabURL == justoff.sstart.Installer.newTabURI)
                            Services.prefs.clearUserPref("browser.newtab.url");
                        var homeURL = Services.prefs.getCharPref("browser.startup.homepage");
                        if (homeURL == justoff.sstart.Installer.newTabURI)
                            Services.prefs.clearUserPref("browser.startup.homepage");
                    }
                    break;
            }
        }
    }

    var AddonListener = {
        onUninstalling:function (addon) {
            if (addon.id == justoff.sstart.Installer.addonId) {
                beingUninstalled = true;
            }
        },
        onDisabling:function (addon) {
            if (addon.id == justoff.sstart.Installer.addonId) {
                beingUninstalled = true;
            }
        },
        onOperationCancelled:function (addon) {
            if (addon.id == justoff.sstart.Installer.addonId) {
                beingUninstalled = (addon.pendingOperations & (AddonManager.PENDING_UNINSTALL | AddonManager.PENDING_DISABLE)) != 0;
            }
        }
    }

    function install() {
        setTimeout(installNormal, 0);
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
        addEventListener("load", install, true);
    }

}
