import ejs  from "ejs";
import path from "path";
import http from "http";

import ApiSerivice from './Api.service';

export default class {
    constructor(mongoose) {
        this._apiService = new ApiSerivice(mongoose);
        this._Endpoints = mongoose.models.Endpoints;
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

    hasPermission(req) {
        return req._remoteAddress === '127.0.0.1';
    }

    updateOrCreateEndpoints(apiAlias, endpoints) {
        endpoints.forEach(endpoint => {

            this._Endpoints.findOneAndUpdate({
                _apiAlias: apiAlias,
                name     : endpoint.name,
                path     : endpoint.path,
                method   : endpoint.method
            }, {}, {upsert: true}, () => {});
        });
    }

    syncRoutes(req, res, apiAlias) {
        if (!this.hasPermission(req))
            return this.error(req, res, 403, 'FORBIDDEN', 'This action can only be called locally');

        return this._apiService.getApi(apiAlias)
            .then(api => {
                if (!api) return res.end('API NOT FOUND');

                return http.get(api.baseUrl, apiEndpointRequest => {
                        if (apiEndpointRequest.statusCode === 200) {

                            const chunks = [];

                            return apiEndpointRequest.on('data', chunk => chunks.push(chunk)).on('end', () => {
                                this.updateOrCreateEndpoints(apiAlias, JSON.parse(Buffer.concat(chunks).toString()).data);
                                return res.end('OK');
                            });
                        }

                        return res.end('ERROR - request status ' + apiEndpointRequest.statusCode);
                    }
                );
            });
    }

    clearCache(req, res, cacheService) {
        if (!this.hasPermission(req))
            return this.error(req, res, 403, 'FORBIDDEN', 'This action can only be called locally');

        cacheService.clear();
        return res.end('OK');
    }
}