justoff.sstart.SStartPropertiesXul = new function () {

	var self = this
	var SStart = justoff.sstart.SStart
	var Prefs = justoff.sstart.Prefs

	Components.utils.import("chrome://sstart/content/file.js");
	Components.utils.import("chrome://sstart/content/dom.js");
	Components.utils.import("chrome://sstart/content/utils.js");
	Components.utils.import("chrome://sstart/content/url.js");
			
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
		if (document.getElementById("useMainBgImage").checked) {
			document.getElementById("BackgroundImage").hidden = true;
			document.getElementById("backgroundStyle").hidden = true;
			if (repaint) {
				Dom.removeClass(this.body, 'background-style-1');
				Dom.removeClass(this.body, 'background-style-2');
				if (SStart.isMainBgImage()) {
					this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
					Dom.addClass(this.body, 'background-style-' + Prefs.getInt('backgroundStyle'));
				} else {
					if (this.backgroundImage == "1") {
						this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + this.pageId + "t") + ")";
						Dom.addClass(this.body, 'background-style-' + document.getElementById("bgStyle").value);
					} else {
						this.body.style.backgroundImage = "";
					}
				}
			}
		} else {
			document.getElementById("BackgroundImage").hidden = false;
			document.getElementById("backgroundStyle").hidden = false;
			if (repaint) {
				Dom.removeClass(this.body, 'background-style-1');
				Dom.removeClass(this.body, 'background-style-2');
				if (this.backgroundImage == "1") {
					this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + this.pageId + "t") + ")";
					Dom.addClass(this.body, 'background-style-' + document.getElementById("bgStyle").value);
				} else {
					this.body.style.backgroundImage = "";
				}
			}
		}
	}

	this.setremoveBackgroundImage = function () {
		if (document.getElementById("SetRemove").label == this.SetStr) {
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
			Dom.addClass(this.body, 'background-style-' + document.getElementById("bgStyle").value);
			document.getElementById("SetRemove").label = this.RemoveStr;
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
		if (this.pageId > 0 && document.getElementById("useMainBgImage").checked && SStart.isMainBgImage()) {
			this.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
			Dom.addClass(document.body, 'background-style-' + Prefs.getInt('backgroundStyle'));
		} else {
			this.body.style.backgroundImage = "";
		}
		document.getElementById("SetRemove").label = this.SetStr;
	}
			
	this.toggleBackgroundStyle = function () {
		Dom.removeClass(this.body, 'background-style-1');
		Dom.removeClass(this.body, 'background-style-2');
		Dom.addClass(this.body, 'background-style-' + document.getElementById("bgStyle").value);
	}

	this.updatePageBgColor = function () {
		this.body.style.backgroundColor = document.getElementById("bgColor").value;
		document.getElementById("bgColorBtn").style.backgroundColor = document.getElementById("bgColor").value;
	}

	this.cpickPageBg = function () {
		var title = document.getElementById("labelPage").label + ", " + document.getElementById("labelBgColor").value;
		var param = { doc: document, tbox: "bgColor", element: self.body, attr: "backgroundColor", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.updateHeaderTColor = function () {
		this.sSheet.cssRules[11].style.color = document.getElementById("titleColor").value;
		document.getElementById("titleColorBtn").style.backgroundColor = document.getElementById("titleColor").value;
	}

	this.cpickHeaderT = function () {
		var title = document.getElementById("labelHeader").label + ", " + document.getElementById("labelTitleColor").value;
		var param = { doc: document, tbox: "titleColor", element: self.sSheet.cssRules[11], attr: "color", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.updateHeaderBgColor = function () {
		this.sSheet.cssRules[6].style.backgroundColor = document.getElementById("headerColor").value;
		this.sSheet.cssRules[4].style.border = "1px solid " + document.getElementById("headerColor").value;
		document.getElementById("headerColorBtn").style.backgroundColor = document.getElementById("headerColor").value;
	}

	this.cpickHeaderBg = function () {
		var title = document.getElementById("labelHeader").label + ", " + document.getElementById("labelHeaderColor").value;
		var param = { doc: document, tbox: "headerColor", element: self.sSheet.cssRules[6], attr: "backgroundColor", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		this.SetStr = Utils.translate("imageSet");
		this.RemoveStr = Utils.translate("imageRemove");
		this.pageId = window.arguments[0].pageId;
		this.body = window.arguments[0].body;
		this.doc = window.arguments[0].doc;
		this.sSheet = window.arguments[0].sSheet;
		document.getElementById("bgColor").value = properties.background || "#FFFFFF";
		var bgColorBtn = document.getElementById("bgColorBtn");
		bgColorBtn.style.backgroundColor = properties.background || "#FFFFFF";
		bgColorBtn.addEventListener('click', this.cpickPageBg, true);
		document.getElementById("titleColor").value = properties.titleColor || "#000000";
		var titleColorBtn = document.getElementById("titleColorBtn");
		titleColorBtn.style.backgroundColor = properties.titleColor || "#000000";
		titleColorBtn.addEventListener('click', this.cpickHeaderT, true);
		document.getElementById("headerColor").value = properties.headerColor || "#E0E0E0";
		var headerColorBtn = document.getElementById("headerColorBtn");
		headerColorBtn.style.backgroundColor = properties.headerColor || "#E0E0E0";
		headerColorBtn.addEventListener('click', this.cpickHeaderBg, true);
		this.backgroundImage = properties.backgroundImage || "0";
		document.getElementById("bgStyle").value = properties.backgroundStyle || 1;
		if (this.backgroundImage == "1") {
			document.getElementById("SetRemove").label = this.RemoveStr;
		} else {
			document.getElementById("SetRemove").label = this.SetStr;
		}
		if (this.pageId > 0) {
			document.getElementById("useMainBgImage").checked = properties.useMainBgImage != "0";
			this.toggleSelectBgImage(false);
		} else {
			document.getElementById("hboxMainBgImage").hidden = true;
		}
	}

	this.onAccept = function () {
		if (this.cpicker) {
			this.cpicker.close();
		}
		var properties = window.arguments[0].properties;
		properties.background = (document.getElementById("bgColor").value == "") ? "#FFFFFF" : document.getElementById("bgColor").value;
		properties.titleColor = (document.getElementById("titleColor").value == "") ? "#000000" : document.getElementById("titleColor").value;
		properties.headerColor = (document.getElementById("headerColor").value == "") ? "#E0E0E0" : document.getElementById("headerColor").value;
		properties.backgroundImage = this.backgroundImage;
		properties.backgroundStyle = document.getElementById("bgStyle").value;
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
			if (this.pageId > 0 && document.getElementById("useMainBgImage").checked && SStart.isMainBgImage()) {
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
			properties.useMainBgImage = document.getElementById("useMainBgImage").checked ? "1" : "0";
		}
	}

	this.onCancel = function () {
		if (this.cpicker) {
			this.cpicker.close();
		}
		this.body.style.backgroundColor = window.arguments[0].properties.background || "#FFFFFF";
		this.sSheet.cssRules[11].style.color = window.arguments[0].properties.titleColor || "#000000";
		this.sSheet.cssRules[6].style.backgroundColor = window.arguments[0].properties.headerColor || "#E0E0E0";
		this.sSheet.cssRules[4].style.border = "1px solid " + (window.arguments[0].properties.headerColor || "#E0E0E0");
		window.arguments[0].properties = null;
	}

}
