import bcrypt     from 'bcrypt';
import JwtService from './Jwt.service';

export default class {
    constructor(mongoose) {
        this._environment = require('../config/env/' + process.env.NODE_ENV + '.env').default.auth;

        this._jwtService = new JwtService();
        this._Acls = mongoose.models.Acls;
    }

    verifyAuthorization(token, type = this._environment.tokenType) {
        switch (type) {
            case 'Bearer':
                return this._jwtService.verifyBearerToken(token);
            default:
                return 'invalid';
        }
    }

    getPayload(token, type = this._environment.tokenType) {
        switch (type) {
            case 'Bearer':
                return this._jwtService.decodeBearerToken(token);
            default:
                return {};
        }
    }

    async hasPermission(aclId, endpointId) {
        return await this._Acls.findOne({
            _id       : aclId,
            _endpoints: {$in: [endpointId]}
        }).exec() !== null;
    }

    async hash(value) {
        return await bcrypt.hash(value, this._environment.bcrypt.saltRounds);
    }

    async compare(value, hash) {
        return await bcrypt.compare(value, hash);
    }
}