import httpProxy from "http-proxy";
import morgan    from "morgan";
import path      from "path";
import ejs       from "ejs";

export default class {
    constructor(environment) {
        this._environment = environment;

        this._morgan = morgan(process.env.NODE_ENV === 'dev' ? 'dev' : 'combined');
    }

    create() {
        return new Promise(resolve => {
            this._proxyServer = httpProxy.createProxyServer(this._environment);

            this._proxyServer.on('error', (err, req, res) => this.handleError(err, req, res));

            return resolve(this._proxyServer);
        });
    }

    error(req, res, code, message, explain = '') {

        if (req.headers.accept === 'application/json') {
            res.writeHead(code, {'Content-Type': 'application/json'});

            return res.end(JSON.stringify({status: code, error: message, message: explain}))
        }

        res.writeHead(code, {'Content-Type': 'text/html'});

        return ejs
            .renderFile(path.join(__dirname, '../views/error.template.ejs'), {
                error  : code,
                message: message,
                explain: explain
            })
            .then(page => {return res.end(page);})
            .catch(() => {return res.end(`${message} - ${explain}`);});
    };

    handleError(err, req, res) {
        if (err.message === 'socket hang up')
            return this.error(req, res, 408, 'REQUEST TIME OUT', 'Request reached the time limit');

        if (err.message.toString().includes('ECONNREFUSED'))
            return this.error(req, res, 503, 'API UNAVAILABLE', 'This API is currently offline');

        return this.error(req, res, 500, err.toString());
    }
}