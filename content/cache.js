var EXPORTED_SYMBOLS = ["Cache"];

var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("chrome://sstart/content/dom.js");
Cu.import("chrome://sstart/content/utils.js");

var Cache = { 

	fragment: false, maxBottom: 1, maxRight: 1, gridInterval: 32, 
	newtabOpenAlways: true, newtabOnLockDrag: true, autoZoom: false, editOn: false, updateMenu: false,

	clearCache: function () {
		this.fragment = false;
	},
	
	updateGridInterval: function (live) {
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		this.gridInterval = prefService.getIntPref("extensions.sstart.gridInterval");
		if (live) {
			var gBrowser = Services.wm.getMostRecentWindow("navigator:browser").getBrowser();
			if (Utils.isSStart(gBrowser.contentDocument)) {
				var grid = gBrowser.contentDocument.getElementById("grid");
				if (grid) {
					grid.style.backgroundImage = "url(chrome://sstart/skin/grid" + this.gridInterval + ".png)";
				}
			}
		}
	},

	updateGridStatus: function (show) {
		var doc = gBrowser = Services.wm.getMostRecentWindow("navigator:browser").getBrowser().contentDocument;
		var grid = doc.getElementById("grid");
		if (show) {
			if (grid) {
				return false;
			}
			grid = doc.createElement("div");
			grid.id = "grid";
			grid.style.height = doc.body.scrollHeight + "px";
			grid.style.width = doc.body.scrollWidth + "px";
			grid.style.backgroundImage = "url(chrome://sstart/skin/grid" + this.gridInterval + ".png)";
			doc.body.appendChild(grid);
			return true;
		} else {
			if (grid) {
				grid.parentNode.removeChild(grid);
			}
		}
	},

	updateGridOnUnlock: function () {
		var gBrowser = Services.wm.getMostRecentWindow("navigator:browser").getBrowser();
		if (Utils.isSStart(gBrowser.contentDocument)) {
			var grid = gBrowser.contentDocument.getElementById("grid");
			var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
			if (prefService.getBoolPref("extensions.sstart.showGridOnUnlock")) {
				if (!grid && Dom.hasClass(gBrowser.contentDocument.body, "unlock-edits")) {
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
	},

	getAutoZoom: function () {
		return this.autoZoom;
	},

	updateAutoZoom: function () {
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		this.autoZoom = prefService.getBoolPref("extensions.sstart.autoZoom");
		if (this.autoZoom) {
			this.fragment = false;
		}
	},

	isUpdateMenu: function () {
		return this.updateMenu;
	},
	
	setUpdateMenu: function (s) {
		this.updateMenu = s;
	},
	
	isEditOn: function () {
		return this.editOn;
	},

	setEditOff: function () {
		this.editOn = false;
	},

	setEditOn: function () {
		this.editOn = true;
	},
	
	getNewtabOnLockDrag: function () {
		return this.newtabOnLockDrag;
	},
	
	getNewtabOpenAlways: function () {
		return this.newtabOpenAlways;
	},

	updateNewtabOpen: function () {
		var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
		if (prefService.getBoolPref("extensions.sstart.newtabOpen")) {
			this.newtabOnLockDrag = prefService.getBoolPref("extensions.sstart.newtabOnLockDrag");
			this.newtabOpenAlways = !this.newtabOnLockDrag;
		} else {
			this.newtabOnLockDrag = false;
			this.newtabOpenAlways = false;
		}
	},

	alignToGrid: function (pos) {
		var min = Math.floor(pos / this.gridInterval) * this.gridInterval;
		if (pos - min > this.gridInterval / 2)
			return min + this.gridInterval;
		else
			return min;
	}

};
