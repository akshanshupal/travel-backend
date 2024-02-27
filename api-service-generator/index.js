/**
 * Module dependencies
 */

var util = require("util");
var path = require("path");
var _ = require("@sailshq/lodash");

/**
 * @asp/sails-generate-api-service-generator
 *
 * Usage:
 * `sails generate api-service-generator`
 *
 * @description Generates a api-service-generator.
 * @docs https://sailsjs.com/docs/concepts/extending-sails/generators/custom-generators
 */

module.exports = {
    /**
     * `before()` is run before executing any of the `targets`
     * defined below.
     *
     * This is where we can validate user input, configure default
     * scope variables, get extra dependencies, and so on.
     *
     * @param  {Dictionary} scope
     * @param  {Function} done
     */

    before: function (scope, done) {
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // // scope.args are the raw command line arguments.
        // //
        // // e.g. if someone runs:
        // // $ sails generate api-service-generator user find create update
        // // then `scope.args` would be `['user', 'find', 'create', 'update']`
        // if (_.isUndefined(scope.args[0])) {
        //   return done(new Error('Please provide a name for this api-service-generator.'));
        // }
        // if (!_.isString(scope.args[0])) {
        //   return done(new Error('Expected a string for `scope.args[0]`, but instead got: '+util.inspect(scope.args[0],{depth: null})));
        // }
        //
        // // Provide defaults for the scope.
        // _.defaults(scope, {
        //   createdAt: new Date()
        // });
        //
        // // Decide the output filename for use in targets below:
        scope.filename = scope.args[0] + ".js";
        scope.urlSlug = scope.args[1];
        scope.mod = scope.args[0] + ".js";
        //
        // // Add other stuff to the scope for use in our templates:
        // scope.whatIsThis = 'an example file created at '+scope.createdAt;
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        // When finished, trigger the `done` callback to begin generating
        // files/folders as specified by the `targets` below.
        //
        // > Or call `done()` with an Error for first argument to signify a fatal error
        // > and halt generation of all targets.

        const firstArg = scope.args[0];
        if (typeof firstArg === "undefined") {
            return exits.error(
                `You did not provide a name for the model.${example}`
            );
        }

        if (typeof firstArg !== "string") {
            return exits.error(
                `The name you provided for the model is not a string.${example}`
            );
        }

        if (firstArg.includes("/")) {
            return exits.error(
                `The model name cannot contain a slash ("/") and you cannot specify a subfolder in which to generate the model.${example}`
            );
        }

        scope.modelName = firstArg.toLowerCase();
        scope.modelProperName = firstArg[0].toUpperCase() + firstArg.slice(1);
        scope.modelFileName = `${scope.modelProperName}.js`;
        scope.modelControllerFileName = `${scope.modelProperName}Controller.js`;
        scope.modelServiceFileName = `${scope.modelProperName}Service.js`;

        if (!scope.urlSlug) {
            scope.urlSlug = scope.modelName;
        }

        return done();
    },

    /**
     * The files/folders to generate.
     * @type {Dictionary}
     */
    targets: {
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // • e.g. create a folder:
        // ```
        // './hey_look_a_folder': { folder: {} }
        // ```
        //
        // • e.g. create a dynamically-named file relative to `scope.rootPath`
        // (defined by the `filename` scope variable).
        //
        // The `template` helper reads the specified template, making the
        // entire scope available to it (uses underscore/JST/ejs syntax).
        // Then the file is copied into the specified destination (on the left).
        // ```
        "./api/models/:modelFileName": { template: "Model.js" },
        "./api/controllers/:modelControllerFileName": {
            template: "ModelController.js",
        },
        "./api/services/:modelServiceFileName": { template: "ModelService.js" },
        // ```
        //
        // • See https://sailsjs.com/docs/concepts/extending-sails/generators for more documentation.
        // (Or visit https://sailsjs.com/support and talk to a maintainer of a core or community generator.)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    },

    /**
     * The absolute path to the `templates` for this generator
     * (for use with the `template` and `copy` builtins)
     *
     * @type {String}
     */
    templatesDirectory: path.resolve(__dirname, "./templates"),

    after: function (scope, done) {
        console.log(
            `Copy paste below routes to config/routes.js${scope.modelProperName}`
        );
        console.log(`****************************************\n`);
        console.log(
            `'POST /api/i/org/${scope.urlSlug}': '${scope.modelProperName}Controller.create',`
        );
        console.log(
            `'GET /api/i/org/${scope.urlSlug}': '${scope.modelProperName}Controller.find',`
        );
        console.log(
            `'GET /api/i/org/${scope.urlSlug}/:id': '${scope.modelProperName}Controller.findOne',`
        );
        console.log(
            `'PUT /api/i/org/${scope.urlSlug}/:id': '${scope.modelProperName}Controller.updateOne',`
        );
        console.log(
            `'DELETE /api/i/org/${scope.urlSlug}/:id': '${scope.modelProperName}Controller.deleteOne',`
        );
        console.log(`\n****************************************`);
        return done();
    },
};
