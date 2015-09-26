justoff.sstart.Factory = function (storage) {

	var Thumbnail = justoff.sstart.Thumbnail
	var Search = justoff.sstart.Search
	var Drag = justoff.sstart.Drag
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
			var param = { properties: properties };
			var xul = 'widgets/thumbnail/' + (properties.isFolder ? 'folder' : 'properties') + '.xul';

			openDialog(xul, "properties", "chrome,centerscreen,modal,resizable", param);
			if (param.properties) {
				properties = param.properties;
			} else {
				return;
			}
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
		var objects = storage.getObjects();
		var hasWidgets = false;
		if (!SStart.isLocked() || pageId > 0 || !justoff.sstart.cache.fragment) {
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
			var x = fragment.getElementsByClassName("widget");
			var l = x.length;
			for (var i = 0; i < l; i++) {
				if (x[i].getAttribute("data-search") == "true") {
					var title = Dom.child(x[i], "title");
					var properties = { id: x[i].id, url: SEARCH_URL, title: title.innerHTML, isFolder: false, left: x[i].style.left, top: x[i].style.top, width: x[i].style.width, height: x[i].style.height };
					fragment.removeChild(x[i]);
					createWidget(properties, fragment);
					i--; l--;
				} else {
					Drag.enable(x[i]);
				}
			}
			hasWidgets = true;
			SStart.setCacheDOM(true);
		}
		document.body.appendChild(fragment);
		return hasWidgets;
	}

};

