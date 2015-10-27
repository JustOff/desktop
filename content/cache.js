var EXPORTED_SYMBOLS = ["cache"];

var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

var cache = { 
	fragment: false, maxBottom: 1, maxRight: 1, gridInterval: 32, 
	newtabOnLockDrag: true, autoZoom: false, editOn: false, updateMenu: false,

	updateGridInterval: function (live) {
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		this.gridInterval = prefService.getIntPref("extensions.sstart.gridInterval");
		if (live) {
			var gBrowser = Services.wm.getMostRecentWindow("navigator:browser").getBrowser();
			if (gBrowser.contentDocument && gBrowser.contentDocument.location
				&& /chrome:\/\/sstart\/content\/sstart.html(\?.*)?/.test(gBrowser.contentDocument.location.href)) {
				var grid = gBrowser.contentDocument.getElementById("grid");
				if (grid) {
					grid.style.backgroundImage = "url(chrome://sstart/skin/grid" + this.gridInterval + ".png)";
				}
			}
		}
	},
	updateNewtabOnLockDrag: function () {
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		this.newtabOnLockDrag = prefService.getBoolPref("extensions.sstart.newtabOnLockDrag");
	},
	updateAutoZoom: function () {
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		this.autoZoom = prefService.getBoolPref("extensions.sstart.autoZoom");
		if (this.autoZoom) {
			this.fragment = false;
		}
	},
	hasClass: function (element, className) {
		return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
	},
	updateGridOnUnlock: function () {
		var gBrowser = Services.wm.getMostRecentWindow("navigator:browser").getBrowser();
		if (gBrowser.contentDocument && gBrowser.contentDocument.location
			&& /chrome:\/\/sstart\/content\/sstart.html(\?.*)?/.test(gBrowser.contentDocument.location.href)) {
			var grid = gBrowser.contentDocument.getElementById("grid");
			var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
			if (prefService.getBoolPref("extensions.sstart.showGridOnUnlock")) {
				if (!grid && this.hasClass(gBrowser.contentDocument.body, "unlock-edits")) {
					var doc = gBrowser.contentDocument;
					grid = doc.createElement("div");
					grid.id = "grid";
					grid.style.height = doc.body.scrollHeight + "px";
					grid.style.width = doc.body.scrollWidth + "px";
					grid.style.backgroundImage = "url(chrome://sstart/skin/grid" + this.gridInterval + ".png)";
					doc.body.appendChild(grid);
				}
			} else {
				if (grid) {
					grid.parentNode.removeChild(grid);
				}
			}
		}
	}
};
