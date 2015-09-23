justoff.sstart.SearchPropertiesXul = new function () {

	var Dom = justoff.sstart.Dom
	var Prefs = justoff.sstart.Prefs

	var getEngines = function () {
		var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
				.getService(Components.interfaces.nsIBrowserSearchService);
		return searchService.getEngines({});
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;

		var listbox = Dom.get("engines");
		var engines = getEngines();

		for (var i in engines) {
			var listitem = document.createElement("listitem");
			listitem.setAttribute("class", "listitem-iconic");
			listitem.setAttribute("label", engines[i].name);
			listitem.setAttribute("image", engines[i].iconURI.spec);
			listbox.appendChild(listitem);
			if (engines[i].name == properties.title) {
				listbox.selectedItem = listitem;
				if (engines[i].name == Prefs.getString("focus")) {
					Dom.get("focus").checked = true;
				}
			}
		}
	}

	this.onAccept = function () {
		var properties = window.arguments[0].properties;
		properties.title = Dom.get("engines").selectedItem.label;
		if (Dom.get("focus").checked == true) {
			Prefs.setString("focus", properties.title);
		}
		else if (properties.title == Prefs.getString("focus")) {
			Prefs.setString("focus", "");
		}
	}

	this.onCancel = function () {
		window.arguments[0].properties = null;
	}

}
