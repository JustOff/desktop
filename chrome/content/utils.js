justoff.sstart.Utils = new function () {

	var Utils = this

	this.getQueryParams = function (url) {
		var params = new Array();
		var regexp = /[?&](\w+)=(\w+)/g;
		var match;
		while (match = regexp.exec(url)) {
			params[match[1]] = match[2];
		}
		return params;
	};

	this.lastUniqueId = 0;

	this.getUniqueId = function () {
		var id = Math.max(Utils.lastUniqueId + 1, new Date().getTime());
		return Utils.lastUniqueId = id;
	};

	this.clone = function (object) {
		return Utils.merge({}, object);
	};

	this.merge = function (target) {
		if (!target) target = new Object();

		for (var j = 1; j < arguments.length; j++) {
			var source = arguments[j];

			for (var i in source) {
				if (source[i] == null) continue;
				switch (typeof source[i]) {
					case "string":
					case "number":
					case "boolean":
					case "function":
						target[i] = source[i];
						break;
					default:
						target[i] = Utils.merge(target[i], source[i]);
						break;
				}
			}
		}
		return target;
	};

	this.toJSON = function (object) {
		return JSON.stringify(object);
	};

	this.fromJSON = function (str) {
		if (!str || /^ *$/.test(str))
			return {};
		try {
			return JSON.parse(str);
		} catch (e) {
			str = str.replace(/\(|\)/g, '').replace(/(\w+):/g, '"$1":')
			try {
				return JSON.parse(str);
			} catch (e) {
				Components.utils.reportError("Error parsing " + str + ": " + e);
			}
			return {};
		}
	};

	this.confirm = function (message) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);
		return prompts.confirm(window, justoff.sstart.SStart.translate("SStart"), message);
	};

	this.getBrowserWindow = function () {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		return wm.getMostRecentWindow("navigator:browser");
	};

	this.getBrowser = function () {
		return Utils.getBrowserWindow().getBrowser();
	};

	this.trim = function (str) {
		return str.replace(/^[\s]*(.*[\S])[\s]*$/, '$1');
	};

	this.getDocumentTab = function (doc) {
		var tabs = gBrowser.tabContainer.childNodes;
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].linkedBrowser.contentDocument == doc) {
				return tabs[i];
			}
		}
	};

}

