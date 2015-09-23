justoff.sstart.ThumbnailFolderXul = new function () {

	var File = justoff.sstart.File
	var Dom = justoff.sstart.Dom

	this.initialize = function () {
		var properties = window.arguments[0].properties;
		Dom.get("customImage").value = properties.customImage || "";
		Dom.get("bgColor").value = properties.background || "#FFFFFF";
		Dom.get("width").value = properties.width || "";
		Dom.get("height").value = properties.height || "";
		Dom.get("name").value = properties.title || "";
	}

	this.onAccept = function () {
		var properties = window.arguments[0].properties;
		properties.customImage = Dom.get("customImage").value;
		properties.background = (Dom.get("bgColor").value == "") ? "#FFFFFF" : Dom.get("bgColor").value;
		properties.width = Dom.get("width").value;
		properties.height = Dom.get("height").value;
		properties.title = Dom.get("name").value;
	}

	this.onCancel = function () {
		window.arguments[0].properties = null;
	}

	this.browseCustomImage = function () {
		var file = File.chooseFile("open", ["images"]);
		if (file) Dom.get("customImage").value = File.getFileURL(file);
	}

}
