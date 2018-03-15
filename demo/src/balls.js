// @flow
import * as Viewport from '../lib/sailcloth'

export class App {
    viewport:any;
    center:{x:number,y:number};
    balls:Object[];
    constructor() {
        
        var element = document.getElementById('canvas')
        this.viewport = new Viewport.Viewport(element, {
            onRedraw: v => {
                for(var ball of this.balls) {
                    for(var targetBall of this.balls) {
                        if(ball == targetBall) {
                            continue;
                        }

                        var dist = ball.distTo(targetBall);

                        if(dist < 100) {
                            ball.color = 'red';
                        } else {
                            ball.color = '#fd4';
                        }
                    }
                }
            }
        });

        this.center = this.viewport.center;
        this.viewport.start();
        this.balls = this.balls || [];
        
        setInterval(() => {
            this.addBall();

            if(this.viewport.averageFrameDuration > 50) {
                this.removeBall();
                this.removeBall();
            }
        }, 100);

        setInterval(() => {
            document.getElementById('ball-count').innerHTML = this.balls.length.toString();
            document.getElementById('frame-ms').innerHTML = this.viewport.averageFrameDuration;
        }, 1000);
    }

    addBall() {
        var b = new BouncingBall({x: this.center.x, y: this.center.y});
        this.balls.push(b);
        this.viewport.add(b);
    }

    removeBall() {
        var b = this.balls.shift();
        b.renderingFinished = true;
    }
}

class BouncingBall extends Viewport.ViewportObject {
    xv:number;
    yv:number;
    color:string;
    constructor(options) {
        super(options);
        this.color = '#fd4';
        this._initVelocity(150);
    }

    _initVelocity(max:number) {
        this.xv = this.randomRange(-max, max);
        this.yv = this.randomRange(-max, max);
    }

    // put this somewhere better?
    randomRange(from:number, to:number):number {
         return (to - from) * Math.random() + from;
    }

    distTo(o) {
        return Math.sqrt(Math.pow(o.x - this.x, 2) + Math.pow(o.y - this.y, 2));
    }

    render(viewport:Viewport.Viewport, sinceLastFrame:number) {
        super.render(viewport, sinceLastFrame);
        viewport.context.fillStyle = this.color;
        viewport.context.beginPath();
        viewport.context.arc(this.x, this.y, 6.0, 0, Math.PI*2);
        viewport.context.fill();
    }

    update(sinceLastFrame:number) {
        this.x += this.xv * (sinceLastFrame / 1000);
        this.y += this.yv * (sinceLastFrame / 1000);

        if(this.viewport) {
            if(this.y > this.viewport._height || this.y < 0) {
                this.xv *= ( 1 * this.randomRange(0.80, 1.20));
                this.yv *= (-1 * this.randomRange(0.80, 1.20));
            }

            if(this.x > this.viewport._width || this.x < 0) {
                this.xv *= (-1 * this.randomRange(0.80, 1.20));
                this.yv *= ( 1 * this.randomRange(0.80, 1.20));
            }

            if(this.y > this.viewport._height) {
                this.y = this.viewport._height - 1;
            }

            if(this.y < 0) {
                this.y = 0 + 1;
            }

            if(this.x > this.viewport._width) {
                this.x = this.viewport._width - 1;
            }

            if(this.x < 0) {
                this.x = 0 + 1;
            }

        }
    }
}
