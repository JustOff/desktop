justoff.sstart.SStartPropertiesXul = new function () {

	var self = this
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

	this.setremoveBackgroundImage = function () {
		if (Dom.get("SetRemove").label == this.SetStr) {
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
			Dom.get("SetRemove").label = this.RemoveStr;
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
		Dom.get("SetRemove").label = this.SetStr;
	}
			
	this.toggleBackgroundStyle = function () {
		Dom.removeClass(this.body, 'background-style-1');
		Dom.removeClass(this.body, 'background-style-2');
		Dom.addClass(this.body, 'background-style-' + Dom.get("bgStyle").value);
	}

	this.updatePageBgColor = function () {
		this.body.style.backgroundColor = Dom.get("bgColor").value;
		Dom.get("bgColorBtn").style["background"] = Dom.get("bgColor").value;
	}

	this.cpickPageBg = function () {
		var title = Dom.get("labelPage").label + ", " + Dom.get("labelBgColor").value;
		var param = { doc: document, tbox: "bgColor", element: self.body, attr: "backgroundColor", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.updateHeaderTColor = function () {
		this.sSheet.cssRules[11].style.color = Dom.get("titleColor").value;
		Dom.get("titleColorBtn").style["background"] = Dom.get("titleColor").value;
	}

	this.cpickHeaderT = function () {
		var title = Dom.get("labelHeader").label + ", " + Dom.get("labelTitleColor").value;
		var param = { doc: document, tbox: "titleColor", element: self.sSheet.cssRules[11], attr: "color", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.updateHeaderBgColor = function () {
		this.sSheet.cssRules[6].style.background = Dom.get("headerColor").value;
		this.sSheet.cssRules[4].style.border = "1px solid " + Dom.get("headerColor").value;
		Dom.get("headerColorBtn").style["background"] = Dom.get("headerColor").value;
	}

	this.cpickHeaderBg = function () {
		var title = Dom.get("labelHeader").label + ", " + Dom.get("labelHeaderColor").value;
		var param = { doc: document, tbox: "headerColor", element: self.sSheet.cssRules[6], attr: "background", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		this.SetStr = SStart.translate("imageSet");
		this.RemoveStr = SStart.translate("imageRemove");
		this.pageId = window.arguments[0].pageId;
		this.body = window.arguments[0].body;
		this.doc = window.arguments[0].doc;
		this.sSheet = window.arguments[0].sSheet;
		Dom.get("bgColor").value = properties.background || "#FFFFFF";
		var bgColorBtn = Dom.get("bgColorBtn");
		bgColorBtn.style["background"] = properties.background || "#FFFFFF";
		bgColorBtn.addEventListener('click', this.cpickPageBg, true);
		Dom.get("titleColor").value = properties.titleColor || "#000000";
		var titleColorBtn = Dom.get("titleColorBtn");
		titleColorBtn.style["background"] = properties.titleColor || "#000000";
		titleColorBtn.addEventListener('click', this.cpickHeaderT, true);
		Dom.get("headerColor").value = properties.headerColor || "#E0E0E0";
		var headerColorBtn = Dom.get("headerColorBtn");
		headerColorBtn.style["background"] = properties.headerColor || "#E0E0E0";
		headerColorBtn.addEventListener('click', this.cpickHeaderBg, true);
		this.backgroundImage = properties.backgroundImage || "0";
		Dom.get("bgStyle").value = properties.backgroundStyle || 1;
		if (this.backgroundImage == "1") {
			Dom.get("SetRemove").label = this.RemoveStr;
		} else {
			Dom.get("SetRemove").label = this.SetStr;
		}
		if (this.pageId > 0) {
			Dom.get("useMainBgImage").checked = properties.useMainBgImage != "0";
			this.toggleSelectBgImage(false);
		} else {
			Dom.get("hboxMainBgImage").hidden = true;
		}
	}

	this.onAccept = function () {
		if (this.cpicker) {
			this.cpicker.close();
		}
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
		if (this.cpicker) {
			this.cpicker.close();
		}
		this.body.style.backgroundColor = window.arguments[0].properties.background || "#FFFFFF";
		this.sSheet.cssRules[11].style.color = window.arguments[0].properties.titleColor || "#000000";
		this.sSheet.cssRules[6].style.background = window.arguments[0].properties.headerColor || "#E0E0E0";
		this.sSheet.cssRules[4].style.border = "1px solid " + (window.arguments[0].properties.headerColor || "#E0E0E0");
		window.arguments[0].properties = null;
	}

}
