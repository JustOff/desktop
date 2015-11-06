var EXPORTED_SYMBOLS = ["File"];

var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

Cu.import("chrome://sstart/content/utils.js");

Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/FileUtils.jsm");

var File = {
	
	getDataDirectory: function () {
		var dir = Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
		dir.append("sstart");
		if (!dir.exists()) {
			dir.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt("0777", 8));
		}
		return dir;
	},

	getDataFile: function (id) {
		var f = this.getDataDirectory();
		f.append(id + ".png");
		return f;
	},

	delDataFile: function (id) {
		var f = this.getDataDirectory();
		f.append(id + ".png");
		try {
			f.remove(false);
		} catch(e) {};
	},

	getDataFileURL: function (file) {
		var f = this.getDataDirectory();
		f.append(file);
		return this.getFileURL(f);
	},

	writeFileAsync: function (file, dataUri, callback) {
		NetUtil.asyncFetch(dataUri, function (istream, status) {
			if (!istream || !Components.isSuccessCode(status)) {
				Cu.reportError("Input stream error!");
				return;
			}
			try {
				var ostream = FileUtils.openAtomicFileOutputStream(file);
			} catch (e) {
				var ostream = FileUtils.openSafeFileOutputStream(file);
			}
			NetUtil.asyncCopy(istream, ostream, function (status) {
				if (!Components.isSuccessCode(status)) {
					Cu.reportError("File write error!");
					return;
				}
				callback();
			});
		});
	},

	chooseFile: function (mode, filters, name) {
		var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
		fp.init(Utils.getBrowserWindow(), null, mode == "save" ? fp.modeSave :
			mode == "folder" ? fp.modeGetFolder : fp.modeOpen);
		for (var i in filters) {
			switch (filters[i]) {
				case "images":
					fp.appendFilters(fp.filterImages);
					break;
				case "html":
					fp.appendFilters(fp.filterHTML);
					break;
				case "text":
					fp.appendFilters(fp.filterText);
					break;
			}
		}
		fp.appendFilters(fp.filterAll);
		fp.defaultString = name;

		var result = fp.show();
		if (result == fp.returnOK || result == fp.returnReplace) {
			return fp.file;
		}
	},

	getNsiFile: function (file) {
		if (file instanceof Ci.nsIFile) return file;
		else {
			var nsiFile = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsILocalFile);
			nsiFile.initWithPath(file);
			return nsiFile;
		}
	},

	getFileURL: function (file) {
		var nsiFile = this.getNsiFile(file);
		var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		return ios.newFileURI(nsiFile).spec;
	}

};
