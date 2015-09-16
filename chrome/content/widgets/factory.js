rtimushev.ffdesktop.Factory = function (storage) {

    var Thumbnail = rtimushev.ffdesktop.Thumbnail
    var Search = rtimushev.ffdesktop.Search
    var Drag = rtimushev.ffdesktop.Drag
	var Prefs = rtimushev.ffdesktop.Prefs
	
	rtimushev.ffdesktop.cache = {};
	Components.utils.import("resource://desktop/cache.js", rtimushev.ffdesktop.cache);

    function getURL(type) {
        switch (type) {
            case "search":
                return "desktop://search/";
        }
    }

    this.createWidget = function (type, x, y) {
        var properties = {
            left:x,
            top:y,
            isFolder:type == "folder",
            url:getURL(type)
        }
        storage.saveObject(properties);
        createWidget(properties);
    }

    function createWidget(properties, fragment) {
        var widget;
        switch (properties.url) {
            case "desktop://search/":
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

    this.createWidgets = function () {
        var objects = storage.getObjects();
        var hasWidgets = false;
		if (!Prefs.getBool("lock") || document.location != "chrome://desktop/content/desktop.html" || !rtimushev.ffdesktop.cache.cfragment.cf) {
			var fragment = document.createElement('span');
			for (var i in objects) {
				createWidget(objects[i], fragment);
				hasWidgets = true;
			}
			if (document.location == "chrome://desktop/content/desktop.html") {
				rtimushev.ffdesktop.cache.cfragment.cf = fragment;
			}
		} else if (document.location == "chrome://desktop/content/desktop.html") {
			var fragment = rtimushev.ffdesktop.cache.cfragment.cf.cloneNode(true);
			var x = fragment.getElementsByClassName("widget");
			for (var i = 0; i < x.length; i++) {
				Drag.enable(x[i]);
			}
			hasWidgets = true;
		}
        document.body.appendChild(fragment);
        return hasWidgets;
    }

};

