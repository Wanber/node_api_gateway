import http   from "http";
import https  from "https";
import zlib   from "zlib";
import path   from "path";
import ejs    from "ejs";
import morgan from "morgan";

import ApiService      from "../services/Api.service";
import EndpointService from "../services/Endpoint.service";
import AuthService     from "../services/Auth.service";
import CacheService    from "../services/Cache.service";
import LogService      from "../services/Log.service";
import GatewayService  from "../services/Gateway.service";

export default class {
    constructor(environment, proxyServer, mongoose) {
        this._environment = environment;
        this._proxyServer = proxyServer;

        this._apiService = new ApiService(mongoose);
        this._endpointService = new EndpointService(mongoose);
        this._authService = new AuthService(mongoose);
        this._logService = new LogService(mongoose);
        this._gatewayService = new GatewayService(mongoose);

        this._cacheService = new CacheService();

        this._morgan = morgan(process.env.NODE_ENV === 'dev' ? 'dev' : 'combined');
    }

    create() {
        return new Promise(resolve => {

            http.createServer()
                .listen(this._environment.httpPort, this._environment.host)
                .on('request', (req, res) => this.handleReq(req, res))
                .on('error', err => this.handleError(err));

            if ('httpsPort' in this._environment)
                https.createServer(this._environment.ssl)
                    .listen(this._environment.httpsPort, this._environment.host)
                    .on('request', (req, res) => this.handleReq(req, res))
                    .on('error', err => this.handleError(err));

            this._proxyServer.on('proxyRes', (proxyRes, req, res) => this.handleProxyRes(proxyRes, req, res));

            return resolve();
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

    cachedResponse(req, res, cachedResponse) {
        if (req.endpoint.isLogEnabled)
            this.saveLog(req, res, cachedResponse.body);

        res.writeHead(200, {'Content-Type': cachedResponse.contentType});
        return res.end(cachedResponse.body);
    }

    saveLog(req, res, rawBody) {
        this._logService.save({
            _endpointId: req.endpoint._id,
            _userId    : 'tokenPayload' in req ? req.tokenPayload._id : null,
            request    : {
                query  : req.url.split('?')[1],
                body   : req.body || null, //body parser?
                headers: req.headers || null,
            },
            response   : {
                status : res.statusCode,
                body   : rawBody || null,
                headers: res.headers || null
            }
        });
    }

    setCache(req, proxyRes, rawBody) {
        this._cacheService.set(req.cacheId, {
            contentType: proxyRes.headers['content-type'],
            body       : rawBody.toString()
        }, req.endpoint.cacheTime);
    }

    handleProxyRes(proxyRes, req, res) {

        const chunks = [];

        proxyRes.on('data', part => chunks.push(part)).on('end', () => {

            if (proxyRes.headers['content-encoding'] === 'gzip') {
                zlib.gunzip(Buffer.concat(chunks), (err, rawBody) => {
                    if (!err) {
                        if (proxyRes.statusCode === 200 && req.endpoint.cacheTime > 0)
                            this.setCache(req, proxyRes, rawBody);

                        if (req.endpoint.isLogEnabled)
                            this.saveLog(req, proxyRes, rawBody);
                    }
                });

            } else {

                if (proxyRes.statusCode === 200 && req.endpoint.cacheTime > 0)
                    this.setCache(req, proxyRes, Buffer.concat(chunks));

                if (req.endpoint.isLogEnabled)
                    this.saveLog(req, proxyRes, Buffer.concat(chunks));
            }
        });
    }

    proxify(req, res) {
        req.url = '/' + req.url.split('/').splice(2).join('/');
        req.cacheId = 'api_' + req.api.alias + '_' + req.method + req.params + req.query + req.body + req.url;

        const cachedResponse = this._cacheService.get(req.cacheId);
        if (cachedResponse !== null) return this.cachedResponse(req, res, cachedResponse);

        return this._proxyServer.web(req, res, {target: req.api.baseUrl});
    }

    async checkPermission(req, res) {
        const tokenPayload = this._authService.getPayload(req.headers.authorization);

        req.tokenPayload = tokenPayload;

        if (!tokenPayload.isAdmin)
            if (!await this._authService.hasPermission(tokenPayload._aclId, req.endpoint._id))
                return this.error(req, res, 401, 'NOT AUTHORIZED', 'You don`t have permission to access this resource');

        return this.proxify(req, res);
    }

    checkAuthorization(req, res) {
        if (!req.endpoint.isPublic) {
            if (typeof req.headers.authorization === 'undefined')
                return this.error(req, res, 401, 'NOT AUTHORIZED', 'You need a authorization to access this resource');

            switch (this._authService.verifyAuthorization(req.headers.authorization)) {
                case 'valid':
                    return this.checkPermission(req, res);
                case 'expired':
                    return this.error(req, res, 401, 'TOKEN EXPIRED', 'You token has expired');
                default:
                    return this.error(req, res, 401, 'NOT AUTHORIZED', 'You token is invalid');
            }
        }

        return this.proxify(req, res);
    }

    checkEndpoint(req, res) {
        return this._endpointService.getEndpoint(req.api.alias, req.method, '/' + req.url.split('/').splice(2).join('/'))
            .then(endpoint => {

                if (!endpoint) return this.error(req, res, 404, 'RESOURCE NOT FOUND', 'This resource not exists');
                if (!endpoint.isEnabled) return this.error(req, res, 403, 'RESOURCE NOT ENABLED', 'This resource is disabled');

                req.endpoint = endpoint;

                return this.checkAuthorization(req, res);
            });
    }

    checkApi(req, res) {
        return this._apiService.getApi(req.url.split('/')[1])
            .then(api => {

                if (!api) return this.error(req, res, 404, 'API NOT FOUND', 'This API not exists');
                if (!api.isEnabled) return this.error(req, res, 403, 'API NOT ENABLED', 'This API is disabled');

                req.api = api;

                return this.checkEndpoint(req, res);
            });
    }

    checkInternalRoute(req, res) {
        switch (req.url.split('/')[1]) {
            case 'sync_routes':
                return this._gatewayService.syncRoutes(req, res, req.url.split('/')[2]);
            case 'clear_cache':
                return this._gatewayService.clearCache(req, res, this._cacheService);
            default:
                return this.checkApi(req, res);
        }
    }

    handleReq(req, res) {
        this._morgan(req, res, () => this.checkInternalRoute(req, res));
    }

    handleError(err) {
        console.log(err);
    }
}