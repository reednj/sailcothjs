// @flow

class App {
    constructor() {
        alert('hello');
    }
}

window.addEventListener('load', () => window._app = new App());

