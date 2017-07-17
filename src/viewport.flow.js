// @flow

// StaticViewport
//
// Helper class to handle html5 cavnases and render subobjects in an
// easy way
//
// It can be run in one of two modes - with autoRedraw or not turned on. With autoRedraw
// the canvas will be redraw as often as possible, using requestAnimationFrame (which aims
// for about 60fps). With it off, the parent will need to call refresh() manually to redraw
// the canvas.
//
// Every time the canvas is redrawn, the render() method is called for every
// object in the render queue. Add objects to the queue using the add(o) method
// The only thing is object is required to have is a render method to paint its self to the
// canvas.
//
// The redraw loop has to be explicitly started with start when the helper is created
//
// Options:
//    - autoRedraw (bool) 	- when true the next frame will be requested immediately after the previous
//    
// Events
//	- onRedraw(this) - this event is triggered after the frame is cleared, but before the draw
//	- onClick(e) - the canvas was clicked. e.canvas.x and e.canvas.y contain the coordinates of the click
//		realtive to the canvas.
//
// Example:
//		var helper = new CanvasHelper('canvas-id', {autoRedraw: true});
//
//		// squareThing.render(helper) gets called at each frame
//		helper.add(squareThing);
//
//		// starts the draw loop.
//		helper.start();
//
// In order to change the order of the rendering, set a zIndex property on the object that is
// passed to add/startRendering. If the zIndex is missing is it assumed to be 1
//
// Renderables:
//
// The objects passed to the add() method are known as renderables, they are normal objects or
// classes, the only thing they are required to have is a render() method. This method paints the
// object onto the canvas. Although this is the only required method, there are a number of optional
// methods that may be useful.
//
//  - zIndex (int) - the z-index of the object that determines the order they are rendered in. Lower z-indexes
//		are rendered first. If no z-index is provided then it is assumed to be zero.
//  - renderingFinished (bool) - when set to true, the object will be removed from the render queue on the next
//		frame. It has to be manually readded in order to get it to display again
//
class StaticViewport {
    element:?HTMLCanvasElement;
    options:Object;
    tick:number;
    waitingForFrame:boolean;
    lastFrameTime:?Date;
    renderQueueChanged:boolean;
    renderQueue:Object[];
    canvas:HTMLCanvasElement;
    context:CanvasRenderingContext2D;
    
    _width:number;
    _height:number;
    _scale:number;
	constructor(element:HTMLCanvasElement, options:Object) {
		this.element = element;
        
        this.options = options || {};
      	this.options.autoRedraw = false;
		this.options.onRedraw = this.options.onRedraw || function() {};

		this.tick = 0;
		this.waitingForFrame = false;
		this.lastFrameTime = null;

		this.renderQueueChanged = false;
		this.renderQueue = [];

		this.canvas = this.element;
		this.context = this.canvas.getContext('2d');
		this.updateDimensions();
	}

	updateDimensions() {
		// the canvas height and width properties actually call a function. We assign them
		// here to variables for speed reasons, as they might get accessed many times per
		// frame
		this._width = this.canvas.width / (this._scale || 1.0);
		this._height = this.canvas.height / (this._scale || 1.0);
	}

	// same as 'fillParent' but easier to remember
	autosize() {
		this.fillParent();
	}

	// makes canvas fill the parent DOM object, a kind of simple
	// autosizing
	//
	// It will call an onResize event on the render object if it exists
	// this function should have the signature:
	//	onResize(width, height, viewport)
	// this method should be used to reposition the object appropriately on
	// the canvas
	fillParent() {
		if(this.canvas) {
			var parentSize = { x:0, y:0 }; //this.canvas.getParent().getSize();
			this.canvas.width = parentSize.x;
			this.canvas.height = parentSize.y;

			this.renderQueue.forEach(function(o) {
				if(typeof o.onResize == 'function') {
					o.onResize(this._width, this._height, this);
				}
			}.bind(this));

			this.updateDimensions();
		}
	}

	start() {
		return this.refresh(true);
	}

