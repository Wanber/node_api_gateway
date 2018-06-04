import mongoose from 'mongoose';

const {SchemaTypes} = mongoose;

export default {
    collection: 'Acls',
    fields    : {
        name      : {
            type     : String,
            required : true,
            lowercase: true
        },
        _endpoints: {
            type    : [SchemaTypes.ObjectId],
            required: true
        },
        _acls     : {
            type    : [SchemaTypes.ObjectId],
            required: true
        }
    },
    indexes   : [
        {
            fields : {
                name     : 1,
                _endpoint: 1,
                _acls    : 1
            },
            options: {
                unique: 'Já existe uma ACL com esta configuração'
            }
        }
    ]
}