justoff.sstart.Factory = function (storage) {

    var Thumbnail = justoff.sstart.Thumbnail
    var Search = justoff.sstart.Search
    var Drag = justoff.sstart.Drag
	var SStart = justoff.sstart.SStart
	var Dom = justoff.sstart.Dom
	
	const SEARCH_URL = "desktop://search/";
	
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
        storage.saveObject(properties);
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

    this.createWidgets = function () {
        var objects = storage.getObjects();
        var hasWidgets = false;
		if (!SStart.isLocked() || document.location != "chrome://sstart/content/sstart.html" || !justoff.sstart.cache.fragment) {
			var fragment = document.createElement('span');
			fragment.setAttribute("id", "widgets");
			for (var i in objects) {
				createWidget(objects[i], fragment);
				hasWidgets = true;
			}
			if (document.location == "chrome://sstart/content/sstart.html") {
				justoff.sstart.cache.fragment = fragment;
			}
			SStart.setCacheDOM(false);
		} else if (document.location == "chrome://sstart/content/sstart.html") {
			var fragment = justoff.sstart.cache.fragment.cloneNode(true);
			var x = fragment.getElementsByClassName("widget");
			for (var i = 0; i < x.length; i++) {
				Drag.enable(x[i]);
				if (Dom.hasClass(x[i], "s-widget")) {
					var title = Dom.child(x[i], "title");
					var properties = { id: x[i].id, url: SEARCH_URL, title: title.innerHTML, isFolder: false, left: x[i].style.left, top: x[i].style.top, width: x[i].style.width, height: x[i].style.height };
					fragment.removeChild(x[i]);
					createWidget(properties, fragment);
				}
			}
			hasWidgets = true;
			SStart.setCacheDOM(true);
		}
        document.body.appendChild(fragment);
//		console.log(SStart.isCacheDOM());
        return hasWidgets;
    }

};

