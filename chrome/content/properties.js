justoff.sstart.SStartPropertiesXul = new function () {

	var File = justoff.sstart.File
	var Dom = justoff.sstart.Dom
	var SStart = justoff.sstart.SStart
	var Utils = justoff.sstart.Utils
	var Prefs = justoff.sstart.Prefs
	var URL = justoff.sstart.URL
			
	this.toggleSelectBgImage = function (repaint) {
		if (repaint && this.backgroundImage == "1") {
			var dir = File.getDataDirectory();
			dir.append("bg_" + this.pageId + "t");
			if (!dir.exists()) {
				var dir2 = File.getDataDirectory();
				dir2.append("bg_" + this.pageId);
				dir2.copyTo(null, "bg_" + this.pageId + "t");
			}
			URL.removeFromCache(File.getDataFileURL("bg_" + this.pageId + "t"));
		}
		if (Dom.get("useMainBgImage").checked) {
			Dom.get("BackgroundImage").hidden = true;
			Dom.get("backgroundStyle").hidden = true;
			if (repaint) {
				Dom.removeClass(this.body, 'background-style-1');
				Dom.removeClass(this.body, 'background-style-2');
				if (SStart.isMainBgImage()) {
					this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
					Dom.addClass(this.body, 'background-style-' + Prefs.getInt('backgroundStyle'));
				} else {
					if (this.backgroundImage == "1") {
						this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + this.pageId + "t") + ")";
						Dom.addClass(this.body, 'background-style-' + Dom.get("bgStyle").value);
					} else {
						this.body.style.backgroundImage = "";
					}
				}
			}
		} else {
			Dom.get("BackgroundImage").hidden = false;
			Dom.get("backgroundStyle").hidden = false;
			if (repaint) {
				Dom.removeClass(this.body, 'background-style-1');
				Dom.removeClass(this.body, 'background-style-2');
				if (this.backgroundImage == "1") {
					this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + this.pageId + "t") + ")";
					Dom.addClass(this.body, 'background-style-' + Dom.get("bgStyle").value);
				} else {
					this.body.style.backgroundImage = "";
				}
			}
		}
	}

	this.setclearBackgroundImage = function () {
		if (Dom.get("SetClear").label == this.SetStr) {
			this.setBackgroundImage();
		} else {
			this.clearBackgroundImage();
		}
	}
	
	this.setBackgroundImage = function () {
		var file = File.chooseFile("open", ["images"]);
		if (file) {
			var dir = File.getDataDirectory();
			dir.append("bg_" + this.pageId + "t");
			if (dir.exists()) {
				dir.remove(false);
			}
			file.copyTo(File.getDataDirectory(), "bg_" + this.pageId + "t");
			this.backgroundImage = "1";
			URL.removeFromCache(File.getDataFileURL("bg_" + this.pageId + "t"));
			this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + this.pageId + "t") + ")";
			Dom.removeClass(this.body, 'background-style-1');
			Dom.removeClass(this.body, 'background-style-2');
			Dom.addClass(this.body, 'background-style-' + Dom.get("bgStyle").value);
			Dom.get("SetClear").label = this.ClearStr;
		}
	}

	this.clearBackgroundImage = function () {
		var dir = File.getDataDirectory();
		dir.append("bg_" + this.pageId + "t");
		if (dir.exists()) {
			dir.remove(false);
		}
		this.backgroundImage = "0";
		Dom.removeClass(this.body, 'background-style-1');
		Dom.removeClass(this.body, 'background-style-2');
		if (this.pageId > 0 && Dom.get("useMainBgImage").checked && SStart.isMainBgImage()) {
			this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
			Dom.addClass(document.body, 'background-style-' + Prefs.getInt('backgroundStyle'));
		} else {
			this.body.style.backgroundImage = "";
		}
		Dom.get("SetClear").label = this.SetStr;
	}
			
	this.toggleBackgroundStyle = function () {
		Dom.removeClass(this.body, 'background-style-1');
		Dom.removeClass(this.body, 'background-style-2');
		Dom.addClass(this.body, 'background-style-' + Dom.get("bgStyle").value);
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		this.SetStr = SStart.translate("imageSet");
		this.ClearStr = SStart.translate("imageClear");
		this.pageId = window.arguments[0].pageId;
		this.body = window.arguments[0].body;
		Dom.get("bgColor").value = properties.background || "#FFFFFF";
		Dom.get("titleColor").value = properties.titleColor || "#000000";
		Dom.get("headerColor").value = properties.headerColor || "#E0E0E0";
		this.backgroundImage = properties.backgroundImage || "0";
		Dom.get("bgStyle").value = properties.backgroundStyle || 1;
		if (this.backgroundImage == "1") {
			Dom.get("SetClear").label = this.ClearStr;
		} else {
			Dom.get("SetClear").label = this.SetStr;
		}
		if (this.pageId > 0) {
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
		var dir = File.getDataDirectory();
		dir.append("bg_" + this.pageId + "t");
		if (dir.exists()) {
			var dir2 = File.getDataDirectory();
			dir2.append("bg_" + this.pageId);
			if (dir2.exists()) {
				dir2.remove(false);
			}
			dir.moveTo(null, "bg_" + this.pageId)
			URL.removeFromCache(File.getDataFileURL("bg_" + this.pageId));
			if (this.pageId > 0 && Dom.get("useMainBgImage").checked && SStart.isMainBgImage()) {
				this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
			} else {
				this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + this.pageId) + ")";
			}
		} else if (properties.backgroundImage == "0") {
			var dir = File.getDataDirectory();
			dir.append("bg_" + this.pageId);
			if (dir.exists()) {
				dir.remove(false);
			}
		}
		if (this.pageId == 0) {
			Prefs.setInt('backgroundStyle', properties.backgroundStyle);
		} else {
			properties.useMainBgImage = Dom.get("useMainBgImage").checked ? "1" : "0";
		}
	}

	this.onCancel = function () {
		window.arguments[0].properties = null;
	}

}
