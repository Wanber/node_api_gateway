import mongoose from 'mongoose';

const {SchemaTypes} = mongoose;

export default {
    collection: 'Logs',
    fields    : {
        _endpointId     : {
            type    : SchemaTypes.ObjectId,
            required: true
        },
        _userId         : {
            type    : SchemaTypes.ObjectId,
            required: false,
            default : null
        },
        isCachedResponse: {
            type    : Boolean,
            required: false,
            default : false
        },
        request         : {
            query  : {
                type     : String,
                required : false,
                lowercase: true,
                default  : null
            },
            body   : {
                type    : String,
                required: false,
                default : null
            },
            headers: {
                type    : SchemaTypes.Mixed,
                required: false,
                default : null
            }
        },
        response        : {
            status : {
                type    : Number,
                required: true
            },
            body   : {
                type    : String,
                required: false,
                default : null
            },
            headers: {
                type    : SchemaTypes.Mixed,
                required: false,
                default : null
            }
        }
    }
}