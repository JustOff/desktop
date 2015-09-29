(function () {
console.time("SStart");
	var Utils = justoff.sstart.Utils
	var File = justoff.sstart.File
	var Prefs = justoff.sstart.Prefs
	var Storage = justoff.sstart.Storage
	var Factory = justoff.sstart.Factory
	var Dom = justoff.sstart.Dom
	var ContextMenu = justoff.sstart.ContextMenu
	var SStart = justoff.sstart.SStart
	var Drag = justoff.sstart.Drag

	var params = Utils.getQueryParams(document.location);
	var storage = new Storage(params.folder);

	if (!params.folder) {
		var pageId = 0;
	} else {
		var pageId = params.folder;
	}
	SStart.setPageId(pageId);

	document.title = storage.getTitle();
	if (document.title == "" || document.title == "SStart") {
		document.title = SStart.translate("SStart");
	}
	
	if (pageId == 0)
		window.history.replaceState(null, "SStart", "chrome://sstart/content/sstart.html");

	var factory = new Factory(storage);
	var hasWidgets = factory.createWidgets(pageId, true);

	var quickstart = Dom.get("quickstart");
	if (!hasWidgets) {
		var qscontent = document.createTextNode(SStart.translate("quickstart"));
		quickstart.appendChild(qscontent);
		quickstart.style.display = "block";
	}

	var properties = storage.getProperties();
	if (properties) {
		if (properties.background) {
			document.body.style.backgroundColor = properties.background;
		}
		if (properties.headerColor) {
			document.styleSheets[1].cssRules[6].style.background = properties.headerColor;
			document.styleSheets[1].cssRules[4].style.border = "1px solid " + properties.headerColor;
		}
		if (properties.titleColor) {
			document.styleSheets[1].cssRules[11].style.color = properties.titleColor;
		}
	}

	if (pageId == 0) {
		if (properties.backgroundImage == "1") {
			document.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
			Dom.addClass(document.body, 'background-style-' + (properties.backgroundStyle || 1));
		}
	} else {
		if (properties.useMainBgImage != "0" && SStart.isMainBgImage()) {
			document.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_0") + ")";
			Dom.addClass(document.body, 'background-style-' + Prefs.getInt('backgroundStyle'));
		} else {
			if (properties.backgroundImage == "1") {
				document.body.style.backgroundImage = "url(" + File.getDataFileURL("bg_" + pageId) + ")";
				Dom.addClass(document.body, 'background-style-' + (properties.backgroundStyle || 1));
			}
		}
	}

	if (!SStart.areDecorationsVisible()) {
		Dom.addClass(document.body, 'no-decorations');
	}

	if (Prefs.getBool("bottomHeader")) {
			Dom.addClass(document.body, 'b-head');
	}

	function updateLockStatus() {
		var s = SStart.isLocked();
		Dom.removeClass(document.body, s ? 'unlock-edits' : 'lock-edits');
		Dom.addClass(document.body, s ? 'lock-edits' : 'unlock-edits');
	}
		
	ContextMenu.enable(document, Dom.get("menu"));

	Dom.get("menu-add").addEventListener("click", function (e) {
		if (SStart.isLocked()) {
			SStart.setLocked(false);
			updateLockStatus();
		}
		if (SStart.isCacheDOM() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			factory.createWidgets(pageId);
		}
		quickstart.style.display = "none";
		factory.createWidget(e.target.type, SStart.alignToGrid(ContextMenu.click.x), SStart.alignToGrid(ContextMenu.click.y));
	}, false);
	Dom.get("menu-prefs").addEventListener("click", function (e) {
		SStart.openPreferences();
	}, false);
	Dom.get("menu-lock").addEventListener("click", function (e) {
		SStart.setLocked(true);
		updateLockStatus();
	}, false);
	Dom.get("menu-unlock").addEventListener("click", function (e) {
		SStart.setLocked(false);
		if (SStart.isCacheDOM() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			factory.createWidgets(pageId);
		}
		updateLockStatus();
	}, false);
	Dom.get("menu-alignall").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
		}
		SStart.setLocked(false);
		SStart.alignAll();
		updateLockStatus();
	}, false);
	Dom.get("menu-refresh").addEventListener("click", function (e) {
		if (Utils.confirm(SStart.translate("contextRefreshThumbnails") + "?")) {
			if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
				var widgets = document.getElementById("widgets");
				widgets.parentNode.removeChild(widgets);
				SStart.setLocked(false);
				factory.createWidgets(pageId);
				SStart.setLocked(true);
			}
			SStart.refreshAll();
		}
	}, false);
	Dom.get("menu-refreshone").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
		var r = Dom.child(document.getElementById(hoverEl.id), "refresh");
		if (r) {
			r.click()
		}
	}, false);
	Dom.get("menu-properties").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
		var r = Dom.child(document.getElementById(hoverEl.id), "properties");
		if (r) {
			r.click()
		}
	}, false);
	Dom.get("menu-remove").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
		var r = Dom.child(document.getElementById(hoverEl.id), "remove");
		if (r) {
			r.click()
		}
	}, false);
	Dom.get("menu-rename").addEventListener("click", function (e) {
		if (SStart.isCacheDOM() && SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			SStart.setLocked(false);
			factory.createWidgets(pageId);
			SStart.setLocked(true);
		}
		var hoverEl = ContextMenu.click.el;
		while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
		var r = Dom.child(document.getElementById(hoverEl.id), "title");
		if (r) {
			var event = new MouseEvent('dblclick', {
				'view': window,
				'bubbles': true,
				'cancelable': true
				});
			r.dispatchEvent(event);
		}
	}, false);
	Dom.get("menu-props").addEventListener("click", function (e) {
		var param = { properties: properties, pageId: pageId };
		var xul = 'properties.xul';
		openDialog(xul, "properties", "chrome,centerscreen,modal,resizable", param);
		if (param.properties) {
			properties = param.properties;
			storage.setProperties(properties);
			if (properties.background) {
				document.body.style.backgroundColor = properties.background;
			}
			if (properties.headerColor) {
				document.styleSheets[1].cssRules[6].style.background = properties.headerColor;
				document.styleSheets[1].cssRules[4].style.border = "1px solid " + properties.headerColor;
			}
			if (properties.titleColor) {
				document.styleSheets[1].cssRules[11].style.color = properties.titleColor;
			}
		}
	}, false);

	document.body.addEventListener("dblclick", function (e) {
		var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
		if (e.clientX == 0 || hoverEl.nodeName.toLowerCase() != "body" && hoverEl.id != "quickstart")
			return;
		SStart.toggleLocked();
		if (SStart.isCacheDOM() && !SStart.isLocked() && pageId == 0) {
			var widgets = document.getElementById("widgets");
			widgets.parentNode.removeChild(widgets);
			factory.createWidgets(pageId);
		}
		updateLockStatus();
	}, false);

	Drag.enable(document);
	updateLockStatus();

	// Disable cache for page
	window.onbeforeunload = function () {
	}
console.timeEnd("SStart");
})();
