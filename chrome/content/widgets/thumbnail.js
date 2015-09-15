rtimushev.ffdesktop.Thumbnail = function () {

    var Thumbnail = rtimushev.ffdesktop.Thumbnail
    var Utils = rtimushev.ffdesktop.Utils
    var Prefs = rtimushev.ffdesktop.Prefs
    var File = rtimushev.ffdesktop.File
    var Dom = rtimushev.ffdesktop.Dom
    var Widget = rtimushev.ffdesktop.Widget
    var URL = rtimushev.ffdesktop.URL

    const TIMEOUT_LOAD = 60 * 1000;
    const TIMEOUT_RENDER = 0.5 * 1000;
    var loading;

    this.setProperties = function (properties) {
        Thumbnail.prototype.setProperties.call(this, properties);

        if (!this.properties.width) {
            this.properties.width = Prefs.getInt("thumbnail.width");
            this.properties.height = Prefs.getInt("thumbnail.height");
        }
        if (this.properties.isFolder) {
            this.properties.url = "chrome://desktop/content/desktop.html?folder=" +
                this.properties.id;
        }
    }

    getImageFile = function () {
        return File.getDataFile(this.properties.id);
    }

    getImageURL = function () {
        if (this.properties.customImage)
            return this.properties.customImage
        else
            return File.getFileURL(getImageFile.call(this));
    }

    this.getIconURL = function () {
        return this.properties.isFolder ? "chrome://desktop/skin/folder.png"
            : Thumbnail.prototype.getIconURL.call(this);
    }

    this.createView = function () {
        return Dom.get("thumbnail").cloneNode(true);
    }

    this.updateView = function () {
//		console.log("[4] renderView->updateView");
        Thumbnail.prototype.updateView.call(this);

        var anchor = Dom.child(this.view, "a");
        this.properties.url ? anchor.href = this.properties.url

            : anchor.removeAttribute("href");

        var img = Dom.child(this.view, "img");
        img.src = getImageURL.call(this);
        img.style.display = loading ? "none" : "block";

        var throbber = Dom.child(this.view, "throbber");
        throbber.style.display = loading ? "block" : "none";
    }

    this.renderView = function () {
        Thumbnail.prototype.renderView.call(this);

        this.view.style.width = this.properties.width;
        this.view.style.height = this.properties.height;

        if (this.properties.url == undefined) {
            this.openProperties();
        }

        if (!this.properties.customImage && !getImageFile.call(this).exists()) this.refresh();
        //else {console.log("[3] renderView->updateView");this.updateView();}

        var self = this;

        this.view.addEventListener("drop", function () {
            Prefs.setInt("thumbnail.width", self.properties.width);
            Prefs.setInt("thumbnail.height", self.properties.height);
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
            this.updateView();
            return;
        }
        loading = true;
        refreshImage.call(this);
        this.updateView();
    }

    this.openProperties = function () {
        var param = { properties:Utils.clone(this.properties) };
        var xul = 'widgets/thumbnail/' +
            (this.properties.isFolder ? 'folder' : 'properties') + '.xul';

        openDialog(xul, "properties",
            "chrome,centerscreen,modal,resizable", param);
        if (param.properties) {
            var refreshNeeded = param.properties.url != this.properties.url ||
                param.properties.customImage != this.properties.customImage;
            this.properties = param.properties;
            this.save();

            refreshNeeded ? this.refresh() : this.updateView();
        }
    }

    function refreshImage() {
        var self = this;
		getSiteFavicon.call(self, self.properties.url);
        loadURI(this.properties.url || "about:blank", this.properties.width, this.properties.height - Widget.HEADER_HEIGHT, function (iframe) {
            if (!self.properties.title) {
                var doc = iframe.contentDocument;
                self.properties.title = doc.title;
                self.save.call(self);
            }
            if (self.properties.customImage) {
                Dom.remove(iframe);
                refreshCustomImage.call(self);
            }
            else saveImage.call(self, iframe);
        });
    }

	function getSiteFavicon(siteURI) {
		var hostURI = "http://" + siteURI.split(/\/+/g)[1] + "/";
		var faviconURI = hostURI + "favicon.ico";
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
			preloadFavicon.call(self, faviconURI, siteURI); 
		}
		xhr.send();
	};   
	
	function preloadFavicon(faviconURI, siteURI) {
		var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var iconURI = ios.newURI(faviconURI, null, null);
		var bookmarkURI = ios.newURI(siteURI, null, null);
		var fis = Components.classes["@mozilla.org/browser/favicon-service;1"].getService(Components.interfaces.nsIFaviconService);
		fis.setAndFetchFaviconForPage(bookmarkURI, iconURI, true, fis.FAVICON_LOAD_NON_PRIVATE);
   };
	
    function saveImage(iframe) {
        var self = this;
        setTimeout(function () {
                var image = createImage(iframe, self.properties.width, self.properties.height - Widget.HEADER_HEIGHT);
                File.writeFile(getImageFile.call(self), image);
                Dom.remove(iframe);

                loading = false;

                URL.removeFromCache(getImageURL.call(self));
                self.updateView.call(self);
            },
            TIMEOUT_RENDER);
    }

    function createFrame(aspect) {
        var browserWindow = Utils.getBrowserWindow();
        var doc = browserWindow.document;

        var iframe = doc.createElement("browser");
		if (aspect < 1) {
			iframe.width = 1024;
		} else {
			iframe.width = 600;
		}
		iframe.height = Math.round(iframe.width * aspect);
		
        iframe.setAttribute("type", "content-targetable");
        iframe.style.overflow = "hidden";
        doc.getElementById("hidden-box").appendChild(iframe);
        return iframe;
    }

    function loadURI(url, width, height, onReady) {
        function onFrameLoad() {
            iframe.removeEventListener("load", onFrameLoad, true);
            clearTimeout(loadTimeout);
            onReady(iframe);
        }

        var iframe = createFrame(height / width);
        iframe.addEventListener("load", function (event) {
            if (event.originalTarget instanceof HTMLDocument) {
                var win = event.originalTarget.defaultView;
                if (win.frameElement) return;
            }
            onFrameLoad(event);
        }, true);
        var loadTimeout = setTimeout(onFrameLoad, TIMEOUT_LOAD);
        iframe.setAttribute("src", url);
    }

    function createImage(iframe, imageWidth, imageHeight) {
        var canvas = document.createElement("canvas");
        canvas.width = imageWidth;
        canvas.height = imageHeight;

        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        var width = iframe.width;
        var height = iframe.height;
        context.scale(canvas.width / width, canvas.height / height);
        context.drawWindow(iframe.contentWindow, 0, 0, width, height, "white");

//		blurImage(context, width, height);
		
        var dataURL = canvas.toDataURL("image/png");
        return atob(dataURL.replace(/^data:image\/png;base64,/, ""));
    }

	function blurImage(context, width, height) {
		var pixels = context.getImageData(0, 0, width, height);

		var weights = [ 0.03, 0.03, 0.03,
						0.03, 0.76, 0.03,
						0.03, 0.03, 0.03 ];
/*						
		var weights = [ 1/9, 1/9, 1/9,
						1/9, 1/9, 1/9,
						1/9, 1/9, 1/9 ];
*/
		var opaque = 0;

		var side = Math.round(Math.sqrt(weights.length));
		var halfSide = Math.floor(side/2);
		var src = pixels.data;
		var sw = pixels.width;
		var sh = pixels.height;
		// pad output by the convolution matrix
		var w = sw;
		var h = sh;
		
		var tmpCanvas = document.createElement('canvas');
		var tmpCtx = tmpCanvas.getContext('2d');
		var output = tmpCtx.createImageData(w,h);
		var dst = output.data;
		var alphaFac = opaque ? 1 : 0;
	
		for (var y=0; y<h; y++) {
			for (var x=0; x<w; x++) {
				var sy = y;
				var sx = x;
				var dstOff = (y*w+x)*4;
				// calculate the weighed sum of the source image pixels that
				// fall under the convolution matrix
				var r=0, g=0, b=0, a=0;
				for (var cy=0; cy<side; cy++) {
					for (var cx=0; cx<side; cx++) {
						var scy = sy + cy - halfSide;
						var scx = sx + cx - halfSide;
						if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
							var srcOff = (scy*sw+scx)*4;
							var wt = weights[cy*side+cx];
							r += src[srcOff] * wt;
							g += src[srcOff+1] * wt;
							b += src[srcOff+2] * wt;
							a += src[srcOff+3] * wt;
						}
					}
				}
				dst[dstOff] = r;
				dst[dstOff+1] = g;
				dst[dstOff+2] = b;
				dst[dstOff+3] = a + alphaFac*(255-a);
			}
		}	
	
		context.putImageData(output, 0, 0);
//		document.removeChild(tmpCanvas);
	}
	
	function grayscaleImage(context, width, height) {
		var imageData = context.getImageData(0, 0, width, height);
		var data = imageData.data;
		
	    for (var i = 0; i < data.length; i += 4) {
			var avg = (data[i] + data[i +1] + data[i +2]) / 3;
			data[i]     = avg; // red
			data[i + 1] = avg; // green
			data[i + 2] = avg; // blue
		}
		
		context.putImageData(imageData, 0, 0);
	}
}

rtimushev.ffdesktop.Thumbnail.prototype = new rtimushev.ffdesktop.Widget();
