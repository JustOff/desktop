justoff.sstart.Factory = function (storage) {

	var Thumbnail = justoff.sstart.Thumbnail
	var Search = justoff.sstart.Search
	var SStart = justoff.sstart.SStart
	var Prefs = justoff.sstart.Prefs

	Components.utils.import("chrome://sstart/content/cache.js");
	Components.utils.import("chrome://sstart/content/file.js");
	Components.utils.import("chrome://sstart/content/utils.js");
	
	var SEARCH_URL = "sstart://search/";

	this.createWidget = function (type, x, y) {
		var properties = {
			title:"",
			left:x,
			top:y,
			isFolder:type == "folder"
		}

		if (type != "search") {
			properties.width = Prefs.getInt("thumbnail.width");
			properties.height = Prefs.getInt("thumbnail.height");
			var param = { properties: properties };
			openDialog("thumbprops.xul", "properties", SStart.getDialogFeatures(300, 255), param);
		} else {
			properties.width = Prefs.getInt("thumbnail.width");
			properties.height = 40;
			properties.url = SEARCH_URL;
			var param = { properties: properties };
			openDialog("searchprops.xul", "properties", SStart.getDialogFeatures(), param);
		}

		if (param.properties) {
			properties = param.properties;
		} else {
			return false;
		}

		storage.saveObject(properties);
		if (properties.url == SEARCH_URL && Prefs.getString("focus") == "0") {
			Prefs.setString("focus", properties.id);
		}
		File.delDataFile(properties.id);
		var fragment = document.createDocumentFragment();
		createWidget(properties, fragment);
		document.getElementById("widgets").appendChild(fragment);
		if (SStart.getZoom() && SStart.getPageId() == 0) {
			Cache.clearCache();
		}
		if (type == "folder") {
			Cache.setUpdateMenu(true);
		}
		return true;
	}

	function createWidget(properties, fragment) {
		var widget;
		switch (properties.url) {
			case SEARCH_URL:
				widget = new Search();
				break;
			default:
				widget = new Thumbnail();
				break;
		}
		widget.setProperties(properties);
		widget.setStorage(storage);
		fragment.appendChild(widget.renderView());
	}

	this.createWidgets = function (pageId, applyZoom, setFocus) {
		var hasWidgets = false;
		var autoZoom = Prefs.getBool("autoZoom");
		if (!SStart.isLocked() || pageId > 0 || !Cache.fragment) {
			if (autoZoom) {
				var maxBottom = 1;
				var maxRight = 1;
			}
			var objects = storage.getObjects();
			if (pageId == 0) {
				SStart.resetFVC();
				var factory = document.getElementById("factory");
				factory.addEventListener("savecache", SStart.saveCache, false);
			}
			var fragment = document.createElement('span');
			fragment.setAttribute("id", "widgets");
			for (var i in objects) {
				createWidget(objects[i], fragment);
				hasWidgets = true;
				if (autoZoom) {
					maxBottom = Math.max(maxBottom, (parseInt(objects[i].top, 10) || 0) + (parseInt(objects[i].height, 10) || 1));
					maxRight = Math.max(maxRight, (parseInt(objects[i].left, 10) || 0) + (parseInt(objects[i].width, 10) || 1));
				}
			}
			if (pageId == 0) {
				if (SStart.getFVC() == 0) {
					if (hasWidgets) {
						SStart.saveCache(null, fragment);
					} else {
						factory.removeEventListener("savecache", SStart.saveCache);
					}
				}
				if (autoZoom) {
					Cache.maxBottom = maxBottom;
					Cache.maxRight = maxRight;
				}
			}
		} else if (pageId == 0) {
			var fragment = Cache.fragment.cloneNode(true);
			hasWidgets = fragment.hasChildNodes();
			SStart.setCacheDOM(true);
			if (autoZoom) {
				var maxBottom = Cache.maxBottom;
				var maxRight = Cache.maxRight;
			}
		}
		
		if (applyZoom && autoZoom) {
			var zoom = Math.round(Math.min(window.innerWidth / maxRight, window.innerHeight / maxBottom) * 100) / 100;
			if (zoom <= 1) {
				var gBrowser = Utils.getBrowser();
				gBrowser.selectedBrowser.markupDocumentViewer.fullZoom = zoom - 0.02;
				SStart.setZoom(zoom - 0.02);
				document.addEventListener("visibilitychange", setZoom, false);
			}
		}
		
		document.body.appendChild(fragment);
		if (setFocus) {
			var focusId = Prefs.getString("focus");
			if (focusId != "") {
				var focusEl = document.getElementById(focusId);
				if (focusEl)
					setTimeout(function () {
						SStart.focusSearch(focusEl);
					}, 50);
			} else {
				setTimeout(function () {
					var urlbar = Utils.getBrowserWindow().document.getElementById("urlbar");
					urlbar.focus();
				}, 50);
			}
		}
		if (Utils.isSeaMonkey) {
			updateUrlbar();
			document.addEventListener("visibilitychange", watchUrlbar, false);
		}
		return hasWidgets;
	}

	function setZoom (e) {
		if (!document.hidden) {
			var gBrowser = Utils.getBrowser();
			gBrowser.selectedBrowser.markupDocumentViewer.fullZoom = SStart.getZoom();
		}
	}

	function updateUrlbar () {
		if (document.location == "chrome://sstart/content/sstart.html") {
			var doc = Utils.getBrowserWindow().document;
			var urlbar = doc.getElementById("urlbar");
			urlbar.value = "";
			var fav = doc.getElementById("page-proxy-favicon");
			if (!fav.hasAttribute("src")) {
				fav.setAttribute("src", "chrome://sstart/skin/icon.png");
			}
		}
	}

	function watchUrlbar (e) {
		if (!document.hidden) {
			updateUrlbar();
		}
	}

};

