"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rect = exports.Rect = function () {
	function Rect(top, left, width, height) {
		_classCallCheck(this, Rect);

		this._x = top;
		this._y = left;
		this._width = width;
		this._height = height;
	}

	_createClass(Rect, [{
		key: "bounds",
		get: function get() {
			return this._bounds = this._bounds || {
				top: this._y,
				left: this._x,
				bottom: this._y + this._height,
				right: this._x + this._width
			};
		}
	}, {
		key: "center",
		get: function get() {
			return this._center = this._center || {
				x: this._x + this._width / 2,
				y: this._y + this._height / 2
			};
		}
	}, {
		key: "origin",
		get: function get() {
			return this._origin = this._origin || {
				x: this._x,
				y: this._y
			};
		}
	}, {
		key: "size",
		get: function get() {
			return this._size = this._size || {
				width: this._width,
				height: this._height
			};
		}
	}]);

	return Rect;
}();

var Vector = exports.Vector = function () {
	function Vector(x, y) {
		_classCallCheck(this, Vector);

		this._x = x;
		this._y = y;
	}

	_createClass(Vector, [{
		key: "toUnit",
		value: function toUnit() {
			return new Vector(this.x / this.size, this.y / this.size);
		}
	}, {
		key: "toObject",
		value: function toObject() {
			return { x: this.x, y: this.y };
		}
	}, {
		key: "x",
		get: function get() {
			return this._x;
		}
	}, {
		key: "y",
		get: function get() {
			return this._y;
		}
	}, {
		key: "size",
		get: function get() {
			return Math.sqrt(Math.pow(this._x, 2) + Math.pow(this._y, 2));
		}
	}]);

	return Vector;
}();
//# sourceMappingURL=types.js.map