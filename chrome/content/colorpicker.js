justoff.sstart.SStartColorpickerXul = new function () {
	
	var Colorpicker = this

	function toHex(d) {
		return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
	}

	function getPos(canvas, e) {
		var rect = canvas.getBoundingClientRect();
		return {
			x : e.clientX - rect.left,
			y : e.clientY - rect.top
		};
	}

	function init(imageObj) {
		var canvas = document.getElementById('cpCanvas');
		var context = canvas.getContext('2d');
		var mouseDown = false;

		canvas.addEventListener('mousedown', function (e) {
			mouseDown = true;
			pickColor(e);
		}, false);

		canvas.addEventListener('mouseup', function () {
			mouseDown = false;
		}, false);

		canvas.addEventListener('mousemove', pickColor, false);

		function pickColor (e) {
			var mousePos = getPos(canvas, e);
			if (mouseDown && mousePos !== null && mousePos.x > 0 && mousePos.x < 272 && mousePos.y > 0 && mousePos.y < 256) {
				var imageData = context.getImageData(0, 0, 272, 256);
				var data = imageData.data;
				var x = mousePos.x - 0;
				var y = mousePos.y - 0;
				var red = data[((272 * y) + x) * 4];
				var green = data[((272 * y) + x) * 4 + 1];
				var blue = data[((272 * y) + x) * 4 + 2];
				var color = '#' + toHex(red) + toHex(green) + toHex(blue);
				if (Colorpicker.element) {
					Colorpicker.element.style[Colorpicker.attr] = color;
				}
				Colorpicker.doc.getElementById(Colorpicker.tbox).value = color;
				Colorpicker.doc.getElementById(Colorpicker.tbox+"Btn").style["background"] = color;
			}
		}	
		
		context.drawImage(imageObj, 0, 0);
	}

	this.initialize = function () {
		this.doc = window.arguments[0].doc;
		this.tbox = window.arguments[0].tbox;
		this.element = window.arguments[0].element;
		this.attr = window.arguments[0].attr;
		var title = window.arguments[0].title || "";
		document.getElementById("sstart-colorpicker").setAttribute("title", title);
		var imageObj = new Image();
		imageObj.onload = function () {
			init(this);
		};
		imageObj.src = 'chrome://sstart/skin/colorpicker.png';
	}

}
