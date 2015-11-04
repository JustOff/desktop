justoff.sstart.Search = function () {

	var Search = justoff.sstart.Search
	var SStart = justoff.sstart.SStart
	var Prefs = justoff.sstart.Prefs

	Components.utils.import("chrome://sstart/content/utils.js");
	Components.utils.import("chrome://sstart/content/dom.js");

	this.setProperties = function (properties) {
		Search.prototype.setProperties.call(this, properties);

		if (!this.properties.width) {
			this.properties.width = Prefs.getInt("thumbnail.width");
			this.properties.height = 40;
		}
	}

	this.createView = function () {
		return document.getElementById("sdiv").cloneNode(true);
	}

	this.updateView = function () {
		Search.prototype.updateView.call(this);
		this.properties.title = SStart.getSearchEngine(this.properties.title).name;
	}

	this.renderView = function () {
		Search.prototype.renderView.call(this);

		var refresh = Dom.child(this.view, "refresh");
		refresh.style.display = "none";

		var self = this;
		this.view.addEventListener("resize", function () {
			self.view.style.top = self.properties.top;
			self.view.style.height = 40;
			if (parseInt(self.view.style.width, 10) < 20) {
				self.view.style.width = 20;
			}
		}, false);

		return this.view;
	}

	this.updateDefaultSize = function () {
		if (Prefs.getBool("autoUpdSize")) {
			Prefs.setInt("thumbnail.width", this.properties.width);
		}
	}

	this.openProperties = function () {
		var param = { properties:Utils.clone(this.properties) };
		openDialog("searchprops.xul", "properties", SStart.getDialogFeatures(), param);
		if (param.properties) {
			this.properties = param.properties;
			this.save();
			this.updateView();
		}
		SStart.deleteSearchNode(this.properties.id);
	}

	this.editTitle = function () {
		this.openProperties();
	}
}

justoff.sstart.Search.prototype = new justoff.sstart.Widget();
