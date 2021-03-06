(function (global, factory) {
 	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
 	typeof define === 'function' && define.amd ? define(['exports'], factory) :
 	(factory((global.DOBUKI = global.DOBUKI || {})));
 }(this, (function (core) { 'use strict';
    core.logScript();
    core.requireScripts([
        'setup.js',
        'objectdecoder.js',
        'loop.js',
    ]);
 
    var currentScript = core.getCurrentScript();
    
    var o = {
         position: {
            x:0, z:-3,
         },
         rotation:{},
         frame:{
             src: currentScript.path + "images/squid.png",
             cut:[0,0,32,32],
         },
    };
    var defaultModel = {
        objects: createModelObjects(1, 4,
            function(i) {
                 o.position.x = Math.sin(i + core.time/1000);
                 o.rotation.z = i*Math.PI/4+core.time/1000;
                 o.frame.cut[0] = (Math.floor(i+core.time/100)%2)*32;
                 o.frame.cut[1] = (Math.floor((i+core.time/100)/2)%2)*32;
                 return o;
            }
        ),
    };
     
    var model = defaultModel;
    
 
    /**
     *  FUNCTION DEFINITIONS
     */
    function setModel(value) {
        model = !value ? {} : core.decodeObject(value);
    }
    
    function getModel() {
        return model;
    }
    
    function createModelObjects(start, count, objectCallback) {
        var objects = new Proxy([], {
            get: (original, key) => {
                if(key==='length') {
                    return Math.max(start + count, original.length);
                } else if(!Number.isNaN(key)) {
                    return original[key] ? original[key] : objectCallback.call(objects,start + parseInt(key));
                }
            },
            set: (original, key, value, receiver) => {
                original[key] = value;
                return true;
            },
            get isGraphicModel() {
                return true;
            },
        });
        return objects;
    }
    
    function fetchValues(model, path) {
        return path.map(p => fetchValueHelper(model, p, 0));
    }
    
    function fetchValueHelper(model, path, index) {
        return index==path.length 
                ? model 
                : !model
                ? null
                : fetchValueHelper(model[path[index]], path, index+1)
    }
            
    function destroyEverything() {
        setModel(null);
    }
    
    function initialize() {
        var scripts = document.getElementsByTagName("script");
        for(var i=0; i<scripts.length; i++) {
            if(scripts[i].type.toLowerCase()=="text/dobuscript") {
                setModel(JSON.parse(scripts[i].textContent));
            }
        }
    }

    /**
     *  PUBLIC DECLARATIONS
     */
    core.setModel = setModel;
    core.getModel = getModel;
    core.createModelObjects = createModelObjects;
    core.fetchValues = fetchValues;
    core.destroyEverything = core.combineMethods(destroyEverything, core.destroyEverything);
    
    /**
     *   PROCESSES
     */
    Object.defineProperty(core, 'model', { get: getModel, set: setModel, enumerable: true } );

    core.makeProcess("initialize-model", initialize).waitFor("page-loaded").ignoreParameters(true);

    
    
 })));