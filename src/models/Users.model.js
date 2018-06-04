import mongoose from 'mongoose';

const {SchemaTypes} = mongoose;

export default {
    collection: 'Users',
    fields    : {
        name      : {
            type     : String,
            required : true,
            lowercase: true
        },
        email     : {
            type     : String,
            required : true,
            lowercase: true,
            unique   : true
        },
        password  : {
            type    : String,
            required: true
        },
        _aclId    : {
            type    : SchemaTypes.ObjectId,
            required: true
        },
        isVerified: {
            type    : Boolean,
            required: false,
            default : false
        },
        isAdmin   : {
            type    : Boolean,
            required: false,
            default : false
        }
    }
}