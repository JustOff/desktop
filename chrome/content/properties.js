justoff.sstart.SStartPropertiesXul = new function () {

	var File = justoff.sstart.File
	var Dom = justoff.sstart.Dom
	var SStart = justoff.sstart.SStart
	var Utils = justoff.sstart.Utils
	var Prefs = justoff.sstart.Prefs
			
	this.backgroundImage = "";

	this.toggleSelectBgImage = function (repaint) {
		if (Dom.get("useMainBgImage").checked) {
			Dom.get("BackgroundImage").hidden = true;
			Dom.get("backgroundStyle").hidden = true;
			if (repaint) {
				var gBrowser = Utils.getBrowser();
				var body = gBrowser.selectedBrowser.contentDocument.body;
				Dom.removeClass(body, 'background-style-1');
				Dom.removeClass(body, 'background-style-2');
				if (SStart.isMainBgImage()) {
					body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
					Dom.addClass(body, 'background-style-' + Prefs.getInt('backgroundStyle'));
				} else {
					body.style.backgroundImage = "";
				}
			}
		} else {
			Dom.get("BackgroundImage").hidden = false;
			Dom.get("backgroundStyle").hidden = false;
			if (repaint) {
				var gBrowser = Utils.getBrowser();
				var body = gBrowser.selectedBrowser.contentDocument.body;
				Dom.removeClass(body, 'background-style-1');
				Dom.removeClass(body, 'background-style-2');
				if (this.backgroundImage == "1") {
					body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + window.arguments[0].pageId) + ")";
					Dom.addClass(body, 'background-style-' + Dom.get("bgStyle").value);
				} else {
					body.style.backgroundImage = "";
				}
			}
		}
	}

	this.browseBackgroundImage = function () {
		var file = File.chooseFile("open", ["images"]);
		if (file) {
			this.clearBackgroundImage();
			file.copyTo(File.getDataDirectory(), "bg_" + window.arguments[0].pageId);
			this.backgroundImage = "1";
			var gBrowser = Utils.getBrowser();
			var body = gBrowser.selectedBrowser.contentDocument.body;
			body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + window.arguments[0].pageId) + ")";
			Dom.addClass(body, 'background-style-' + Dom.get("bgStyle").value);
		}
	}

	this.clearBackgroundImage = function () {
		var dir = File.getDataDirectory();
		dir.append("bg_" + window.arguments[0].pageId);
		try {
			dir.remove(false);
		} catch (e) {}
		this.backgroundImage = "0";
		var gBrowser = Utils.getBrowser();
		var body = gBrowser.selectedBrowser.contentDocument.body;
		body.style.backgroundImage = "";
		Dom.removeClass(body, 'background-style-1');
		Dom.removeClass(body, 'background-style-2');
	}
			
	this.toggleBackgroundStyle = function () {
		var gBrowser = Utils.getBrowser();
		var body = gBrowser.selectedBrowser.contentDocument.body;
		Dom.removeClass(body, 'background-style-1');
		Dom.removeClass(body, 'background-style-2');
		Dom.addClass(body, 'background-style-' + Dom.get("bgStyle").value);
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		var pageId = window.arguments[0].pageId;
		Dom.get("bgColor").value = properties.background || "#FFFFFF";
		Dom.get("titleColor").value = properties.titleColor || "#000000";
		Dom.get("headerColor").value = properties.headerColor || "#E0E0E0";
		this.backgroundImage = properties.backgroundImage || "0";
		Dom.get("bgStyle").value = properties.backgroundStyle || 1;
		if (window.arguments[0].pageId > 0) {
			Dom.get("useMainBgImage").checked = properties.useMainBgImage != "0";
			this.toggleSelectBgImage(false);
		} else {
			Dom.get("hboxMainBgImage").hidden = true;
		}
	}

	this.onAccept = function () {
		var properties = window.arguments[0].properties;
		properties.background = (Dom.get("bgColor").value == "") ? "#FFFFFF" : Dom.get("bgColor").value;
		properties.titleColor = (Dom.get("titleColor").value == "") ? "#000000" : Dom.get("titleColor").value;
		properties.headerColor = (Dom.get("headerColor").value == "") ? "#E0E0E0" : Dom.get("headerColor").value;
		properties.backgroundImage = this.backgroundImage;
		properties.backgroundStyle = Dom.get("bgStyle").value;
		if (window.arguments[0].pageId == 0) {
			Prefs.setInt('backgroundStyle', properties.backgroundStyle);
		}
		if (window.arguments[0].pageId > 0) {
			properties.useMainBgImage = Dom.get("useMainBgImage").checked ? "1" : "0";
		}
	}

	this.onCancel = function () {
		window.arguments[0].properties = null;
	}

}
