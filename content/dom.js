var EXPORTED_SYMBOLS = ["Dom"];

var Dom = {

	child: function (element, classOrType) {
		var elements = [ element ];
		var regexp = new RegExp("\\b" + classOrType + "\\b");

		while ((element = elements.shift())) {
			for (var i = 0; i < element.childNodes.length; i++) {
				var child = element.childNodes[i];
				if (child.nodeName.toLowerCase() == classOrType ||
					child.className && child.className.match(regexp)) return child;
				elements.push(child);
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
