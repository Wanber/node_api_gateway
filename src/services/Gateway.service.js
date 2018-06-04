import ejs  from "ejs";
import path from "path";

export default class {
    constructor() {}

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

    hasPermission(req) {
        return req._remoteAddress === '127.0.0.1';
    }

    syncRoutes(req, res, apiAlias) {
        if (!this.hasPermission(req))
            return this.error(req, res, 403, 'FORBIDDEN', 'This action can only be called locally');

        console.log('sincronizando ', apiAlias);
        //ler rota / da api e sincronizar com o banco os endpoint retornados

        return res.end(apiAlias);
    }

    clearCache(req, res, cacheService) {
        if (!this.hasPermission(req))
            return this.error(req, res, 403, 'FORBIDDEN', 'This action can only be called locally');

        cacheService.clear();
        return res.end('OK');
    }
}