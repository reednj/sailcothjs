define(["exports"], function (exports) {
	"use strict";

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	class Renderable {
		constructor() {
			this.renderingFinished = false;
			this.positionType = "world";
			this.zIndex = 100;
		}

		render(viewport, sinceLastFrame) {}
	}

	exports.Renderable = Renderable;
	class ViewportObject extends Renderable {
		constructor(options) {
			super();
			this.x = options.x;
			this.y = options.y;
		}

		render(viewport, sinceLastFrame) {
			this.update(sinceLastFrame);
		}

		update(sinceLastFrame) {}
	}

	exports.ViewportObject = ViewportObject;
	class Viewport {
		constructor(element, options) {
			this.element = element;
			this.sizingElement = options.sizingElement || null;

			this.options = options || {};
			this.options.autoRedraw = false;
			this.options.onRedraw = this.options.onRedraw || function () {};

			this.tick = 0;
			this.waitingForFrame = false;
			this.lastFrameTime = null;

			this.renderQueueChanged = false;
			this.renderQueue = [];

			this.canvas = this.element;
			this.context = this.canvas.getContext('2d');
			this.updateDimensions();

			if (this.sizingElement) {
				window.addEventListener('resize', () => this.autosize());
				this.autosize();
			}
		}

		// if this is set to an element, the canvas will try to fill it
		// as much as possible when the window is resized


		updateDimensions() {
			// the canvas height and width properties actually call a function. We assign them
			// here to variables for speed reasons, as they might get accessed many times per
			// frame
			this._width = this.canvas.width / (this._scale || 1.0);
			this._height = this.canvas.height / (this._scale || 1.0);
		}

		autosize() {
			if (this.canvas && this.sizingElement) {
				var parentSize = {
					x: this.sizingElement.clientWidth || 0,
					y: this.sizingElement.clientHeight || 0
				};

				this.canvas.width = parentSize.x;
				this.canvas.height = parentSize.y;

				this.renderQueue.forEach(o => {
					if (typeof o.onResize == 'function') {
						o.onResize(this._width, this._height, this);
					}
				});

				this.updateDimensions();
			}
		}

		start() {
			return this.refresh(true);
		}

		refresh(autoRedraw) {
			if (this.waitingForFrame === false && this.options.autoRedraw === false) {
				requestAnimationFrame(this.redraw.bind(this));

				// the waiting for frame flag makes sure that the frame will only be redrawn once
				// if mulitple requests are made on the same canvas before it gets a chance to draw
				this.waitingForFrame = true;

				if (autoRedraw === true) {
					this.options.autoRedraw = autoRedraw;
				}
			}

			return this;
		}

		stop() {
			this.options.autoRedraw = false;
			return this;
		}

		redraw() {
			this.tick++;
			this.waitingForFrame = false;

			this.clear();

			// call the redraw event, so that the position of objects etc can be updated
			this.options.onRedraw(this);

			// after the redraw event there might be some objects we dont want to render
			// anymore. So we get a list of them, and remove them from the render queue
			this.renderQueue = this.renderQueue.filter(o => !o.renderingFinished);

			// we want to calulate the time since the last frame so that things can be animated consistantly
			var currentTime = new Date();
			var sinceLastFrame = currentTime - (this.lastFrameTime || currentTime);
			this.lastFrameTime = currentTime;

			this.renderObjects(this.renderQueue, sinceLastFrame);

			if (this.options.autoRedraw === true) {
				requestAnimationFrame(this.redraw.bind(this));
			}

			this.renderQueueChanged = false;
		}

		renderObjects(renderQueue, sinceLastFrame) {
			renderQueue.forEach(function (o) {
				this.renderObject(o, sinceLastFrame);
			}.bind(this));
		}

		renderObject(o, sinceLastFrame) {
			if (o) {
				o.render(this, sinceLastFrame);
			}
		}

		add(o) {
			return this.startRendering(o);
		}

		startRendering(o) {
			if (!o) {
				return;
			}

			// the object has to have a render function for it to be added to the queue
			if (!o.render || typeof o.render != 'function') {
				return;
			}

			// re-adding the object resets the render finished flag
			if (o.renderingFinished === true) {
				o.renderingFinished = false;
			}

			// if the object has a viewport variable that is not set yet, then we will set it
			// to the current one. Don't want to overwrite this though, because it is possible
			// for an object to belong to more than one viewport
			if (!o.viewport) {
				o.viewport = this;
			}

			// if it has a resize method, then we fire that as well when it is added, so that
			// it can position itself etc
			if (typeof o.onResize == 'function') {
				o.onResize(this._width, this._height, this);
			}

			this.renderQueue.push(o);
			this.renderQueueChanged = true;

			// now we need to sort the render queue by zindex to make sure it is rendered in the same order
			this.renderQueue.sort(function (a, b) {
				return (a.zIndex || 1) - (b.zIndex || 1);
			});

			return this;
		}

		clear() {
			this.context.clearRect(0, 0, this._width, this._height);
		}

		getObjectCount() {
			return this.renderQueue.length;
		}

		// gets the center of the canvas in static co-ords
		getCenter() {
			return {
				x: Math.round(this._width / 2),
				y: Math.round(this._height / 2)
			};
		}
	}

	exports.Viewport = Viewport;
	class WorldViewport extends Viewport {

		constructor(element, options = {}) {
			super(element, options);
			this.origin = this.options.origin || { x: 0, y: 0 };

			this.staticQueue = [];
			this.worldQueue = [];

			this._width = 0.0;
			this._height = 0.0;
			this._scale = 1.0;
			this.updateDimensions();
		}

		setScale(n) {
			if (n != null) {
				this.context.scale(n, n);
				this._scale = n;
				this.updateDimensions();
			}
		}

		updateQueues(renderQueue) {
			this.staticQueue = renderQueue.filter(o => o.positionType != 'world');
			this.worldQueue = renderQueue.filter(o => o.positionType == 'world');
		}

		renderObjects(renderQueue, sinceLastFrame) {
			if (this.renderQueueChanged === true) {
				this.updateQueues(renderQueue);
			}

			this.updateDimensions();

			this.context.save();
			this.context.translate(-this.origin.x, -this.origin.y);

			for (var i = 0; i < this.worldQueue.length; i++) {
				this.renderObject(this.worldQueue[i], sinceLastFrame);
			}

			this.context.restore();

			// this means that static objects will always render on top of the world ones
			// it would be difficult to fix this, but since this is mostly what we want anyway
			// lets just ignore this problem
			super.renderObjects(this.staticQueue, sinceLastFrame);
		}

		// calls the render method the object in the right way. If the renderable
		// has the position type set to world, then we check if the object is visible
		// before rendering, as well as calling any other aux functions.
		//
		// Statically positioned objects are rendered the same as before
		renderObject(o, sinceLastFrame) {
			if (o.positionType == 'world' && o instanceof ViewportObject) {
				if (this.objectVisible(o) && o.render) {
					o.render(this, sinceLastFrame);
				}
			} else {
				super.renderObject(o, sinceLastFrame);
			}
		}

		// this sets the canvas (0,0) (in screen coords) to the x,y arguments
		// in world coordinates. Put another way, the x,y provided as arguments
		// will be the world coordinates of the top left corner of the canvas.
		setOrigin(x, y) {
			this.origin = { x: x, y: y };
		}

		getOrigin() {
			return this.origin;
		}

		// this is the same as setOrigin, but it uses the center of the canvas as the reference
		// instead of the top-left. x and y will be the world coordinates of the center of the 
		// canvas
		setCenter(x, y) {
			this._center = null;
			this._bounds = null;
			this.setOrigin(x - Math.round(this._width / 2), y - Math.round(this._height / 2));
		}

		get center() {
			return this._center = this._center || {
				x: this.origin.x + Math.round(this._width / 2),
				y: this.origin.y + Math.round(this._height / 2)
			};
		}

		// returns the bounds of the viewport in world coordinates
		// this is mainly used to decide if a given object is visible on the
		// canvas and should be rendered
		get bounds() {
			return this._bounds = this._bounds || {
				x: this.origin.x,
				y: this.origin.y,
				width: this._width,
				height: this._height,
				top: this.origin.y,
				left: this.origin.x,
				bottom: this.origin.y + this._height,
				right: this.origin.x + this._width
			};
		}

		//
		// assumes the object being passed has at least a 'getBounds' method, and if not
		// at least an x or y property so it can be evalulated as a point
		//
		// this will default to returning TRUE
		//
		// this gets called for every objet on every frame, so we should work on making it more
		// efficient...
		//
		objectVisible(o) {
			if (o.x == null || o.y == null) return true;

			if (this.pointVisible(o.x, o.y)) return true;

			if (o.x - this.origin.x > this._width * 2 || o.x - this.origin.x < -this._width) return false;

			if (o.y - this.origin.y > this._height * 2 || o.y - this.origin.y < -this._height) return false;

			var bounds;
			if (!o.getBounds) {
				if (o.x !== undefined && o.y !== undefined && o.width !== undefined && o.height !== undefined) {
					bounds = {
						x: o.x,
						y: o.y,
						width: o.width || 0,
						height: o.height || 0
					};
				} else if (o.x !== undefined && o.y !== undefined) {
					return this.pointVisible(o.x, o.y);
				} else {
					return true;
				}
			} else {
				bounds = o.getBounds();
			}

			if (!bounds.width || !bounds.height) {
				// either object has no width and height, or they are
				// undefined. Either way just evaluate the visibility as if it was a point
				return this.pointVisible(bounds.x, bounds.y);
			} else {
				// we need to check the visibility of each corner of the bounds, if any is visible
				// then we say that the object is
				return this.pointVisible(bounds.x, bounds.y) || this.pointVisible(bounds.x + bounds.width, bounds.y) || this.pointVisible(bounds.x, bounds.y + bounds.height) || this.pointVisible(bounds.x + bounds.width, bounds.y + bounds.height);
			}
		}

		pointVisible(x, y) {
			return x >= this.origin.x && x < this.origin.x + this._width && y >= this.origin.y && y < this.origin.y + this._height;
		}
	}
	exports.WorldViewport = WorldViewport;
});
//# sourceMappingURL=viewport.js.map