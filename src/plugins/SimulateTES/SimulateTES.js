/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Thu May 12 2016 19:55:04 GMT-0500 (CDT).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'common/util/ejs', // for ejs templates
    'common/util/xmljsonconverter', // used to save model as json
    'plugin/SimulateTES/SimulateTES/Templates/Templates',
    'plugin/SimulateTES/SimulateTES/SimulateTES.Parser',
    'plugin/SimulateTES/SimulateTES/SimulateTES.Plotter',
    'gridlabd/meta',
    'gridlabd/modelLoader',
    'gridlabd/renderer',
    'q'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    ejs,
    Converter,
    TEMPLATES,
    Parser,
    Plotter,
    MetaTypes,
    loader,
    renderer,
    Q) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of SimulateTES.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin SimulateTES.
     * @constructor
     */
    var SimulateTES = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
        this.metaTypes = MetaTypes;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    SimulateTES.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    SimulateTES.prototype = Object.create(PluginBase.prototype);
    SimulateTES.prototype.constructor = SimulateTES;

    SimulateTES.prototype.notify = function(level, msg) {
	var self = this;
	var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
	if (level=='error')
	    self.logger.error(msg);
	else if (level=='debug')
	    self.logger.debug(msg);
	else if (level=='info')
	    self.logger.info(msg);
	else if (level=='warning')
	    self.logger.warn(msg);
	self.createMessage(self.activeNode, msg, level);
	self.sendNotification(prefix+msg);
    };

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    SimulateTES.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
        modelNode;

	self.result.success = false;

        if (typeof WebGMEGlobal !== 'undefined') {
	    var msg = 'You must run this plugin on the server!';
	    self.notify('error', msg);
	    callback(new Error(msg), self.result);
        }

	self.updateMETA(self.metaTypes);

	// What did the user select for our configuration?
	var currentConfig = self.getCurrentConfig();
	self.simulationTime = currentConfig.simulationTime;
	self.delayMean = currentConfig.delayMean;
	self.delayStdDev = currentConfig.delayStdDev;
	self.community1 = currentConfig.community1;
	self.community2 = currentConfig.community2;
	self.generator1 = currentConfig.generator1;
	self.generator2 = currentConfig.generator2;
	self.returnZip = currentConfig.returnZip;

        modelNode = self.activeNode;
	self.modelName = self.core.getAttribute(modelNode, 'name');
	self.fileName = self.modelName + '.glm';

	var path = require('path');
	var filendir = require('filendir');
	self.root_dir = path.join(process.cwd(), 
				  'generated', 
				  self.project.projectId, 
				  self.branchName,
				  'models');

	return loader.loadModel(self.core, modelNode, true, true)
	    .then(function(powerModel) {
		self.powerModel = powerModel;
	    })
	    .then(function() {
		return self.clean();
	    })
	    .then(function() {
		return self.renderModel();
	    })
	    .then(function() {
		return self.writeInputs();
	    })
	    .then(function() {
		return self.runSimulation();
	    })
	    .then(function() {
		return self.copyArtifacts();
	    })
	    .then(function() {
		return self.plotLogs();
	    })
	    .then(function() {
		self.result.success = true;
		self.notify('info', 'Simulation Complete.');
		callback(null, self.result);
	    })
	    .catch(function(err) {
		self.notify('error', err);
		self.result.success = false;
		callback(err, self.result);
	    });
    };

    SimulateTES.prototype.clean = function() {
	var self = this;
	var basePath = "/home/jeb/tesDemo/repo/c2wtng-fedimgs/dockerfeds/examples/TES2016Demo/Demo/";
	var cp = require('child_process');
	var deferred = Q.defer();

	var fedMgr = cp.spawn('bash', [], {cwd:basePath});
	fedMgr.stdout.on('data', function (data) {});
	fedMgr.stderr.on('data', function (error) {});
	fedMgr.on('exit', function (code) {
	    deferred.resolve();
	});
	setTimeout(function() {
	    self.notify('info', 'Cleaning experiment artifacts and processes from system.');
	    fedMgr.stdin.write('rm -rf input/*\n');
	    fedMgr.stdin.write('rm -rf output/*\n');
	    fedMgr.stdin.write('./kill-all.sh\n');
	    fedMgr.stdin.end();
	}, 1000);
	return deferred.promise;
    };

    SimulateTES.prototype.renderModel = function() {
	var self = this;
	self.fileData = renderer.renderGLM(self.powerModel, self.core, self.META);
    };

    SimulateTES.prototype.writeInputs = function() {
	var self = this,
	basePath = "/home/jeb/tesDemo/repo/c2wtng-fedimgs/dockerfeds/examples/TES2016Demo/Demo/input/",
	inputFiles = {
	    "model.glm": self.fileData,
	    "Community1DemandController.config": JSON.stringify({ "Threshold": +self.community1 }, null, 2),
	    "Community2DemandController.config": JSON.stringify({ "Threshold": +self.community2 }, null, 2),
	    "Generator1PriceController.config": JSON.stringify({ "Threshold": +self.generator1 }, null, 2),
	    "Generator2PriceController.config": JSON.stringify({ "Threshold": +self.generator2 }, null, 2),
	    "script.xml": ejs.render(
		TEMPLATES['script.xml.ejs'], 
		{ 
		    simEnd: self.simulationTime,
		    delayMean: self.delayMean,
		    delayStdDev: self.delayStdDev
		})
	},
	fs = require('fs'),
	path = require('path'),
	filendir = require('filendir');
	
	var fileNames = Object.keys(inputFiles);
	var tasks = fileNames.map((fileName) => {
	    var deferred = Q.defer();
	    var data = inputFiles[fileName];
	    filendir.writeFile(path.join(basePath, fileName), data, (err) => {
		if (err) {
		    deferred.reject('Couldnt write ' + fileName + ': ' + err);
		}
		else {
		    deferred.resolve();
		}
	    });
	    return deferred.promise;
	});

	return Q.all(tasks)
	    .then(function() {
		self.notify('info', 'Generated artifacts.');
	    });
    };

    SimulateTES.prototype.runSimulation = function() {
	var self = this;
	var path = require('path');
	var cp = require('child_process');

	self.notify('info', 'Starting Simulation');

	var deferred = Q.defer();

	var fname = path.join(self.root_dir, self.fileName);

	// start fed manager
	return self.startFederates()
	    .then(function() {
		return self.monitorContainers();
	    })
	    .then(function() {
		return self.killFederates();
	    });

	return deferred.promise;
    };

    SimulateTES.prototype.startFederates = function() {
	// run-cpp-feds.sh
	var self = this;
	var basePath = "/home/jeb/tesDemo/repo/c2wtng-fedimgs/dockerfeds/examples/TES2016Demo/Demo/";
	var cp = require('child_process');
	var deferred = Q.defer();

	var fedMgr = cp.spawn('bash', [], {cwd:basePath});
	fedMgr.stdout.on('data', function (data) {});
	fedMgr.stderr.on('data', function (error) {
	});
	fedMgr.on('exit', function (code) {
	    if (code == 0) {
		self.notify('info', 'Started Federates.');
		deferred.resolve(code);
	    }
	    else {
		deferred.reject('federates:: child process exited with code ' + code);
	    }
	});
	setTimeout(function() {
	    self.notify('info', 'Starting Federates.');
	    fedMgr.stdin.write('./run-cpp-feds.sh\n');
	    fedMgr.stdin.end();
	}, 1000);
	return deferred.promise;
    };

    SimulateTES.prototype.monitorContainers = function() {
	var self = this;
	var cp = require('child_process');
	var deferred = Q.defer();
	
	var stdout = cp.execSync('docker ps');
	var regex = /(demo_c2wt_cpp_fedmgr_run_[\w+]*)/gi;
	var results = regex.exec(stdout);
	if (results) {
	    var dockerName = results[1];
	    self.notify('info', 'Waiting for simulation to complete when ' + dockerName + ' exits.');
	    stdout = cp.execSync('docker wait ' + dockerName);
	    self.notify('info', 'Docker federate exited with stdout: ' + stdout);
	}
	else {
	    self.notify('error', 'Couldnt find the federate docker container in docker ps!');
	}
    };

    SimulateTES.prototype.killFederates = function() {
	// kill-all.sh
	var self = this;
	var basePath = "/home/jeb/tesDemo/repo/c2wtng-fedimgs/dockerfeds/examples/TES2016Demo/Demo/";
	var cp = require('child_process');
	var deferred = Q.defer();

	var stopFeds = cp.spawn('bash', [], {cwd:basePath});
	stopFeds.stdout.on('data', function (data) {});
	stopFeds.stderr.on('data', function (error) {
	});
	stopFeds.on('exit', function (code) {
	    if (code == 0) {
		self.notify('info', 'Killed all experiment feds.');
		deferred.resolve(code);
	    }
	    else {
		deferred.reject('stopFeds:: child process exited with code ' + code);
	    }
	});
	setTimeout(function() {
	    self.notify('info', 'Killing experiment feds.');
	    stopFeds.stdin.write('docker stop $(docker ps -a -q)\n');
	    stopFeds.stdin.end();
	}, 1000);
	return deferred.promise;
    };

    SimulateTES.prototype.copyArtifacts = function() {
	var self = this;
	var basePath = "/home/jeb/tesDemo/repo/c2wtng-fedimgs/dockerfeds/examples/TES2016Demo/Demo/output";
	
	self.notify('info', 'Copying output.');
	
	return new Promise(function(resolve, reject) {
	    var zlib = require('zlib'),
	    tar = require('tar'),
	    fstream = require('fstream'),
	    input = basePath;

	    var bufs = [];
	    var packer = tar.Pack()
		.on('error', function(e) { reject(e); });

	    var gzipper = zlib.Gzip()
		.on('error', function(e) { reject(e); })
		.on('data', function(d) { bufs.push(d); })
		.on('end', function() {
		    var buf = Buffer.concat(bufs);
		    self.blobClient.putFile('output.tar.gz',buf)
			.then(function (hash) {
			    self.result.addArtifact(hash);
			    resolve();
			})
			.catch(function(err) {
			    reject(err);
			})
			    .done();
		});

	    var reader = fstream.Reader({ 'path': input, 'type': 'Directory' })
		.on('error', function(e) { reject(e); });

	    reader
		.pipe(packer)
		.pipe(gzipper);
	})
	    .then(function() {
		self.notify('info', 'Created archive.');
	    });
    };

    SimulateTES.prototype.plotLogs = function() {
	var self = this;
	var path = require('path');
	var fs = require('fs');
	var basePath = "/home/jeb/tesDemo/repo/c2wtng-fedimgs/dockerfeds/examples/TES2016Demo/Demo/output";
	var controllers = [
	    "Community1DemandController",
	    "Community2DemandController",
	    "Generator1PriceController",
	    "Generator2PriceController"
	];

	self.notify('info', 'Plotting logs.');

	var tasks = controllers.map((controller) => {
	    var fileName = path.join(basePath, controller.toLowerCase(), controller + '.log');
	    var deferred = Q.defer();
	    // load the file
	    fs.readFile(fileName, (err, data) => {
		if (err) {
		    deferred.reject('Couldnt open ' + fileName + ': ' + err);
		    return;
		}
		var logData = Parser.getDataFromLog(data);
		Plotter.logger = self.logger;
		Plotter.plotData(logData)
		    .then((svgHtml) => {
			var resultFileName = controller + '.svg';
			self.blobClient.putFile(resultFileName, svgHtml)
			    .then((hash) => {
				self.result.addArtifact(hash);
				var resultUrl = '/rest/blob/download/' + hash + '/' + resultFileName;
				self.createMessage(self.activeNode, controller + ' log plot:' + svgHtml, 'info');
				deferred.resolve();
			    })
			    .catch((err) => {
				deferred.reject('Couldnt add ' + resultFileName +' to blob');
			    });
		    });
	    });
	    return deferred.promise;
	});
	return Q.all(tasks);
    };

    return SimulateTES;
});
