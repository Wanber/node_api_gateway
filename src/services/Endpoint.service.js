import routePattern from 'route-pattern';

export default class {
    constructor(mongoose) {
        this._Endpoints = mongoose.models.Endpoints;
    }

    async getEndpoint(apiAlias, method, path) {

        const endpoints = await this._Endpoints.find({
            _apiAlias: apiAlias,
            method   : method
        }).exec();

        return endpoints.find(endpoint => routePattern.fromString(endpoint.path).matches(path));
    }
}