	refresh(autoRedraw) {
		if(this.waitingForFrame === false && this.options.autoRedraw === false) {
			requestAnimationFrame(this.redraw.bind(this));

			// the waiting for frame flag makes sure that the frame will only be redrawn once
			// if mulitple requests are made on the same canvas before it gets a chance to draw
			this.waitingForFrame = true;

			if(autoRedraw === true) {
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
		this.stopRendering(this.renderQueue.filter(function(o) {return o.renderingFinished === true; }));

		// we want to calulate the time since the last frame so that things can be animated consistantly
		var currentTime = new Date();
		var sinceLastFrame = currentTime - (this.lastFrameTime || currentTime);
		this.lastFrameTime = currentTime;

		this.renderObjects(this.renderQueue, sinceLastFrame);

		if(this.options.autoRedraw === true) {
			requestAnimationFrame(this.redraw.bind(this));
		}

		this.renderQueueChanged = false;
	}

	renderObjects(renderQueue, sinceLastFrame) {
		renderQueue.forEach(function(o) {
			this.renderObject(o, sinceLastFrame);
		}.bind(this));
	}

	renderObject(o, sinceLastFrame) {
		if(!o) {
			return;
		}

		o.render(this, sinceLastFrame);
	}

	add(o:IRenderable) {
		return this.startRendering(o);
	}

	startRendering(o:IRenderable) {
    	if(!o) {
    		return;
    	}

		// the object has to have a render function for it to be added to the queue
		if(!o.render || typeof o.render != 'function') {
			return;
		}

		// re-adding the object resets the render finished flag
		if(o.renderingFinished === true) {
			o.renderingFinished = false;
		}

		// if the object has a viewport variable that is not set yet, then we will set it
		// to the current one. Don't want to overwrite this though, because it is possible
		// for an object to belong to more than one viewport
		if(!o.viewport) {
			o.viewport = this;
		}

		// if it has a resize method, then we fire that as well when it is added, so that
		// it can position itself etc
		if(typeof o.onResize == 'function') {
			o.onResize(this._width, this._height, this);
		}

		this.renderQueue.push(o);
		this.renderQueueChanged = true;

		// now we need to sort the render queue by zindex to make sure it is rendered in the same order
		this.renderQueue.sort(function(a, b) { return (a.zIndex || 1) - (b.zIndex || 1);});

		return this;
	}

	stopRendering(o) {
		if(!o) {
    		return;
    	}

        
		this.renderQueueChanged = true;
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



interface IRenderable {
    viewport:StaticViewport;
    renderingFinished:boolean;
    render(viewport:StaticViewport, sinceLastFrame:number):void;
}

class ViewportObject implements IRenderable {
    x:number;
    y:number;
    viewport:StaticViewport;
    renderingFinished:boolean;
    constructor(options:{x:number,y:number}) {
        this.x = options.x;
        this.y = options.y;
    }

    render(viewport:StaticViewport, sinceLastFrame:number) {
        this.update(sinceLastFrame);
    }

    update(sinceLastFrame:number) {
    }
}


type BoxOptions = {x:number,y:number,size:number};

class RotatingBox extends ViewportObject {
    options:BoxOptions;
    renderingFinished:boolean;
    viewport:StaticViewport;
    angle:number;
    constructor(options:BoxOptions) {
        super(options);
        this.options = options || {};
        this.renderingFinished = false;
        this.angle = 0;
    }

    render(viewport:StaticViewport, sinceLastFrame:number) {
        super.render(viewport, sinceLastFrame);

        viewport.context.fillStyle = "#ff8888";
        viewport.context.save();
        viewport.context.translate(this.options.x, this.options.y);
        viewport.context.rotate(this.angle);
        viewport.context.fillRect(-this.options.size/2, -this.options.size/2, this.options.size, this.options.size);
        viewport.context.restore();
    }

    update(sinceLastFrame) {
        this.angle += (sinceLastFrame / 1000) * Math.PI * 0.25;
    }
}

window.StaticViewport = StaticViewport;
window.RotatingBox = RotatingBox;
