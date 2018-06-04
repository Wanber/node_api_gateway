export default {
    mongooseOptions: {},
    schemaOptions  : {
        timestamps       : true,
        runSettersOnQuery: true
    },
    plugins        : ['mongoose-beautiful-unique-validation']
};