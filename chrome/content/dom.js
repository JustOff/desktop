justoff.sstart.Dom = new function () {

	var Dom = this

	this.get = function (id) {
		return document.getElementById(id);
	};

	this.child = function (element, classOrType) {
		var elements = [ element ];
		var regexp = new RegExp("\\b" + classOrType + "\\b");

		while (element = elements.shift()) {
			for (var i = 0; i < element.childNodes.length; i++) {
				var child = element.childNodes[i];
				if (child.nodeName.toLowerCase() == classOrType ||
					child.className && child.className.match(regexp)) return child;
				elements.push(child);
			}
		}
	};

	this.parent = function (element, classOrType) {
		var regexp = new RegExp("\\b" + classOrType + "\\b");

		while (element = element.parentNode) {
			if (element.nodeName.toLowerCase() == classOrType ||
				element.className && element.className.match(regexp)) return element;
		}
	};

	this.prepend = function (parentNode, child) {
		parent.insertBefore(child, parentNode.firstChild);
	};

	this.addClass = function (element, className) {
		if (element.className.indexOf(className) == -1) {
			element.className += " " + className;
		}
	};

	this.removeClass = function (element, className) {
		element.className = element.className.replace(new RegExp("((^)|( +))" + className + "(( +)|($))"), " ")
	}
	
	this.hasClass = function (element, className) {
		return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
	}

	this.remove = function (element) {
		element.parentNode.removeChild(element);
	};

};

