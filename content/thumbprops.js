justoff.sstart.ThumbnailPropertiesXul = new function () {

	var self = this
	var File = justoff.sstart.File
	var Dom = justoff.sstart.Dom
	var URL = justoff.sstart.URL
	var SStart = justoff.sstart.SStart

	this.updateBgColor = function () {
		var bgColor = Dom.get("bgColor").value == "#" ? "" : Dom.get("bgColor").value;
		if (this.view) {
			this.view.style.backgroundColor = bgColor;
		}
		Dom.get("bgColorBtn").style.backgroundColor = bgColor;
	}

	this.cpickBgColor = function () {
		var title = Dom.get("labelBgColor").value;
		var param = { doc: document, tbox: "bgColor", element: self.view, attr: "backgroundColor", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		this.view = window.arguments[0].view || null;
		this.isFolder = properties.isFolder;
		Dom.get("thumbnail-properties").setAttribute("title", Dom.get("thumbnail-properties").getAttribute("title") + ": " + properties.title);
		if (this.isFolder) {
			Dom.get("name").value = properties.title || "";
			Dom.get("urlrow").hidden = true;
			Dom.get("name").focus();
		} else {
			Dom.get("url").value = properties.url || "";
			Dom.get("namerow").hidden = true;
			Dom.get("url").focus();
		}
		Dom.get("bgColor").value = properties.background || "#";
		var bgColorBtn = Dom.get("bgColorBtn");
		bgColorBtn.style.backgroundColor = properties.background || "";
		bgColorBtn.addEventListener('click', this.cpickBgColor, true);
		Dom.get("width").value = properties.width || "";
		Dom.get("height").value = properties.height || "";
		if (properties.customImage && SStart.isURI(properties.customImage)) {
			Dom.get("customImage").value = properties.customImage || "";
		} else {
			if (properties.customImage) {
				Dom.get("customImage").value = properties.customImage.slice(9);
				this.origImage = properties.customImage;
			} else {
				Dom.get("customImage").value = "";
			}
		}
	}

	this.onAccept = function () {
		if (this.cpicker) {
			this.cpicker.close();
		}
		var properties = window.arguments[0].properties;
		if (this.isFolder) {
			properties.title = Dom.get("name").value;
		} else {
			var url = Dom.get("url").value.trim();
			if (url != properties.url) properties.title = "";
			if (url) {
				try {
					if (URL.getScheme(url)) {
						properties.url = url;
					}
				} catch (e) {
					properties.url = "http://" + url;
				}
			} else {
				properties.url = "about:blank";
			}
		}
		properties.background = (Dom.get("bgColor").value == "#") ? "" : Dom.get("bgColor").value;
		properties.width = Dom.get("width").value;
		properties.height = Dom.get("height").value;
		if (Dom.get("customImage").value == "" || SStart.isURI(Dom.get("customImage").value)) {
			properties.customImage = Dom.get("customImage").value.trim();
		} else {
			var dir = File.getDataDirectory();
			try {
				dir.append("tmp." + this.hashWord + "." + Dom.get("customImage").value);
				if (dir.exists()) {
					dir.moveTo(null, this.hashWord + "." + Dom.get("customImage").value);
					properties.customImage = this.hashWord + "." + Dom.get("customImage").value;
				}
			} catch (e) {
				return;
			}
		}
		if (this.origImage && this.origImage != properties.customImage) {
			var dir = File.getDataDirectory();
			try {
				dir.append(this.origImage);
				if (dir.exists()) {
					dir.remove(false);
				}
			} catch (e) {}
		}
	}

	this.onCancel = function () {
		if (this.cpicker) {
			this.cpicker.close();
		}
		if (this.view) {
			this.view.style.backgroundColor = window.arguments[0].properties.background || "";
		}
		window.arguments[0].properties = null;
		if (this.tmpName) {
			var dir = File.getDataDirectory();
			try {
				dir.append("tmp." + this.hashWord + "." + this.tmpName);
				if (dir.exists()) {
					dir.remove(false);
				}
			} catch (e) {}
		}
	}

	this.browseCustomImage = function () {
		var file = File.chooseFile("open", ["images"]);
		if (file) {
			if (!SStart.isURI(Dom.get("customImage").value)) {
				var dir = File.getDataDirectory();
				try {
					dir.append("tmp." + this.hashWord + "." + this.tmpName);
					if (dir.exists()) {
						dir.remove(false);
					}
				} catch (e) {}
			}
			this.hashWord = (Math.random().toString(36)+'00000000000000000').slice(2, 10);
			file.copyTo(File.getDataDirectory(), "tmp." + this.hashWord + "." + file.leafName);
			Dom.get("customImage").value = file.leafName;
			this.tmpName = file.leafName;
		}
	}

}