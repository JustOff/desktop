justoff.sstart.ThumbnailPropertiesXul = new function () {

	var File = justoff.sstart.File
	var Dom = justoff.sstart.Dom
	var URL = justoff.sstart.URL

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		this.isFolder = properties.isFolder;
		Dom.get("thumbnail-properties").setAttribute("title", Dom.get("thumbnail-properties").getAttribute("title") + ": " + properties.title);
		if (this.isFolder) {
			Dom.get("name").value = properties.title || "";
			Dom.get("urlrow").hidden = true;
		} else {
			Dom.get("url").value = properties.url || "";
			Dom.get("namerow").hidden = true;
		}
		Dom.get("customImage").value = properties.customImage || "";
		Dom.get("bgColor").value = properties.background || "#FFFFFF";
		Dom.get("width").value = properties.width || "";
		Dom.get("height").value = properties.height || "";

		if (properties.isFolder) {
			Dom.get("url").readOnly = true;
			Dom.get("url").removeAttribute("enablehistory");
			Dom.get("browseFile").disabled = true;
		}
	}

	this.onAccept = function () {
		var properties = window.arguments[0].properties;
		if (this.isFolder) {
			properties.title = Dom.get("name").value;
		} else {
			var url = Dom.get("url").value;
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
		properties.customImage = Dom.get("customImage").value;
		properties.background = (Dom.get("bgColor").value == "") ? "#FFFFFF" : Dom.get("bgColor").value;
		properties.width = Dom.get("width").value;
		properties.height = Dom.get("height").value;
	}

	this.onCancel = function () {
		window.arguments[0].properties = null;
	}

	this.browseFile = function () {
		var file = File.chooseFile("open");
		if (file) Dom.get("url").value = File.getFileURL(file);
	}

	this.browseCustomImage = function () {
		var file = File.chooseFile("open", ["images"]);
		if (file) Dom.get("customImage").value = File.getFileURL(file);
	}

}
