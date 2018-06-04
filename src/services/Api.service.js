export default class {
    constructor(mongoose) {
        this._Apis = mongoose.models.Apis;
    }

    getApi(alias) {
        return this._Apis.findOne({alias: alias});
    }
}