export default {
    collection: 'Apis',
    fields    : {
        name     : {
            type     : String,
            required : true,
            lowercase: true
        },
        alias    : {
            type     : String,
            required : true,
            lowercase: true,
            unique   : true
        },
        baseUrl  : {
            type     : String,
            required : true,
            lowercase: true,
            unique   : true
        },
        isEnabled: {
            type    : Boolean,
            required: false,
            default : true
        }
    }
}