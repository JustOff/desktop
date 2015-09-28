justoff.sstart.Factory = function (storage) {

	var Thumbnail = justoff.sstart.Thumbnail
	var Search = justoff.sstart.Search
	var SStart = justoff.sstart.SStart
	var Dom = justoff.sstart.Dom
	var Prefs = justoff.sstart.Prefs
	var File = justoff.sstart.File
	
	const SEARCH_URL = "sstart://search/";
	
	Components.utils.import("resource://sstart/cache.js", justoff.sstart);

	function getURL(type) {
		switch (type) {
			case "search":
				return SEARCH_URL;
		}
	}

	this.createWidget = function (type, x, y) {
		var properties = {
			left:x,
			top:y,
			isFolder:type == "folder",
			url:getURL(type)
		}

		if (type != "search") {
			properties.width = Prefs.getInt("thumbnail.width");
			properties.height = Prefs.getInt("thumbnail.height");
			properties.title = "";
			var param = { properties: properties };
			var xul = 'widgets/thumbnail/' + (properties.isFolder ? 'folder' : 'properties') + '.xul';
			openDialog(xul, "properties", "chrome,centerscreen,modal,resizable", param);
		} else {
			properties.width = 200;
			properties.height = 40;
			properties.title = "";
			var param = { properties: properties };
			openDialog("widgets/search/properties.xul", "properties", "chrome,centerscreen,modal,resizable", param);
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

	this.createWidgets = function (pageId) {
		var hasWidgets = false;
		if (!SStart.isLocked() || pageId > 0 || !justoff.sstart.cache.fragment) {
			var objects = storage.getObjects();
			var fragment = document.createElement('span');
			fragment.setAttribute("id", "widgets");
			for (var i in objects) {
				createWidget(objects[i], fragment);
				hasWidgets = true;
			}
			if (pageId == 0) {
				justoff.sstart.cache.fragment = fragment;
				SStart.setCacheDOM(false);
			}
		} else if (pageId == 0) {
			var fragment = justoff.sstart.cache.fragment.cloneNode(true);
			hasWidgets = true;
			SStart.setCacheDOM(true);
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

};

