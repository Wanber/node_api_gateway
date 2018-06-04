export default {
    collection: 'Endpoints',
    fields    : {
        name        : {
            type     : String,
            required : false,
            lowercase: true,
            default  : null
        },
        path        : {
            type     : String,
            required : true,
            lowercase: true
        },
        method      : {
            type    : String,
            enum    : ['GET', 'POST', 'PUT', 'UPDATE', 'OPTIONS', 'DELETE'],
            required: true
        },
        _apiAlias   : {
            type     : String,
            required : true,
            lowercase: true
        },
        cacheTime   : {
            type    : Number,
            required: false,
            min     : 0,
            max     : 86400,
            default : 0
        },
        isPublic    : {
            type    : Boolean,
            required: false,
            default : false
        },
        isLogEnabled: {
            type    : Boolean,
            required: false,
            default : false
        },
        isEnabled   : {
            type    : Boolean,
            required: false,
            default : true
        }
    },
    indexes   : [
        {
            fields : {
                path     : 1,
                _apiAlias: 1,
                method   : 1,
                isEnabled: 1
            },
            options: {
                unique: 'Já existe um endpoint ativo com esta configuração'
            }
        }
    ]
}