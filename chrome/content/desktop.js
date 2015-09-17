rtimushev.ffdesktop.Desktop = new function () {

    var Desktop = this;
    var Utils = rtimushev.ffdesktop.Utils;
    var File = rtimushev.ffdesktop.File;
    var Prefs = rtimushev.ffdesktop.Prefs;
    var Dom = rtimushev.ffdesktop.Dom;
	
	var isLocked = true;
	var isCacheDOM;

    this.isDesktop = function (doc) {
        return doc && doc.location
            && /chrome:\/\/desktop\/content\/desktop.html(\?.*)?/.test(doc.location.href);
    };

    this.reloadPage = function (doc) {
        doc.reload(false);
    };

    this.forEachDesktopBrowser = function (onPage) {
        var gBrowser = Utils.getBrowser();
        for (var i = 0; i < gBrowser.browsers.length; i++) {
            var br = gBrowser.browsers[i];
            if (Desktop.isDesktop(br.contentDocument))
                onPage(br);
        }
    };

    this.openPreferences = function () {
        if (!Desktop.prefsWindow || Desktop.prefsWindow.closed) {
            Desktop.prefsWindow = window.openDialog(
                "chrome://desktop/content/preferences.xul",
                "desktop-preferences-window",
                "chrome,toolbar,centerscreen,resizable=yes");
        } else
            Desktop.prefsWindow.focus();
    };

    this.isBackgroundImageSpecified = function () {
        var bg = File.getDataDirectory();
        bg.append("background");
        return bg.exists();
    };

    this.translate = function (key) {
        if (!Desktop.bundle) {
            Desktop.bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService)
                .createBundle("chrome://desktop/locale/desktop.properties");
        }
        return Desktop.bundle.GetStringFromName(key);
    };

    this.isCacheDOM = function () {
        return isCacheDOM;
    };

    this.setCacheDOM = function (s) {
        isCacheDOM = s;
    };

    this.isLocked = function () {
//        return Prefs.getBool("lock");
        return isLocked;
    };

    this.setLocked = function (s) {
//        Prefs.setBool("lock", s);
        isLocked = s;
    };

    this.toggleLocked = function () {
//        Prefs.setBool("lock", !Prefs.getBool("lock"));
        isLocked = !isLocked;
    };

    this.areDecorationsVisible = function () {
        return Prefs.getBool("showDecorations");
    };

    this.refreshAll = function () {
        var c = document.body.getElementsByClassName("widget");
        for (var i = 0; i < c.length; i++) {
            var r = Dom.child(c[i], "refresh");
            if (r) {
                r.click()
            }
        }
    };

};

