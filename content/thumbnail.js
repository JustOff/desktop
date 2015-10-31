justoff.sstart.Thumbnail = function () {

	var Thumbnail = justoff.sstart.Thumbnail
	var Prefs = justoff.sstart.Prefs
	var Widget = justoff.sstart.Widget
	var SStart = justoff.sstart.SStart

	Components.utils.import("chrome://sstart/content/cache.js");
	Components.utils.import("chrome://sstart/content/utils.js");
	Components.utils.import("chrome://sstart/content/file.js");
	Components.utils.import("chrome://sstart/content/dom.js");
	Components.utils.import("chrome://sstart/content/url.js");

	var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
	var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

	const TIMEOUT_LOAD = 30 * 1000;
	const TIMEOUT_RENDER = 0.5 * 1000;
	const HEADER_HEIGHT = 20;

	var loading;

	this.setProperties = function (properties) {
		Thumbnail.prototype.setProperties.call(this, properties);

		if (!this.properties.width) {
			this.properties.width = Prefs.getInt("thumbnail.width");
			this.properties.height = Prefs.getInt("thumbnail.height");
		}
		if (this.properties.isFolder) {
			this.properties.url = "chrome://sstart/content/sstart.html?folder=" + this.properties.id;
		}
	}

	var getImageFile = function () {
		return File.getDataFile(this.properties.id);
	}

	var getImageURL = function () {
		if (this.properties.customImage)
			if (SStart.isURI(this.properties.customImage)) {
				return this.properties.customImage;
			} else {
				return File.getDataFileURL(this.properties.customImage);
			}
		else
			return File.getFileURL(getImageFile.call(this));
	}

	this.createView = function () {
		return document.getElementById("thumbnail").cloneNode(true);
	}

	this.updateView = function () {
		Thumbnail.prototype.updateView.call(this);

		var anchor = Dom.child(this.view, "a");
		this.properties.url ? anchor.href = this.properties.url : anchor.removeAttribute("href");

		var img = Dom.child(this.view, "img");
		img.src = getImageURL.call(this);
		img.style.display = loading ? "none" : "block";

		var throbber = Dom.child(this.view, "throbber");
		throbber.style.display = loading ? "block" : "none";

		if (this.properties.customImage) {
			var thumbnail = Dom.child(this.view, "thumbnail");
			if (!Dom.child(thumbnail, "z0")) {
				var img0 = document.createElement("img");
				img0.className = "z0";
				img0.src = "chrome://sstart/skin/0.png";
				thumbnail.appendChild(img0);
			}
		}
	}

	this.renderView = function () {
		Thumbnail.prototype.renderView.call(this);

		this.view.style.width = this.properties.width;
		this.view.style.height = this.properties.height;

		if (this.properties.url == undefined) {
			this.openProperties();
		}

		if (!this.properties.customImage && !getImageFile.call(this).exists()) this.refresh();
		//else this.updateView();}

		var self = this;

		this.view.addEventListener("drop", function () {
			if (Prefs.getBool("autoUpdSize")) {
				Prefs.setInt("thumbnail.width", self.properties.width);
				Prefs.setInt("thumbnail.height", self.properties.height);
			}
		}, false);

		// This code disables Tab Mix Plus "Force new tab" option. Magic.
		var anchor = Dom.child(this.view, "a");
		anchor.addEventListener("click", function (e) {
			if (e.button == 0 && !e.ctrlKey && !e.metaKey) {
				e.stopPropagation();
				return false;
			}
		}, false);

		return this.view;
	}

	this.remove = function () {
		if (Thumbnail.prototype.remove.call(this)) {
			try {
				getImageFile.call(this).remove(false);
			}
			catch (e) {
			}
		}
	}

	this.refresh = function () {
		if (this.properties.customImage) {
			URL.removeFromCache(getImageURL.call(this));
			this.updateView();
		} else {
			loading = true;
			refreshImage.call(this);
			this.updateView();
		}
	}

	this.irefresh = function () {
		if (!this.properties.isFolder) {
			var self = this;
			getSiteFavicon.call(self, self.properties.url, Dom.child(self.view, "icon"));
		}
	}

	this.openProperties = function () {
		var param = { properties:Utils.clone(this.properties), view: this.view };
		openDialog("thumbprops.xul", "properties", SStart.getDialogFeatures(300, 230), param);
		if (param.properties) {
			var refreshNeeded = param.properties.url != this.properties.url ||
				param.properties.customImage != this.properties.customImage ||
				param.properties.background != this.properties.background ||
				param.properties.width != this.properties.width ||
				param.properties.height != this.properties.height;
			this.properties = param.properties;
			this.save();

			refreshNeeded ? this.refresh() : this.updateView();
		}
	}

	function refreshImage() {
		var self = this;
		if (!this.properties.isFolder) {
			getSiteFavicon.call(self, self.properties.url);
		}
		loadURI(this.properties.url || "about:blank", this.properties.width, this.properties.height - HEADER_HEIGHT, function (iframe) {
			if (!self.properties.title) {
				var doc = iframe.contentDocument;
				self.properties.title = doc.title;
				self.save.call(self);
			}
			saveImage.call(self, iframe);
		});
	}

	function getSiteFavicon(siteURI, icon) {
		var splitURI = siteURI.split(/\/+/g);
		if (splitURI[0] && splitURI[1] && splitURI[0] in {"http":1,"https":1}) {
			var faviconURI = splitURI[0] + "//" + splitURI[1] + "/favicon.ico";
		} else {
			return;
		}
		var xhr = new XMLHttpRequest();
		xhr.open("GET", siteURI, true);
		xhr.responseType = "document";	  
		xhr.onload = xhr.onerror = function() {
			var doc = xhr.responseXML;
			if ( doc !== null ) {
				var links = doc.getElementsByTagName("link");
				[...links].forEach(
					function(link) {
						if (/(?:^|\s)icon(?:\s|$)/.test(link.rel.toLowerCase()))
							faviconURI = link.href;
					}
				);
			}
			var self = this;				
			preloadFavicon.call(self, faviconURI, siteURI, icon ? icon : null); 
		}
		xhr.send();
	};   
	
	function preloadFavicon(faviconURI, siteURI, icon) {
		var iconURI = ios.newURI(faviconURI, null, null);
		var bookmarkURI = ios.newURI(siteURI, null, null);
		if (icon) {
			fis.setAndFetchFaviconForPage(bookmarkURI, iconURI, true, fis.FAVICON_LOAD_NON_PRIVATE, function () {
				icon.style.backgroundImage = "url(moz-anno:favicon:" + iconURI.spec + ")";
				Cache.clearCache();
			});
		} else {
			fis.setAndFetchFaviconForPage(bookmarkURI, iconURI, true, fis.FAVICON_LOAD_NON_PRIVATE);
		}
   };
	
	function saveImage(iframe) {
		var self = this;
		setTimeout(function () {
				var imageUri = createImage(iframe, self.properties.width, self.properties.height - HEADER_HEIGHT);
				Dom.remove(iframe);
				File.writeFileAsync(getImageFile.call(self), imageUri, function () {
					loading = false;
					URL.removeFromCache(getImageURL.call(self));
					self.updateView.call(self);
					Cache.clearCache();
				});
			},
			TIMEOUT_RENDER);
	}

	function createFrame(aspect, url) {
		var browserWindow = Utils.getBrowserWindow();
		var doc = browserWindow.document;

		var iframe = doc.createElement("browser");

		if (url.slice(0,16) == "chrome://sstart/") {
			iframe.width = doc.documentElement.clientWidth;
		} else if (aspect < 1) {
			iframe.width = Math.min(1024, doc.documentElement.clientWidth);
		} else {
			iframe.width = Math.min(600, Math.round(doc.documentElement.clientWidth / 2));
		}
		iframe.height = Math.round(iframe.width * aspect);
		
		iframe.setAttribute("type", "content-targetable");
		iframe.style.overflow = "hidden";
		doc.getElementById("sstart-hidden-box").appendChild(iframe);
		return iframe;
	}

	function loadURI(url, width, height, onReady) {
		function onFrameTimeout() {
			iframe.removeEventListener("load", onFrameLoad, true);
			clearTimeout(loadTimeout);
			onReady(iframe);
		}
		function onFrameLoad(event) {
			if (event.originalTarget instanceof HTMLDocument) {
				var win = event.originalTarget.defaultView;
				if (win.frameElement) return;
			}
			onFrameTimeout(event);
		}

		var iframe = createFrame(height / width, url);
		iframe.addEventListener("load", onFrameLoad, true);
		var loadTimeout = setTimeout(onFrameTimeout, TIMEOUT_LOAD);
		iframe.setAttribute("src", url);
	}

	function createImage(iframe, imageWidth, imageHeight) {
		var ifw = iframe.contentDocument.documentElement.offsetWidth || iframe.width;
		var ifh = Math.round(ifw / imageWidth * imageHeight);
		var canvas = document.createElement("canvas");
		var context = canvas.getContext("2d");
		canvas.width = imageWidth;
		canvas.height = imageHeight;
		context.clearRect(0, 0, canvas.width, canvas.height);
		var scale = canvas.width / ifw;
		var oc = document.createElement('canvas');
		var octx = oc.getContext('2d');
		oc.width = ifw;
		oc.height = ifh;
		octx.drawWindow(iframe.contentWindow, 0, 0, ifw, ifh, "white");
		if (scale < 0.6) {
			octx.drawImage(oc, 0, 0, ifw * 0.5, ifh * 0.5);
			if (scale < 0.25) {
				octx.drawImage(oc, 0, 0, ifw * 0.5, ifh * 0.5, 0, 0, ifw * 0.25, ifh * 0.25);
				context.drawImage(oc, 0, 0, ifw * 0.25, ifh * 0.25, 0, 0, canvas.width, canvas.height);
			} else {
				context.drawImage(oc, 0, 0, ifw * 0.5, ifh * 0.5, 0, 0, canvas.width, canvas.height);
			}
			sharpenImage(context, canvas.width, canvas.height, 0.1);
		} else {
			scale = 0.5 * scale + 0.5;
			octx.drawImage(oc, 0, 0, ifw * scale, ifh * scale);
			context.drawImage(oc, 0, 0, ifw * scale, ifh * scale, 0, 0, canvas.width, canvas.height);
		}
		return canvas.toDataURL("image/png");
	}

	function sharpenImage(ctx, w, h, mix) {
		var weights = [0, -1, 0, -1, 5, -1, 0, -1, 0],
			side = Math.round(Math.sqrt(weights.length)),
			half = Math.floor(side * 0.5),
			dstData = ctx.createImageData(w, h),
			dstBuff = dstData.data,
			srcBuff = ctx.getImageData(0, 0, w, h).data,
			y = h, x, sy, sx, dstOff, r, g, b, a, cy, cx, scy, scx, srcOff, wt;
		while (y--) {
			x = w;
			while (x--) {
				sy = y; sx = x; dstOff = (y * w + x) * 4; r = 0; g = 0; b = 0; a = 0;
				for (cy = 0; cy < side; cy++) {
					for (cx = 0; cx < side; cx++) {
						scy = sy + cy - half;
						scx = sx + cx - half;
						if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
							srcOff = (scy * w + scx) * 4;
							wt = weights[cy * side + cx];
							r += srcBuff[srcOff] * wt;
							g += srcBuff[srcOff + 1] * wt;
							b += srcBuff[srcOff + 2] * wt;
							a += srcBuff[srcOff + 3] * wt;
						}
					}
				}
				dstBuff[dstOff] = r * mix + srcBuff[dstOff] * (1 - mix);
				dstBuff[dstOff + 1] = g * mix + srcBuff[dstOff + 1] * (1 - mix);
				dstBuff[dstOff + 2] = b * mix + srcBuff[dstOff + 2] * (1 - mix)
				dstBuff[dstOff + 3] = srcBuff[dstOff + 3];
			}
		}
		ctx.putImageData(dstData, 0, 0);
	}
}

justoff.sstart.Thumbnail.prototype = new justoff.sstart.Widget();
