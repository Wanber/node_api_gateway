import App from './core/App';

new App(require('./config/env/' + process.env.NODE_ENV + '.env').default);