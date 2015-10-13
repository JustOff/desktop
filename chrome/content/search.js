justoff.sstart.Search = function () {

	var Search = justoff.sstart.Search
	var Utils = justoff.sstart.Utils
	var Dom = justoff.sstart.Dom
	var SStart = justoff.sstart.SStart

	this.setProperties = function (properties) {
		Search.prototype.setProperties.call(this, properties);

		if (!this.properties.width) {
			this.properties.width = 200;
			this.properties.height = 40;
		}
	}

	this.createView = function () {
		return Dom.get("sdiv").cloneNode(true);
	}

	this.updateView = function () {
		Search.prototype.updateView.call(this);
//		console.log(this.properties.title);
		this.properties.title = SStart.getSearchEngine(this.properties.title).name;
	}

	this.renderView = function () {
		Search.prototype.renderView.call(this);
		this.updateView();

		var refresh = Dom.child(this.view, "refresh");
		refresh.style.display = "none";

		var self = this;
		this.view.addEventListener("resize", function () {
			self.view.style.top = self.properties.top;
			self.view.style.height = self.properties.height;
		}, false);

		return this.view;
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
	}
}

justoff.sstart.Search.prototype = new justoff.sstart.Widget();
