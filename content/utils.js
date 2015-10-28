var EXPORTED_SYMBOLS = ["Utils"];

var Utils = {

	getQueryParams: function (url) {
		var params = new Array();
		var regexp = /[?&](\w+)=(\w+)/g;
		var match;
		while ((match = regexp.exec(url))) {
			params[match[1]] = match[2];
		}
		return params;
	},

	clone: function (object) {
		return this.merge({}, object);
	},

	merge: function (target) {
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
						target[i] = this.merge(target[i], source[i]);
						break;
				}
			}
		}
		return target;
	},

	toJSON: function (object) {
		return JSON.stringify(object);
	},

	fromJSON: function (str) {
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
	},

	translate: function (key) {
		if (!this.bundle) {
			this.bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
				.getService(Components.interfaces.nsIStringBundleService)
				.createBundle("chrome://sstart/locale/sstart.strings" + "?" + Math.random());
		}
		return this.bundle.GetStringFromName(key);
	},

	alert: function (message) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);
		return prompts.alert(this.getBrowserWindow(), this.translate("SpeedStart"), message);
	},

	confirm: function (message) {
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService);
		return prompts.confirm(this.getBrowserWindow(), this.translate("SpeedStart"), message);
	},

	getBrowserWindow: function () {
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		return wm.getMostRecentWindow("navigator:browser");
	},

	getBrowser: function () {
		return this.getBrowserWindow().getBrowser();
	},

	trim: function (str) {
		return str.replace(/^[\s]*(.*[\S])[\s]*$/, '$1');
	},

	getDocumentTab: function (doc) {
		var tabs = gBrowser.tabContainer.childNodes;
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].linkedBrowser.contentDocument == doc) {
				return tabs[i];
			}
		}
	}

};
