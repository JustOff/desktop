justoff.sstart.SearchPropertiesXul = new function () {

	var Prefs = justoff.sstart.Prefs

	var getEngines = function () {
		var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
				.getService(Components.interfaces.nsIBrowserSearchService);
		return searchService.getEngines({});
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		var listbox = document.getElementById("engines");
		var engines = getEngines();
		for (var i in engines) {
			var listitem = document.createElement("listitem");
			listitem.setAttribute("class", "listitem-iconic");
			listitem.setAttribute("label", engines[i].name);
			listitem.setAttribute("image", engines[i].iconURI.spec);
			listbox.appendChild(listitem);
			if (engines[i].name == properties.title) {
				listbox.selectedItem = listitem;
				if (properties.id == Prefs.getString("focus")) {
					document.getElementById("focus").checked = true;
				}
			}
		}
		if (!listbox.selectedItem && listbox.firstChild) {
			listbox.selectedItem = listbox.firstChild;
		}
	}

	this.onAccept = function () {
		var properties = window.arguments[0].properties;
		properties.title = document.getElementById("engines").selectedItem.label;
		if (document.getElementById("focus").checked == true) {
			Prefs.setString("focus", properties.id);
		}
		else if (properties.id == Prefs.getString("focus")) {
			Prefs.setString("focus", "");
		}
	}

	this.onCancel = function () {
		window.arguments[0].properties = null;
	}

}
