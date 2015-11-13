var EXPORTED_SYMBOLS = ["URL"];

var Cc = Components.classes, Ci = Components.interfaces;

var URL = {

	getNsiURL: function (url) {
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		return ioService.newURI(url ? url : "about:blank", null, null);
	},

	getScheme: function (url) {
		if (url) {
			return this.getNsiURL(url).scheme;
		}
	},

	readURL: function (url) {
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var channel = ioService.newChannel(url, null, null);
		var stream = channel.open();

		var binary = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
		binary.setInputStream(stream);
		var data = binary.readBytes(binary.available());
		binary.close();
		stream.close();

		return data;
	},

	removeFromCache: function (doc, url) {
		try {
			var cache = Cc["@mozilla.org/image/tools;1"].getService(Ci.imgITools).getImgCacheForDocument(doc);
			cache.removeEntry(this.getNsiURL(url));
		} catch (e) {
			try {
				cache.clearCache(false);
			} catch (e) {}
		}
	}

};
