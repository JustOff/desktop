var EXPORTED_SYMBOLS = ["URL"];

var URL = {

	getNsiURL: function (url) {
		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		return ioService.newURI(url ? url : "about:blank", null, null);
	},

	getScheme: function (url) {
		if (url) {
			return this.getNsiURL(url).scheme;
		}
	},

	readURL: function (url) {
		var ioService = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		var channel = ioService.newChannel(url, null, null);
		var stream = channel.open();

		var binary = Components.classes["@mozilla.org/binaryinputstream;1"]
			.createInstance(Components.interfaces.nsIBinaryInputStream);
		binary.setInputStream(stream);
		var data = binary.readBytes(binary.available());
		binary.close();
		stream.close();

		return data;
	},

	removeFromCache: function (url) {
		if (!url) return;
		try {
			var cacheService = Components.classes["@mozilla.org/image/tools;1"]
				.getService(Components.interfaces.imgITools).getImgCacheForDocument(null);
			cacheService.removeEntry(this.getNsiURL(url));
		} catch (e) {}
	}

};
