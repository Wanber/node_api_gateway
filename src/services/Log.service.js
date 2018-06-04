export default class {
    constructor(mongoose) {
        this._Logs = mongoose.models.Logs;
    }

    save(log) {
        if (log.response.headers == null) log.isCachedResponse = true;

        return this._Logs.create(log);
    }
}