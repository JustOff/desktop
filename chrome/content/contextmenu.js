justoff.sstart.ContextMenu = new function () {

	var ContextMenu = this
	var Utils = justoff.sstart.Utils
	var Dom = justoff.sstart.Dom
	var SStart = justoff.sstart.SStart

	this.click = { x:0, y:0, el: null };
	this.current = null,

	this.enable = function (element, menu) {
		var handler = function (e) {
			if (e.button != 2) return;

			var hoverEl = document.elementFromPoint(e.clientX, e.clientY);
			var s = SStart.isOverWidget(hoverEl);
			Dom.removeClass(document.body, s ? 'no-widget' : 'is-widget');
			Dom.addClass(document.body, s ? 'is-widget' : 'no-widget');
				
			if (s) {
				var hoverTmp = hoverEl;
				while ((hoverTmp = hoverTmp.parentElement) && !hoverTmp.classList.contains("widget"));
				if (hoverTmp.getAttribute("data-search") == "true") {
					Dom.addClass(document.body, 'is-search');
				} else {
					Dom.removeClass(document.body, 'is-search');
				}
			}

			e.preventDefault();
			ContextMenu.click.x = e.pageX;
			ContextMenu.click.y = e.pageY;
			ContextMenu.click.el = hoverEl;
			ContextMenu.open(menu, e.pageX, e.pageY);
		};
		element.addEventListener("contextmenu", handler, false);
		element.addEventListener("dblclick", handler, false);
	};

	this.open = function (menu, x, y) {
		ContextMenu.close();

		if (!menu.translated) {
			ContextMenu.translate(menu);
			menu.translated = true;
		}

		ContextMenu.current = menu;
		document.body.appendChild(ContextMenu.current);
		ContextMenu.showSubmenu(ContextMenu.current, x, y);

		document.addEventListener("click", ContextMenu.close, false);
		document.addEventListener("blur", ContextMenu.close, false);
	};

	this.close = function () {
		if (ContextMenu.current) {
			document.addEventListener("click", ContextMenu.close, false);
			document.addEventListener("blur", ContextMenu.close, false);
			Dom.remove(ContextMenu.current);
			ContextMenu.current = null;
		}
	};

	this.translate = function (menu) {
		for (var i = 0; i < menu.childNodes.length; i++) {
			var node = menu.childNodes[i];
			if (node.nodeName == 'LI') {
				var str = SStart.translate("context" + Utils.trim(node.firstChild.nodeValue));
				node.firstChild.nodeValue = str;
			}
			ContextMenu.translate(node);
		}
	};

	this.showSubmenu = function (menu, x, y) {
		for (var i = 0; i < menu.childNodes.length; i++) {
			var child = menu.childNodes[i];
			if (child.nodeName != "LI") continue;

			child.addEventListener("mouseover", ContextMenu.onItemOver, false);
			var submenu = ContextMenu.getSubmenu(child);
			if (submenu) {
				ContextMenu.hideSubmenu(submenu);
				Dom.addClass(child, "container");
				child.addEventListener("click", ContextMenu.onContainerClick, false);
			}
		}
		Dom.addClass(menu, "contextmenu");
		menu.style.left = x;
		menu.style.top = y;
		menu.style.display = "block";
	};

	this.hideSubmenu = function (menu) {
		menu.style.display = "none";
	};

	this.getSubmenu = function (item) {
		return Dom.child(item, "ul");
	};

	this.onItemOver = function (e) {
		if (e.target != e.currentTarget) return;

		var menu = e.target.parentNode;
		for (var i = 0; i < menu.childNodes.length; i++) {
			var item = menu.childNodes[i];
			var submenu = ContextMenu.getSubmenu(item);
			if (submenu) {
				var x = menu.offsetWidth - 2;
				var y = item.offsetTop - 1;
				item == e.target ? ContextMenu.showSubmenu(submenu, x, y)
					: ContextMenu.hideSubmenu(submenu);
			}
		}
	};

	this.onContainerClick = function (e) {
		if (e.target == e.currentTarget) e.stopPropagation();
	};

};
