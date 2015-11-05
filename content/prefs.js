justoff.sstart.Prefs = new function () {

	this.prefs = Components.classes["@mozilla.org/preferences-service;1"]
		.getService(Components.interfaces.nsIPrefService)
		.getBranch("extensions.sstart."),

	this.getInt = function (name) {
		try {
			return this.prefs.getIntPref(name);
		} catch (e) {
			return 0;
		}
	};

	this.setInt = function (name, value) {
		this.prefs.setIntPref(name, value);
	};

	this.getString = function (name) {
		try {
			return this.prefs.getComplexValue(name,
				Components.interfaces.nsISupportsString).data;
		} catch (e) {
			return null;
		}
	};

	this.setString = function (name, value) {
		var str = Components.classes["@mozilla.org/supports-string;1"]
			.createInstance(Components.interfaces.nsISupportsString);
		str.data = value;
		this.prefs.setComplexValue(name,
			Components.interfaces.nsISupportsString, str);
	};

	this.getBool = function (name) {
		try {
			return this.prefs.getBoolPref(name);
		} catch (e) {
			return false;
		}
	};

	this.setBool = function (name, value) {
		this.prefs.setBoolPref(name, value);
	};

};
