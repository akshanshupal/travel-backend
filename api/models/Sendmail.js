/**
 * Sendmail Model Schema
 *
 */

const { model } = require("mongoose");

module.exports = {

    attributes: {
        title: {
            type: 'string'
        },
        status: {
            type: 'boolean'
        },
        company: {
            model: 'company'
        },
        email:{
            type: 'string',

        },
        subject:{
            type: 'string',
        },
        html:{
            type: 'string',
        },
        emailFunction: {
            type: 'string'
        },
        primaryModel: {
            type : 'string'
        },
        modelId : {
            type: 'string'
        },
        sendBy:{
            model: 'user'
        },



    }
};
