justoff.sstart.SStartOptionsXul = new function () {

	var Prefs = justoff.sstart.Prefs
	
	var Cc = Components.classes, Ci = Components.interfaces, Cu = Components.utils;

	Cu.import("chrome://sstart/content/cache.js");
	Cu.import("chrome://sstart/content/file.js");
	Cu.import("chrome://sstart/content/utils.js");
	Cu.import("chrome://sstart/content/bookmark.js");
			
	var BACKUP_VERSION = "1.0";
	var ROOT_TITLE = "SStart";
	var ROOT_DIR = "sstart";
	var ANNOTATION = "bookmarkProperties/description";
	var pr = {PR_RDONLY: 0x01, PR_WRONLY: 0x02, PR_RDWR: 0x04, PR_CREATE_FILE: 0x08, PR_APPEND: 0x10, PR_TRUNCATE: 0x20};

	Cu.import("resource://gre/modules/NetUtil.jsm");
	Cu.import("resource://gre/modules/FileUtils.jsm");
	
	this.updateNewtabDisable = function () {
		if (document.getElementById("openNewtabOpen").hasAttribute("checked")) {
			document.getElementById("openNewtabOnLockDrag").removeAttribute("disabled");
			document.getElementById("openNewtabAlways").removeAttribute("disabled");
		} else {
			document.getElementById("openNewtabOnLockDrag").setAttribute("disabled", "true");
			document.getElementById("openNewtabAlways").setAttribute("disabled", "true");
		}
	}

	this.exportData = function () {
		var zfile = File.chooseFile("save", ["zip"], "sstart-backup.zip");
		if (zfile) {
			var data = {prefs: {thw: Prefs.getInt("thumbnail.width"), thh: Prefs.getInt("thumbnail.height"),
				gri: Prefs.getInt("gridInterval"), bgs: Prefs.getInt("backgroundStyle"), fcs: Prefs.getString("focus"),
				hdc: Prefs.getBool("hideDecorations"), ont: Prefs.getBool("overrideNewTab"), ohp: Prefs.getBool("overrideHomePage"),
				ntd: Prefs.getBool("newtabOnLockDrag"), bth: Prefs.getBool("bottomHeader"), azm: Prefs.getBool("autoZoom"),
				guo: Prefs.getBool("showGridOnUnlock"), hcm: Prefs.getBool("hideContextMenu"), dst: Prefs.getBool("disableSysThumbs"),
				aus: Prefs.getBool("autoUpdSize"), nto: Prefs.getBool("newtabOpen"), eld: Prefs.getInt("enlargeDialogs")}};
			data["version"] = BACKUP_VERSION;
			var bookmarks = Bookmark.getBookmarks();
			for (var i in bookmarks) {
				if (bookmarks[i].isFolder && bookmarks[i].title == ROOT_TITLE) {
					data["params"] = Bookmark.getAnnotation(bookmarks[i].id, ANNOTATION) || "";
					var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
						.getService(Ci.nsINavBookmarksService);
					var callback = {
						runBatched: function() {
							exportFolder(bookmarks[i].id, data, true);
						}
					}
					bookmarksService.runInBatchMode(callback, null);
					data = Utils.toJSON(data);
					data = md5hash(data) + data;
					var file = File.getDataDirectory();
					file.append("sstart.conf");
					try {
						var ostream = FileUtils.openAtomicFileOutputStream(file);
					} catch (e) {
						var ostream = FileUtils.openSafeFileOutputStream(file);
					}
					var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
						.createInstance(Ci.nsIScriptableUnicodeConverter);
					converter.charset = "UTF-8";
					var istream = converter.convertToInputStream(data);
					NetUtil.asyncCopy(istream, ostream, function(status) {
					  try {
						if (!Components.isSuccessCode(status)) {
							throw Utils.translate("bfileWError");
						}
						var zw = Cc['@mozilla.org/zipwriter;1'].createInstance(Ci.nsIZipWriter);
						zw.open(zfile, pr.PR_RDWR | pr.PR_CREATE_FILE | pr.PR_TRUNCATE);
						var dirArr = [File.getDataDirectory()];
						for (var i=0; i<dirArr.length; i++) {
							var dirEntries = dirArr[i].directoryEntries;
							while (dirEntries.hasMoreElements()) {
								var entry = dirEntries.getNext().QueryInterface(Ci.nsIFile);
								var relPath = entry.path.replace(dirArr[0].path, '');
								var saveInZipAs = relPath.substr(1);
								saveInZipAs = saveInZipAs.replace(/\\/g,'/');
								zw.addEntryFile(saveInZipAs, Ci.nsIZipWriter.COMPRESSION_NONE, entry, false);
							}
						}
						zw.close();
						Utils.alert(Utils.translate("exportOk"));
					  } catch(e) {
						Utils.alert(e);
					  }
						file = File.getDataDirectory();
						file.append("sstart.conf");
						if (file.exists()) {
							file.remove(false);
						}
					});
				}
			}
		}
	}

	function exportFolder(folderId, data, isRoot) {
		var bookmarks = Bookmark.getBookmarks(folderId);
		var item = {};
		for (var i in bookmarks) {
			item[bookmarks[i].id] = {};
			item[bookmarks[i].id]["title"] = bookmarks[i].title;
			item[bookmarks[i].id]["url"] = bookmarks[i].url;
			item[bookmarks[i].id]["params"] = Bookmark.getAnnotation(bookmarks[i].id, ANNOTATION) || "";
			item[bookmarks[i].id]["isFolder"] = bookmarks[i].isFolder;
			if (bookmarks[i].isFolder) {
				exportFolder(bookmarks[i].id, item, false);
			}
			if (isRoot) {
				data["root"] = item;
			} else {
				data[folderId] = Utils.merge(data[folderId], item);
			}
		}
	}

	this.importData = function () {
		if (!Utils.confirm(Utils.translate("importWarn"))) {
			return;
		}
		var zfile = File.chooseFile("open", ["zip"], "sstart-backup.zip");
		if (zfile) {
			var dstFolder = "SStart." + (Math.random().toString(36)+'00000000000000000').slice(2, 10);
			var tmpDir = FileUtils.getFile("TmpD", ["SpeedStart.tmp"]);
			tmpDir.createUnique(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
			var dstDir = FileUtils.getFile("ProfD", ["sstart.tmp"]);
			dstDir.createUnique(Ci.nsIFile.DIRECTORY_TYPE, FileUtils.PERMS_DIRECTORY);
			var zr = Cc["@mozilla.org/libjar/zip-reader;1"].createInstance(Ci.nsIZipReader);
			zr.open(zfile);
			var entries = zr.findEntries('*'), entryName, target;
			while (entries.hasMore()) {
				entryName = entries.getNext();
				target = tmpDir.clone();
				target.append(entryName);
				zr.extract(entryName, target);
			}
			zr.close();
			var cfile = tmpDir.clone(); cfile.append("sstart.conf");
			NetUtil.asyncFetch(cfile, function(istream, status) {
			  try {
				if (!Components.isSuccessCode(status)) {
					throw Utils.translate("bfileRError");
				}
				var data = NetUtil.readInputStreamToString(istream, istream.available(), {charset:"UTF-8"});
				var datahash = data.slice(0,32);
				data = data.slice(32);
				if (datahash != md5hash(data)) {
					throw Utils.translate("bfileCorrupt");
				}
				data = Utils.fromJSON(data);
				if (data["version"] != BACKUP_VERSION) {
					throw Utils.translate("bfileWrongVer");
				}
				Prefs.setInt("thumbnail.width", data["prefs"]["thw"]);
				Prefs.setInt("thumbnail.height", data["prefs"]["thh"]);
				Prefs.setInt("gridInterval", data["prefs"]["gri"]);
				Prefs.setInt("backgroundStyle", data["prefs"]["bgs"]);
				Prefs.setString("focus", data["prefs"]["fcs"]);
				Prefs.setBool("overrideNewTab", data["prefs"]["ont"]);
				Prefs.setBool("overrideHomePage", data["prefs"]["ohp"]);
				Prefs.setBool("newtabOnLockDrag", data["prefs"]["ntd"]);
				Prefs.setBool("bottomHeader", data["prefs"]["bth"]);
				Prefs.setBool("autoZoom", data["prefs"]["azm"]);
				if (typeof data["prefs"]["guo"] != "undefined") Prefs.setBool("showGridOnUnlock", data["prefs"]["guo"]);
				if (typeof data["prefs"]["dst"] != "undefined") Prefs.setBool("disableSysThumbs", data["prefs"]["dst"]);
				if (typeof data["prefs"]["aus"] != "undefined") Prefs.setBool("autoUpdSize", data["prefs"]["aus"]);
				if (typeof data["prefs"]["nto"] != "undefined") Prefs.setBool("newtabOpen", data["prefs"]["nto"]);
				if (typeof data["prefs"]["hdc"] != "undefined") Prefs.setBool("hideDecorations", data["prefs"]["hdc"]);
				if (typeof data["prefs"]["hcm"] != "undefined") Prefs.setBool("hideContextMenu", data["prefs"]["hcm"]);
				if (typeof data["prefs"]["eld"] != "undefined") Prefs.setInt("enlargeDialogs", data["prefs"]["eld"]);
				var newId = Bookmark.createFolder(dstFolder);
				Bookmark.setAnnotation(newId, ANNOTATION, data["params"] || "");
				var bookmarksService = Cc["@mozilla.org/browser/nav-bookmarks-service;1"]
					.getService(Ci.nsINavBookmarksService);
				var callback = {
					runBatched: function() {
						importFolder(data["root"], newId, tmpDir, dstDir);
					}
				}
				bookmarksService.runInBatchMode(callback, null);
				var mainbg = tmpDir.clone();
				mainbg.append("bg_0");
				if (mainbg.exists()) {
					mainbg.copyTo(dstDir, "bg_0");
				}
			  } catch(e) {
				Utils.alert(e);
				Bookmark.removeBookmark(newId);
				if (dstDir.exists()) {
					dstDir.remove(true);
				}
				return;
			  }
			  try {
				if (tmpDir.exists()) {
					tmpDir.remove(true);
				}
				var bookmarks = Bookmark.getBookmarks();
				for (var i in bookmarks) {
					if (bookmarks[i].isFolder && bookmarks[i].title == ROOT_TITLE) {
						Bookmark.removeBookmark(bookmarks[i].id);
						break;
					}
				}
				Bookmark.updateFolder(newId, ROOT_TITLE);
				var rootDir = File.getDataDirectory();
				var rootDel = "sstart.del." + (Math.random().toString(36)+'00000000000000000').slice(2, 10);
				rootDir.moveTo(null, rootDel);
				dstDir.moveTo(null, ROOT_DIR);
				var delDir = FileUtils.getFile("ProfD", [rootDel]);
				if (delDir.exists()) {
					delDir.remove(true);
				}
				Cache.clearCache();
				Cache.setUpdateMenu(true);
				Utils.reloadEachSStartBrowser();
				Utils.alert(Utils.translate("importOk"));
			  } catch(e) {
				Utils.alert(e);
			  }
			});
		}
	}
	
	function importFolder(data, srcId, srcDir, dstDir) {
		var newId;
		for (var key in data) {
			if (!(key in {title:1, url:1, params:1, isFolder:1})) {
				if (data[key]["isFolder"]) {
					newId = Bookmark.createFolder(data[key]["title"], srcId);
					Bookmark.setAnnotation(newId, ANNOTATION, data[key]["params"] || "");
					importImage(srcDir, dstDir, newId, key, data[key]["params"]);
					importFolder(data[key], newId, srcDir, dstDir);
				} else {
					newId = Bookmark.createBookmark(data[key]["url"], data[key]["title"], srcId);
					Bookmark.setAnnotation(newId, ANNOTATION, data[key]["params"] || "");
					importImage(srcDir, dstDir, newId, key, data[key]["params"]);
				}
			}
		}
	}
	
	function importImage(srcDir, dstDir, newId, oldId, paramsJS) {
		var params = Utils.fromJSON(paramsJS);
		var sdir = srcDir.clone();
		sdir.append(oldId + ".png");
		if (sdir.exists()) {
			sdir.copyTo(dstDir, newId + ".png");
		}
		if (params["backgroundImage"] && params["backgroundImage"] == "1") {
			sdir = srcDir.clone();
			sdir.append("bg_" + oldId);
			if (sdir.exists()) {
				sdir.copyTo(dstDir, "bg_" + newId);
			}
		}
		if (params["customImage"] && params["customImage"] != "" && !Utils.isURI(params["customImage"])) {
			sdir = srcDir.clone();
			sdir.append(params["customImage"]);
			if (sdir.exists()) {
				sdir.copyTo(dstDir, params["customImage"]);
			}
		}
	}

	function toHexString(charCode) {
		return ("0" + charCode.toString(16)).slice(-2);
	}

	function md5hash(data) {
		var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
			.createInstance(Ci.nsIScriptableUnicodeConverter);
		converter.charset = "UTF-8";
		var result = {};
		var utf8data = converter.convertToByteArray(data, result);
		var ch = Cc["@mozilla.org/security/hash;1"]
			.createInstance(Ci.nsICryptoHash);
		ch.init(ch.MD5);
		ch.update(utf8data, utf8data.length);
		var hash = ch.finish(false);
		var hexhash = [...hash].map(char => toHexString(char.charCodeAt(0))).join("");
		return hexhash;
	}
	
}
