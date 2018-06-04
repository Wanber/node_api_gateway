import Mongoose    from './Mongoose';
import ProxyServer from './ProxyServer';
import WebServer   from './WebServer';
import Commands    from './Commands';

export default class {
    constructor(environment) {
        this._environment = environment;

        return new Mongoose(this._environment.mongoose).connect()
            .then(mongoose => {
                this._mongoose = mongoose;
                console.log('\x1b[35m[Mongoose] Connection success!\x1b[0m');

                return new ProxyServer(this._environment.proxy).create();
            })
            .then(proxyServer => {
                this._proxyServer = proxyServer;
                console.log('\x1b[35m[Proxy Server] Setup success!\x1b[0m');

                return new WebServer(this._environment.server, this._proxyServer, this._mongoose).create();
            })
            .then(() => {
                console.log(`\x1b[35m[Web Server] Setup success!\x1b[0m`);

                return new Commands();
            })
            .then(() => {
                console.log();
                console.log(`\x1b[32m[APP] API Gateway Online (${'httpsPort' in this._environment.server ? 'With SSL' : 'Without SSL'})\x1b[0m`);
                console.log();
            })
            .catch(err => {
                console.log(err);
                console.log('\x1b[31m[APP] Unexpected error, stopping application...\x1b[0m');
                process.exit(1);
            });
    }
}