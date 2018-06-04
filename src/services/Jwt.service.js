import jwt from 'jsonwebtoken';

export default class {
    constructor() {
        this._environment = require('../config/env/' + process.env.NODE_ENV + '.env').default.jwt;

        /*console.log(this.createBearerToken({
            _id    : '5b0f356ecaa2c256d18a7c0a',
            _aclId : '5b0ffafecaa2c256d18a7c0b',
            isAdmin: true
        }));*/
    }

    createToken(payload) {
        return jwt.sign(payload, this._environment.key, {
            algorithm: this._environment.algorithm,
            expiresIn: this._environment.expiresIn
        });
    }

    verifyToken(token) {
        try {
            jwt.verify(token, this._environment.cert, {
                algorithms: [this._environment.algorithm]
            });

            return 'valid';
        } catch (e) {
            return e.name === 'TokenExpiredError' ? 'expired' : 'invalid';
        }
    }

    decodeToken(token) {
        return jwt.decode(token);
    }

    createBearerToken(payload) {
        return 'Bearer ' + this.createToken(payload);
    }

    verifyBearerToken(token) {
        return this.verifyToken(token.replace('Bearer ', ''));
    }

    decodeBearerToken(token) {
        return this.decodeToken(token.replace('Bearer ', ''));
    }
}