var EXPORTED_SYMBOLS = ["Dom"];

var Dom = {

	child: function (element, classOrType) {
		var i, ch, el, els = [ element ];
		while ((el = els.shift())) {
			for (i = 0; i < el.childNodes.length; i++) {
				ch = el.childNodes[i];
				if (ch.nodeName.toLowerCase() == classOrType || ch.classList && ch.classList.contains(classOrType)) {
					return ch;
				} else {
					els.push(ch);
				}
			}
		}
	},

	addClass: function (element, className) {
		element.classList.add(className);
	},

	removeClass: function (element, className) {
		element.classList.remove(className);
	},
	
	remove: function (element) {
		element.parentNode.removeChild(element);
	}

};
