/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Thu May 05 2016 13:51:44 GMT-0700 (PDT).
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of UpdateGLDMeta.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin UpdateGLDMeta.
     * @constructor
     */
    var UpdateGLDMeta = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    UpdateGLDMeta.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    UpdateGLDMeta.prototype = Object.create(PluginBase.prototype);
    UpdateGLDMeta.prototype.constructor = UpdateGLDMeta;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    UpdateGLDMeta.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this;
	var attr_regex = /(?:(\w+)\s([\w]+)(\[\S+\])?;)|(?:(?:enumeration|set)\s\{([\S ]+)\}\s(\w+);)/gm;
	var enum_set_regex = /(\w+)=(\d+)/gi;
	var class_regex = /class (\w+) {/gm;

	// create: object(fco?), parent (src,dst), 

	// set METAAspectSet of the ROOT node (means it is META)
	//  adds to the meta sheet
	//   : core.addMember(self.rootNode, 'MetaAspectSet', node)
	//  adds to a tab of the meta sheet
	//   : var set = self.core.getSetNames(self.rootNode).find(name => name !== 'MetaAspectSet');
	//   : core.addMember(this.rootNode, set, node);

	// need to position the nodes in the meta sheet!
	
	// means we can create meta-sheets for each of the loaded files! :D

	// core.setAspectMetaTarget(node, name, target)

	// core.createNode({parent:, base:})

	// core.getFCO(node)
	// core.getAllMetaNodes(node)
	// core.getChildrenMeta(node)
	// core.getAttributeNames(node)
	// core.getAttributeMeta(node, name)
	// core.getBase(node)
	// core.getBaseType(node)
	// core.getPointerNames(node)
	// core.getPointerMeta(node, name)
	// core.getRegistryNames(node)
	// core.getRegistry(node, name)
	// core.getSetNames(node)
	
	// core.setAttribute(node, name, value)
	// core.setAttributeMeta(node, name, rule)
	//   rule : { type: string | integer | float | bool, enum: [string] }
	// core.setPointerMetaTarget(node, name, target, min, max)
	// core.setChildMeta(node, child, min, max)
	// core.setBase(node, base)
	// core.setRegistry(node, 'position', {x: , y:})

        self.result.setSuccess(true);
        callback(null, self.result);
    };

    return UpdateGLDMeta;
});
