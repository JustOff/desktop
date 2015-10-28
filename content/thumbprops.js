justoff.sstart.ThumbnailPropertiesXul = new function () {

	var self = this
	var SStart = justoff.sstart.SStart

	Components.utils.import("chrome://sstart/content/file.js");
	Components.utils.import("chrome://sstart/content/url.js");

	this.updateBgColor = function () {
		var bgColor = document.getElementById("bgColor").value == "#" ? "" : document.getElementById("bgColor").value;
		if (this.view) {
			this.view.style.backgroundColor = bgColor;
		}
		document.getElementById("bgColorBtn").style.backgroundColor = bgColor;
	}

	this.cpickBgColor = function () {
		var title = document.getElementById("labelBgColor").value;
		var param = { doc: document, tbox: "bgColor", element: self.view, attr: "backgroundColor", title: title };
		self.cpicker = openDialog("chrome://sstart/content/colorpicker.xul", "sstart-colorpicker-window",
			SStart.getDialogFeatures(300, 300, window.screenX + window.outerWidth, window.screenY, false), param);
	}

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		this.view = window.arguments[0].view || null;
		this.isFolder = properties.isFolder;
		document.getElementById("thumbnail-properties").setAttribute("title", document.getElementById("thumbnail-properties").getAttribute("title") + ": " + properties.title);
		if (this.isFolder) {
			document.getElementById("name").value = properties.title || "";
			document.getElementById("urlrow").hidden = true;
			document.getElementById("name").focus();
		} else {
			document.getElementById("url").value = properties.url || "";
			document.getElementById("namerow").hidden = true;
			document.getElementById("url").focus();
		}
		document.getElementById("bgColor").value = properties.background || "#";
		var bgColorBtn = document.getElementById("bgColorBtn");
		bgColorBtn.style.backgroundColor = properties.background || "";
		bgColorBtn.addEventListener('click', this.cpickBgColor, true);
		document.getElementById("width").value = properties.width || "";
		document.getElementById("height").value = properties.height || "";
		if (properties.customImage && SStart.isURI(properties.customImage)) {
			document.getElementById("customImage").value = properties.customImage || "";
		} else {
			if (properties.customImage) {
				document.getElementById("customImage").value = properties.customImage.slice(9);
				this.origImage = properties.customImage;
			} else {
				document.getElementById("customImage").value = "";
			}
		}
	}

	this.onAccept = function () {
		if (this.cpicker) {
			this.cpicker.close();
		}
		var properties = window.arguments[0].properties;
		if (this.isFolder) {
			properties.title = document.getElementById("name").value;
		} else {
			var url = document.getElementById("url").value.trim();
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
		properties.background = (document.getElementById("bgColor").value == "#") ? "" : document.getElementById("bgColor").value;
		properties.width = document.getElementById("width").value;
		properties.height = document.getElementById("height").value;
		if (document.getElementById("customImage").value == "" || SStart.isURI(document.getElementById("customImage").value)) {
			properties.customImage = document.getElementById("customImage").value.trim();
		} else {
			var dir = File.getDataDirectory();
			try {
				dir.append("tmp." + this.hashWord + "." + document.getElementById("customImage").value);
				if (dir.exists()) {
					dir.moveTo(null, this.hashWord + "." + document.getElementById("customImage").value);
					properties.customImage = this.hashWord + "." + document.getElementById("customImage").value;
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
			if (!SStart.isURI(document.getElementById("customImage").value)) {
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
			document.getElementById("customImage").value = file.leafName;
			this.tmpName = file.leafName;
		}
	}

}
