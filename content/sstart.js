justoff.sstart.SStart = new function () {

	var SStart = this;

	Components.utils.import("chrome://sstart/content/cache.js");
	Components.utils.import("chrome://sstart/content/utils.js");
	Components.utils.import("chrome://sstart/content/file.js");
	Components.utils.import("chrome://sstart/content/dom.js");
	
	this.Locked = true;
	this.CacheDOM = false;
	this.Internal = false;
	this.Zoom = 1;
	this.PageId = 0;
	this.FaviCount = 0;
	this.SearchNodes = {};

	this.isMainBgImage = function () {
		var bg = File.getDataDirectory();
		bg.append("bg_0");
		return bg.exists();
	};

	this.saveCache = function (e, fragment) {
		var doc = Utils.getBrowserWindow().document;
		if (typeof fragment != "undefined") {
			doc.getElementById("sstart-hidden-box").appendChild(doc.importNode(fragment, true));
		} else {
			doc.getElementById("sstart-hidden-box").appendChild(doc.importNode(document.getElementById("widgets"), true));
		}
		var widgets = doc.getElementById("widgets");
		Cache.fragment = widgets;
		Dom.remove(widgets);
		SStart.setCacheDOM(false);
		var factory = document.getElementById("factory");
		factory.removeEventListener("savecache", SStart.saveCache);
	};

	this.getFVC = function () {
		return SStart.FaviCount;
	};

	this.incFVC = function () {
		SStart.FaviCount = SStart.FaviCount + 1;
	};

	this.decFVC = function () {
		SStart.FaviCount = SStart.FaviCount - 1;
		return SStart.FaviCount;
	};

	this.resetFVC = function () {
		SStart.FaviCount = 0;
	};

	this.getPageId = function () {
		return SStart.PageId;
	};

	this.setPageId = function (s) {
		SStart.PageId = s;
	};

	this.getZoom = function () {
		return SStart.Zoom;
	};

	this.setZoom = function (s) {
		SStart.Zoom = s;
	};

	this.isCacheDOM = function () {
		return SStart.CacheDOM;
	};

	this.setCacheDOM = function (s) {
		SStart.CacheDOM = s;
	};

	this.isInternal = function () {
		return SStart.Internal;
	};

	this.setInternal = function (s) {
		SStart.Internal = s;
	};

	this.isLocked = function () {
		return SStart.Locked;
	};

	this.setLocked = function (s) {
		SStart.Locked = s;
	};

	this.toggleLocked = function () {
		SStart.Locked = !SStart.Locked;
	};

	this.deleteSearchNode = function (node) {
		if (node in SStart.SearchNodes) {
			delete SStart.SearchNodes[node];
		}
	};

	this.focusSearch = function (hoverEl) {
		try {
			var input = Dom.child(hoverEl.lastElementChild.firstElementChild, "search");
		} catch (e) {}
		if (input) {
			if (!(hoverEl.id in SStart.SearchNodes)) {
				input.addEventListener("keypress", function (e) {
					if (e.keyCode == e.DOM_VK_RETURN) {
						SStart.doSearch.call(self, this.value, input, e.ctrlKey || e.metaKey);
					}
				}, false);
				SStart.SearchNodes[hoverEl.id] = true;
			}
			input.focus();
		}
	};

	this.getSearchEngine = function (name) {
		var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
			.getService(Components.interfaces.nsIBrowserSearchService);
		return searchService.getEngineByName(name) ||
			searchService.currentEngine;
	};

	this.doSearch = function (text, input, newtab) {
		var engine = SStart.getSearchEngine(Dom.child(input.parentNode.parentNode.parentNode, "title").textContent);
		input.value = "";
		var submission = engine.getSubmission(text);
		if (newtab && !Cache.getNewtabOpenAlways() || !newtab && Cache.getNewtabOpenAlways()) {
			Utils.getBrowser().loadOneTab(submission.uri.spec, 
				{postData: submission.postData, inBackground: false, relatedToCurrent: true});
		} else {
			Utils.getBrowser().loadURIWithFlags(submission.uri.spec, 
				Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, submission.postData);
		}
	};
	
	this.getDialogFeatures = function (w, h, l, t, m) {
		var osString = Components.classes["@mozilla.org/xre/app-info;1"]  
			.getService(Components.interfaces.nsIXULRuntime).OS;
		var features = "chrome";
		if (typeof m == "undefined" || osString == "Darwin") {
			features = features + ",modal";
		}
		if (osString == "Darwin") {
			features = features + ",titlebar,dialog=no";
			if (typeof w != "undefined") {
				w = w + 30;
			}
			if (typeof h != "undefined") {
				h = h + 30;
			}
		}
		if (typeof w == "undefined" || typeof h == "undefined") {
			features = features + ",centerscreen,resizable";
		} else {
			var prefBranch = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefService).getBranch("extensions.sstart.");
			var autoZoom = prefBranch.getBoolPref("autoZoom");
			if (autoZoom) {
				w = Math.round(w / this.getZoom());
				h = Math.round(h / this.getZoom());
			}
			if (typeof l == "undefined" || typeof t == "undefined") {
				var edc = prefBranch.getIntPref("enlargeDialogs");
				if (edc > 100) {
					w = Math.round(w * edc / 100); 
					h = Math.round(h * (1 + (edc / 100 - 1) / 2));
				}
				l = Math.round((window.innerWidth - w) / 2) + window.mozInnerScreenX;
				t = Math.round((window.innerHeight - h) / 2) + window.mozInnerScreenY;
			}
			features = features + ",outerWidth=" + w + ",outerHeight=" + h + ",left=" + l + ",top=" + t;
		}
		return features;
	};
	
};

