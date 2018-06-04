import mongoose from 'mongoose';
import fs       from "fs";
import path     from "path";

import mongooseConfig from '../config/mongoose.conf';

export default class {
    constructor(environment) {
        this._environment = environment;

        this._setupMongoose();
        this._setupPlugins();
        this._setupModels();
    }

    _createMongooseUri() {

        const authSource = this._environment.authSource ? '&authSource=' + this._environment.authSource : '';
        const replicaSet = this._environment.replicaSet ? '&replicaSet=' + this._environment.replicaSet : '';
        const options = `ssl=${this._environment.ssl}${authSource}${replicaSet}`;

        let servers = '';

        this._environment.servers.forEach((server, key) =>
            servers += `${server.host}:${server.port}${key === this._environment.servers.length - 1 ? '' : ','}`
        );

        return 'user' in this._environment
            ? `${this._environment.driver}://${encodeURIComponent(this._environment.user)}:${encodeURIComponent(this._environment.pass)}@${servers}/${this._environment.database}?${options}`
            : `${this._environment.driver}://${servers}/${this._environment.database}?${options}`;
    }

    connect() {
        return mongoose.connect(this._createMongooseUri())
            .then(() => {return mongoose;});
    }

    _setupMongoose() {
        mongoose.Promise = global.Promise;

        Object.keys(mongooseConfig.mongooseOptions).forEach(key => {
            mongoose.set(key, mongooseConfig.mongooseOptions[key]);
        });
    }

    _setupPlugins() {
        mongooseConfig.plugins.forEach(plugin => {
            mongoose.plugin(require(plugin));
        });
    }

    _setupModels() {
        fs.readdirSync(path.join(__dirname, '../models')).forEach(filename => {

            const schemaDef = require(path.join(__dirname, '../models/', filename)).default;
            const defaultOptions = Object.assign(mongooseConfig.schemaOptions, {collection: schemaDef.collection});

            schemaDef.options = 'options' in schemaDef
                ? Object.assign(defaultOptions, schemaDef.options) : defaultOptions;

            const schema = new mongoose.Schema(schemaDef.fields, schemaDef.options);

            if ('pre' in schemaDef)
                Object.keys(schemaDef.pre).forEach(hook => {
                    schema.pre(hook, schemaDef.pre[hook]);
                });

            if ('post' in schemaDef)
                Object.keys(schemaDef.post).forEach(hook => {
                    schema.post(hook, schemaDef.post[hook]);
                });

            if ('indexes' in schemaDef)
                Object.keys(schemaDef.indexes).forEach(index => {
                    schema.index(schemaDef.indexes[index].fields, schemaDef.indexes[index].options);
                });

            mongoose.model(schemaDef.collection, schema);
        });
    }
}