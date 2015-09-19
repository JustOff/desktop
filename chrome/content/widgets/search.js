justoff.sstart.Search = function () {

    var Search = justoff.sstart.Search
    var Utils = justoff.sstart.Utils
    var Dom = justoff.sstart.Dom

    this.setProperties = function (properties) {
        Search.prototype.setProperties.call(this, properties);

        if (!this.properties.width) {
            this.properties.width = 200;
            this.properties.height = 40;
        }
    }

    this.createView = function () {
        return Dom.get("search").cloneNode(true);
    }

    this.updateView = function () {
        Search.prototype.updateView.call(this);
        this.properties.title = this.getEngine().name;
    }

    this.renderView = function () {
        Search.prototype.renderView.call(this);
        this.updateView();

        var refresh = Dom.child(this.view, "refresh");
        refresh.style.display = "none";

        var self = this;
        this.view.addEventListener("resize", function () {
            self.view.style.left = self.properties.left;
            self.view.style.top = self.properties.top;
            self.view.style.height = self.properties.height;
        }, false);

        var input = Dom.child(this.view, "search");
        input.addEventListener("keypress", function (e) {
            if (e.keyCode == e.DOM_VK_RETURN) {
                doSearch.call(self, this.value);
            }
        }, false);

        return this.view;
    }

    this.openProperties = function () {
        var param = { properties:Utils.clone(this.properties) };

        openDialog("widgets/search/properties.xul", "properties",
            "chrome,centerscreen,modal,resizable", param);
        if (param.properties) {
            this.properties = param.properties;
            this.save();
            this.updateView();
        }
    }

    this.getIconURL = function () {
        return this.getEngine().iconURI.spec;
    }

    this.editTitle = function () {
    }

    this.getEngine = function (name) {
        var searchService = Components.classes["@mozilla.org/browser/search-service;1"]
            .getService(Components.interfaces.nsIBrowserSearchService);
        return searchService.getEngineByName(this.properties.title) ||
            searchService.currentEngine;
    }

    function doSearch(text) {
        var engine = this.getEngine();
        var submission = engine.getSubmission(text, null);
        document.location = submission.uri.spec;
    }
}

justoff.sstart.Search.prototype = new justoff.sstart.Widget();
