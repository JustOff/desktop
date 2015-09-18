rtimushev.ffdesktop.Widget = function () {

    var Utils = rtimushev.ffdesktop.Utils
    var Dom = rtimushev.ffdesktop.Dom
    var Bookmark = rtimushev.ffdesktop.Bookmark
    var Drag = rtimushev.ffdesktop.Drag
    var Prefs = rtimushev.ffdesktop.Prefs
    var Desktop = rtimushev.ffdesktop.Desktop
	var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

    this.properties;
    this.view;

    this.setProperties = function (properties) {
        this.properties = properties;
    }

    this.setStorage = function (storage) {
        this.storage = storage;
    }

    this.updateView = function () {
        this.view.style.left = this.properties.left || "";
        this.view.style.top = this.properties.top || "";
        this.view.style.width = this.properties.width || "";
        this.view.style.height = this.properties.height || "";

        var icon = Dom.child(this.view, "icon");
//        icon.style.background = "url(" + this.getIconURL() + ")";

		if (this.properties.isFolder) {
			icon.style.background = "url(chrome://desktop/skin/folder.png)";
		} else if (this.properties.url == "desktop://search/") {
			icon.style.background = "url(" + this.getIconURL() + ")";
		} else if (this.properties.url) {
//			console.log("url: " + this.properties.url);
			uri = ios.newURI(this.properties.url, null, null);
			fis.getFaviconURLForPage(uri, 
				function (furi, len, data, mimeType) {
					if (furi) {
//						console.log("favicon: " + furi.spec);
						icon.style.background = "url(moz-anno:favicon:" + furi.spec + ")";
					}
				}
			);
		}

        var title = Dom.child(this.view, "title");
        title.innerHTML = this.properties.title || "";
    }

    this.renderView = function () {
        this.view = Dom.get("widget").cloneNode(true);
        Dom.child(this.view, "body").appendChild(this.createView());
        this.view.id = this.properties.id;
		if (this.properties.url == "desktop://search/") {
			Dom.addClass(this.view, "s-widget");
		}

        Drag.enable(this.view);
//		console.log("[1] renderView->updateView");
        this.updateView();
        if (this.properties.title == Prefs.getString("focus")) {
            var view = this.view;
            setTimeout(function () {
                var node = Dom.child(view, "search");
                if (node) node.focus();
            }, 110);
        }
        var self = this;
        var title = Dom.child(this.view, "title");
        title.addEventListener("dblclick", function () {
            self.editTitle.call(self);
        }, false);

        var remove = Dom.child(this.view, "remove");
        remove.addEventListener("click", function () {
            self.remove.call(self);
        }, false);

        var refresh = Dom.child(this.view, "refresh");
        refresh.addEventListener("click", function () {
            self.refresh.call(self);
        }, false);

        var properties = Dom.child(this.view, "properties");
        properties.addEventListener("click", function () {
            self.openProperties.call(self);
        }, false);

        this.view.addEventListener("drop", function () {
            self.properties.left = self.view.offsetLeft;
            self.properties.top = self.view.offsetTop;
            var resized = (self.properties.width != self.view.clientWidth || self.properties.height != self.view.clientHeight);
            self.properties.width = self.view.clientWidth;
            self.properties.height = self.view.clientHeight;
            self.save.call(self);
//			console.log("[2] renderView->updateView");
            self.updateView.call(self);
            if (resized) {
                self.refresh.call(self);
            }
        }, false);

        return this.view;
    }

    this.remove = function () {
        if (Utils.confirm(Desktop.translate("dialogRemoveWidget"))) {
            if (this.view) Dom.remove(this.view);
            this.storage.removeObject(this.properties.id);
            return true;
        }
    }

    this.refresh = function () {
    }
    this.openProperties = function () {
    }

    this.save = function () {
        this.storage.saveObject(this.properties);
    }

    this.getIconURL = function () {
        return Bookmark.getFaviconURL(this.properties.url);
    }

    this.editTitle = function () {
//        if (Desktop.isLocked()) return;
		if (Desktop.isLocked())
			Dom.addClass(document.body, 'no-hlink');
        var self = this;
        var title = Dom.child(self.view, "title");

        function removeInput() {
            title.innerHTML = self.properties.title;
			Dom.removeClass(document.body, 'no-hlink');
        }

        function updateTitle() {
            self.properties.title = title.firstChild.value;
            self.save.call(self);
            removeInput();
        }

        function onKeyUp(e) {
            switch (e.keyCode) {
                case e.DOM_VK_RETURN:
                    updateTitle();
                    break;
                case e.DOM_VK_ESCAPE:
                    removeInput();
                    break;
            }
        }

        title.innerHTML = "<input type='text'>";
        var input = title.firstChild;
        input.value = this.properties.title;
        input.focus();
//        input.select();
        input.addEventListener("blur", updateTitle, false);
        input.addEventListener("keyup", onKeyUp, false);
    }
}

rtimushev.ffdesktop.Widget.HEADER_HEIGHT = 20;
