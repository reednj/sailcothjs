// @flow

import { Renderable, WorldViewport, StaticViewport } from '../../src/viewport.flow'
import * as Box from './box.flow'

export class App {
    viewport:any;
    constructor() {
        let element = document.getElementById('canvas')

        // $FlowFixMe
        this.viewport = new WorldViewport(element);
        this.viewport.setCenter(0, 0);
        this.viewport.start();

        this.viewport.add(new Box.RotatingBox({ x: 0, y: 0, size: 50 }))
        this.viewport.add(new GridLines());
    }
}

class GridLines extends Renderable {
    zIndex:number;
    constructor() {
        super();
        this.zIndex = 10;
    }

    render(viewport:StaticViewport, sinceLastFrame:number) {
        if(viewport instanceof WorldViewport) {
            let bounds = viewport.getBounds();
            viewport.context.strokeStyle = "#ddd"
            viewport.context.lineWidth - 1.0;

            viewport.context.beginPath();
            viewport.context.moveTo(bounds.left, 0.5);
            viewport.context.lineTo(bounds.right, 0.5);
            viewport.context.stroke();

            viewport.context.beginPath();
            viewport.context.moveTo(0.5, bounds.top);
            viewport.context.lineTo(0.5, bounds.bottom);
            viewport.context.stroke();
        }
    }
}

