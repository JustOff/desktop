justoff.sstart.Drag = new function () {

	var Drag = this
	var SStart = justoff.sstart.SStart
	var Dom = justoff.sstart.Dom

	this.MIN_DRAG = 5;
	this.BORDER_WIDTH = 5;
	this.click = { x:0, y:0, border:null };
	this.original = { left:0, top:0, width:0, height:0 };
	this.hover = null;
	this.object = null;
	this.inProgress = false;
	this.prevTarget = null;

	this.enable = function (element) {
		element.addEventListener("mousedown", Drag.onMouseDown, false);
		element.addEventListener("mouseover", Drag.onMouseOver, false);
		element.addEventListener("mouseout", Drag.onMouseOut, false);
		element.addEventListener("mouseup", Drag.onMouseUp, false);
		element.addEventListener("mousemove", Drag.onMouseMove, false);
	};

	this.onMouseOver = function (e) {
		if (!SStart.isLocked()) {
			var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
			if (hoverEl.nodeName.toLowerCase() != "body" && hoverEl.id != "quickstart") {
				while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
				if (hoverEl) {
					Drag.hover = hoverEl;
				}
			}
		}
	};

	this.onMouseOut = function (e) {
		if (Drag.hover) {
			if (!SStart.isLocked()) {
				Drag.hover.style.cursor = "";
				var els = Drag.hover.getElementsByTagName('*');
				for (var i = -1, l = els.length; ++i < l;) {
					els[i].style.cursor = "";
				}
			}
			Drag.hover = null;
		}
	};

	this.onMouseDown = function (e) {
		if (e.target.nodeName == "INPUT") return;
		if (!SStart.newtabOnLockDrag() && SStart.isLocked()) return;

		var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
		if (hoverEl.nodeName.toLowerCase() != "body" && hoverEl.id != "quickstart") {
			while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
			if (hoverEl) {
				Drag.object = hoverEl;
			} else {
				return;
			}
		} else {
			return;
		}
		Drag.click.x = e.pageX;
		Drag.click.y = e.pageY;
		Drag.click.border = Drag.getBorder(Drag.object, e.pageX, e.pageY);
		Drag.original = {
			left:Drag.object.offsetLeft,
			top:Drag.object.offsetTop,
			width:Drag.object.offsetWidth,
			height:Drag.object.offsetHeight,
			borderWidth:Drag.object.offsetWidth - Drag.object.clientWidth,
			borderHeight:Drag.object.offsetHeight - Drag.object.clientHeight
		}
		e.preventDefault();
	};

	this.onMouseUp = function (e) {
		var theObject = Drag.object;
		Drag.object = null;
		if (SStart.newtabOnLockDrag() && SStart.isLocked() && Drag.inProgress) {
			Drag.removeGlass();
			Drag.inProgress = false;
			var anchor = Dom.child(theObject, "a");
			var mw = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
			var tb = mw.getBrowser();
			var tab = tb.loadOneTab(anchor.href, {inBackground: true, relatedToCurrent: true});
			if (e.pageY - Drag.click.y < 0)
				mw.setTimeout(function() { tb.selectedTab = tab; }, 0);
			e.preventDefault();
			return;
		}
		if (Drag.inProgress) {
			Drag.removeGrid();
			Drag.removeGlass();
			Drag.inProgress = false;

			var event = new CustomEvent("drop", {'detail':{'clientX':e.clientX, 'clientY':e.clientY}});
			theObject.dispatchEvent(event);
		} else {
			var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
			if (hoverEl.nodeName.toLowerCase() != "body" && hoverEl.id != "quickstart") {
				while ((hoverEl = hoverEl.parentElement) && !hoverEl.classList.contains("widget"));
				if (hoverEl && hoverEl.getAttribute("data-search") == "true") {
					SStart.focusSearch(hoverEl);
				}
			}
		}
	};

	// Glass prevents onclick event after drop occurs

	this.createGlass = function (cursor) {
		var glass = document.createElement("div");
		glass.id = "glass";
		glass.style.position = "fixed";
		glass.style.left = 0;
		glass.style.top = 0;
		glass.style.right = 0;
		glass.style.bottom = 0;
		glass.style.zIndex = 1000;
		glass.style.cursor = cursor;
		document.body.appendChild(glass);
	};

	this.removeGlass = function () {
		var glass = document.getElementById("glass");
		glass.parentNode.removeChild(glass);
	};

	this.createGrid = function (element) {
		Drag.gridInterval = SStart.getGridInterval();
		Drag.snapInterval = Drag.gridInterval * 0.2;
		var grid = document.createElement("div");
		grid.id = "grid";
		grid.style.zIndex = -1;
		grid.style.width = "100%";
		grid.style.height = document.body.scrollHeight + "px";
		grid.style.backgroundImage = "url(chrome://sstart/skin/grid" + Drag.gridInterval + ".png)";
		document.body.appendChild(grid);
	};

	this.removeGrid = function () {
		var grid = document.getElementById("grid");
		grid.parentNode.removeChild(grid);
	};

	this.getBorder = function (element, x, y) {
		var border = "";
		var deltaLeft = x - element.offsetLeft,
			deltaTop = y - element.offsetTop,
			deltaRight = element.offsetWidth - deltaLeft,
			deltaBottom = element.offsetHeight - deltaTop;

		if (deltaTop > 0 && deltaTop < Drag.BORDER_WIDTH) border = "n";
		else if (deltaBottom > 0 && deltaBottom < Drag.BORDER_WIDTH) border = "s";
		if (deltaLeft > 0 && deltaLeft < Drag.BORDER_WIDTH) border += "w";
		else if (deltaRight > 0 && deltaRight < Drag.BORDER_WIDTH) border += "e";
		return border;
	};

	this.onMouseMove = function (e) {
		if (SStart.newtabOnLockDrag() && SStart.isLocked()) { 
			if (!Drag.inProgress && Drag.object && Math.abs(Drag.click.x - e.pageX) +
					Math.abs(Drag.click.y - e.pageY) > Drag.MIN_DRAG) {
				Drag.inProgress = true;
				Drag.createGlass("");
			}
			return;
		}

		if (!Drag.inProgress && Drag.object &&
			(Drag.click.border != "" || Math.abs(Drag.click.x - e.pageX) + Math.abs(Drag.click.y - e.pageY) > Drag.MIN_DRAG)) {
			Drag.inProgress = true;
			Drag.createGrid();
			if (Drag.click.border != "") {
				var cursor = Drag.click.border + "-resize";
			} else {
				var cursor = "all-scroll";
			}
			Drag.createGlass(cursor);
		}
		if (Drag.inProgress) {
			var deltaX = e.pageX - Drag.click.x;
			var deltaY = e.pageY - Drag.click.y;

			if (Drag.click.border.match(/e/)) {
				var newWidth = Drag.original.left + Drag.original.width + deltaX - Drag.original.left;
				Drag.object.style.width = Math.max(newWidth - Drag.original.borderWidth, 0);
			}
			if (Drag.click.border.match(/s/)) {
				var newHeight = Drag.original.top + Drag.original.height + deltaY - Drag.original.top;
				Drag.object.style.height = Math.max(newHeight - Drag.original.borderHeight, 0);
			}
			if (Drag.click.border.match(/w/)) {
				var right = Drag.original.left + Drag.original.width;
				Drag.object.style.left = Math.min(Drag.original.left + deltaX, right - Drag.original.borderWidth);
				Drag.object.style.width = right - Drag.object.offsetLeft - Drag.original.borderWidth;
			}
			if (Drag.click.border.match(/n/)) {
				var bottom = Drag.original.top + Drag.original.height;
				Drag.object.style.top = Math.min(Drag.original.top + deltaY, bottom - Drag.original.borderHeight);
				Drag.object.style.height = bottom - Drag.object.offsetTop - Drag.original.borderHeight;
			}
			if (!Drag.click.border) {
				Drag.object.style.left = Drag.original.left + deltaX;
				Drag.object.style.top = Drag.original.top + deltaY;
			}
			var event = new Event(Drag.click.border ? "resize" : "drag");
			Drag.object.dispatchEvent(event);
		}
		if (Drag.hover && !SStart.isLocked()) {
			var border = Drag.getBorder(Drag.hover, e.pageX, e.pageY);
			var cursor = border ? border + "-resize" : "";
			if (Drag.prevTarget && Drag.prevTarget != e.target) {
				Drag.prevTarget.style.cursor = "";
			}
			Drag.prevTarget = cursor == "" ? null : e.target;
			Drag.hover.style.cursor = e.target.style.cursor = cursor;
		}
	};

};
