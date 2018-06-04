import mcache from "memory-cache";

export default class {
    constructor() {}

    set(key, value, expireSecs) {
        return mcache.put(key, value, expireSecs * 1000);
    }

    get(key) {
        return mcache.get(key);
    }

    clear() {
        return mcache.clear();
    }
}