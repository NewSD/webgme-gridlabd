/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by AddOnGenerator 1.7.0 from webgme on Thu May 05 2016 13:39:24 GMT-0700 (PDT).
 */

define([
    'addon/AddOnBase'
], function (AddOnBase) {
    'use strict';

    /**
     * Initializes a new instance of AttributeConverter.
     * @class
     * @augments {AddOnBase}
     * @classdesc This class represents the addOn AttributeConverter.
     * @constructor
     */
    var AttributeConverter = function (mainLogger, gmeConfig) {
        // Call base class' constructor.
        AddOnBase.call(this, mainLogger, gmeConfig);
    };

    // Prototypal inheritance from AddOnBase.
    AttributeConverter.prototype = Object.create(AddOnBase.prototype);
    AttributeConverter.prototype.constructor = AttributeConverter;

    /**
     * Gets the name of the AttributeConverter.
     * @returns {string} The name of the AddOn.
     * @public
     */
    AttributeConverter.prototype.getName = function () {
        return 'AttributeConverter';
    };

    /**
     * Gets the semantic version (semver.org) of the AttributeConverter.
     * @returns {string} The version of the AddOn.
     * @public
     */
    AttributeConverter.prototype.getVersion = function () {
        return '0.1.0';
    };

    /**
     * This is invoked each time changes in the branch of the project are done. AddOns are allowed to make changes on
     * an update, but should not persist by themselves. (The AddOnManager will persist after each addOn has had its way
     * ordered by the usedAddOn registry in the rootNode).
     * Before each invocation a new updateResult is created which should be returned in the callback. There is no need
     * for the AddOn to report if it made changes or not, the monitor/manager will always persist and if there are no
     * changed objects - it won't commit to the storage.
     * @param {object} rootNode
     * @param {object} commitObj
     * @param {function(Error, AddOnUpdateResult)} callback
     */
    AttributeConverter.prototype.update = function (rootNode, commitObj, callback) {
        var newName = commitObj.updater.toString();
        this.logger.info('AttributeConverter in update at commitHash', commitObj._id);

        if (this.core.getAttribute(rootNode, 'name') !== newName) {
            this.logger.info('AttributeConverter changing name of root to committer(s): ', newName);
            //this.core.setAttribute(rootNode, 'name', newName);
            //this.addCommitMessage('Changed rootNode name to "' + newName + '"');
        }

        callback(null, this.updateResult);
    };

    /**
     * Called once when the addOn is started for the first time.
     * @param {object} rootNode
     * @param {object} commitObj
     * @param {function(Error, AddOnUpdateResult} callback
     */
    AttributeConverter.prototype.initialize = function (rootNode, commitObj, callback) {
        this.logger.info('AttributeConverter got initialized at commitHash', commitObj._id);

        this.update(rootNode, commitObj, callback);
    };

    return AttributeConverter;
});