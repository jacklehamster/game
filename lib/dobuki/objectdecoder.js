(function (global, factory) {
 	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
 	typeof define === 'function' && define.amd ? define(['exports'], factory) :
 	(factory((global.DOBUKI = global.DOBUKI || {})));
 }(this, (function (core) { 'use strict';
 
    var modelRegistrations = {};
 
    /**
     *  FUNCTION DEFINITIONS
     */
    function registerModel(name, callback) {
        modelRegistrations[name] = callback;
    }
     
    function decodeObject(object, parent, objectName) {
        if(typeof(object) === 'object') {
            for(var prop in object) {
                if(prop.indexOf("//")===0) {   //  any prop starting with // is a comment
                    delete object[prop];
                    continue;
                }
                if(modelRegistrations[prop]) {
                    var result = modelRegistrations[prop].call(parent, object, prop, parent, objectName);
                    if (typeof(result) !== 'undefined') {
                        return result;
                    }
                } else {
                    decodeObject(object[prop], object, prop);
                }
            }
        }
        return object;
    }
    
    function waitForContent(object, prop, parent, objectName, condition, callback) {
        var content = core.decodeObject(object[prop], object, prop);
        if (condition(content)) {
            return callback.call(parent,content);
        } else {
            function checkValue() {
                var content = core.decodeObject(object[prop], object, prop);
                if (condition(content)) {
                    core.stopWatch(prop, checkValue, object);
                    callback.call(parent,content);
                }
            }
            
            core.watchModel(prop, checkValue, object);
        }
    }

    function destroyEverything() {
        modelRegistrations = null;
    }
   
    /**
     *  PUBLIC DECLARATIONS
     */
    core.registerModel = registerModel;
    core.decodeObject = decodeObject;
    core.waitForContent = waitForContent;
    core.destroyEverything = core.combineMethods(destroyEverything, core.destroyEverything);
    
    /**
     *   PROCESSES
     */
    core.requireScripts(['setup.js','utils.js']);
    core.logScript();
 })));