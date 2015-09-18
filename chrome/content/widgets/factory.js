rtimushev.ffdesktop.Factory = function (storage) {

    var Thumbnail = rtimushev.ffdesktop.Thumbnail
    var Search = rtimushev.ffdesktop.Search
    var Drag = rtimushev.ffdesktop.Drag
	var Desktop = rtimushev.ffdesktop.Desktop
	var Dom = rtimushev.ffdesktop.Dom
	
	Components.utils.import("resource://desktop/cache.js", rtimushev.ffdesktop);

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
		var fragment = document.createDocumentFragment();
        createWidget(properties, fragment);
		document.getElementById("widgets").appendChild(fragment);
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
		if (!Desktop.isLocked() || document.location != "chrome://desktop/content/desktop.html" || !rtimushev.ffdesktop.cache.fragment) {
			var fragment = document.createElement('span');
			fragment.setAttribute("id", "widgets");
			for (var i in objects) {
				createWidget(objects[i], fragment);
				hasWidgets = true;
			}
			if (document.location == "chrome://desktop/content/desktop.html") {
				rtimushev.ffdesktop.cache.fragment = fragment;
			}
			Desktop.setCacheDOM(false);
		} else if (document.location == "chrome://desktop/content/desktop.html") {
			var fragment = rtimushev.ffdesktop.cache.fragment.cloneNode(true);
			var x = fragment.getElementsByClassName("widget");
			for (var i = 0; i < x.length; i++) {
				Drag.enable(x[i]);
				if (Dom.hasClass(x[i], "s-widget")) {
					var title = Dom.child(x[i], "title");
					var properties = { id: x[i].id, url: "desktop://search/", title: title.innerHTML, isFolder: false, left: x[i].style.left, top: x[i].style.top, width: x[i].style.width, height: x[i].style.height };
					fragment.removeChild(x[i]);
					createWidget(properties, fragment);
				}
			}
			hasWidgets = true;
			Desktop.setCacheDOM(true);
		}
        document.body.appendChild(fragment);
//		console.log(Desktop.isCacheDOM());
        return hasWidgets;
    }

};

