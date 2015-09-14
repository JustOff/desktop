rtimushev.ffdesktop.Drag = new function () {

    var Drag = this
    var Prefs = rtimushev.ffdesktop.Prefs
    var Desktop = rtimushev.ffdesktop.Desktop
	var Dom = rtimushev.ffdesktop.Dom

    this.MIN_DRAG = 10;
    this.BORDER_WIDTH = 5;
    this.click = { x:0, y:0, border:null };
    this.original = { left:0, top:0, width:0, height:0 };
    this.hover = null;
    this.object = null;
    this.inProgress = false;
    this.prevTarget = null;

    this.enable = function (element, options) {
        element.addEventListener("mousedown", Drag.onMouseDown, false);
        element.addEventListener("mouseover", Drag.onMouseOver, false);
        element.addEventListener("mouseout", Drag.onMouseOut, false);
        document.addEventListener("mouseup", Drag.onMouseUp, false);
        document.addEventListener("mousemove", Drag.onMouseMove, false);
    };

    this.disable = function (element) {
        element.removeEventListener("mousedown", Drag.onMouseDown, false);
        element.removeEventListener("mouseover", Drag.onMouseOver, false);
        element.removeEventListener("mouseout", Drag.onMouseOut, false);
    };

    this.onMouseOver = function (e) {
        Drag.hover = e.currentTarget;
    };

    this.onMouseOut = function (e) {
        Drag.hover = null;
    };

    this.onMouseDown = function (e) {
        if (e.target.nodeName == "INPUT") return;
        if (!Prefs.getBool("newtabOnLockDrag") && Desktop.isLocked()) return;

        Drag.object = e.currentTarget;
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
		if (Prefs.getBool("newtabOnLockDrag") && Desktop.isLocked() && Drag.inProgress) {
			Drag.removeGlass();
			Drag.inProgress = false;
			var anchor = Dom.child(theObject, "a");
			// console.log(anchor.href);
			var mw = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser");
			var tb = mw.getBrowser();
			var tab = tb.loadOneTab(anchor.href, {inBackground: true, relatedToCurrent: true});
			if (e.pageY - Drag.click.y < 0)
				mw.setTimeout(function() { tb.selectedTab = tab; }, 0);
			return;
		}
        if (Drag.inProgress) {
            Drag.removeGrid();
            Drag.removeGlass();
            Drag.inProgress = false;

            var event = document.createEvent("Event");
            event.initEvent("drop", false, false);
            theObject.dispatchEvent(event);
        }
    };

    // Glass prevents onclick event after drop occurs

    this.createGlass = function (element) {
        var glass = document.createElement("div");
        glass.id = "glass";
        glass.style.position = "fixed";
        glass.style.left = 0;
        glass.style.top = 0;
        glass.style.right = 0;
        glass.style.bottom = 0;
        glass.style.zIndex = 1000;
        document.body.appendChild(glass);
    };

    this.removeGlass = function () {
        var glass = document.getElementById("glass");
        glass.parentNode.removeChild(glass);
    };

    this.createGrid = function (element) {
        Drag.gridInterval = Prefs.getInt("gridInterval");
        Drag.snapInterval = Drag.gridInterval * 0.2;
        var grid = document.createElement("div");
        grid.id = "grid";
        grid.style.zIndex = -1;
        grid.style.width = "100%";
        grid.style.height = document.body.scrollHeight + "px";
        grid.style.backgroundImage = "url(chrome://desktop/skin/grid" + Drag.gridInterval + ".png)";
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
        if (Prefs.getBool("newtabOnLockDrag") && Desktop.isLocked()) { 
			if (!Drag.inProgress && Drag.object && Math.abs(Drag.click.x - e.pageX) +
					Math.abs(Drag.click.y - e.pageY) > Drag.MIN_DRAG) {
				Drag.inProgress = true;
				Drag.createGlass();
			}
			return;
		}

        if (!Drag.inProgress && Drag.object &&
            Math.abs(Drag.click.x - e.pageX) +
                Math.abs(Drag.click.y - e.pageY) > Drag.MIN_DRAG) {
            Drag.inProgress = true;
            Drag.createGlass();
            Drag.createGrid();
        }
        if (Drag.inProgress) {
            var deltaX = e.pageX - Drag.click.x;
            var deltaY = e.pageY - Drag.click.y;

            if (Drag.click.border.match(/e/)) {
                var newWidth = Drag.snapToGrid(e, Drag.original.left + Drag.original.width + deltaX) - Drag.original.left;
                Drag.object.style.width = Math.max(newWidth - Drag.original.borderWidth, 0);
            }
            if (Drag.click.border.match(/s/)) {
                var newHeight = Drag.snapToGrid(e, Drag.original.top + Drag.original.height + deltaY) - Drag.original.top;
                Drag.object.style.height = Math.max(newHeight - Drag.original.borderHeight, 0);
            }
            if (Drag.click.border.match(/w/)) {
                var right = Drag.original.left + Drag.original.width;
                Drag.object.style.left = Math.min(Drag.snapToGrid(e, Drag.original.left + deltaX), right - Drag.original.borderWidth);
                Drag.object.style.width = right - Drag.object.offsetLeft - Drag.original.borderWidth;
            }
            if (Drag.click.border.match(/n/)) {
                var bottom = Drag.original.top + Drag.original.height;
                Drag.object.style.top = Math.min(Drag.snapToGrid(e, Drag.original.top + deltaY), bottom - Drag.original.borderHeight);
                Drag.object.style.height = bottom - Drag.object.offsetTop - Drag.original.borderHeight;
            }
            if (!Drag.click.border) {
                Drag.object.style.left = Drag.snap2ToGrid(e, Drag.original.left + deltaX, Drag.original.width);
                Drag.object.style.top = Drag.snap2ToGrid(e, Drag.original.top + deltaY, Drag.original.height);
            }
            var event = document.createEvent("Event");
            event.initEvent(Drag.click.border ? "resize" : "drag", false, false);
            Drag.object.dispatchEvent(event);
        }
        if (Drag.hover) {
            var border = Drag.getBorder(Drag.hover, e.pageX, e.pageY);
            var cursor = border ? border + "-resize" : "";
            if (Drag.prevTarget && Drag.prevTarget != e.target) {
                Drag.prevTarget.style.cursor = "";
            }
            if (Desktop.isLocked()) cursor = "";
            Drag.prevTarget = cursor == "" ? null : e.target;
            Drag.hover.style.cursor = e.target.style.cursor = cursor;
        }
    };

    this.snapToGrid = function (e, x) {
        if (e.ctrlKey) return x;
        var gx = Math.round(x / Drag.gridInterval) * Drag.gridInterval;
        return (Math.abs(x - gx) < Drag.snapInterval) ? gx : x;
    };

    this.snap2ToGrid = function (e, x, szx) {
        if (e.ctrlKey) return x;
        var gx1 = Math.round(x / Drag.gridInterval) * Drag.gridInterval;
        var gx2 = Math.round((x + szx) / Drag.gridInterval) * Drag.gridInterval;
        if (Math.abs(x - gx1) <= Math.abs(x + szx - gx2)) {
            return (Math.abs(x - gx1) < Drag.snapInterval) ? gx1 : x;
        } else {
            return (Math.abs(x + szx - gx2) < Drag.snapInterval) ? gx2 - szx : x;
        }
    };

};

