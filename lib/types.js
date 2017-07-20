define(["exports"], function (exports) {
	"use strict";

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	class Rect {

		constructor(top, left, width, height) {
			this._x = top;
			this._y = left;
			this._width = width;
			this._height = height;
		}

		get bounds() {
			return this._bounds = this._bounds || {
				top: this._y,
				left: this._x,
				bottom: this._y + this._height,
				right: this._x + this._width
			};
		}

		get center() {
			return this._center = this._center || {
				x: this._x + this._width / 2,
				y: this._y + this._height / 2
			};
		}

		get origin() {
			return this._origin = this._origin || {
				x: this._x,
				y: this._y
			};
		}

		get size() {
			return this._size = this._size || {
				width: this._width,
				height: this._height
			};
		}
	}
	exports.Rect = Rect;
});
//# sourceMappingURL=types.js.map