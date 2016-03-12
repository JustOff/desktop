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

	removeFromCache: function (doc, url) {
		try {
			var cache = Cc["@mozilla.org/image/tools;1"].getService(Ci.imgITools).getImgCacheForDocument(doc);
			if (typeof cache.removeEntry === "function") {
				cache.removeEntry(this.getNsiURL(url));
			} else {
				cache.clearCache(false);
			}
		} catch (e) {}
	}

};
