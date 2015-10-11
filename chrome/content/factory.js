justoff.sstart.Factory = function (storage) {

	var Thumbnail = justoff.sstart.Thumbnail
	var Search = justoff.sstart.Search
	var SStart = justoff.sstart.SStart
	var Dom = justoff.sstart.Dom
	var Prefs = justoff.sstart.Prefs
	var File = justoff.sstart.File
	var Utils = justoff.sstart.Utils
	
	const SEARCH_URL = "sstart://search/";
	
	Components.utils.import("resource://sstart/cache.js", justoff.sstart);

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
			openDialog("thumbprops.xul", "properties", SStart.getDialogFeatures(280, 240), param);
		} else {
			properties.width = 200;
			properties.height = 40;
			properties.url = SEARCH_URL;
			var param = { properties: properties };
			openDialog("searchprops.xul", "properties", SStart.getDialogFeatures(), param);
		}

		if (param.properties) {
			properties = param.properties;
		} else {
			return;
		}

		storage.saveObject(properties);
		File.delDataFile(properties.id);
		var fragment = document.createDocumentFragment();
		createWidget(properties, fragment);
		document.getElementById("widgets").appendChild(fragment);
		if (SStart.getZoom() && SStart.getPageId() == 0) {
			SStart.clearCache();
		}
		if (type == "folder") {
			SStart.setUpdateMenu(true);
		}
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

	this.createWidgets = function (pageId, autoZoom) {
		var hasWidgets = false;
		if (!SStart.isLocked() || pageId > 0 || !justoff.sstart.cache.fragment) {
			if (SStart.autoZoom()) {
				var maxBottom = 1;
				var maxRight = 1;
			}
			var objects = storage.getObjects();
			var fragment = document.createElement('span');
			fragment.setAttribute("id", "widgets");
			for (var i in objects) {
				createWidget(objects[i], fragment);
				hasWidgets = true;
				if (SStart.autoZoom()) {
					maxBottom = Math.max(maxBottom, (parseInt(objects[i].top, 10) || 0) + (parseInt(objects[i].height, 10) || 1));
					maxRight = Math.max(maxRight, (parseInt(objects[i].left, 10) || 0) + (parseInt(objects[i].width, 10) || 1));
				}
			}
			if (pageId == 0) {
				justoff.sstart.cache.fragment = fragment;
				SStart.setCacheDOM(false);
				if (SStart.autoZoom()) {
					justoff.sstart.cache.maxBottom = maxBottom;
					justoff.sstart.cache.maxRight = maxRight;
				}
			}
		} else if (pageId == 0) {
			var fragment = justoff.sstart.cache.fragment.cloneNode(true);
			hasWidgets = true;
			SStart.setCacheDOM(true);
			if (SStart.autoZoom()) {
				var maxBottom = justoff.sstart.cache.maxBottom;
				var maxRight = justoff.sstart.cache.maxRight;
			}
		}
		
		if (autoZoom && SStart.autoZoom()) {
			var zoom = Math.round(Math.min(window.innerWidth / maxRight, window.innerHeight / maxBottom) * 100) / 100;
			if (zoom <= 1) {
				var gBrowser = Utils.getBrowser();
				gBrowser.selectedBrowser.markupDocumentViewer.fullZoom = zoom - 0.02;
				SStart.setZoom(zoom - 0.02);
				document.addEventListener("visibilitychange", setZoom, false);
			}
		}
		
		document.body.appendChild(fragment);
		var focusId = Prefs.getString("focus");
		if (focusId != "") {
			var focusEl = document.getElementById(focusId);
			if (focusEl)
				setTimeout(function () {
					SStart.focusSearch(focusEl);
				}, 50);
		}
		return hasWidgets;
	}

	function setZoom (e) {
		if (!document.hidden) {
			var gBrowser = Utils.getBrowser();
			gBrowser.selectedBrowser.markupDocumentViewer.fullZoom = SStart.getZoom();
		}
	}

};

