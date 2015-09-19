justoff.sstart.SStart = new function () {

    var SStart = this;
    var Utils = justoff.sstart.Utils;
    var File = justoff.sstart.File;
    var Prefs = justoff.sstart.Prefs;
    var Dom = justoff.sstart.Dom;
	
	var isLocked = true;
	var isCacheDOM;

    this.isSStart = function (doc) {
        return doc && doc.location
            && /chrome:\/\/sstart\/content\/sstart.html(\?.*)?/.test(doc.location.href);
    };

    this.reloadPage = function (doc) {
        doc.reload(false);
    };

    this.forEachSStartBrowser = function (onPage) {
        var gBrowser = Utils.getBrowser();
        for (var i = 0; i < gBrowser.browsers.length; i++) {
            var br = gBrowser.browsers[i];
            if (SStart.isSStart(br.contentDocument))
                onPage(br);
        }
    };

    this.openPreferences = function () {
        if (!SStart.prefsWindow || SStart.prefsWindow.closed) {
            SStart.prefsWindow = window.openDialog(
                "chrome://sstart/content/preferences.xul",
                "sstart-preferences-window",
                "chrome,toolbar,centerscreen,resizable=yes");
        } else
            SStart.prefsWindow.focus();
    };

    this.isBackgroundImageSpecified = function () {
        var bg = File.getDataDirectory();
        bg.append("background");
        return bg.exists();
    };

    this.translate = function (key) {
        if (!SStart.bundle) {
            SStart.bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                .getService(Components.interfaces.nsIStringBundleService)
                .createBundle("chrome://sstart/locale/sstart.properties");
        }
        return SStart.bundle.GetStringFromName(key);
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

