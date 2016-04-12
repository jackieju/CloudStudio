"no use strict";
;(function(window) {
if (typeof window.window != "undefined" && window.document) {
    return;
}

window.console = function() {
    var msgs = Array.prototype.slice.call(arguments, 0);
    postMessage({type: "log", data: msgs});
};
window.console.error =
window.console.warn = 
window.console.log =
window.console.trace = window.console;

window.window = window;
window.ace = window;

window.onerror = function(message, file, line, col, err) {
    console.error("Worker " + (err ? err.stack : message));
};

window.normalizeModule = function(parentId, moduleName) {
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return window.normalizeModule(parentId, chunks[0]) + "!" + window.normalizeModule(parentId, chunks[1]);
    }
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = (base ? base + "/" : "") + moduleName;
        
        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            moduleName = moduleName.replace(/^\.\//, "").replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }
    
    return moduleName;
};

window.require = function(parentId, id) {
    if (!id) {
        id = parentId;
        parentId = null;
    }
    if (!id.charAt)
        throw new Error("worker.js require() accepts only (parentId, id) as arguments");

    id = window.normalizeModule(parentId, id);

    var module = window.require.modules[id];
    if (module) {
        if (!module.initialized) {
            module.initialized = true;
            module.exports = module.factory().exports;
        }
        return module.exports;
    }
    
    var chunks = id.split("/");
    if (!window.require.tlns)
        return console.log("unable to load " + id);
    chunks[0] = window.require.tlns[chunks[0]] || chunks[0];
    var path = chunks.join("/") + ".js";
    
    window.require.id = id;
    importScripts(path);
    return window.require(parentId, id);
};
window.require.modules = {};
window.require.tlns = {};

window.define = function(id, deps, factory) {
    if (arguments.length == 2) {
        factory = deps;
        if (typeof id != "string") {
            deps = id;
            id = window.require.id;
        }
    } else if (arguments.length == 1) {
        factory = id;
        deps = [];
        id = window.require.id;
    }

    if (!deps.length)
        deps = ['require', 'exports', 'module'];

    if (id.indexOf("text!") === 0) 
        return;
    
    var req = function(childId) {
        return window.require(id, childId);
    };

    window.require.modules[id] = {
        exports: {},
        factory: function() {
            var module = this;
            var returnExports = factory.apply(this, deps.map(function(dep) {
              switch(dep) {
                  case 'require': return req;
                  case 'exports': return module.exports;
                  case 'module':  return module;
                  default:        return req(dep);
              }
            }));
            if (returnExports)
                module.exports = returnExports;
            return module;
        }
    };
};
window.define.amd = {};

window.initBaseUrls  = function initBaseUrls(topLevelNamespaces) {
    require.tlns = topLevelNamespaces;
};

window.initSender = function initSender() {

    var EventEmitter = window.require("ace/lib/event_emitter").EventEmitter;
    var oop = window.require("ace/lib/oop");
    
    var Sender = function() {};
    
    (function() {
        
        oop.implement(this, EventEmitter);
                
        this.callback = function(data, callbackId) {
            postMessage({
                type: "call",
                id: callbackId,
                data: data
            });
        };
    
        this.emit = function(name, data) {
            postMessage({
                type: "event",
                name: name,
                data: data
            });
        };
        
    }).call(Sender.prototype);
    
    return new Sender();
};

window.inspect = function (obj){
	var props = "";

	var type = typeof(obj);
	if (type == "string" || type == "number" || type == "boolean")
		return obj+"["+typeof(obj)+"]";
     
	for(var p in obj){

         if(typeof(obj[p])=="function"){
          // obj[p]();
			props += "function "+p+"()\n";
         }else{
           	props+="["+typeof(obj[p])+"]" +  p + "=" + obj[p] + "\n";
			// the recursive may cause dead loop
            // if (typeof(obj[p])=="object")
                    // props+="[\n"+inspect(obj[p])+"\n]\n";
					// props+="[\n"+obj[p]+"("+typeof(obj[p])+")\n]\n";
         }
     }

    // alert(props);
	return obj+"["+type+","+obj.length+"]:\n"+props;
}

var main = window.main = null;
var sender = window.sender = null;

window.onmessage = function(e) {
    var msg = e.data;
    if (msg.command) {
        if (main[msg.command])
            main[msg.command].apply(main, msg.args);
        else
            throw new Error("Unknown command:" + msg.command);
    }
    else if (msg.init) {        
        initBaseUrls(msg.tlns);
        require("ace/lib/es5-shim");
        sender = window.sender = initSender();
        var clazz = require(msg.module)[msg.classname];
        main = window.main = new clazz(sender);
    } 
    else if (msg.event && sender) {
        sender._signal(msg.event, msg.data);
    }
};
})(this);// https://github.com/kriskowal/es5-shim

define('ace/lib/es5-shim', ['require', 'exports', 'module' ], function(require, exports, module) {

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        var target = this;
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = slice.call(arguments, 1); // for normal call
        var bound = function () {

            if (this instanceof bound) {

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }
        return bound;
    };
}
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}
if ([1,2].splice(0).length != 2) {
    if(function() { // test IE < 9 to splice bug - see issue #138
        function makeArray(l) {
            var a = new Array(l+2);
            a[0] = a[1] = 0;
            return a;
        }
        var array = [], lengthBefore;
        
        array.splice.apply(array, makeArray(20));
        array.splice.apply(array, makeArray(26));

        lengthBefore = array.length; //46
        array.splice(5, 0, "XXX"); // add one element

        lengthBefore + 1 == array.length

        if (lengthBefore + 1 == array.length) {
            return true;// has right splice implementation without bugs
        }
    }()) {//IE 6/7
        var array_splice = Array.prototype.splice;
        Array.prototype.splice = function(start, deleteCount) {
            if (!arguments.length) {
                return [];
            } else {
                return array_splice.apply(this, [
                    start === void 0 ? 0 : start,
                    deleteCount === void 0 ? (this.length - start) : deleteCount
                ].concat(slice.call(arguments, 2)))
            }
        };
    } else {//IE8
        Array.prototype.splice = function(pos, removeCount){
            var length = this.length;
            if (pos > 0) {
                if (pos > length)
                    pos = length;
            } else if (pos == void 0) {
                pos = 0;
            } else if (pos < 0) {
                pos = Math.max(length + pos, 0);
            }

            if (!(pos+removeCount < length))
                removeCount = length - pos;

            var removed = this.slice(pos, pos+removeCount);
            var insert = slice.call(arguments, 2);
            var add = insert.length;            
            if (pos === length) {
                if (add) {
                    this.push.apply(this, insert);
                }
            } else {
                var remove = Math.min(removeCount, length - pos);
                var tailOldPos = pos + remove;
                var tailNewPos = tailOldPos + add - remove;
                var tailCount = length - tailOldPos;
                var lengthAfterRemove = length - remove;

                if (tailNewPos < tailOldPos) { // case A
                    for (var i = 0; i < tailCount; ++i) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } else if (tailNewPos > tailOldPos) { // case B
                    for (i = tailCount; i--; ) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } // else, add == remove (nothing to do)

                if (add && pos === lengthAfterRemove) {
                    this.length = lengthAfterRemove; // truncate array
                    this.push.apply(this, insert);
                } else {
                    this.length = lengthAfterRemove + add; // reserves space
                    for (i = 0; i < add; ++i) {
                        this[pos+i] = insert[i];
                    }
                }
            }
            return removed;
        };
    }
}
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;
        descriptor =  { enumerable: true, configurable: true };
        if (supportsAccessors) {
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;
                return descriptor;
            }
        }
        descriptor.value = object[property];
        return descriptor;
    };
}
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}
if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        createEmpty = function () {
            var empty = {};
            for (var i in empty)
                empty[i] = null;
            empty.constructor =
            empty.hasOwnProperty =
            empty.propertyIsEnumerable =
            empty.isPrototypeOf =
            empty.toLocaleString =
            empty.toString =
            empty.valueOf =
            empty.__proto__ = null;
            return empty;
        }
    }

    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
    }
}
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
            }
        }
        if (owns(descriptor, "value")) {

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                delete object[property];
                object[property] = descriptor.value;
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}
if (!Object.seal) {
    Object.seal = function seal(object) {
        return object;
    };
}
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        return object;
    };
}
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        return object;
    };
}
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}
if (!Object.keys) {
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

}); 

define('ace/mode/ruby_worker', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/worker/mirror', 'ace/mode/ruby/ruby'], function(require, exports, module) {


var oop = require("../lib/oop");
var Mirror = require("../worker/mirror").Mirror;
var RUBY = require("./ruby/ruby").RUBY;

var RubyWorker = exports.RubyWorker = function(sender) {
    Mirror.call(this, sender);
    this.setTimeout(500);
};

oop.inherits(RubyWorker, Mirror);

(function() {
    this.setOptions = function(opts) {
        // this.inlinePhp = opts && opts.inline;
    };

    this.onUpdate = function() {
	console.log("onupdate ruby");
        var value = this.doc.getValue();
        var errors = [];


        try {
	console.log("parse ruby");


	 	
	var s = "";
		{
				obj = RUBY;
			var props = "";

		var type = typeof(obj);
		if (type == "string" || type == "number" || type == "boolean")
			return obj+"["+typeof(obj)+"]";

		for(var p in obj){

	         if(typeof(obj[p])=="function"){
	          // obj[p]();
				// props += "function "+p+"()\n";
	         }else{
	           	props+="["+typeof(obj[p])+"]" +  p + "=" + obj[p] + "\n";
				// the recursive may cause dead loop
	            // if (typeof(obj[p])=="object")
	                    // props+="[\n"+inspect(obj[p])+"\n]\n";
	         }
	     }

	    // alert(props);
		 s= obj+"["+typeof(obj)+"]:\n"+props;
		}
	console.log(s);
	console.log("type is "+ typeof(RUBY.parse));
	console.log(inspect(RUBY.lexer));
            RUBY.parse(value);
        } catch(e) {
		console.log(" ruby error, line "+ e.line + ", "+e.message+"\n"+e.stack);
            errors.push({
                row: e.line - 1,
                column: null,
                text: e.message.charAt(0).toUpperCase() + e.message.substring(1),
                type: "error"
            });
        }

        if (errors.length) {
            this.sender.emit("error", errors);
        } else {
            this.sender.emit("ok");
        }
    };

}).call(RubyWorker.prototype);

});

define('ace/lib/oop', ['require', 'exports', 'module' ], function(require, exports, module) {


exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj;
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});
define('ace/worker/mirror', ['require', 'exports', 'module' , 'ace/document', 'ace/lib/lang'], function(require, exports, module) {


var Document = require("../document").Document;
var lang = require("../lib/lang");
    
var Mirror = exports.Mirror = function(sender) {
    this.sender = sender;
    var doc = this.doc = new Document("");
    
    var deferredUpdate = this.deferredUpdate = lang.delayedCall(this.onUpdate.bind(this));
    
    var _self = this;
    sender.on("change", function(e) {
        doc.applyDeltas(e.data);
        if (_self.$timeout)
            return deferredUpdate.schedule(_self.$timeout);
        _self.onUpdate();
    });
};

(function() {
    
    this.$timeout = 500;
    
    this.setTimeout = function(timeout) {
        this.$timeout = timeout;
    };
    
    this.setValue = function(value) {
        this.doc.setValue(value);
        this.deferredUpdate.schedule(this.$timeout);
    };
    
    this.getValue = function(callbackId) {
        this.sender.callback(this.doc.getValue(), callbackId);
    };
    
    this.onUpdate = function() {
    };
    
    this.isPending = function() {
        return this.deferredUpdate.isPending();
    };
    
}).call(Mirror.prototype);

});

define('ace/document', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter', 'ace/range', 'ace/anchor'], function(require, exports, module) {


var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Anchor = require("./anchor").Anchor;

var Document = function(text) {
    this.$lines = [];
    if (text.length === 0) {
        this.$lines = [""];
    } else if (Array.isArray(text)) {
        this._insertLines(0, text);
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);
    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length === 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        };
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        this.$autoNewLine = match ? match[1] : "\n";
        this._signal("changeNewLineMode");
    };
    this.getNewLineCharacter = function() {
        switch (this.$newLineMode) {
          case "windows":
            return "\r\n";
          case "unix":
            return "\n";
          default:
            return this.$autoNewLine || "\n";
        }
    };

    this.$autoNewLine = "";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
        this._signal("changeNewLineMode");
    };
    this.getNewLineMode = function() {
        return this.$newLineMode;
    };
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };
    this.getLength = function() {
        return this.$lines.length;
    };
    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.getLine(range.start.row)
                .substring(range.start.column, range.end.column);
        }
        var lines = this.getLines(range.start.row, range.end.row);
        lines[0] = (lines[0] || "").substring(range.start.column);
        var l = lines.length - 1;
        if (range.end.row - range.start.row == l)
            lines[l] = lines[l].substring(0, range.end.column);
        return lines.join(this.getNewLineCharacter());
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        } else if (position.row < 0)
            position.row = 0;
        return position;
    };
    this.insert = function(position, text) {
        if (!text || text.length === 0)
            return position;

        position = this.$clipPosition(position);
        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var lines = this.$split(text);
        var firstLine = lines.splice(0, 1)[0];
        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

        position = this.insertInLine(position, firstLine);
        if (lastLine !== null) {
            position = this.insertNewLine(position); // terminate first line
            position = this._insertLines(position.row, lines);
            position = this.insertInLine(position, lastLine || "");
        }
        return position;
    };
    this.insertLines = function(row, lines) {
        if (row >= this.getLength())
            return this.insert({row: row, column: 0}, "\n" + lines.join("\n"));
        return this._insertLines(Math.max(row, 0), lines);
    };
    this._insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};
        while (lines.length > 0xF000) {
            var end = this._insertLines(row, lines.slice(0, 0xF000));
            lines = lines.slice(0xF000);
            row = end.row;
        }

        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);

        var range = new Range(row, 0, row + lines.length, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._signal("change", { data: delta });
        return range.end;
    };
    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

        var end = {
            row : position.row + 1,
            column : 0
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._signal("change", { data: delta });

        return end;
    };
    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;

        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._signal("change", { data: delta });

        return end;
    };
    this.remove = function(range) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;

        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
            var lastFullRow = lastRow - 1;

            if (range.end.column > 0)
                this.removeInLine(lastRow, 0, range.end.column);

            if (lastFullRow >= firstFullRow)
                this._removeLines(firstFullRow, lastFullRow);

            if (firstFullRow != firstRow) {
                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                this.removeNewLine(range.start.row);
            }
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };
    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;

        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);

        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._signal("change", { data: delta });
        return range.start;
    };
    this.removeLines = function(firstRow, lastRow) {
        if (firstRow < 0 || lastRow >= this.getLength())
            return this.remove(new Range(firstRow, 0, lastRow + 1, 0));
        return this._removeLines(firstRow, lastRow);
    };

    this._removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow + 1, 0);
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._signal("change", { data: delta });
        return removed;
    };
    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);

        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;

        this.$lines.splice(row, 2, line);

        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._signal("change", { data: delta });
    };
    this.replace = function(range, text) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        if (text.length == 0 && range.isEmpty())
            return range.start;
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }

        return end;
    };
    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text);
            else if (delta.action == "removeLines")
                this._removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "removeText")
                this.remove(range);
        }
    };
    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];

            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this._removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "insertText")
                this.remove(range);
            else if (delta.action == "removeLines")
                this._insertLines(range.start.row, delta.lines);
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text);
        }
    };
    this.indexToPosition = function(index, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        for (var i = startRow || 0, l = lines.length; i < l; i++) {
            index -= lines[i].length + newlineLength;
            if (index < 0)
                return {row: i, column: index + lines[i].length + newlineLength};
        }
        return {row: l-1, column: lines[l-1].length};
    };
    this.positionToIndex = function(pos, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        var index = 0;
        var row = Math.min(pos.row, lines.length);
        for (var i = startRow || 0; i < row; ++i)
            index += lines[i].length + newlineLength;

        return index + pos.column;
    };

}).call(Document.prototype);

exports.Document = Document;
});

define('ace/lib/event_emitter', ['require', 'exports', 'module' ], function(require, exports, module) {


var EventEmitter = {};
var stopPropagation = function() { this.propagationStopped = true; };
var preventDefault = function() { this.defaultPrevented = true; };

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    if (typeof e != "object" || !e)
        e = {};

    if (!e.type)
        e.type = eventName;
    if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
    if (!e.preventDefault)
        e.preventDefault = preventDefault;

    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
};


EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
        return;
    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++)
        listeners[i](e, this);
};

EventEmitter.once = function(eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
        _self.removeEventListener(eventName, newCallback);
        callback.apply(null, arguments);
    });
};


EventEmitter.setDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        handlers = this._defaultHandlers = {_disabled_: {}};
    
    if (handlers[eventName]) {
        var old = handlers[eventName];
        var disabled = handlers._disabled_[eventName];
        if (!disabled)
            handlers._disabled_[eventName] = disabled = [];
        disabled.push(old);
        var i = disabled.indexOf(callback);
        if (i != -1) 
            disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
};
EventEmitter.removeDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        return;
    var disabled = handlers._disabled_[eventName];
    
    if (handlers[eventName] == callback) {
        var old = handlers[eventName];
        if (disabled)
            this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
        var i = disabled.indexOf(callback);
        if (i != -1)
            disabled.splice(i, 1);
    }
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
    return callback;
};

EventEmitter.off =
EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
};

exports.EventEmitter = EventEmitter;

});

define('ace/range', ['require', 'exports', 'module' ], function(require, exports, module) {

var comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};
var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {
    this.isEqual = function(range) {
        return this.start.row === range.start.row &&
            this.end.row === range.end.row &&
            this.start.column === range.start.column &&
            this.end.column === range.end.column;
    };
    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };
    this.compareRange = function(range) {
        var cmp,
            end = range.end,
            start = range.start;

        cmp = this.compare(end.row, end.column);
        if (cmp == 1) {
            cmp = this.compare(start.row, start.column);
            if (cmp == 1) {
                return 2;
            } else if (cmp == 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (cmp == -1) {
            return -2;
        } else {
            cmp = this.compare(start.row, start.column);
            if (cmp == -1) {
                return -1;
            } else if (cmp == 1) {
                return 42;
            } else {
                return 0;
            }
        }
    };
    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    };
    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function(range) {
        var cmp = this.compareRange(range);
        return (cmp == -1 || cmp == 0 || cmp == 1);
    };
    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    };
    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    };
    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    };
    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    };
    this.inside = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column) || this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideStart = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideEnd = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow)
            var end = {row: lastRow + 1, column: 0};
        else if (this.end.row < firstRow)
            var end = {row: firstRow, column: 0};

        if (this.start.row > lastRow)
            var start = {row: lastRow + 1, column: 0};
        else if (this.start.row < firstRow)
            var start = {row: firstRow, column: 0};

        return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row === this.end.row && this.start.column === this.end.column);
    };
    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };
    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };
    this.toScreenRange = function(session) {
        var screenPosStart = session.documentToScreenPosition(this.start);
        var screenPosEnd = session.documentToScreenPosition(this.end);

        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };
    this.moveBy = function(row, column) {
        this.start.row += row;
        this.start.column += column;
        this.end.row += row;
        this.end.column += column;
    };

}).call(Range.prototype);
Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};
Range.comparePoints = comparePoints;

Range.comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};


exports.Range = Range;
});

define('ace/anchor', ['require', 'exports', 'module' , 'ace/lib/oop', 'ace/lib/event_emitter'], function(require, exports, module) {


var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

var Anchor = exports.Anchor = function(doc, row, column) {
    this.$onChange = this.onChange.bind(this);
    this.attach(doc);
    
    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);
};

(function() {

    oop.implement(this, EventEmitter);
    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
    this.getDocument = function() {
        return this.document;
    };
    this.$insertRight = false;
    this.onChange = function(e) {
	console.log("change pos");
        var delta = e.data;
        var range = delta.range;

        if (range.start.row == range.end.row && range.start.row != this.row)
            return;

        if (range.start.row > this.row)
            return;

        if (range.start.row == this.row && range.start.column > this.column)
            return;

        var row = this.row;
        var column = this.column;
        var start = range.start;
        var end = range.end;

        if (delta.action === "insertText") {
            if (start.row === row && start.column <= column) {
                if (start.column === column && this.$insertRight) {
                } else if (start.row === end.row) {
                    column += end.column - start.column;
                } else {
                    column -= start.column;
                    row += end.row - start.row;
                }
            } else if (start.row !== end.row && start.row < row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "insertLines") {
            if (start.row === row && column === 0 && this.$insertRight) {
            }
            else if (start.row <= row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "removeText") {
            if (start.row === row && start.column < column) {
                if (end.column >= column)
                    column = start.column;
                else
                    column = Math.max(0, column - (end.column - start.column));

            } else if (start.row !== end.row && start.row < row) {
                if (end.row === row)
                    column = Math.max(0, column - end.column) + start.column;
                row -= (end.row - start.row);
            } else if (end.row === row) {
                row -= end.row - start.row;
                column = Math.max(0, column - end.column) + start.column;
            }
        } else if (delta.action == "removeLines") {
            if (start.row <= row) {
                if (end.row <= row)
                    row -= end.row - start.row;
                else {
                    row = start.row;
                    column = 0;
                }
            }
        }

        this.setPosition(row, column, true);
    };
    this.setPosition = function(row, column, noClip) {
        var pos;
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        } else {
            pos = this.$clipPositionToDocument(row, column);
        }

        if (this.row == pos.row && this.column == pos.column)
            return;

        var old = {
            row: this.row,
            column: this.column
        };

        this.row = pos.row;
        this.column = pos.column;
        this._signal("change", {
            old: old,
            value: pos
        });
    };
    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    this.attach = function(doc) {
        this.document = doc || this.document;
        this.document.on("change", this.$onChange);
    };
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};

        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }

        if (column < 0)
            pos.column = 0;

        return pos;
    };

}).call(Anchor.prototype);

});

define('ace/lib/lang', ['require', 'exports', 'module' ], function(require, exports, module) {


exports.last = function(a) {
    return a[a.length - 1];
};

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function (obj) {
    if (typeof obj !== "object" || !obj)
        return obj;
    var cons = obj.constructor;
    if (cons === RegExp)
        return obj;
    
    var copy = cons();
    for (var key in obj) {
        if (typeof obj[key] === "object") {
            copy[key] = exports.deepCopy(obj[key]);
        } else {
            copy[key] = obj[key];
        }
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};
exports.deferredCall = function(fcn) {

    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };
    
    deferred.isPending = function() {
        return timer;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};
});



define('ace/mode/ruby/ruby', ['require', 'exports', 'module' ], function(require, exports, module) {
	/* parser generated by jison 0.4.13 */
	/*
	  Returns a Parser object of the following structure:

	  Parser: {
	    yy: {}
	  }

	  Parser.prototype: {
	    yy: {},
	    trace: function(),
	    symbols_: {associative list: name ==> number},
	    terminals_: {associative list: number ==> name},
	    productions_: [...],
	    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
	    table: [...],
	    defaultActions: {...},
	    parseError: function(str, hash),
	    parse: function(input),

	    lexer: {
	        EOF: 1,
	        parseError: function(str, hash),
	        setInput: function(input),
	        input: function(),
	        unput: function(str),
	        more: function(),
	        less: function(n),
	        pastInput: function(),
	        upcomingInput: function(),
	        showPosition: function(),
	        test_match: function(regex_match_array, rule_index),
	        next: function(),
	        lex: function(),
	        begin: function(condition),
	        popState: function(),
	        _currentRules: function(),
	        topState: function(),
	        pushState: function(condition),

	        options: {
	            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
	            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
	            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
	        },

	        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
	        rules: [...],
	        conditions: {associative list: name ==> set},
	    }
	  }


	  token location info (@$, _$, etc.): {
	    first_line: n,
	    last_line: n,
	    first_column: n,
	    last_column: n,
	    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
	  }


	  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
	    text:        (matched text)
	    token:       (the produced terminal token, if any)
	    line:        (yylineno)
	  }
	  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
	    loc:         (yylloc)
	    expected:    (string describing the set of expected tokens)
	    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
	  }
	*/
	var ruby = (function(){
	var parser = {trace: function trace() { },
	yy: {},
	symbols_: {"error":2,"PROGRAM":3,"COMPSTMT":4,"STMT":5,"TERM":6,"EXPR":7,"CALL":8,"do":9,"|":10,"end":11,"undef":12,"FNAME":13,"alias":14,"if":15,"while":16,"unless":17,"until":18,"BEGIN":19,"{":20,"}":21,"END":22,"LHS":23,"=":24,"COMMAND":25,"MLHS":26,"MRHS":27,"return":28,"CALL_ARGS":29,"yield":30,"and":31,"or":32,"not":33,"!":34,"ARG":35,"FUNCTION":36,"OPERATION":37,"PRIMARY":38,".":39,"::":40,"super":41,"(":42,")":43,"OP_ASGN":44,"..":45,"...":46,"+":47,"-":48,"*":49,"/":50,"%":51,"**":52,"^":53,"&":54,"<=>":55,">":56,">=":57,"<":58,"<=":59,"==":60,"===":61,"!=":62,"=~":63,"!~":64,"~":65,"<<":66,">>":67,"&&":68,"||":69,"defined?":70,"LITERAL":71,"VARIABLE":72,"IDENTIFIER":73,"[":74,"]":75,"ARGS":76,",":77,"ASSOCS":78,"THEN":79,"elsif":80,"else":81,"DO":82,"case":83,"when":84,"WHEN_ARGS":85,"for":86,"BLOCK_VAR":87,"in":88,"begin":89,"rescue":90,"ensure":91,"class":92,"module":93,"def":94,"ARGDECL":95,"SINGLETON":96,"then":97,"MLHS_ITEM":98,"ARGLIST":99,"ASSOC":100,"=>":101,"VARNAME":102,"nil":103,"self":104,"numeric":105,"SYMBOL":106,"STRING":107,"STRING2":108,"HERE_DOC":109,"REGEXP":110,";":111,"\\n":112,"+=":113,"-=":114,"*=":115,"/=":116,"%=":117,"**=":118,"&=":119,"|=":120,"^=":121,"<<=":122,">>=":123,"&&=":124,"||=":125,":":126,"+@":127,"-@":128,"[]":129,"[]=":130,"?":131,"GLOBAL":132,"@":133,"$":134,"any_char":135,"\"":136,"any_char*":137,"\n\t\t|":138,"\n;\nSTRING2\t\t:":139,"Q":140,"q":141,"x":142,")char":143,"char\n{console.log(\">>>STRING2\");};\nHERE_DOC":144,"(IDENTIFIER|STRING)\n":145,"any_char*\n":146,"IDENTIFIER\n;\nREGEXP\t\t:":147,"i":148,"o":149,"p":150,"]\n\t\t|":151,"r":152,"char":153,"$accept":0,"$end":1},
	terminals_: {2:"error",9:"do",10:"|",11:"end",12:"undef",14:"alias",15:"if",16:"while",17:"unless",18:"until",19:"BEGIN",20:"{",21:"}",22:"END",24:"=",28:"return",30:"yield",31:"and",32:"or",33:"not",34:"!",39:".",40:"::",41:"super",42:"(",43:")",45:"..",46:"...",47:"+",48:"-",49:"*",50:"/",51:"%",52:"**",53:"^",54:"&",55:"<=>",56:">",57:">=",58:"<",59:"<=",60:"==",61:"===",62:"!=",63:"=~",64:"!~",65:"~",66:"<<",67:">>",68:"&&",69:"||",70:"defined?",73:"IDENTIFIER",74:"[",75:"]",77:",",80:"elsif",81:"else",83:"case",84:"when",86:"for",88:"in",89:"begin",90:"rescue",91:"ensure",92:"class",93:"module",94:"def",97:"then",101:"=>",103:"nil",104:"self",105:"numeric",108:"STRING2",109:"HERE_DOC",110:"REGEXP",111:";",112:"\\n",113:"+=",114:"-=",115:"*=",116:"/=",117:"%=",118:"**=",119:"&=",120:"|=",121:"^=",122:"<<=",123:">>=",124:"&&=",125:"||=",126:":",127:"+@",128:"-@",129:"[]",130:"[]=",131:"?",133:"@",134:"$",135:"any_char",136:"\"",137:"any_char*",138:"\n\t\t|",139:"\n;\nSTRING2\t\t:",140:"Q",141:"q",142:"x",143:")char",144:"char\n{console.log(\">>>STRING2\");};\nHERE_DOC",145:"(IDENTIFIER|STRING)\n",146:"any_char*\n",147:"IDENTIFIER\n;\nREGEXP\t\t:",148:"i",149:"o",150:"p",151:"]\n\t\t|",152:"r",153:"char"},
	productions_: [0,[3,1],[4,3],[5,6],[5,2],[5,3],[5,3],[5,3],[5,3],[5,3],[5,4],[5,4],[5,8],[5,1],[7,3],[7,2],[7,2],[7,3],[7,3],[7,2],[7,1],[7,2],[7,1],[8,1],[8,1],[25,2],[25,4],[25,4],[25,2],[36,3],[36,5],[36,5],[36,3],[36,3],[36,3],[36,1],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,2],[35,2],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,3],[35,2],[35,2],[35,3],[35,3],[35,3],[35,3],[35,2],[35,1],[38,3],[38,1],[38,1],[38,3],[38,2],[38,3],[38,4],[38,2],[38,3],[38,3],[38,3],[38,4],[38,1],[38,6],[38,11],[38,7],[38,5],[38,5],[38,9],[38,7],[38,10],[38,6],[38,4],[38,5],[38,3],[38,5],[85,4],[85,2],[79,1],[79,1],[79,2],[82,1],[82,1],[82,2],[87,1],[87,1],[26,6],[26,2],[98,1],[98,3],[23,1],[23,3],[23,3],[27,4],[27,2],[29,1],[29,9],[29,7],[29,5],[29,2],[29,1],[76,3],[95,3],[95,2],[99,8],[99,5],[99,2],[96,1],[96,3],[78,3],[100,3],[72,1],[72,1],[72,1],[71,1],[71,1],[71,1],[71,1],[71,1],[71,1],[6,1],[6,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[44,1],[106,2],[106,2],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[13,1],[37,1],[37,2],[37,2],[102,1],[102,2],[102,1],[132,2],[132,2],[132,3],[107,3],[107,80]],
	performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
	/* this == yyval */

	var $0 = $$.length - 1;
	switch (yystate) {
	case 1:console.log(">>>COMPSTMT");
	break;
	case 13:console.log(">>>STMT");
	break;
	case 14:console.log(">>>EXPR");
	break;
	case 22:console.log(">>>EXPR");
	break;
	case 28:console.log(">>>COMMAND");
	break;
	case 35:console.log(">>>FUNCTION");
	break;
	case 68:console.log(">>>"+yylineno+" ARG");
	break;
	case 94:console.log(">>>PRIMARY");
	break;
	case 108:console.log(">>>MLHS_ITEM");
	break;
	case 122:console.log(">>>ARGDECL");
	break;
	case 127:console.log(">>>SINGLETON");
	break;
	}
	},
	table: [{3:1,4:2,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[3]},{1:[2,1]},{6:62,15:[1,63],16:[1,64],17:[1,65],18:[1,66],111:[1,67],112:[1,68]},{9:[1,69]},{10:[1,73],13:70,45:[1,72],47:[1,84],48:[1,85],49:[1,86],50:[1,87],51:[1,88],52:[1,89],53:[1,74],54:[1,75],55:[1,76],56:[1,80],57:[1,81],58:[1,82],59:[1,83],60:[1,77],61:[1,78],63:[1,79],65:[1,92],66:[1,90],67:[1,91],73:[1,71],127:[1,93],128:[1,94],129:[1,95],130:[1,96]},{10:[1,73],13:97,45:[1,72],47:[1,84],48:[1,85],49:[1,86],50:[1,87],51:[1,88],52:[1,89],53:[1,74],54:[1,75],55:[1,76],56:[1,80],57:[1,81],58:[1,82],59:[1,83],60:[1,77],61:[1,78],63:[1,79],65:[1,92],66:[1,90],67:[1,91],73:[1,71],127:[1,93],128:[1,94],129:[1,95],130:[1,96]},{20:[1,98]},{20:[1,99]},{24:[1,100],44:101,77:[2,107],113:[1,102],114:[1,103],115:[1,104],116:[1,105],117:[1,106],118:[1,107],119:[1,108],120:[1,109],121:[1,110],122:[1,111],123:[1,112],124:[1,113],125:[1,114]},{15:[2,13],16:[2,13],17:[2,13],18:[2,13],31:[1,115],32:[1,116],111:[2,13],112:[2,13]},{9:[2,23],10:[2,23],15:[2,23],16:[2,23],17:[2,23],18:[2,23],20:[1,117],31:[2,23],32:[2,23],39:[2,23],40:[2,23],43:[2,23],45:[2,23],46:[2,23],47:[2,23],48:[2,23],49:[2,23],50:[2,23],51:[2,23],52:[2,23],53:[2,23],54:[2,23],55:[2,23],56:[2,23],57:[2,23],58:[2,23],59:[2,23],60:[2,23],61:[2,23],62:[2,23],63:[2,23],64:[2,23],66:[2,23],67:[2,23],68:[2,23],69:[2,23],74:[2,23],101:[2,23],111:[2,23],112:[2,23]},{9:[2,24],15:[2,24],16:[2,24],17:[2,24],18:[2,24],31:[2,24],32:[2,24],111:[2,24],112:[2,24]},{1:[2,109],9:[2,109],10:[2,109],11:[2,109],15:[2,109],16:[2,109],17:[2,109],18:[2,109],21:[2,109],24:[2,109],31:[2,109],32:[2,109],39:[2,109],40:[2,109],43:[2,109],45:[2,109],46:[2,109],47:[2,109],48:[2,109],49:[2,109],50:[2,109],51:[2,109],52:[2,109],53:[2,109],54:[2,109],55:[2,109],56:[2,109],57:[2,109],58:[2,109],59:[2,109],60:[2,109],61:[2,109],62:[2,109],63:[2,109],64:[2,109],66:[2,109],67:[2,109],68:[2,109],69:[2,109],74:[2,109],77:[2,109],80:[2,109],81:[2,109],84:[2,109],88:[2,109],90:[2,109],91:[2,109],97:[2,109],101:[2,109],111:[2,109],112:[2,109],113:[2,109],114:[2,109],115:[2,109],116:[2,109],117:[2,109],118:[2,109],119:[2,109],120:[2,109],121:[2,109],122:[2,109],123:[2,109],124:[2,109],125:[2,109]},{1:[2,68],9:[2,68],10:[2,68],11:[2,68],15:[2,68],16:[2,68],17:[2,68],18:[2,68],21:[2,68],31:[2,68],32:[2,68],39:[1,119],40:[1,120],43:[2,68],45:[2,68],46:[2,68],47:[2,68],48:[2,68],49:[2,68],50:[2,68],51:[2,68],52:[2,68],53:[2,68],54:[2,68],55:[2,68],56:[2,68],57:[2,68],58:[2,68],59:[2,68],60:[2,68],61:[2,68],62:[2,68],63:[2,68],64:[2,68],66:[2,68],67:[2,68],68:[2,68],69:[2,68],74:[1,118],77:[2,68],80:[2,68],81:[2,68],84:[2,68],90:[2,68],91:[2,68],97:[2,68],101:[2,68],111:[2,68],112:[2,68]},{24:[1,121]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,25:128,28:[1,132],29:122,30:[1,133],34:[1,131],35:129,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,123],47:[1,45],48:[1,46],49:[1,126],54:[1,127],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:124,78:125,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,25:128,28:[1,132],29:135,30:[1,133],34:[1,131],35:129,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,136],47:[1,45],48:[1,46],49:[1,126],54:[1,127],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:124,78:125,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:137,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,25:140,28:[1,132],30:[1,133],34:[1,131],35:141,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,22],9:[2,22],10:[1,151],11:[2,22],15:[2,22],16:[2,22],17:[2,22],18:[2,22],21:[2,22],31:[2,22],32:[2,22],43:[2,22],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,22],81:[2,22],84:[2,22],90:[2,22],91:[2,22],97:[2,22],101:[1,168],111:[2,22],112:[2,22]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,25:128,28:[1,132],29:170,30:[1,133],34:[1,131],35:129,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,169],47:[1,45],48:[1,46],49:[1,126],54:[1,127],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:124,78:125,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,35],9:[2,35],10:[2,35],11:[2,35],15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],21:[2,35],23:130,25:128,28:[1,132],29:172,30:[1,133],31:[2,35],32:[2,35],34:[1,131],35:129,36:134,37:21,38:14,39:[2,35],40:[1,28],41:[1,22],42:[1,171],43:[2,35],45:[2,35],46:[2,35],47:[1,45],48:[1,46],49:[1,126],50:[2,35],51:[2,35],52:[2,35],53:[2,35],54:[1,127],55:[2,35],56:[2,35],57:[2,35],58:[2,35],59:[2,35],60:[2,35],61:[2,35],62:[2,35],63:[2,35],64:[2,35],65:[1,47],66:[2,35],67:[2,35],68:[2,35],69:[2,35],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:124,77:[2,35],78:125,80:[2,35],81:[2,35],83:[1,37],84:[2,35],86:[1,38],89:[1,39],90:[2,35],91:[2,35],92:[1,40],93:[1,41],94:[1,42],97:[2,35],100:57,101:[2,35],102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],111:[2,35],112:[2,35],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,130],9:[2,130],10:[2,130],11:[2,130],15:[2,130],16:[2,130],17:[2,130],18:[2,130],21:[2,130],24:[2,130],31:[2,130],32:[2,130],39:[2,130],40:[2,130],43:[2,130],45:[2,130],46:[2,130],47:[2,130],48:[2,130],49:[2,130],50:[2,130],51:[2,130],52:[2,130],53:[2,130],54:[2,130],55:[2,130],56:[2,130],57:[2,130],58:[2,130],59:[2,130],60:[2,130],61:[2,130],62:[2,130],63:[2,130],64:[2,130],66:[2,130],67:[2,130],68:[2,130],69:[2,130],74:[2,130],77:[2,130],80:[2,130],81:[2,130],84:[2,130],88:[2,130],90:[2,130],91:[2,130],97:[2,130],101:[2,130],111:[2,130],112:[2,130],113:[2,130],114:[2,130],115:[2,130],116:[2,130],117:[2,130],118:[2,130],119:[2,130],120:[2,130],121:[2,130],122:[2,130],123:[2,130],124:[2,130],125:[2,130]},{1:[2,131],9:[2,131],10:[2,131],11:[2,131],15:[2,131],16:[2,131],17:[2,131],18:[2,131],21:[2,131],24:[2,131],31:[2,131],32:[2,131],39:[2,131],40:[2,131],43:[2,131],45:[2,131],46:[2,131],47:[2,131],48:[2,131],49:[2,131],50:[2,131],51:[2,131],52:[2,131],53:[2,131],54:[2,131],55:[2,131],56:[2,131],57:[2,131],58:[2,131],59:[2,131],60:[2,131],61:[2,131],62:[2,131],63:[2,131],64:[2,131],66:[2,131],67:[2,131],68:[2,131],69:[2,131],74:[2,131],77:[2,131],80:[2,131],81:[2,131],84:[2,131],88:[2,131],90:[2,131],91:[2,131],97:[2,131],101:[2,131],111:[2,131],112:[2,131],113:[2,131],114:[2,131],115:[2,131],116:[2,131],117:[2,131],118:[2,131],119:[2,131],120:[2,131],121:[2,131],122:[2,131],123:[2,131],124:[2,131],125:[2,131]},{1:[2,132],9:[2,132],10:[2,132],11:[2,132],15:[2,132],16:[2,132],17:[2,132],18:[2,132],21:[2,132],24:[2,132],31:[2,132],32:[2,132],39:[2,132],40:[2,132],43:[2,132],45:[2,132],46:[2,132],47:[2,132],48:[2,132],49:[2,132],50:[2,132],51:[2,132],52:[2,132],53:[2,132],54:[2,132],55:[2,132],56:[2,132],57:[2,132],58:[2,132],59:[2,132],60:[2,132],61:[2,132],62:[2,132],63:[2,132],64:[2,132],66:[2,132],67:[2,132],68:[2,132],69:[2,132],74:[2,132],77:[2,132],80:[2,132],81:[2,132],84:[2,132],88:[2,132],90:[2,132],91:[2,132],97:[2,132],101:[2,132],111:[2,132],112:[2,132],113:[2,132],114:[2,132],115:[2,132],116:[2,132],117:[2,132],118:[2,132],119:[2,132],120:[2,132],121:[2,132],122:[2,132],123:[2,132],124:[2,132],125:[2,132]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:174,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,70],9:[2,70],10:[2,70],11:[2,70],15:[2,70],16:[2,70],17:[2,70],18:[2,70],21:[2,70],31:[2,70],32:[2,70],39:[2,70],40:[2,70],43:[2,70],45:[2,70],46:[2,70],47:[2,70],48:[2,70],49:[2,70],50:[2,70],51:[2,70],52:[2,70],53:[2,70],54:[2,70],55:[2,70],56:[2,70],57:[2,70],58:[2,70],59:[2,70],60:[2,70],61:[2,70],62:[2,70],63:[2,70],64:[2,70],66:[2,70],67:[2,70],68:[2,70],69:[2,70],74:[2,70],77:[2,70],80:[2,70],81:[2,70],84:[2,70],90:[2,70],91:[2,70],97:[2,70],101:[2,70],111:[2,70],112:[2,70]},{10:[1,73],13:176,45:[1,72],47:[1,84],48:[1,85],49:[1,86],50:[1,87],51:[1,88],52:[1,89],53:[1,74],54:[1,75],55:[1,76],56:[1,80],57:[1,81],58:[1,82],59:[1,83],60:[1,77],61:[1,78],63:[1,79],65:[1,92],66:[1,90],67:[1,91],73:[1,175],127:[1,93],128:[1,94],129:[1,95],130:[1,96]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:129,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:177,78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:129,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:181,78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{77:[1,182]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:184,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,183],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:185,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:186,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:187,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:188,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:189,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:191,26:192,28:[1,132],30:[1,133],34:[1,131],35:193,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],87:190,89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:194,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{73:[1,195]},{73:[1,196]},{10:[1,73],13:197,42:[1,201],45:[1,72],47:[1,84],48:[1,85],49:[1,86],50:[1,87],51:[1,88],52:[1,89],53:[1,74],54:[1,75],55:[1,76],56:[1,80],57:[1,81],58:[1,82],59:[1,83],60:[1,77],61:[1,78],63:[1,79],65:[1,92],66:[1,90],67:[1,91],72:200,73:[1,199],96:198,102:23,103:[1,24],104:[1,25],127:[1,93],128:[1,94],129:[1,95],130:[1,96],132:49,133:[1,50],134:[1,58]},{77:[1,202]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:203,28:[1,132],30:[1,133],34:[1,131],35:193,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:204,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:205,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:206,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,182],9:[2,182],10:[2,182],11:[2,182],15:[2,182],16:[2,182],17:[2,182],18:[2,182],20:[2,182],21:[2,182],24:[2,182],28:[2,182],30:[2,182],31:[2,182],32:[2,182],34:[1,207],39:[2,182],40:[2,182],41:[2,182],42:[2,182],43:[2,182],45:[2,182],46:[2,182],47:[2,182],48:[2,182],49:[2,182],50:[2,182],51:[2,182],52:[2,182],53:[2,182],54:[2,182],55:[2,182],56:[2,182],57:[2,182],58:[2,182],59:[2,182],60:[2,182],61:[2,182],62:[2,182],63:[2,182],64:[2,182],65:[2,182],66:[2,182],67:[2,182],68:[2,182],69:[2,182],70:[2,182],73:[2,182],74:[2,182],77:[2,182],80:[2,182],81:[2,182],83:[2,182],84:[2,182],86:[2,182],88:[2,182],89:[2,182],90:[2,182],91:[2,182],92:[2,182],93:[2,182],94:[2,182],97:[2,182],101:[2,182],103:[2,182],104:[2,182],105:[2,182],108:[2,182],109:[2,182],110:[2,182],111:[2,182],112:[2,182],113:[2,182],114:[2,182],115:[2,182],116:[2,182],117:[2,182],118:[2,182],119:[2,182],120:[2,182],121:[2,182],122:[2,182],123:[2,182],124:[2,182],125:[2,182],126:[2,182],131:[1,208],133:[2,182],134:[2,182],136:[2,182],137:[2,182]},{1:[2,185],9:[2,185],10:[2,185],11:[2,185],15:[2,185],16:[2,185],17:[2,185],18:[2,185],21:[2,185],24:[2,185],31:[2,185],32:[2,185],39:[2,185],40:[2,185],43:[2,185],45:[2,185],46:[2,185],47:[2,185],48:[2,185],49:[2,185],50:[2,185],51:[2,185],52:[2,185],53:[2,185],54:[2,185],55:[2,185],56:[2,185],57:[2,185],58:[2,185],59:[2,185],60:[2,185],61:[2,185],62:[2,185],63:[2,185],64:[2,185],66:[2,185],67:[2,185],68:[2,185],69:[2,185],74:[2,185],77:[2,185],80:[2,185],81:[2,185],84:[2,185],88:[2,185],90:[2,185],91:[2,185],97:[2,185],101:[2,185],111:[2,185],112:[2,185],113:[2,185],114:[2,185],115:[2,185],116:[2,185],117:[2,185],118:[2,185],119:[2,185],120:[2,185],121:[2,185],122:[2,185],123:[2,185],124:[2,185],125:[2,185]},{73:[1,209]},{1:[2,133],9:[2,133],10:[2,133],11:[2,133],15:[2,133],16:[2,133],17:[2,133],18:[2,133],21:[2,133],31:[2,133],32:[2,133],39:[2,133],40:[2,133],43:[2,133],45:[2,133],46:[2,133],47:[2,133],48:[2,133],49:[2,133],50:[2,133],51:[2,133],52:[2,133],53:[2,133],54:[2,133],55:[2,133],56:[2,133],57:[2,133],58:[2,133],59:[2,133],60:[2,133],61:[2,133],62:[2,133],63:[2,133],64:[2,133],66:[2,133],67:[2,133],68:[2,133],69:[2,133],74:[2,133],77:[2,133],80:[2,133],81:[2,133],84:[2,133],90:[2,133],91:[2,133],97:[2,133],101:[2,133],111:[2,133],112:[2,133]},{1:[2,134],9:[2,134],10:[2,134],11:[2,134],15:[2,134],16:[2,134],17:[2,134],18:[2,134],21:[2,134],31:[2,134],32:[2,134],39:[2,134],40:[2,134],43:[2,134],45:[2,134],46:[2,134],47:[2,134],48:[2,134],49:[2,134],50:[2,134],51:[2,134],52:[2,134],53:[2,134],54:[2,134],55:[2,134],56:[2,134],57:[2,134],58:[2,134],59:[2,134],60:[2,134],61:[2,134],62:[2,134],63:[2,134],64:[2,134],66:[2,134],67:[2,134],68:[2,134],69:[2,134],74:[2,134],77:[2,134],80:[2,134],81:[2,134],84:[2,134],90:[2,134],91:[2,134],97:[2,134],101:[2,134],111:[2,134],112:[2,134]},{1:[2,135],9:[2,135],10:[2,135],11:[2,135],15:[2,135],16:[2,135],17:[2,135],18:[2,135],21:[2,135],31:[2,135],32:[2,135],39:[2,135],40:[2,135],43:[2,135],45:[2,135],46:[2,135],47:[2,135],48:[2,135],49:[2,135],50:[2,135],51:[2,135],52:[2,135],53:[2,135],54:[2,135],55:[2,135],56:[2,135],57:[2,135],58:[2,135],59:[2,135],60:[2,135],61:[2,135],62:[2,135],63:[2,135],64:[2,135],66:[2,135],67:[2,135],68:[2,135],69:[2,135],74:[2,135],77:[2,135],80:[2,135],81:[2,135],84:[2,135],90:[2,135],91:[2,135],97:[2,135],101:[2,135],111:[2,135],112:[2,135]},{1:[2,136],9:[2,136],10:[2,136],11:[2,136],15:[2,136],16:[2,136],17:[2,136],18:[2,136],21:[2,136],31:[2,136],32:[2,136],39:[2,136],40:[2,136],43:[2,136],45:[2,136],46:[2,136],47:[2,136],48:[2,136],49:[2,136],50:[2,136],51:[2,136],52:[2,136],53:[2,136],54:[2,136],55:[2,136],56:[2,136],57:[2,136],58:[2,136],59:[2,136],60:[2,136],61:[2,136],62:[2,136],63:[2,136],64:[2,136],66:[2,136],67:[2,136],68:[2,136],69:[2,136],74:[2,136],77:[2,136],80:[2,136],81:[2,136],84:[2,136],90:[2,136],91:[2,136],97:[2,136],101:[2,136],111:[2,136],112:[2,136]},{1:[2,137],9:[2,137],10:[2,137],11:[2,137],15:[2,137],16:[2,137],17:[2,137],18:[2,137],21:[2,137],31:[2,137],32:[2,137],39:[2,137],40:[2,137],43:[2,137],45:[2,137],46:[2,137],47:[2,137],48:[2,137],49:[2,137],50:[2,137],51:[2,137],52:[2,137],53:[2,137],54:[2,137],55:[2,137],56:[2,137],57:[2,137],58:[2,137],59:[2,137],60:[2,137],61:[2,137],62:[2,137],63:[2,137],64:[2,137],66:[2,137],67:[2,137],68:[2,137],69:[2,137],74:[2,137],77:[2,137],80:[2,137],81:[2,137],84:[2,137],90:[2,137],91:[2,137],97:[2,137],101:[2,137],111:[2,137],112:[2,137]},{1:[2,138],9:[2,138],10:[2,138],11:[2,138],15:[2,138],16:[2,138],17:[2,138],18:[2,138],21:[2,138],31:[2,138],32:[2,138],39:[2,138],40:[2,138],43:[2,138],45:[2,138],46:[2,138],47:[2,138],48:[2,138],49:[2,138],50:[2,138],51:[2,138],52:[2,138],53:[2,138],54:[2,138],55:[2,138],56:[2,138],57:[2,138],58:[2,138],59:[2,138],60:[2,138],61:[2,138],62:[2,138],63:[2,138],64:[2,138],66:[2,138],67:[2,138],68:[2,138],69:[2,138],74:[2,138],77:[2,138],80:[2,138],81:[2,138],84:[2,138],90:[2,138],91:[2,138],97:[2,138],101:[2,138],111:[2,138],112:[2,138]},{77:[1,210]},{48:[1,213],73:[1,211],135:[1,212]},{10:[1,73],13:214,45:[1,72],47:[1,84],48:[1,85],49:[1,86],50:[1,87],51:[1,88],52:[1,89],53:[1,74],54:[1,75],55:[1,76],56:[1,80],57:[1,81],58:[1,82],59:[1,83],60:[1,77],61:[1,78],63:[1,79],65:[1,92],66:[1,90],67:[1,91],73:[1,199],102:215,127:[1,93],128:[1,94],129:[1,95],130:[1,96],132:49,133:[1,50],134:[1,58]},{135:[1,216]},{1:[2,192],9:[2,192],10:[2,192],11:[2,192],15:[2,192],16:[2,192],17:[2,192],18:[2,192],21:[2,192],31:[2,192],32:[2,192],39:[2,192],40:[2,192],43:[2,192],45:[2,192],46:[2,192],47:[2,192],48:[2,192],49:[2,192],50:[2,192],51:[2,192],52:[2,192],53:[2,192],54:[2,192],55:[2,192],56:[2,192],57:[2,192],58:[2,192],59:[2,192],60:[2,192],61:[2,192],62:[2,192],63:[2,192],64:[2,192],66:[2,192],67:[2,192],68:[2,192],69:[2,192],74:[2,192],77:[2,192],80:[2,192],81:[2,192],84:[2,192],90:[2,192],91:[2,192],97:[2,192],101:[2,192],111:[2,192],112:[2,192]},{7:217,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:218,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:219,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:220,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:221,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{9:[2,139],12:[2,139],14:[2,139],15:[2,139],16:[2,139],17:[2,139],18:[2,139],19:[2,139],20:[2,139],22:[2,139],28:[2,139],30:[2,139],33:[2,139],34:[2,139],40:[2,139],41:[2,139],42:[2,139],47:[2,139],48:[2,139],49:[2,139],65:[2,139],70:[2,139],73:[2,139],74:[2,139],83:[2,139],86:[2,139],89:[2,139],92:[2,139],93:[2,139],94:[2,139],97:[2,139],103:[2,139],104:[2,139],105:[2,139],108:[2,139],109:[2,139],110:[2,139],126:[2,139],133:[2,139],134:[2,139],136:[2,139],137:[2,139]},{9:[2,140],12:[2,140],14:[2,140],15:[2,140],16:[2,140],17:[2,140],18:[2,140],19:[2,140],20:[2,140],22:[2,140],28:[2,140],30:[2,140],33:[2,140],34:[2,140],40:[2,140],41:[2,140],42:[2,140],47:[2,140],48:[2,140],49:[2,140],65:[2,140],70:[2,140],73:[2,140],74:[2,140],83:[2,140],86:[2,140],89:[2,140],92:[2,140],93:[2,140],94:[2,140],97:[2,140],103:[2,140],104:[2,140],105:[2,140],108:[2,140],109:[2,140],110:[2,140],126:[2,140],133:[2,140],134:[2,140],136:[2,140],137:[2,140]},{10:[1,222]},{15:[2,4],16:[2,4],17:[2,4],18:[2,4],111:[2,4],112:[2,4]},{10:[2,156],15:[2,156],16:[2,156],17:[2,156],18:[2,156],45:[2,156],47:[2,156],48:[2,156],49:[2,156],50:[2,156],51:[2,156],52:[2,156],53:[2,156],54:[2,156],55:[2,156],56:[2,156],57:[2,156],58:[2,156],59:[2,156],60:[2,156],61:[2,156],63:[2,156],65:[2,156],66:[2,156],67:[2,156],73:[2,156],111:[2,156],112:[2,156],127:[2,156],128:[2,156],129:[2,156],130:[2,156]},{1:[2,157],9:[2,157],10:[2,157],11:[2,157],15:[2,157],16:[2,157],17:[2,157],18:[2,157],21:[2,157],31:[2,157],32:[2,157],39:[2,157],40:[2,157],42:[2,157],43:[2,157],45:[2,157],46:[2,157],47:[2,157],48:[2,157],49:[2,157],50:[2,157],51:[2,157],52:[2,157],53:[2,157],54:[2,157],55:[2,157],56:[2,157],57:[2,157],58:[2,157],59:[2,157],60:[2,157],61:[2,157],62:[2,157],63:[2,157],64:[2,157],65:[2,157],66:[2,157],67:[2,157],68:[2,157],69:[2,157],73:[2,157],74:[2,157],77:[2,157],80:[2,157],81:[2,157],84:[2,157],90:[2,157],91:[2,157],97:[2,157],101:[2,157],111:[2,157],112:[2,157],127:[2,157],128:[2,157],129:[2,157],130:[2,157]},{1:[2,158],9:[2,158],10:[2,158],11:[2,158],15:[2,158],16:[2,158],17:[2,158],18:[2,158],21:[2,158],31:[2,158],32:[2,158],39:[2,158],40:[2,158],42:[2,158],43:[2,158],45:[2,158],46:[2,158],47:[2,158],48:[2,158],49:[2,158],50:[2,158],51:[2,158],52:[2,158],53:[2,158],54:[2,158],55:[2,158],56:[2,158],57:[2,158],58:[2,158],59:[2,158],60:[2,158],61:[2,158],62:[2,158],63:[2,158],64:[2,158],65:[2,158],66:[2,158],67:[2,158],68:[2,158],69:[2,158],73:[2,158],74:[2,158],77:[2,158],80:[2,158],81:[2,158],84:[2,158],90:[2,158],91:[2,158],97:[2,158],101:[2,158],111:[2,158],112:[2,158],127:[2,158],128:[2,158],129:[2,158],130:[2,158]},{1:[2,159],9:[2,159],10:[2,159],11:[2,159],15:[2,159],16:[2,159],17:[2,159],18:[2,159],21:[2,159],31:[2,159],32:[2,159],39:[2,159],40:[2,159],42:[2,159],43:[2,159],45:[2,159],46:[2,159],47:[2,159],48:[2,159],49:[2,159],50:[2,159],51:[2,159],52:[2,159],53:[2,159],54:[2,159],55:[2,159],56:[2,159],57:[2,159],58:[2,159],59:[2,159],60:[2,159],61:[2,159],62:[2,159],63:[2,159],64:[2,159],65:[2,159],66:[2,159],67:[2,159],68:[2,159],69:[2,159],73:[2,159],74:[2,159],77:[2,159],80:[2,159],81:[2,159],84:[2,159],90:[2,159],91:[2,159],97:[2,159],101:[2,159],111:[2,159],112:[2,159],127:[2,159],128:[2,159],129:[2,159],130:[2,159]},{1:[2,160],9:[2,160],10:[2,160],11:[2,160],15:[2,160],16:[2,160],17:[2,160],18:[2,160],21:[2,160],31:[2,160],32:[2,160],39:[2,160],40:[2,160],42:[2,160],43:[2,160],45:[2,160],46:[2,160],47:[2,160],48:[2,160],49:[2,160],50:[2,160],51:[2,160],52:[2,160],53:[2,160],54:[2,160],55:[2,160],56:[2,160],57:[2,160],58:[2,160],59:[2,160],60:[2,160],61:[2,160],62:[2,160],63:[2,160],64:[2,160],65:[2,160],66:[2,160],67:[2,160],68:[2,160],69:[2,160],73:[2,160],74:[2,160],77:[2,160],80:[2,160],81:[2,160],84:[2,160],90:[2,160],91:[2,160],97:[2,160],101:[2,160],111:[2,160],112:[2,160],127:[2,160],128:[2,160],129:[2,160],130:[2,160]},{1:[2,161],9:[2,161],10:[2,161],11:[2,161],15:[2,161],16:[2,161],17:[2,161],18:[2,161],21:[2,161],31:[2,161],32:[2,161],39:[2,161],40:[2,161],42:[2,161],43:[2,161],45:[2,161],46:[2,161],47:[2,161],48:[2,161],49:[2,161],50:[2,161],51:[2,161],52:[2,161],53:[2,161],54:[2,161],55:[2,161],56:[2,161],57:[2,161],58:[2,161],59:[2,161],60:[2,161],61:[2,161],62:[2,161],63:[2,161],64:[2,161],65:[2,161],66:[2,161],67:[2,161],68:[2,161],69:[2,161],73:[2,161],74:[2,161],77:[2,161],80:[2,161],81:[2,161],84:[2,161],90:[2,161],91:[2,161],97:[2,161],101:[2,161],111:[2,161],112:[2,161],127:[2,161],128:[2,161],129:[2,161],130:[2,161]},{1:[2,162],9:[2,162],10:[2,162],11:[2,162],15:[2,162],16:[2,162],17:[2,162],18:[2,162],21:[2,162],31:[2,162],32:[2,162],39:[2,162],40:[2,162],42:[2,162],43:[2,162],45:[2,162],46:[2,162],47:[2,162],48:[2,162],49:[2,162],50:[2,162],51:[2,162],52:[2,162],53:[2,162],54:[2,162],55:[2,162],56:[2,162],57:[2,162],58:[2,162],59:[2,162],60:[2,162],61:[2,162],62:[2,162],63:[2,162],64:[2,162],65:[2,162],66:[2,162],67:[2,162],68:[2,162],69:[2,162],73:[2,162],74:[2,162],77:[2,162],80:[2,162],81:[2,162],84:[2,162],90:[2,162],91:[2,162],97:[2,162],101:[2,162],111:[2,162],112:[2,162],127:[2,162],128:[2,162],129:[2,162],130:[2,162]},{1:[2,163],9:[2,163],10:[2,163],11:[2,163],15:[2,163],16:[2,163],17:[2,163],18:[2,163],21:[2,163],31:[2,163],32:[2,163],39:[2,163],40:[2,163],42:[2,163],43:[2,163],45:[2,163],46:[2,163],47:[2,163],48:[2,163],49:[2,163],50:[2,163],51:[2,163],52:[2,163],53:[2,163],54:[2,163],55:[2,163],56:[2,163],57:[2,163],58:[2,163],59:[2,163],60:[2,163],61:[2,163],62:[2,163],63:[2,163],64:[2,163],65:[2,163],66:[2,163],67:[2,163],68:[2,163],69:[2,163],73:[2,163],74:[2,163],77:[2,163],80:[2,163],81:[2,163],84:[2,163],90:[2,163],91:[2,163],97:[2,163],101:[2,163],111:[2,163],112:[2,163],127:[2,163],128:[2,163],129:[2,163],130:[2,163]},{1:[2,164],9:[2,164],10:[2,164],11:[2,164],15:[2,164],16:[2,164],17:[2,164],18:[2,164],21:[2,164],31:[2,164],32:[2,164],39:[2,164],40:[2,164],42:[2,164],43:[2,164],45:[2,164],46:[2,164],47:[2,164],48:[2,164],49:[2,164],50:[2,164],51:[2,164],52:[2,164],53:[2,164],54:[2,164],55:[2,164],56:[2,164],57:[2,164],58:[2,164],59:[2,164],60:[2,164],61:[2,164],62:[2,164],63:[2,164],64:[2,164],65:[2,164],66:[2,164],67:[2,164],68:[2,164],69:[2,164],73:[2,164],74:[2,164],77:[2,164],80:[2,164],81:[2,164],84:[2,164],90:[2,164],91:[2,164],97:[2,164],101:[2,164],111:[2,164],112:[2,164],127:[2,164],128:[2,164],129:[2,164],130:[2,164]},{1:[2,165],9:[2,165],10:[2,165],11:[2,165],15:[2,165],16:[2,165],17:[2,165],18:[2,165],21:[2,165],31:[2,165],32:[2,165],39:[2,165],40:[2,165],42:[2,165],43:[2,165],45:[2,165],46:[2,165],47:[2,165],48:[2,165],49:[2,165],50:[2,165],51:[2,165],52:[2,165],53:[2,165],54:[2,165],55:[2,165],56:[2,165],57:[2,165],58:[2,165],59:[2,165],60:[2,165],61:[2,165],62:[2,165],63:[2,165],64:[2,165],65:[2,165],66:[2,165],67:[2,165],68:[2,165],69:[2,165],73:[2,165],74:[2,165],77:[2,165],80:[2,165],81:[2,165],84:[2,165],90:[2,165],91:[2,165],97:[2,165],101:[2,165],111:[2,165],112:[2,165],127:[2,165],128:[2,165],129:[2,165],130:[2,165]},{1:[2,166],9:[2,166],10:[2,166],11:[2,166],15:[2,166],16:[2,166],17:[2,166],18:[2,166],21:[2,166],31:[2,166],32:[2,166],39:[2,166],40:[2,166],42:[2,166],43:[2,166],45:[2,166],46:[2,166],47:[2,166],48:[2,166],49:[2,166],50:[2,166],51:[2,166],52:[2,166],53:[2,166],54:[2,166],55:[2,166],56:[2,166],57:[2,166],58:[2,166],59:[2,166],60:[2,166],61:[2,166],62:[2,166],63:[2,166],64:[2,166],65:[2,166],66:[2,166],67:[2,166],68:[2,166],69:[2,166],73:[2,166],74:[2,166],77:[2,166],80:[2,166],81:[2,166],84:[2,166],90:[2,166],91:[2,166],97:[2,166],101:[2,166],111:[2,166],112:[2,166],127:[2,166],128:[2,166],129:[2,166],130:[2,166]},{1:[2,167],9:[2,167],10:[2,167],11:[2,167],15:[2,167],16:[2,167],17:[2,167],18:[2,167],21:[2,167],31:[2,167],32:[2,167],39:[2,167],40:[2,167],42:[2,167],43:[2,167],45:[2,167],46:[2,167],47:[2,167],48:[2,167],49:[2,167],50:[2,167],51:[2,167],52:[2,167],53:[2,167],54:[2,167],55:[2,167],56:[2,167],57:[2,167],58:[2,167],59:[2,167],60:[2,167],61:[2,167],62:[2,167],63:[2,167],64:[2,167],65:[2,167],66:[2,167],67:[2,167],68:[2,167],69:[2,167],73:[2,167],74:[2,167],77:[2,167],80:[2,167],81:[2,167],84:[2,167],90:[2,167],91:[2,167],97:[2,167],101:[2,167],111:[2,167],112:[2,167],127:[2,167],128:[2,167],129:[2,167],130:[2,167]},{1:[2,168],9:[2,168],10:[2,168],11:[2,168],15:[2,168],16:[2,168],17:[2,168],18:[2,168],21:[2,168],31:[2,168],32:[2,168],39:[2,168],40:[2,168],42:[2,168],43:[2,168],45:[2,168],46:[2,168],47:[2,168],48:[2,168],49:[2,168],50:[2,168],51:[2,168],52:[2,168],53:[2,168],54:[2,168],55:[2,168],56:[2,168],57:[2,168],58:[2,168],59:[2,168],60:[2,168],61:[2,168],62:[2,168],63:[2,168],64:[2,168],65:[2,168],66:[2,168],67:[2,168],68:[2,168],69:[2,168],73:[2,168],74:[2,168],77:[2,168],80:[2,168],81:[2,168],84:[2,168],90:[2,168],91:[2,168],97:[2,168],101:[2,168],111:[2,168],112:[2,168],127:[2,168],128:[2,168],129:[2,168],130:[2,168]},{1:[2,169],9:[2,169],10:[2,169],11:[2,169],15:[2,169],16:[2,169],17:[2,169],18:[2,169],21:[2,169],31:[2,169],32:[2,169],39:[2,169],40:[2,169],42:[2,169],43:[2,169],45:[2,169],46:[2,169],47:[2,169],48:[2,169],49:[2,169],50:[2,169],51:[2,169],52:[2,169],53:[2,169],54:[2,169],55:[2,169],56:[2,169],57:[2,169],58:[2,169],59:[2,169],60:[2,169],61:[2,169],62:[2,169],63:[2,169],64:[2,169],65:[2,169],66:[2,169],67:[2,169],68:[2,169],69:[2,169],73:[2,169],74:[2,169],77:[2,169],80:[2,169],81:[2,169],84:[2,169],90:[2,169],91:[2,169],97:[2,169],101:[2,169],111:[2,169],112:[2,169],127:[2,169],128:[2,169],129:[2,169],130:[2,169]},{1:[2,170],9:[2,170],10:[2,170],11:[2,170],15:[2,170],16:[2,170],17:[2,170],18:[2,170],21:[2,170],31:[2,170],32:[2,170],39:[2,170],40:[2,170],42:[2,170],43:[2,170],45:[2,170],46:[2,170],47:[2,170],48:[2,170],49:[2,170],50:[2,170],51:[2,170],52:[2,170],53:[2,170],54:[2,170],55:[2,170],56:[2,170],57:[2,170],58:[2,170],59:[2,170],60:[2,170],61:[2,170],62:[2,170],63:[2,170],64:[2,170],65:[2,170],66:[2,170],67:[2,170],68:[2,170],69:[2,170],73:[2,170],74:[2,170],77:[2,170],80:[2,170],81:[2,170],84:[2,170],90:[2,170],91:[2,170],97:[2,170],101:[2,170],111:[2,170],112:[2,170],127:[2,170],128:[2,170],129:[2,170],130:[2,170]},{1:[2,171],9:[2,171],10:[2,171],11:[2,171],15:[2,171],16:[2,171],17:[2,171],18:[2,171],21:[2,171],31:[2,171],32:[2,171],39:[2,171],40:[2,171],42:[2,171],43:[2,171],45:[2,171],46:[2,171],47:[2,171],48:[2,171],49:[2,171],50:[2,171],51:[2,171],52:[2,171],53:[2,171],54:[2,171],55:[2,171],56:[2,171],57:[2,171],58:[2,171],59:[2,171],60:[2,171],61:[2,171],62:[2,171],63:[2,171],64:[2,171],65:[2,171],66:[2,171],67:[2,171],68:[2,171],69:[2,171],73:[2,171],74:[2,171],77:[2,171],80:[2,171],81:[2,171],84:[2,171],90:[2,171],91:[2,171],97:[2,171],101:[2,171],111:[2,171],112:[2,171],127:[2,171],128:[2,171],129:[2,171],130:[2,171]},{1:[2,172],9:[2,172],10:[2,172],11:[2,172],15:[2,172],16:[2,172],17:[2,172],18:[2,172],21:[2,172],31:[2,172],32:[2,172],39:[2,172],40:[2,172],42:[2,172],43:[2,172],45:[2,172],46:[2,172],47:[2,172],48:[2,172],49:[2,172],50:[2,172],51:[2,172],52:[2,172],53:[2,172],54:[2,172],55:[2,172],56:[2,172],57:[2,172],58:[2,172],59:[2,172],60:[2,172],61:[2,172],62:[2,172],63:[2,172],64:[2,172],65:[2,172],66:[2,172],67:[2,172],68:[2,172],69:[2,172],73:[2,172],74:[2,172],77:[2,172],80:[2,172],81:[2,172],84:[2,172],90:[2,172],91:[2,172],97:[2,172],101:[2,172],111:[2,172],112:[2,172],127:[2,172],128:[2,172],129:[2,172],130:[2,172]},{1:[2,173],9:[2,173],10:[2,173],11:[2,173],15:[2,173],16:[2,173],17:[2,173],18:[2,173],21:[2,173],31:[2,173],32:[2,173],39:[2,173],40:[2,173],42:[2,173],43:[2,173],45:[2,173],46:[2,173],47:[2,173],48:[2,173],49:[2,173],50:[2,173],51:[2,173],52:[2,173],53:[2,173],54:[2,173],55:[2,173],56:[2,173],57:[2,173],58:[2,173],59:[2,173],60:[2,173],61:[2,173],62:[2,173],63:[2,173],64:[2,173],65:[2,173],66:[2,173],67:[2,173],68:[2,173],69:[2,173],73:[2,173],74:[2,173],77:[2,173],80:[2,173],81:[2,173],84:[2,173],90:[2,173],91:[2,173],97:[2,173],101:[2,173],111:[2,173],112:[2,173],127:[2,173],128:[2,173],129:[2,173],130:[2,173]},{1:[2,174],9:[2,174],10:[2,174],11:[2,174],15:[2,174],16:[2,174],17:[2,174],18:[2,174],21:[2,174],31:[2,174],32:[2,174],39:[2,174],40:[2,174],42:[2,174],43:[2,174],45:[2,174],46:[2,174],47:[2,174],48:[2,174],49:[2,174],50:[2,174],51:[2,174],52:[2,174],53:[2,174],54:[2,174],55:[2,174],56:[2,174],57:[2,174],58:[2,174],59:[2,174],60:[2,174],61:[2,174],62:[2,174],63:[2,174],64:[2,174],65:[2,174],66:[2,174],67:[2,174],68:[2,174],69:[2,174],73:[2,174],74:[2,174],77:[2,174],80:[2,174],81:[2,174],84:[2,174],90:[2,174],91:[2,174],97:[2,174],101:[2,174],111:[2,174],112:[2,174],127:[2,174],128:[2,174],129:[2,174],130:[2,174]},{1:[2,175],9:[2,175],10:[2,175],11:[2,175],15:[2,175],16:[2,175],17:[2,175],18:[2,175],21:[2,175],31:[2,175],32:[2,175],39:[2,175],40:[2,175],42:[2,175],43:[2,175],45:[2,175],46:[2,175],47:[2,175],48:[2,175],49:[2,175],50:[2,175],51:[2,175],52:[2,175],53:[2,175],54:[2,175],55:[2,175],56:[2,175],57:[2,175],58:[2,175],59:[2,175],60:[2,175],61:[2,175],62:[2,175],63:[2,175],64:[2,175],65:[2,175],66:[2,175],67:[2,175],68:[2,175],69:[2,175],73:[2,175],74:[2,175],77:[2,175],80:[2,175],81:[2,175],84:[2,175],90:[2,175],91:[2,175],97:[2,175],101:[2,175],111:[2,175],112:[2,175],127:[2,175],128:[2,175],129:[2,175],130:[2,175]},{1:[2,176],9:[2,176],10:[2,176],11:[2,176],15:[2,176],16:[2,176],17:[2,176],18:[2,176],21:[2,176],31:[2,176],32:[2,176],39:[2,176],40:[2,176],42:[2,176],43:[2,176],45:[2,176],46:[2,176],47:[2,176],48:[2,176],49:[2,176],50:[2,176],51:[2,176],52:[2,176],53:[2,176],54:[2,176],55:[2,176],56:[2,176],57:[2,176],58:[2,176],59:[2,176],60:[2,176],61:[2,176],62:[2,176],63:[2,176],64:[2,176],65:[2,176],66:[2,176],67:[2,176],68:[2,176],69:[2,176],73:[2,176],74:[2,176],77:[2,176],80:[2,176],81:[2,176],84:[2,176],90:[2,176],91:[2,176],97:[2,176],101:[2,176],111:[2,176],112:[2,176],127:[2,176],128:[2,176],129:[2,176],130:[2,176]},{1:[2,177],9:[2,177],10:[2,177],11:[2,177],15:[2,177],16:[2,177],17:[2,177],18:[2,177],21:[2,177],31:[2,177],32:[2,177],39:[2,177],40:[2,177],42:[2,177],43:[2,177],45:[2,177],46:[2,177],47:[2,177],48:[2,177],49:[2,177],50:[2,177],51:[2,177],52:[2,177],53:[2,177],54:[2,177],55:[2,177],56:[2,177],57:[2,177],58:[2,177],59:[2,177],60:[2,177],61:[2,177],62:[2,177],63:[2,177],64:[2,177],65:[2,177],66:[2,177],67:[2,177],68:[2,177],69:[2,177],73:[2,177],74:[2,177],77:[2,177],80:[2,177],81:[2,177],84:[2,177],90:[2,177],91:[2,177],97:[2,177],101:[2,177],111:[2,177],112:[2,177],127:[2,177],128:[2,177],129:[2,177],130:[2,177]},{1:[2,178],9:[2,178],10:[2,178],11:[2,178],15:[2,178],16:[2,178],17:[2,178],18:[2,178],21:[2,178],31:[2,178],32:[2,178],39:[2,178],40:[2,178],42:[2,178],43:[2,178],45:[2,178],46:[2,178],47:[2,178],48:[2,178],49:[2,178],50:[2,178],51:[2,178],52:[2,178],53:[2,178],54:[2,178],55:[2,178],56:[2,178],57:[2,178],58:[2,178],59:[2,178],60:[2,178],61:[2,178],62:[2,178],63:[2,178],64:[2,178],65:[2,178],66:[2,178],67:[2,178],68:[2,178],69:[2,178],73:[2,178],74:[2,178],77:[2,178],80:[2,178],81:[2,178],84:[2,178],90:[2,178],91:[2,178],97:[2,178],101:[2,178],111:[2,178],112:[2,178],127:[2,178],128:[2,178],129:[2,178],130:[2,178]},{1:[2,179],9:[2,179],10:[2,179],11:[2,179],15:[2,179],16:[2,179],17:[2,179],18:[2,179],21:[2,179],31:[2,179],32:[2,179],39:[2,179],40:[2,179],42:[2,179],43:[2,179],45:[2,179],46:[2,179],47:[2,179],48:[2,179],49:[2,179],50:[2,179],51:[2,179],52:[2,179],53:[2,179],54:[2,179],55:[2,179],56:[2,179],57:[2,179],58:[2,179],59:[2,179],60:[2,179],61:[2,179],62:[2,179],63:[2,179],64:[2,179],65:[2,179],66:[2,179],67:[2,179],68:[2,179],69:[2,179],73:[2,179],74:[2,179],77:[2,179],80:[2,179],81:[2,179],84:[2,179],90:[2,179],91:[2,179],97:[2,179],101:[2,179],111:[2,179],112:[2,179],127:[2,179],128:[2,179],129:[2,179],130:[2,179]},{1:[2,180],9:[2,180],10:[2,180],11:[2,180],15:[2,180],16:[2,180],17:[2,180],18:[2,180],21:[2,180],31:[2,180],32:[2,180],39:[2,180],40:[2,180],42:[2,180],43:[2,180],45:[2,180],46:[2,180],47:[2,180],48:[2,180],49:[2,180],50:[2,180],51:[2,180],52:[2,180],53:[2,180],54:[2,180],55:[2,180],56:[2,180],57:[2,180],58:[2,180],59:[2,180],60:[2,180],61:[2,180],62:[2,180],63:[2,180],64:[2,180],65:[2,180],66:[2,180],67:[2,180],68:[2,180],69:[2,180],73:[2,180],74:[2,180],77:[2,180],80:[2,180],81:[2,180],84:[2,180],90:[2,180],91:[2,180],97:[2,180],101:[2,180],111:[2,180],112:[2,180],127:[2,180],128:[2,180],129:[2,180],130:[2,180]},{1:[2,181],9:[2,181],10:[2,181],11:[2,181],15:[2,181],16:[2,181],17:[2,181],18:[2,181],21:[2,181],31:[2,181],32:[2,181],39:[2,181],40:[2,181],42:[2,181],43:[2,181],45:[2,181],46:[2,181],47:[2,181],48:[2,181],49:[2,181],50:[2,181],51:[2,181],52:[2,181],53:[2,181],54:[2,181],55:[2,181],56:[2,181],57:[2,181],58:[2,181],59:[2,181],60:[2,181],61:[2,181],62:[2,181],63:[2,181],64:[2,181],65:[2,181],66:[2,181],67:[2,181],68:[2,181],69:[2,181],73:[2,181],74:[2,181],77:[2,181],80:[2,181],81:[2,181],84:[2,181],90:[2,181],91:[2,181],97:[2,181],101:[2,181],111:[2,181],112:[2,181],127:[2,181],128:[2,181],129:[2,181],130:[2,181]},{10:[1,73],13:223,45:[1,72],47:[1,84],48:[1,85],49:[1,86],50:[1,87],51:[1,88],52:[1,89],53:[1,74],54:[1,75],55:[1,76],56:[1,80],57:[1,81],58:[1,82],59:[1,83],60:[1,77],61:[1,78],63:[1,79],65:[1,92],66:[1,90],67:[1,91],73:[1,71],127:[1,93],128:[1,94],129:[1,95],130:[1,96]},{4:224,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:225,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,25:226,28:[1,132],30:[1,133],34:[1,131],35:227,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:228,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[2,141],16:[2,141],17:[2,141],18:[2,141],20:[2,141],28:[2,141],30:[2,141],34:[2,141],40:[2,141],41:[2,141],42:[2,141],47:[2,141],48:[2,141],65:[2,141],70:[2,141],73:[2,141],74:[2,141],83:[2,141],86:[2,141],89:[2,141],92:[2,141],93:[2,141],94:[2,141],103:[2,141],104:[2,141],105:[2,141],108:[2,141],109:[2,141],110:[2,141],126:[2,141],133:[2,141],134:[2,141],136:[2,141],137:[2,141]},{15:[2,142],16:[2,142],17:[2,142],18:[2,142],20:[2,142],28:[2,142],30:[2,142],34:[2,142],40:[2,142],41:[2,142],42:[2,142],47:[2,142],48:[2,142],65:[2,142],70:[2,142],73:[2,142],74:[2,142],83:[2,142],86:[2,142],89:[2,142],92:[2,142],93:[2,142],94:[2,142],103:[2,142],104:[2,142],105:[2,142],108:[2,142],109:[2,142],110:[2,142],126:[2,142],133:[2,142],134:[2,142],136:[2,142],137:[2,142]},{15:[2,143],16:[2,143],17:[2,143],18:[2,143],20:[2,143],28:[2,143],30:[2,143],34:[2,143],40:[2,143],41:[2,143],42:[2,143],47:[2,143],48:[2,143],65:[2,143],70:[2,143],73:[2,143],74:[2,143],83:[2,143],86:[2,143],89:[2,143],92:[2,143],93:[2,143],94:[2,143],103:[2,143],104:[2,143],105:[2,143],108:[2,143],109:[2,143],110:[2,143],126:[2,143],133:[2,143],134:[2,143],136:[2,143],137:[2,143]},{15:[2,144],16:[2,144],17:[2,144],18:[2,144],20:[2,144],28:[2,144],30:[2,144],34:[2,144],40:[2,144],41:[2,144],42:[2,144],47:[2,144],48:[2,144],65:[2,144],70:[2,144],73:[2,144],74:[2,144],83:[2,144],86:[2,144],89:[2,144],92:[2,144],93:[2,144],94:[2,144],103:[2,144],104:[2,144],105:[2,144],108:[2,144],109:[2,144],110:[2,144],126:[2,144],133:[2,144],134:[2,144],136:[2,144],137:[2,144]},{15:[2,145],16:[2,145],17:[2,145],18:[2,145],20:[2,145],28:[2,145],30:[2,145],34:[2,145],40:[2,145],41:[2,145],42:[2,145],47:[2,145],48:[2,145],65:[2,145],70:[2,145],73:[2,145],74:[2,145],83:[2,145],86:[2,145],89:[2,145],92:[2,145],93:[2,145],94:[2,145],103:[2,145],104:[2,145],105:[2,145],108:[2,145],109:[2,145],110:[2,145],126:[2,145],133:[2,145],134:[2,145],136:[2,145],137:[2,145]},{15:[2,146],16:[2,146],17:[2,146],18:[2,146],20:[2,146],28:[2,146],30:[2,146],34:[2,146],40:[2,146],41:[2,146],42:[2,146],47:[2,146],48:[2,146],65:[2,146],70:[2,146],73:[2,146],74:[2,146],83:[2,146],86:[2,146],89:[2,146],92:[2,146],93:[2,146],94:[2,146],103:[2,146],104:[2,146],105:[2,146],108:[2,146],109:[2,146],110:[2,146],126:[2,146],133:[2,146],134:[2,146],136:[2,146],137:[2,146]},{15:[2,147],16:[2,147],17:[2,147],18:[2,147],20:[2,147],28:[2,147],30:[2,147],34:[2,147],40:[2,147],41:[2,147],42:[2,147],47:[2,147],48:[2,147],65:[2,147],70:[2,147],73:[2,147],74:[2,147],83:[2,147],86:[2,147],89:[2,147],92:[2,147],93:[2,147],94:[2,147],103:[2,147],104:[2,147],105:[2,147],108:[2,147],109:[2,147],110:[2,147],126:[2,147],133:[2,147],134:[2,147],136:[2,147],137:[2,147]},{15:[2,148],16:[2,148],17:[2,148],18:[2,148],20:[2,148],28:[2,148],30:[2,148],34:[2,148],40:[2,148],41:[2,148],42:[2,148],47:[2,148],48:[2,148],65:[2,148],70:[2,148],73:[2,148],74:[2,148],83:[2,148],86:[2,148],89:[2,148],92:[2,148],93:[2,148],94:[2,148],103:[2,148],104:[2,148],105:[2,148],108:[2,148],109:[2,148],110:[2,148],126:[2,148],133:[2,148],134:[2,148],136:[2,148],137:[2,148]},{15:[2,149],16:[2,149],17:[2,149],18:[2,149],20:[2,149],28:[2,149],30:[2,149],34:[2,149],40:[2,149],41:[2,149],42:[2,149],47:[2,149],48:[2,149],65:[2,149],70:[2,149],73:[2,149],74:[2,149],83:[2,149],86:[2,149],89:[2,149],92:[2,149],93:[2,149],94:[2,149],103:[2,149],104:[2,149],105:[2,149],108:[2,149],109:[2,149],110:[2,149],126:[2,149],133:[2,149],134:[2,149],136:[2,149],137:[2,149]},{15:[2,150],16:[2,150],17:[2,150],18:[2,150],20:[2,150],28:[2,150],30:[2,150],34:[2,150],40:[2,150],41:[2,150],42:[2,150],47:[2,150],48:[2,150],65:[2,150],70:[2,150],73:[2,150],74:[2,150],83:[2,150],86:[2,150],89:[2,150],92:[2,150],93:[2,150],94:[2,150],103:[2,150],104:[2,150],105:[2,150],108:[2,150],109:[2,150],110:[2,150],126:[2,150],133:[2,150],134:[2,150],136:[2,150],137:[2,150]},{15:[2,151],16:[2,151],17:[2,151],18:[2,151],20:[2,151],28:[2,151],30:[2,151],34:[2,151],40:[2,151],41:[2,151],42:[2,151],47:[2,151],48:[2,151],65:[2,151],70:[2,151],73:[2,151],74:[2,151],83:[2,151],86:[2,151],89:[2,151],92:[2,151],93:[2,151],94:[2,151],103:[2,151],104:[2,151],105:[2,151],108:[2,151],109:[2,151],110:[2,151],126:[2,151],133:[2,151],134:[2,151],136:[2,151],137:[2,151]},{15:[2,152],16:[2,152],17:[2,152],18:[2,152],20:[2,152],28:[2,152],30:[2,152],34:[2,152],40:[2,152],41:[2,152],42:[2,152],47:[2,152],48:[2,152],65:[2,152],70:[2,152],73:[2,152],74:[2,152],83:[2,152],86:[2,152],89:[2,152],92:[2,152],93:[2,152],94:[2,152],103:[2,152],104:[2,152],105:[2,152],108:[2,152],109:[2,152],110:[2,152],126:[2,152],133:[2,152],134:[2,152],136:[2,152],137:[2,152]},{15:[2,153],16:[2,153],17:[2,153],18:[2,153],20:[2,153],28:[2,153],30:[2,153],34:[2,153],40:[2,153],41:[2,153],42:[2,153],47:[2,153],48:[2,153],65:[2,153],70:[2,153],73:[2,153],74:[2,153],83:[2,153],86:[2,153],89:[2,153],92:[2,153],93:[2,153],94:[2,153],103:[2,153],104:[2,153],105:[2,153],108:[2,153],109:[2,153],110:[2,153],126:[2,153],133:[2,153],134:[2,153],136:[2,153],137:[2,153]},{7:229,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:230,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{10:[1,231]},{75:[1,232]},{37:234,73:[1,233]},{37:235,73:[1,236]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,27:237,28:[1,132],30:[1,133],34:[1,131],35:129,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],49:[1,239],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:238,78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,15],9:[2,15],11:[2,15],15:[2,15],16:[2,15],17:[2,15],18:[2,15],21:[2,15],31:[2,15],32:[2,15],43:[2,15],80:[2,15],81:[2,15],84:[2,15],90:[2,15],91:[2,15],97:[2,15],111:[2,15],112:[2,15]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],43:[1,240],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,114],9:[2,114],11:[2,114],15:[2,114],16:[2,114],17:[2,114],18:[2,114],21:[2,114],31:[2,114],32:[2,114],43:[2,114],77:[1,241],80:[2,114],81:[2,114],84:[2,114],90:[2,114],91:[2,114],97:[2,114],111:[2,114],112:[2,114]},{77:[1,242]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:243,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:244,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,119],9:[2,119],11:[2,119],15:[2,119],16:[2,119],17:[2,119],18:[2,119],21:[2,119],31:[2,119],32:[2,119],43:[2,119],80:[2,119],81:[2,119],84:[2,119],90:[2,119],91:[2,119],97:[2,119],111:[2,119],112:[2,119]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],77:[1,245],101:[1,168]},{24:[1,246],44:101,113:[1,102],114:[1,103],115:[1,104],116:[1,105],117:[1,106],118:[1,107],119:[1,108],120:[1,109],121:[1,110],122:[1,111],123:[1,112],124:[1,113],125:[1,114]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:141,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{42:[1,247]},{42:[1,248]},{1:[2,81],9:[2,81],10:[2,81],11:[2,81],15:[2,81],16:[2,81],17:[2,81],18:[2,81],20:[1,117],21:[2,81],31:[2,81],32:[2,81],39:[2,81],40:[2,81],43:[2,81],45:[2,81],46:[2,81],47:[2,81],48:[2,81],49:[2,81],50:[2,81],51:[2,81],52:[2,81],53:[2,81],54:[2,81],55:[2,81],56:[2,81],57:[2,81],58:[2,81],59:[2,81],60:[2,81],61:[2,81],62:[2,81],63:[2,81],64:[2,81],66:[2,81],67:[2,81],68:[2,81],69:[2,81],74:[2,81],77:[2,81],80:[2,81],81:[2,81],84:[2,81],90:[2,81],91:[2,81],97:[2,81],101:[2,81],111:[2,81],112:[2,81]},{1:[2,16],9:[2,16],11:[2,16],15:[2,16],16:[2,16],17:[2,16],18:[2,16],21:[2,16],31:[2,16],32:[2,16],43:[2,16],80:[2,16],81:[2,16],84:[2,16],90:[2,16],91:[2,16],97:[2,16],111:[2,16],112:[2,16]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],43:[1,249],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,19],9:[2,19],11:[2,19],15:[2,19],16:[2,19],17:[2,19],18:[2,19],21:[2,19],31:[1,115],32:[1,116],43:[2,19],80:[2,19],81:[2,19],84:[2,19],90:[2,19],91:[2,19],97:[2,19],111:[2,19],112:[2,19]},{1:[2,20],9:[2,20],11:[2,20],15:[2,20],16:[2,20],17:[2,20],18:[2,20],21:[2,20],31:[2,20],32:[2,20],43:[2,20],80:[2,20],81:[2,20],84:[2,20],90:[2,20],91:[2,20],97:[2,20],111:[2,20],112:[2,20]},{24:[1,246],44:101,49:[2,107],77:[2,107],113:[1,102],114:[1,103],115:[1,104],116:[1,105],117:[1,106],118:[1,107],119:[1,108],120:[1,109],121:[1,110],122:[1,111],123:[1,112],124:[1,113],125:[1,114]},{1:[2,21],9:[2,21],11:[2,21],15:[2,21],16:[2,21],17:[2,21],18:[2,21],21:[2,21],31:[2,21],32:[2,21],43:[2,21],80:[2,21],81:[2,21],84:[2,21],90:[2,21],91:[2,21],97:[2,21],111:[2,21],112:[2,21]},{1:[2,61],9:[2,61],10:[1,151],11:[2,61],15:[2,61],16:[2,61],17:[2,61],18:[2,61],21:[2,61],31:[2,61],32:[2,61],39:[2,61],40:[2,61],43:[2,61],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,61],77:[2,61],80:[2,61],81:[2,61],84:[2,61],90:[2,61],91:[2,61],97:[2,61],101:[1,168],111:[2,61],112:[2,61]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:250,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:251,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:252,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:253,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:254,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:255,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:256,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:257,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:258,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:259,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:260,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:261,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:262,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:263,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:264,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:265,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:266,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:267,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:268,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:269,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:270,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:271,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:272,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:273,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:274,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:275,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],43:[1,276],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,25],9:[2,25],11:[2,25],15:[2,25],16:[2,25],17:[2,25],18:[2,25],21:[2,25],31:[2,25],32:[2,25],43:[2,25],80:[2,25],81:[2,25],84:[2,25],90:[2,25],91:[2,25],97:[2,25],111:[2,25],112:[2,25]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],43:[1,277],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,28],9:[2,28],11:[2,28],15:[2,28],16:[2,28],17:[2,28],18:[2,28],21:[2,28],31:[2,28],32:[2,28],43:[2,28],80:[2,28],81:[2,28],84:[2,28],90:[2,28],91:[2,28],97:[2,28],111:[2,28],112:[2,28]},{43:[1,278]},{24:[1,121],43:[1,279]},{1:[2,73],9:[2,73],10:[2,73],11:[2,73],15:[2,73],16:[2,73],17:[2,73],18:[2,73],21:[2,73],31:[2,73],32:[2,73],39:[2,73],40:[2,73],42:[2,156],43:[2,73],45:[2,73],46:[2,73],47:[2,73],48:[2,73],49:[2,73],50:[2,73],51:[2,73],52:[2,73],53:[2,73],54:[2,73],55:[2,73],56:[2,73],57:[2,73],58:[2,73],59:[2,73],60:[2,73],61:[2,73],62:[2,73],63:[2,73],64:[2,73],66:[2,73],67:[2,73],68:[2,73],69:[2,73],73:[2,156],74:[2,73],77:[2,73],80:[2,73],81:[2,73],84:[2,73],90:[2,73],91:[2,73],97:[2,73],101:[2,73],111:[2,73],112:[2,73]},{42:[1,281],49:[1,284],54:[1,285],73:[1,283],95:280,99:282},{77:[1,286]},{1:[2,68],9:[2,68],10:[2,68],11:[2,68],15:[2,68],16:[2,68],17:[2,68],18:[2,68],21:[2,68],31:[2,68],32:[2,68],39:[1,287],40:[1,288],43:[2,68],45:[2,68],46:[2,68],47:[2,68],48:[2,68],49:[2,68],50:[2,68],51:[2,68],52:[2,68],53:[2,68],54:[2,68],55:[2,68],56:[2,68],57:[2,68],58:[2,68],59:[2,68],60:[2,68],61:[2,68],62:[2,68],63:[2,68],64:[2,68],66:[2,68],67:[2,68],68:[2,68],69:[2,68],74:[1,118],77:[2,68],80:[2,68],81:[2,68],84:[2,68],90:[2,68],91:[2,68],97:[2,68],101:[2,68],111:[2,68],112:[2,68]},{42:[1,289]},{1:[2,35],9:[2,35],10:[2,35],11:[2,35],15:[2,35],16:[2,35],17:[2,35],18:[2,35],20:[2,35],21:[2,35],31:[2,35],32:[2,35],39:[2,35],40:[2,35],42:[1,290],43:[2,35],45:[2,35],46:[2,35],47:[2,35],48:[2,35],49:[2,35],50:[2,35],51:[2,35],52:[2,35],53:[2,35],54:[2,35],55:[2,35],56:[2,35],57:[2,35],58:[2,35],59:[2,35],60:[2,35],61:[2,35],62:[2,35],63:[2,35],64:[2,35],66:[2,35],67:[2,35],68:[2,35],69:[2,35],74:[2,35],77:[2,35],80:[2,35],81:[2,35],84:[2,35],90:[2,35],91:[2,35],97:[2,35],101:[2,35],111:[2,35],112:[2,35]},{1:[2,76],9:[2,76],10:[2,76],11:[2,76],15:[2,76],16:[2,76],17:[2,76],18:[2,76],21:[2,76],31:[2,76],32:[2,76],39:[2,76],40:[2,76],43:[2,76],45:[2,76],46:[2,76],47:[2,76],48:[2,76],49:[2,76],50:[2,76],51:[2,76],52:[2,76],53:[2,76],54:[2,76],55:[2,76],56:[2,76],57:[2,76],58:[2,76],59:[2,76],60:[2,76],61:[2,76],62:[2,76],63:[2,76],64:[2,76],66:[2,76],67:[2,76],68:[2,76],69:[2,76],74:[2,76],77:[2,76],80:[2,76],81:[2,76],84:[2,76],90:[2,76],91:[2,76],97:[2,76],101:[2,76],111:[2,76],112:[2,76]},{21:[1,291]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:292,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,67],9:[2,67],10:[1,151],11:[2,67],15:[2,67],16:[2,67],17:[2,67],18:[2,67],21:[2,67],31:[2,67],32:[2,67],39:[2,67],40:[2,67],43:[2,67],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,67],77:[2,67],80:[2,67],81:[2,67],84:[2,67],90:[2,67],91:[2,67],97:[2,67],101:[1,168],111:[2,67],112:[2,67]},{6:294,31:[1,115],32:[1,116],79:293,97:[1,295],111:[1,67],112:[1,68]},{6:294,31:[1,115],32:[1,116],79:296,97:[1,295],111:[1,67],112:[1,68]},{6:298,9:[1,299],31:[1,115],32:[1,116],82:297,111:[1,67],112:[1,68]},{6:298,9:[1,299],31:[1,115],32:[1,116],82:300,111:[1,67],112:[1,68]},{84:[1,301]},{88:[1,302]},{24:[1,246],44:101,77:[2,103],88:[2,103],113:[1,102],114:[1,103],115:[1,104],116:[1,105],117:[1,106],118:[1,107],119:[1,108],120:[1,109],121:[1,110],122:[1,111],123:[1,112],124:[1,113],125:[1,114]},{88:[2,104]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],101:[1,168]},{90:[1,303]},{58:[1,304]},{4:305,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{42:[1,281],49:[1,284],54:[1,285],73:[1,283],95:306,99:282},{39:[1,307]},{1:[2,156],9:[2,156],10:[2,156],11:[2,156],15:[2,156],16:[2,156],17:[2,156],18:[2,156],21:[2,156],31:[2,156],32:[2,156],39:[2,156],40:[2,156],42:[2,156],43:[2,156],45:[2,156],46:[2,156],47:[2,156],48:[2,156],49:[2,156],50:[2,156],51:[2,156],52:[2,156],53:[2,156],54:[2,156],55:[2,156],56:[2,156],57:[2,156],58:[2,156],59:[2,156],60:[2,156],61:[2,156],62:[2,156],63:[2,156],64:[2,156],66:[2,156],67:[2,156],68:[2,156],69:[2,156],73:[2,156],74:[2,156],77:[2,156],80:[2,156],81:[2,156],84:[2,156],90:[2,156],91:[2,156],97:[2,156],101:[2,156],111:[2,156],112:[2,156]},{39:[2,126]},{7:308,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,28:[1,132],30:[1,133],34:[1,131],35:193,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,26],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:309,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{24:[1,246],43:[2,106],44:101,88:[2,106],113:[1,102],114:[1,103],115:[1,104],116:[1,105],117:[1,106],118:[1,107],119:[1,108],120:[1,109],121:[1,110],122:[1,111],123:[1,112],124:[1,113],125:[1,114]},{1:[2,46],9:[2,46],10:[1,151],11:[2,46],15:[2,46],16:[2,46],17:[2,46],18:[2,46],21:[2,46],31:[2,46],32:[2,46],39:[2,46],40:[2,46],43:[2,46],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,46],77:[2,46],80:[2,46],81:[2,46],84:[2,46],90:[2,46],91:[2,46],97:[2,46],101:[1,168],111:[2,46],112:[2,46]},{1:[2,47],9:[2,47],10:[1,151],11:[2,47],15:[2,47],16:[2,47],17:[2,47],18:[2,47],21:[2,47],31:[2,47],32:[2,47],39:[2,47],40:[2,47],43:[2,47],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,47],77:[2,47],80:[2,47],81:[2,47],84:[2,47],90:[2,47],91:[2,47],97:[2,47],101:[1,168],111:[2,47],112:[2,47]},{1:[2,62],9:[2,62],10:[1,151],11:[2,62],15:[2,62],16:[2,62],17:[2,62],18:[2,62],21:[2,62],31:[2,62],32:[2,62],39:[2,62],40:[2,62],43:[2,62],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,62],77:[2,62],80:[2,62],81:[2,62],84:[2,62],90:[2,62],91:[2,62],97:[2,62],101:[1,168],111:[2,62],112:[2,62]},{1:[2,183],9:[2,183],10:[2,183],11:[2,183],15:[2,183],16:[2,183],17:[2,183],18:[2,183],20:[2,183],21:[2,183],28:[2,183],30:[2,183],31:[2,183],32:[2,183],34:[2,183],39:[2,183],40:[2,183],41:[2,183],42:[2,183],43:[2,183],45:[2,183],46:[2,183],47:[2,183],48:[2,183],49:[2,183],50:[2,183],51:[2,183],52:[2,183],53:[2,183],54:[2,183],55:[2,183],56:[2,183],57:[2,183],58:[2,183],59:[2,183],60:[2,183],61:[2,183],62:[2,183],63:[2,183],64:[2,183],65:[2,183],66:[2,183],67:[2,183],68:[2,183],69:[2,183],70:[2,183],73:[2,183],74:[2,183],77:[2,183],80:[2,183],81:[2,183],83:[2,183],84:[2,183],86:[2,183],89:[2,183],90:[2,183],91:[2,183],92:[2,183],93:[2,183],94:[2,183],97:[2,183],101:[2,183],103:[2,183],104:[2,183],105:[2,183],108:[2,183],109:[2,183],110:[2,183],111:[2,183],112:[2,183],126:[2,183],133:[2,183],134:[2,183],136:[2,183],137:[2,183]},{1:[2,184],9:[2,184],10:[2,184],11:[2,184],15:[2,184],16:[2,184],17:[2,184],18:[2,184],20:[2,184],21:[2,184],28:[2,184],30:[2,184],31:[2,184],32:[2,184],34:[2,184],39:[2,184],40:[2,184],41:[2,184],42:[2,184],43:[2,184],45:[2,184],46:[2,184],47:[2,184],48:[2,184],49:[2,184],50:[2,184],51:[2,184],52:[2,184],53:[2,184],54:[2,184],55:[2,184],56:[2,184],57:[2,184],58:[2,184],59:[2,184],60:[2,184],61:[2,184],62:[2,184],63:[2,184],64:[2,184],65:[2,184],66:[2,184],67:[2,184],68:[2,184],69:[2,184],70:[2,184],73:[2,184],74:[2,184],77:[2,184],80:[2,184],81:[2,184],83:[2,184],84:[2,184],86:[2,184],89:[2,184],90:[2,184],91:[2,184],92:[2,184],93:[2,184],94:[2,184],97:[2,184],101:[2,184],103:[2,184],104:[2,184],105:[2,184],108:[2,184],109:[2,184],110:[2,184],111:[2,184],112:[2,184],126:[2,184],133:[2,184],134:[2,184],136:[2,184],137:[2,184]},{1:[2,186],9:[2,186],10:[2,186],11:[2,186],15:[2,186],16:[2,186],17:[2,186],18:[2,186],21:[2,186],24:[2,186],31:[2,186],32:[2,186],39:[2,186],40:[2,186],43:[2,186],45:[2,186],46:[2,186],47:[2,186],48:[2,186],49:[2,186],50:[2,186],51:[2,186],52:[2,186],53:[2,186],54:[2,186],55:[2,186],56:[2,186],57:[2,186],58:[2,186],59:[2,186],60:[2,186],61:[2,186],62:[2,186],63:[2,186],64:[2,186],66:[2,186],67:[2,186],68:[2,186],69:[2,186],74:[2,186],77:[2,186],80:[2,186],81:[2,186],84:[2,186],88:[2,186],90:[2,186],91:[2,186],97:[2,186],101:[2,186],111:[2,186],112:[2,186],113:[2,186],114:[2,186],115:[2,186],116:[2,186],117:[2,186],118:[2,186],119:[2,186],120:[2,186],121:[2,186],122:[2,186],123:[2,186],124:[2,186],125:[2,186]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:193,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:310,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,188],9:[2,188],10:[2,188],11:[2,188],15:[2,188],16:[2,188],17:[2,188],18:[2,188],21:[2,188],24:[2,188],31:[2,188],32:[2,188],39:[2,188],40:[2,188],43:[2,188],45:[2,188],46:[2,188],47:[2,188],48:[2,188],49:[2,188],50:[2,188],51:[2,188],52:[2,188],53:[2,188],54:[2,188],55:[2,188],56:[2,188],57:[2,188],58:[2,188],59:[2,188],60:[2,188],61:[2,188],62:[2,188],63:[2,188],64:[2,188],66:[2,188],67:[2,188],68:[2,188],69:[2,188],74:[2,188],77:[2,188],80:[2,188],81:[2,188],84:[2,188],88:[2,188],90:[2,188],91:[2,188],97:[2,188],101:[2,188],111:[2,188],112:[2,188],113:[2,188],114:[2,188],115:[2,188],116:[2,188],117:[2,188],118:[2,188],119:[2,188],120:[2,188],121:[2,188],122:[2,188],123:[2,188],124:[2,188],125:[2,188]},{1:[2,189],9:[2,189],10:[2,189],11:[2,189],15:[2,189],16:[2,189],17:[2,189],18:[2,189],21:[2,189],24:[2,189],31:[2,189],32:[2,189],39:[2,189],40:[2,189],43:[2,189],45:[2,189],46:[2,189],47:[2,189],48:[2,189],49:[2,189],50:[2,189],51:[2,189],52:[2,189],53:[2,189],54:[2,189],55:[2,189],56:[2,189],57:[2,189],58:[2,189],59:[2,189],60:[2,189],61:[2,189],62:[2,189],63:[2,189],64:[2,189],66:[2,189],67:[2,189],68:[2,189],69:[2,189],74:[2,189],77:[2,189],80:[2,189],81:[2,189],84:[2,189],88:[2,189],90:[2,189],91:[2,189],97:[2,189],101:[2,189],111:[2,189],112:[2,189],113:[2,189],114:[2,189],115:[2,189],116:[2,189],117:[2,189],118:[2,189],119:[2,189],120:[2,189],121:[2,189],122:[2,189],123:[2,189],124:[2,189],125:[2,189]},{135:[1,311]},{1:[2,154],9:[2,154],10:[2,154],11:[2,154],15:[2,154],16:[2,154],17:[2,154],18:[2,154],21:[2,154],31:[2,154],32:[2,154],39:[2,154],40:[2,154],43:[2,154],45:[2,154],46:[2,154],47:[2,154],48:[2,154],49:[2,154],50:[2,154],51:[2,154],52:[2,154],53:[2,154],54:[2,154],55:[2,154],56:[2,154],57:[2,154],58:[2,154],59:[2,154],60:[2,154],61:[2,154],62:[2,154],63:[2,154],64:[2,154],66:[2,154],67:[2,154],68:[2,154],69:[2,154],74:[2,154],77:[2,154],80:[2,154],81:[2,154],84:[2,154],90:[2,154],91:[2,154],97:[2,154],101:[2,154],111:[2,154],112:[2,154]},{1:[2,155],9:[2,155],10:[2,155],11:[2,155],15:[2,155],16:[2,155],17:[2,155],18:[2,155],21:[2,155],31:[2,155],32:[2,155],39:[2,155],40:[2,155],43:[2,155],45:[2,155],46:[2,155],47:[2,155],48:[2,155],49:[2,155],50:[2,155],51:[2,155],52:[2,155],53:[2,155],54:[2,155],55:[2,155],56:[2,155],57:[2,155],58:[2,155],59:[2,155],60:[2,155],61:[2,155],62:[2,155],63:[2,155],64:[2,155],66:[2,155],67:[2,155],68:[2,155],69:[2,155],74:[2,155],77:[2,155],80:[2,155],81:[2,155],84:[2,155],90:[2,155],91:[2,155],97:[2,155],101:[2,155],111:[2,155],112:[2,155]},{136:[1,312]},{1:[2,2],11:[2,2],21:[2,2],31:[1,115],32:[1,116],43:[2,2],80:[2,2],81:[2,2],84:[2,2],90:[2,2],91:[2,2]},{15:[2,6],16:[2,6],17:[2,6],18:[2,6],31:[1,115],32:[1,116],111:[2,6],112:[2,6]},{15:[2,7],16:[2,7],17:[2,7],18:[2,7],31:[1,115],32:[1,116],111:[2,7],112:[2,7]},{15:[2,8],16:[2,8],17:[2,8],18:[2,8],31:[1,115],32:[1,116],111:[2,8],112:[2,8]},{15:[2,9],16:[2,9],17:[2,9],18:[2,9],31:[1,115],32:[1,116],111:[2,9],112:[2,9]},{10:[1,313]},{15:[2,5],16:[2,5],17:[2,5],18:[2,5],111:[2,5],112:[2,5]},{21:[1,314]},{21:[1,315]},{9:[1,316]},{1:[2,36],9:[2,36],10:[1,151],11:[2,36],15:[2,36],16:[2,36],17:[2,36],18:[2,36],21:[2,36],31:[2,36],32:[2,36],39:[2,36],40:[2,36],43:[2,36],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,36],77:[2,36],80:[2,36],81:[2,36],84:[2,36],90:[2,36],91:[2,36],97:[2,36],101:[1,168],111:[2,36],112:[2,36]},{1:[2,37],9:[2,37],10:[1,151],11:[2,37],15:[2,37],16:[2,37],17:[2,37],18:[2,37],21:[2,37],31:[2,37],32:[2,37],39:[2,37],40:[2,37],43:[2,37],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,37],77:[2,37],80:[2,37],81:[2,37],84:[2,37],90:[2,37],91:[2,37],97:[2,37],101:[1,168],111:[2,37],112:[2,37]},{1:[2,17],9:[2,17],11:[2,17],15:[2,17],16:[2,17],17:[2,17],18:[2,17],21:[2,17],31:[1,115],32:[1,116],43:[2,17],80:[2,17],81:[2,17],84:[2,17],90:[2,17],91:[2,17],97:[2,17],111:[2,17],112:[2,17]},{1:[2,18],9:[2,18],11:[2,18],15:[2,18],16:[2,18],17:[2,18],18:[2,18],21:[2,18],31:[1,115],32:[1,116],43:[2,18],80:[2,18],81:[2,18],84:[2,18],90:[2,18],91:[2,18],97:[2,18],111:[2,18],112:[2,18]},{10:[1,317]},{1:[2,110],9:[2,110],10:[2,110],11:[2,110],15:[2,110],16:[2,110],17:[2,110],18:[2,110],21:[2,110],24:[2,110],31:[2,110],32:[2,110],39:[2,110],40:[2,110],43:[2,110],45:[2,110],46:[2,110],47:[2,110],48:[2,110],49:[2,110],50:[2,110],51:[2,110],52:[2,110],53:[2,110],54:[2,110],55:[2,110],56:[2,110],57:[2,110],58:[2,110],59:[2,110],60:[2,110],61:[2,110],62:[2,110],63:[2,110],64:[2,110],66:[2,110],67:[2,110],68:[2,110],69:[2,110],74:[2,110],77:[2,110],80:[2,110],81:[2,110],84:[2,110],88:[2,110],90:[2,110],91:[2,110],97:[2,110],101:[2,110],111:[2,110],112:[2,110],113:[2,110],114:[2,110],115:[2,110],116:[2,110],117:[2,110],118:[2,110],119:[2,110],120:[2,110],121:[2,110],122:[2,110],123:[2,110],124:[2,110],125:[2,110]},{1:[2,182],9:[2,182],10:[2,182],11:[2,182],15:[2,182],16:[2,182],17:[2,182],18:[2,182],20:[2,182],21:[2,182],24:[2,111],28:[2,182],30:[2,182],31:[2,182],32:[2,182],34:[1,207],39:[2,182],40:[2,182],41:[2,182],42:[2,182],43:[2,111],45:[2,182],46:[2,182],47:[2,182],48:[2,182],49:[2,111],50:[2,182],51:[2,182],52:[2,182],53:[2,182],54:[2,182],55:[2,182],56:[2,182],57:[2,182],58:[2,182],59:[2,182],60:[2,182],61:[2,182],62:[2,182],63:[2,182],64:[2,182],65:[2,182],66:[2,182],67:[2,182],68:[2,182],69:[2,182],70:[2,182],73:[2,182],74:[2,182],77:[2,111],80:[2,182],81:[2,182],83:[2,182],84:[2,182],86:[2,182],88:[2,111],89:[2,182],90:[2,182],91:[2,182],92:[2,182],93:[2,182],94:[2,182],97:[2,182],101:[2,182],103:[2,182],104:[2,182],105:[2,182],108:[2,182],109:[2,182],110:[2,182],111:[2,182],112:[2,182],113:[2,111],114:[2,111],115:[2,111],116:[2,111],117:[2,111],118:[2,111],119:[2,111],120:[2,111],121:[2,111],122:[2,111],123:[2,111],124:[2,111],125:[2,111],126:[2,182],131:[1,208],133:[2,182],134:[2,182],136:[2,182],137:[2,182]},{1:[2,32],9:[2,32],10:[2,32],11:[2,32],15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],21:[2,32],23:130,25:128,28:[1,132],29:319,30:[1,133],31:[2,32],32:[2,32],34:[1,131],35:129,36:134,37:21,38:14,39:[2,32],40:[1,28],41:[1,22],42:[1,318],43:[2,32],45:[2,32],46:[2,32],47:[1,45],48:[1,46],49:[1,126],50:[2,32],51:[2,32],52:[2,32],53:[2,32],54:[1,127],55:[2,32],56:[2,32],57:[2,32],58:[2,32],59:[2,32],60:[2,32],61:[2,32],62:[2,32],63:[2,32],64:[2,32],65:[1,47],66:[2,32],67:[2,32],68:[2,32],69:[2,32],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:124,77:[2,32],78:125,80:[2,32],81:[2,32],83:[1,37],84:[2,32],86:[1,38],89:[1,39],90:[2,32],91:[2,32],92:[1,40],93:[1,41],94:[1,42],97:[2,32],100:57,101:[2,32],102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],111:[2,32],112:[2,32],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,33],9:[2,33],10:[2,33],11:[2,33],15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],21:[2,33],23:130,25:128,28:[1,132],29:321,30:[1,133],31:[2,33],32:[2,33],34:[1,131],35:129,36:134,37:21,38:14,39:[2,33],40:[1,28],41:[1,22],42:[1,320],43:[2,33],45:[2,33],46:[2,33],47:[1,45],48:[1,46],49:[1,126],50:[2,33],51:[2,33],52:[2,33],53:[2,33],54:[1,127],55:[2,33],56:[2,33],57:[2,33],58:[2,33],59:[2,33],60:[2,33],61:[2,33],62:[2,33],63:[2,33],64:[2,33],65:[1,47],66:[2,33],67:[2,33],68:[2,33],69:[2,33],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:124,77:[2,33],78:125,80:[2,33],81:[2,33],83:[1,37],84:[2,33],86:[1,38],89:[1,39],90:[2,33],91:[2,33],92:[1,40],93:[1,41],94:[1,42],97:[2,33],100:57,101:[2,33],102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],111:[2,33],112:[2,33],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,72],9:[2,72],10:[2,72],11:[2,72],15:[2,72],16:[2,72],17:[2,72],18:[2,72],20:[2,182],21:[2,72],28:[2,182],30:[2,182],31:[2,72],32:[2,72],34:[1,207],39:[2,72],40:[2,72],41:[2,182],42:[2,182],43:[2,72],45:[2,72],46:[2,72],47:[2,72],48:[2,72],49:[2,72],50:[2,72],51:[2,72],52:[2,72],53:[2,72],54:[2,72],55:[2,72],56:[2,72],57:[2,72],58:[2,72],59:[2,72],60:[2,72],61:[2,72],62:[2,72],63:[2,72],64:[2,72],65:[2,182],66:[2,72],67:[2,72],68:[2,72],69:[2,72],70:[2,182],73:[2,182],74:[2,72],77:[2,72],80:[2,72],81:[2,72],83:[2,182],84:[2,72],86:[2,182],89:[2,182],90:[2,72],91:[2,72],92:[2,182],93:[2,182],94:[2,182],97:[2,72],101:[2,72],103:[2,182],104:[2,182],105:[2,182],108:[2,182],109:[2,182],110:[2,182],111:[2,72],112:[2,72],126:[2,182],131:[1,208],133:[2,182],134:[2,182],136:[2,182],137:[2,182]},{1:[2,14],9:[2,14],11:[2,14],15:[2,14],16:[2,14],17:[2,14],18:[2,14],21:[2,14],31:[2,14],32:[2,14],43:[2,14],80:[2,14],81:[2,14],84:[2,14],90:[2,14],91:[2,14],97:[2,14],111:[2,14],112:[2,14]},{77:[1,322]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:323,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,78],9:[2,78],10:[2,78],11:[2,78],15:[2,78],16:[2,78],17:[2,78],18:[2,78],21:[2,78],31:[2,78],32:[2,78],39:[2,78],40:[2,78],43:[2,78],45:[2,78],46:[2,78],47:[2,78],48:[2,78],49:[2,78],50:[2,78],51:[2,78],52:[2,78],53:[2,78],54:[2,78],55:[2,78],56:[2,78],57:[2,78],58:[2,78],59:[2,78],60:[2,78],61:[2,78],62:[2,78],63:[2,78],64:[2,78],66:[2,78],67:[2,78],68:[2,78],69:[2,78],74:[2,78],77:[2,78],80:[2,78],81:[2,78],84:[2,78],90:[2,78],91:[2,78],97:[2,78],101:[2,78],111:[2,78],112:[2,78]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:193,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:324,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{21:[1,291],49:[1,325]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],77:[1,326],101:[1,168]},{1:[2,118],9:[2,118],10:[1,151],11:[2,118],15:[2,118],16:[2,118],17:[2,118],18:[2,118],21:[2,118],31:[2,118],32:[2,118],43:[2,118],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,118],81:[2,118],84:[2,118],90:[2,118],91:[2,118],97:[2,118],101:[1,168],111:[2,118],112:[2,118]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:327,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:227,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{43:[1,240]},{43:[1,249]},{1:[2,79],9:[2,79],10:[2,79],11:[2,79],15:[2,79],16:[2,79],17:[2,79],18:[2,79],21:[2,79],31:[2,79],32:[2,79],39:[2,79],40:[2,79],43:[2,79],45:[2,79],46:[2,79],47:[2,79],48:[2,79],49:[2,79],50:[2,79],51:[2,79],52:[2,79],53:[2,79],54:[2,79],55:[2,79],56:[2,79],57:[2,79],58:[2,79],59:[2,79],60:[2,79],61:[2,79],62:[2,79],63:[2,79],64:[2,79],66:[2,79],67:[2,79],68:[2,79],69:[2,79],74:[2,79],77:[2,79],80:[2,79],81:[2,79],84:[2,79],90:[2,79],91:[2,79],97:[2,79],101:[2,79],111:[2,79],112:[2,79]},{1:[2,38],9:[2,38],10:[1,151],11:[2,38],15:[2,38],16:[2,38],17:[2,38],18:[2,38],21:[2,38],31:[2,38],32:[2,38],39:[2,38],40:[2,38],43:[2,38],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,38],77:[2,38],80:[2,38],81:[2,38],84:[2,38],90:[2,38],91:[2,38],97:[2,38],101:[1,168],111:[2,38],112:[2,38]},{1:[2,39],9:[2,39],10:[1,151],11:[2,39],15:[2,39],16:[2,39],17:[2,39],18:[2,39],21:[2,39],31:[2,39],32:[2,39],39:[2,39],40:[2,39],43:[2,39],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,39],77:[2,39],80:[2,39],81:[2,39],84:[2,39],90:[2,39],91:[2,39],97:[2,39],101:[1,168],111:[2,39],112:[2,39]},{1:[2,40],9:[2,40],10:[1,151],11:[2,40],15:[2,40],16:[2,40],17:[2,40],18:[2,40],21:[2,40],31:[2,40],32:[2,40],39:[2,40],40:[2,40],43:[2,40],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,40],77:[2,40],80:[2,40],81:[2,40],84:[2,40],90:[2,40],91:[2,40],97:[2,40],101:[1,168],111:[2,40],112:[2,40]},{1:[2,41],9:[2,41],10:[1,151],11:[2,41],15:[2,41],16:[2,41],17:[2,41],18:[2,41],21:[2,41],31:[2,41],32:[2,41],39:[2,41],40:[2,41],43:[2,41],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,41],77:[2,41],80:[2,41],81:[2,41],84:[2,41],90:[2,41],91:[2,41],97:[2,41],101:[1,168],111:[2,41],112:[2,41]},{1:[2,42],9:[2,42],10:[1,151],11:[2,42],15:[2,42],16:[2,42],17:[2,42],18:[2,42],21:[2,42],31:[2,42],32:[2,42],39:[2,42],40:[2,42],43:[2,42],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,42],77:[2,42],80:[2,42],81:[2,42],84:[2,42],90:[2,42],91:[2,42],97:[2,42],101:[1,168],111:[2,42],112:[2,42]},{1:[2,43],9:[2,43],10:[1,151],11:[2,43],15:[2,43],16:[2,43],17:[2,43],18:[2,43],21:[2,43],31:[2,43],32:[2,43],39:[2,43],40:[2,43],43:[2,43],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,43],77:[2,43],80:[2,43],81:[2,43],84:[2,43],90:[2,43],91:[2,43],97:[2,43],101:[1,168],111:[2,43],112:[2,43]},{1:[2,44],9:[2,44],10:[1,151],11:[2,44],15:[2,44],16:[2,44],17:[2,44],18:[2,44],21:[2,44],31:[2,44],32:[2,44],39:[2,44],40:[2,44],43:[2,44],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,44],77:[2,44],80:[2,44],81:[2,44],84:[2,44],90:[2,44],91:[2,44],97:[2,44],101:[1,168],111:[2,44],112:[2,44]},{1:[2,45],9:[2,45],10:[1,151],11:[2,45],15:[2,45],16:[2,45],17:[2,45],18:[2,45],21:[2,45],31:[2,45],32:[2,45],39:[2,45],40:[2,45],43:[2,45],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,45],77:[2,45],80:[2,45],81:[2,45],84:[2,45],90:[2,45],91:[2,45],97:[2,45],101:[1,168],111:[2,45],112:[2,45]},{1:[2,48],9:[2,48],10:[1,151],11:[2,48],15:[2,48],16:[2,48],17:[2,48],18:[2,48],21:[2,48],31:[2,48],32:[2,48],39:[2,48],40:[2,48],43:[2,48],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,48],77:[2,48],80:[2,48],81:[2,48],84:[2,48],90:[2,48],91:[2,48],97:[2,48],101:[1,168],111:[2,48],112:[2,48]},{1:[2,49],9:[2,49],10:[1,151],11:[2,49],15:[2,49],16:[2,49],17:[2,49],18:[2,49],21:[2,49],31:[2,49],32:[2,49],39:[2,49],40:[2,49],43:[2,49],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,49],77:[2,49],80:[2,49],81:[2,49],84:[2,49],90:[2,49],91:[2,49],97:[2,49],101:[1,168],111:[2,49],112:[2,49]},{1:[2,50],9:[2,50],10:[1,151],11:[2,50],15:[2,50],16:[2,50],17:[2,50],18:[2,50],21:[2,50],31:[2,50],32:[2,50],39:[2,50],40:[2,50],43:[2,50],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,50],77:[2,50],80:[2,50],81:[2,50],84:[2,50],90:[2,50],91:[2,50],97:[2,50],101:[1,168],111:[2,50],112:[2,50]},{1:[2,51],9:[2,51],10:[1,151],11:[2,51],15:[2,51],16:[2,51],17:[2,51],18:[2,51],21:[2,51],31:[2,51],32:[2,51],39:[2,51],40:[2,51],43:[2,51],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,51],77:[2,51],80:[2,51],81:[2,51],84:[2,51],90:[2,51],91:[2,51],97:[2,51],101:[1,168],111:[2,51],112:[2,51]},{1:[2,52],9:[2,52],10:[1,151],11:[2,52],15:[2,52],16:[2,52],17:[2,52],18:[2,52],21:[2,52],31:[2,52],32:[2,52],39:[2,52],40:[2,52],43:[2,52],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,52],77:[2,52],80:[2,52],81:[2,52],84:[2,52],90:[2,52],91:[2,52],97:[2,52],101:[1,168],111:[2,52],112:[2,52]},{1:[2,53],9:[2,53],10:[1,151],11:[2,53],15:[2,53],16:[2,53],17:[2,53],18:[2,53],21:[2,53],31:[2,53],32:[2,53],39:[2,53],40:[2,53],43:[2,53],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,53],77:[2,53],80:[2,53],81:[2,53],84:[2,53],90:[2,53],91:[2,53],97:[2,53],101:[1,168],111:[2,53],112:[2,53]},{1:[2,54],9:[2,54],10:[1,151],11:[2,54],15:[2,54],16:[2,54],17:[2,54],18:[2,54],21:[2,54],31:[2,54],32:[2,54],39:[2,54],40:[2,54],43:[2,54],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,54],77:[2,54],80:[2,54],81:[2,54],84:[2,54],90:[2,54],91:[2,54],97:[2,54],101:[1,168],111:[2,54],112:[2,54]},{1:[2,55],9:[2,55],10:[1,151],11:[2,55],15:[2,55],16:[2,55],17:[2,55],18:[2,55],21:[2,55],31:[2,55],32:[2,55],39:[2,55],40:[2,55],43:[2,55],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,55],77:[2,55],80:[2,55],81:[2,55],84:[2,55],90:[2,55],91:[2,55],97:[2,55],101:[1,168],111:[2,55],112:[2,55]},{1:[2,56],9:[2,56],10:[1,151],11:[2,56],15:[2,56],16:[2,56],17:[2,56],18:[2,56],21:[2,56],31:[2,56],32:[2,56],39:[2,56],40:[2,56],43:[2,56],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,56],77:[2,56],80:[2,56],81:[2,56],84:[2,56],90:[2,56],91:[2,56],97:[2,56],101:[1,168],111:[2,56],112:[2,56]},{1:[2,57],9:[2,57],10:[1,151],11:[2,57],15:[2,57],16:[2,57],17:[2,57],18:[2,57],21:[2,57],31:[2,57],32:[2,57],39:[2,57],40:[2,57],43:[2,57],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,57],77:[2,57],80:[2,57],81:[2,57],84:[2,57],90:[2,57],91:[2,57],97:[2,57],101:[1,168],111:[2,57],112:[2,57]},{1:[2,58],9:[2,58],10:[1,151],11:[2,58],15:[2,58],16:[2,58],17:[2,58],18:[2,58],21:[2,58],31:[2,58],32:[2,58],39:[2,58],40:[2,58],43:[2,58],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,58],77:[2,58],80:[2,58],81:[2,58],84:[2,58],90:[2,58],91:[2,58],97:[2,58],101:[1,168],111:[2,58],112:[2,58]},{1:[2,59],9:[2,59],10:[1,151],11:[2,59],15:[2,59],16:[2,59],17:[2,59],18:[2,59],21:[2,59],31:[2,59],32:[2,59],39:[2,59],40:[2,59],43:[2,59],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,59],77:[2,59],80:[2,59],81:[2,59],84:[2,59],90:[2,59],91:[2,59],97:[2,59],101:[1,168],111:[2,59],112:[2,59]},{1:[2,60],9:[2,60],10:[1,151],11:[2,60],15:[2,60],16:[2,60],17:[2,60],18:[2,60],21:[2,60],31:[2,60],32:[2,60],39:[2,60],40:[2,60],43:[2,60],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,60],77:[2,60],80:[2,60],81:[2,60],84:[2,60],90:[2,60],91:[2,60],97:[2,60],101:[1,168],111:[2,60],112:[2,60]},{1:[2,63],9:[2,63],10:[1,151],11:[2,63],15:[2,63],16:[2,63],17:[2,63],18:[2,63],21:[2,63],31:[2,63],32:[2,63],39:[2,63],40:[2,63],43:[2,63],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,63],77:[2,63],80:[2,63],81:[2,63],84:[2,63],90:[2,63],91:[2,63],97:[2,63],101:[1,168],111:[2,63],112:[2,63]},{1:[2,64],9:[2,64],10:[1,151],11:[2,64],15:[2,64],16:[2,64],17:[2,64],18:[2,64],21:[2,64],31:[2,64],32:[2,64],39:[2,64],40:[2,64],43:[2,64],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,64],77:[2,64],80:[2,64],81:[2,64],84:[2,64],90:[2,64],91:[2,64],97:[2,64],101:[1,168],111:[2,64],112:[2,64]},{1:[2,65],9:[2,65],10:[1,151],11:[2,65],15:[2,65],16:[2,65],17:[2,65],18:[2,65],21:[2,65],31:[2,65],32:[2,65],39:[2,65],40:[2,65],43:[2,65],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,65],77:[2,65],80:[2,65],81:[2,65],84:[2,65],90:[2,65],91:[2,65],97:[2,65],101:[1,168],111:[2,65],112:[2,65]},{1:[2,66],9:[2,66],10:[1,151],11:[2,66],15:[2,66],16:[2,66],17:[2,66],18:[2,66],21:[2,66],31:[2,66],32:[2,66],39:[2,66],40:[2,66],43:[2,66],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,66],77:[2,66],80:[2,66],81:[2,66],84:[2,66],90:[2,66],91:[2,66],97:[2,66],101:[1,168],111:[2,66],112:[2,66]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],77:[2,129],101:[1,168]},{1:[2,29],9:[2,29],10:[2,29],11:[2,29],15:[2,29],16:[2,29],17:[2,29],18:[2,29],20:[2,29],21:[2,29],31:[2,29],32:[2,29],39:[2,29],40:[2,29],43:[2,29],45:[2,29],46:[2,29],47:[2,29],48:[2,29],49:[2,29],50:[2,29],51:[2,29],52:[2,29],53:[2,29],54:[2,29],55:[2,29],56:[2,29],57:[2,29],58:[2,29],59:[2,29],60:[2,29],61:[2,29],62:[2,29],63:[2,29],64:[2,29],66:[2,29],67:[2,29],68:[2,29],69:[2,29],74:[2,29],77:[2,29],80:[2,29],81:[2,29],84:[2,29],90:[2,29],91:[2,29],97:[2,29],101:[2,29],111:[2,29],112:[2,29]},{1:[2,34],9:[2,34],10:[2,34],11:[2,34],15:[2,34],16:[2,34],17:[2,34],18:[2,34],20:[2,34],21:[2,34],31:[2,34],32:[2,34],39:[2,34],40:[2,34],43:[2,34],45:[2,34],46:[2,34],47:[2,34],48:[2,34],49:[2,34],50:[2,34],51:[2,34],52:[2,34],53:[2,34],54:[2,34],55:[2,34],56:[2,34],57:[2,34],58:[2,34],59:[2,34],60:[2,34],61:[2,34],62:[2,34],63:[2,34],64:[2,34],66:[2,34],67:[2,34],68:[2,34],69:[2,34],74:[2,34],77:[2,34],80:[2,34],81:[2,34],84:[2,34],90:[2,34],91:[2,34],97:[2,34],101:[2,34],111:[2,34],112:[2,34]},{1:[2,69],9:[2,69],10:[2,69],11:[2,69],15:[2,69],16:[2,69],17:[2,69],18:[2,69],21:[2,69],31:[2,69],32:[2,69],39:[2,69],40:[2,69],43:[2,69],45:[2,69],46:[2,69],47:[2,69],48:[2,69],49:[2,69],50:[2,69],51:[2,69],52:[2,69],53:[2,69],54:[2,69],55:[2,69],56:[2,69],57:[2,69],58:[2,69],59:[2,69],60:[2,69],61:[2,69],62:[2,69],63:[2,69],64:[2,69],66:[2,69],67:[2,69],68:[2,69],69:[2,69],74:[2,69],77:[2,69],80:[2,69],81:[2,69],84:[2,69],90:[2,69],91:[2,69],97:[2,69],101:[2,69],111:[2,69],112:[2,69]},{49:[2,108],77:[2,108]},{4:328,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{49:[1,284],54:[1,285],73:[1,283],99:329},{6:330,111:[1,67],112:[1,68]},{77:[1,331]},{73:[1,332]},{73:[1,333]},{75:[1,334]},{37:335,73:[1,233]},{37:336,73:[1,236]},{43:[1,276]},{43:[1,277]},{1:[2,77],9:[2,77],10:[2,77],11:[2,77],15:[2,77],16:[2,77],17:[2,77],18:[2,77],21:[2,77],31:[2,77],32:[2,77],39:[2,77],40:[2,77],43:[2,77],45:[2,77],46:[2,77],47:[2,77],48:[2,77],49:[2,77],50:[2,77],51:[2,77],52:[2,77],53:[2,77],54:[2,77],55:[2,77],56:[2,77],57:[2,77],58:[2,77],59:[2,77],60:[2,77],61:[2,77],62:[2,77],63:[2,77],64:[2,77],66:[2,77],67:[2,77],68:[2,77],69:[2,77],74:[2,77],77:[2,77],80:[2,77],81:[2,77],84:[2,77],90:[2,77],91:[2,77],97:[2,77],101:[2,77],111:[2,77],112:[2,77]},{10:[1,151],15:[2,22],16:[2,22],17:[2,22],18:[2,22],31:[2,22],32:[2,22],43:[1,337],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],101:[1,168],111:[2,22],112:[2,22]},{4:338,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{12:[2,97],14:[2,97],15:[2,97],16:[2,97],17:[2,97],18:[2,97],19:[2,97],20:[2,97],22:[2,97],28:[2,97],30:[2,97],33:[2,97],34:[2,97],40:[2,97],41:[2,97],42:[2,97],47:[2,97],48:[2,97],49:[2,97],65:[2,97],70:[2,97],73:[2,97],74:[2,97],83:[2,97],86:[2,97],89:[2,97],92:[2,97],93:[2,97],94:[2,97],97:[1,339],103:[2,97],104:[2,97],105:[2,97],108:[2,97],109:[2,97],110:[2,97],126:[2,97],133:[2,97],134:[2,97],136:[2,97],137:[2,97]},{12:[2,98],14:[2,98],15:[2,98],16:[2,98],17:[2,98],18:[2,98],19:[2,98],20:[2,98],22:[2,98],28:[2,98],30:[2,98],33:[2,98],34:[2,98],40:[2,98],41:[2,98],42:[2,98],47:[2,98],48:[2,98],49:[2,98],65:[2,98],70:[2,98],73:[2,98],74:[2,98],83:[2,98],86:[2,98],89:[2,98],92:[2,98],93:[2,98],94:[2,98],103:[2,98],104:[2,98],105:[2,98],108:[2,98],109:[2,98],110:[2,98],126:[2,98],133:[2,98],134:[2,98],136:[2,98],137:[2,98]},{4:340,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:341,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{9:[1,342],12:[2,100],14:[2,100],15:[2,100],16:[2,100],17:[2,100],18:[2,100],19:[2,100],20:[2,100],22:[2,100],28:[2,100],30:[2,100],33:[2,100],34:[2,100],40:[2,100],41:[2,100],42:[2,100],47:[2,100],48:[2,100],49:[2,100],65:[2,100],70:[2,100],73:[2,100],74:[2,100],83:[2,100],86:[2,100],89:[2,100],92:[2,100],93:[2,100],94:[2,100],103:[2,100],104:[2,100],105:[2,100],108:[2,100],109:[2,100],110:[2,100],126:[2,100],133:[2,100],134:[2,100],136:[2,100],137:[2,100]},{12:[2,101],14:[2,101],15:[2,101],16:[2,101],17:[2,101],18:[2,101],19:[2,101],20:[2,101],22:[2,101],28:[2,101],30:[2,101],33:[2,101],34:[2,101],40:[2,101],41:[2,101],42:[2,101],47:[2,101],48:[2,101],49:[2,101],65:[2,101],70:[2,101],73:[2,101],74:[2,101],83:[2,101],86:[2,101],89:[2,101],92:[2,101],93:[2,101],94:[2,101],103:[2,101],104:[2,101],105:[2,101],108:[2,101],109:[2,101],110:[2,101],126:[2,101],133:[2,101],134:[2,101],136:[2,101],137:[2,101]},{4:343,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:129,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],49:[1,346],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],76:345,78:31,83:[1,37],85:344,86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{7:347,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{6:298,9:[1,299],82:348,111:[1,67],112:[1,68]},{73:[1,349]},{11:[1,350]},{4:351,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,93],9:[2,93],10:[2,93],11:[2,93],15:[2,93],16:[2,93],17:[2,93],18:[2,93],21:[2,93],31:[2,93],32:[2,93],39:[2,93],40:[2,93],43:[2,93],45:[2,93],46:[2,93],47:[2,93],48:[2,93],49:[2,93],50:[2,93],51:[2,93],52:[2,93],53:[2,93],54:[2,93],55:[2,93],56:[2,93],57:[2,93],58:[2,93],59:[2,93],60:[2,93],61:[2,93],62:[2,93],63:[2,93],64:[2,93],66:[2,93],67:[2,93],68:[2,93],69:[2,93],74:[2,93],77:[2,93],80:[2,93],81:[2,93],84:[2,93],90:[2,93],91:[2,93],97:[2,93],101:[2,93],111:[2,93],112:[2,93]},{31:[1,115],32:[1,116],43:[1,352]},{77:[1,353]},{77:[1,210]},{1:[2,190],9:[2,190],10:[2,190],11:[2,190],15:[2,190],16:[2,190],17:[2,190],18:[2,190],21:[2,190],24:[2,190],31:[2,190],32:[2,190],39:[2,190],40:[2,190],43:[2,190],45:[2,190],46:[2,190],47:[2,190],48:[2,190],49:[2,190],50:[2,190],51:[2,190],52:[2,190],53:[2,190],54:[2,190],55:[2,190],56:[2,190],57:[2,190],58:[2,190],59:[2,190],60:[2,190],61:[2,190],62:[2,190],63:[2,190],64:[2,190],66:[2,190],67:[2,190],68:[2,190],69:[2,190],74:[2,190],77:[2,190],80:[2,190],81:[2,190],84:[2,190],88:[2,190],90:[2,190],91:[2,190],97:[2,190],101:[2,190],111:[2,190],112:[2,190],113:[2,190],114:[2,190],115:[2,190],116:[2,190],117:[2,190],118:[2,190],119:[2,190],120:[2,190],121:[2,190],122:[2,190],123:[2,190],124:[2,190],125:[2,190]},{1:[2,191],9:[2,191],10:[2,191],11:[2,191],15:[2,191],16:[2,191],17:[2,191],18:[2,191],21:[2,191],31:[2,191],32:[2,191],39:[2,191],40:[2,191],43:[2,191],45:[2,191],46:[2,191],47:[2,191],48:[2,191],49:[2,191],50:[2,191],51:[2,191],52:[2,191],53:[2,191],54:[2,191],55:[2,191],56:[2,191],57:[2,191],58:[2,191],59:[2,191],60:[2,191],61:[2,191],62:[2,191],63:[2,191],64:[2,191],66:[2,191],67:[2,191],68:[2,191],69:[2,191],74:[2,191],77:[2,191],80:[2,191],81:[2,191],84:[2,191],90:[2,191],91:[2,191],97:[2,191],101:[2,191],111:[2,191],112:[2,191]},{4:354,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[2,10],16:[2,10],17:[2,10],18:[2,10],111:[2,10],112:[2,10]},{15:[2,11],16:[2,11],17:[2,11],18:[2,11],111:[2,11],112:[2,11]},{10:[1,355]},{4:356,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],43:[1,357],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,26],9:[2,26],11:[2,26],15:[2,26],16:[2,26],17:[2,26],18:[2,26],21:[2,26],31:[2,26],32:[2,26],43:[2,26],80:[2,26],81:[2,26],84:[2,26],90:[2,26],91:[2,26],97:[2,26],111:[2,26],112:[2,26]},{4:173,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],43:[1,358],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,27],9:[2,27],11:[2,27],15:[2,27],16:[2,27],17:[2,27],18:[2,27],21:[2,27],31:[2,27],32:[2,27],43:[2,27],80:[2,27],81:[2,27],84:[2,27],90:[2,27],91:[2,27],97:[2,27],111:[2,27],112:[2,27]},{49:[1,359]},{1:[2,113],9:[2,113],10:[1,151],11:[2,113],15:[2,113],16:[2,113],17:[2,113],18:[2,113],21:[2,113],31:[2,113],32:[2,113],43:[2,113],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,113],81:[2,113],84:[2,113],90:[2,113],91:[2,113],97:[2,113],101:[1,168],111:[2,113],112:[2,113]},{77:[1,360]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:361,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{54:[1,362]},{1:[2,120],9:[2,120],10:[1,151],11:[2,120],15:[2,120],16:[2,120],17:[2,120],18:[2,120],21:[2,120],31:[2,120],32:[2,120],39:[2,120],40:[2,120],43:[2,120],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],74:[2,120],77:[2,120],80:[2,120],81:[2,120],84:[2,120],90:[2,120],91:[2,120],97:[2,120],101:[1,168],111:[2,120],112:[2,120]},{11:[1,363]},{43:[1,364]},{12:[2,122],14:[2,122],15:[2,122],16:[2,122],17:[2,122],18:[2,122],19:[2,122],20:[2,122],22:[2,122],28:[2,122],30:[2,122],33:[2,122],34:[2,122],40:[2,122],41:[2,122],42:[2,122],47:[2,122],48:[2,122],49:[2,122],65:[2,122],70:[2,122],73:[2,122],74:[2,122],83:[2,122],86:[2,122],89:[2,122],92:[2,122],93:[2,122],94:[2,122],103:[2,122],104:[2,122],105:[2,122],108:[2,122],109:[2,122],110:[2,122],126:[2,122],133:[2,122],134:[2,122],136:[2,122],137:[2,122]},{73:[1,365]},{77:[1,366]},{43:[2,125],111:[2,125],112:[2,125]},{1:[2,75],9:[2,75],10:[2,75],11:[2,75],15:[2,75],16:[2,75],17:[2,75],18:[2,75],21:[2,75],31:[2,75],32:[2,75],39:[2,75],40:[2,75],43:[2,75],45:[2,75],46:[2,75],47:[2,75],48:[2,75],49:[2,75],50:[2,75],51:[2,75],52:[2,75],53:[2,75],54:[2,75],55:[2,75],56:[2,75],57:[2,75],58:[2,75],59:[2,75],60:[2,75],61:[2,75],62:[2,75],63:[2,75],64:[2,75],66:[2,75],67:[2,75],68:[2,75],69:[2,75],74:[2,75],77:[2,75],80:[2,75],81:[2,75],84:[2,75],90:[2,75],91:[2,75],97:[2,75],101:[2,75],111:[2,75],112:[2,75]},{1:[2,32],9:[2,32],10:[2,32],11:[2,32],15:[2,32],16:[2,32],17:[2,32],18:[2,32],20:[2,32],21:[2,32],31:[2,32],32:[2,32],39:[2,32],40:[2,32],42:[1,367],43:[2,32],45:[2,32],46:[2,32],47:[2,32],48:[2,32],49:[2,32],50:[2,32],51:[2,32],52:[2,32],53:[2,32],54:[2,32],55:[2,32],56:[2,32],57:[2,32],58:[2,32],59:[2,32],60:[2,32],61:[2,32],62:[2,32],63:[2,32],64:[2,32],66:[2,32],67:[2,32],68:[2,32],69:[2,32],74:[2,32],77:[2,32],80:[2,32],81:[2,32],84:[2,32],90:[2,32],91:[2,32],97:[2,32],101:[2,32],111:[2,32],112:[2,32]},{1:[2,33],9:[2,33],10:[2,33],11:[2,33],15:[2,33],16:[2,33],17:[2,33],18:[2,33],20:[2,33],21:[2,33],31:[2,33],32:[2,33],39:[2,33],40:[2,33],42:[1,368],43:[2,33],45:[2,33],46:[2,33],47:[2,33],48:[2,33],49:[2,33],50:[2,33],51:[2,33],52:[2,33],53:[2,33],54:[2,33],55:[2,33],56:[2,33],57:[2,33],58:[2,33],59:[2,33],60:[2,33],61:[2,33],62:[2,33],63:[2,33],64:[2,33],66:[2,33],67:[2,33],68:[2,33],69:[2,33],74:[2,33],77:[2,33],80:[2,33],81:[2,33],84:[2,33],90:[2,33],91:[2,33],97:[2,33],101:[2,33],111:[2,33],112:[2,33]},{1:[2,80],9:[2,80],10:[2,80],11:[2,80],15:[2,80],16:[2,80],17:[2,80],18:[2,80],21:[2,80],31:[2,80],32:[2,80],39:[2,80],40:[2,80],43:[2,80],45:[2,80],46:[2,80],47:[2,80],48:[2,80],49:[2,80],50:[2,80],51:[2,80],52:[2,80],53:[2,80],54:[2,80],55:[2,80],56:[2,80],57:[2,80],58:[2,80],59:[2,80],60:[2,80],61:[2,80],62:[2,80],63:[2,80],64:[2,80],66:[2,80],67:[2,80],68:[2,80],69:[2,80],74:[2,80],77:[2,80],80:[2,80],81:[2,80],84:[2,80],90:[2,80],91:[2,80],97:[2,80],101:[2,80],111:[2,80],112:[2,80]},{80:[1,369]},{12:[2,99],14:[2,99],15:[2,99],16:[2,99],17:[2,99],18:[2,99],19:[2,99],20:[2,99],22:[2,99],28:[2,99],30:[2,99],33:[2,99],34:[2,99],40:[2,99],41:[2,99],42:[2,99],47:[2,99],48:[2,99],49:[2,99],65:[2,99],70:[2,99],73:[2,99],74:[2,99],83:[2,99],86:[2,99],89:[2,99],92:[2,99],93:[2,99],94:[2,99],103:[2,99],104:[2,99],105:[2,99],108:[2,99],109:[2,99],110:[2,99],126:[2,99],133:[2,99],134:[2,99],136:[2,99],137:[2,99]},{81:[1,370]},{11:[1,371]},{12:[2,102],14:[2,102],15:[2,102],16:[2,102],17:[2,102],18:[2,102],19:[2,102],20:[2,102],22:[2,102],28:[2,102],30:[2,102],33:[2,102],34:[2,102],40:[2,102],41:[2,102],42:[2,102],47:[2,102],48:[2,102],49:[2,102],65:[2,102],70:[2,102],73:[2,102],74:[2,102],83:[2,102],86:[2,102],89:[2,102],92:[2,102],93:[2,102],94:[2,102],103:[2,102],104:[2,102],105:[2,102],108:[2,102],109:[2,102],110:[2,102],126:[2,102],133:[2,102],134:[2,102],136:[2,102],137:[2,102]},{11:[1,372]},{6:294,79:373,97:[1,295],111:[1,67],112:[1,68]},{77:[1,374]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:375,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{6:298,9:[1,299],31:[1,115],32:[1,116],82:376,111:[1,67],112:[1,68]},{4:377,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:378,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,91],9:[2,91],10:[2,91],11:[2,91],15:[2,91],16:[2,91],17:[2,91],18:[2,91],21:[2,91],31:[2,91],32:[2,91],39:[2,91],40:[2,91],43:[2,91],45:[2,91],46:[2,91],47:[2,91],48:[2,91],49:[2,91],50:[2,91],51:[2,91],52:[2,91],53:[2,91],54:[2,91],55:[2,91],56:[2,91],57:[2,91],58:[2,91],59:[2,91],60:[2,91],61:[2,91],62:[2,91],63:[2,91],64:[2,91],66:[2,91],67:[2,91],68:[2,91],69:[2,91],74:[2,91],77:[2,91],80:[2,91],81:[2,91],84:[2,91],90:[2,91],91:[2,91],97:[2,91],101:[2,91],111:[2,91],112:[2,91]},{11:[1,379]},{39:[2,127]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,28:[1,132],30:[1,133],34:[1,131],35:193,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,26],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:380,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{11:[1,381]},{10:[1,382]},{21:[1,383]},{1:[2,30],9:[2,30],10:[2,30],11:[2,30],15:[2,30],16:[2,30],17:[2,30],18:[2,30],20:[2,30],21:[2,30],31:[2,30],32:[2,30],39:[2,30],40:[2,30],43:[2,30],45:[2,30],46:[2,30],47:[2,30],48:[2,30],49:[2,30],50:[2,30],51:[2,30],52:[2,30],53:[2,30],54:[2,30],55:[2,30],56:[2,30],57:[2,30],58:[2,30],59:[2,30],60:[2,30],61:[2,30],62:[2,30],63:[2,30],64:[2,30],66:[2,30],67:[2,30],68:[2,30],69:[2,30],74:[2,30],77:[2,30],80:[2,30],81:[2,30],84:[2,30],90:[2,30],91:[2,30],97:[2,30],101:[2,30],111:[2,30],112:[2,30]},{1:[2,31],9:[2,31],10:[2,31],11:[2,31],15:[2,31],16:[2,31],17:[2,31],18:[2,31],20:[2,31],21:[2,31],31:[2,31],32:[2,31],39:[2,31],40:[2,31],43:[2,31],45:[2,31],46:[2,31],47:[2,31],48:[2,31],49:[2,31],50:[2,31],51:[2,31],52:[2,31],53:[2,31],54:[2,31],55:[2,31],56:[2,31],57:[2,31],58:[2,31],59:[2,31],60:[2,31],61:[2,31],62:[2,31],63:[2,31],64:[2,31],66:[2,31],67:[2,31],68:[2,31],69:[2,31],74:[2,31],77:[2,31],80:[2,31],81:[2,31],84:[2,31],90:[2,31],91:[2,31],97:[2,31],101:[2,31],111:[2,31],112:[2,31]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:384,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{21:[1,291],49:[1,385]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],77:[1,386],101:[1,168]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:387,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,94],9:[2,94],10:[2,94],11:[2,94],15:[2,94],16:[2,94],17:[2,94],18:[2,94],21:[2,94],31:[2,94],32:[2,94],39:[2,94],40:[2,94],43:[2,94],45:[2,94],46:[2,94],47:[2,94],48:[2,94],49:[2,94],50:[2,94],51:[2,94],52:[2,94],53:[2,94],54:[2,94],55:[2,94],56:[2,94],57:[2,94],58:[2,94],59:[2,94],60:[2,94],61:[2,94],62:[2,94],63:[2,94],64:[2,94],66:[2,94],67:[2,94],68:[2,94],69:[2,94],74:[2,94],77:[2,94],80:[2,94],81:[2,94],84:[2,94],90:[2,94],91:[2,94],97:[2,94],101:[2,94],111:[2,94],112:[2,94]},{12:[2,121],14:[2,121],15:[2,121],16:[2,121],17:[2,121],18:[2,121],19:[2,121],20:[2,121],22:[2,121],28:[2,121],30:[2,121],33:[2,121],34:[2,121],40:[2,121],41:[2,121],42:[2,121],47:[2,121],48:[2,121],49:[2,121],65:[2,121],70:[2,121],73:[2,121],74:[2,121],83:[2,121],86:[2,121],89:[2,121],92:[2,121],93:[2,121],94:[2,121],103:[2,121],104:[2,121],105:[2,121],108:[2,121],109:[2,121],110:[2,121],126:[2,121],133:[2,121],134:[2,121],136:[2,121],137:[2,121]},{77:[1,388]},{54:[1,389]},{43:[1,357]},{43:[1,358]},{7:390,15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:139,25:138,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:134,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{4:391,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,85],9:[2,85],10:[2,85],11:[2,85],15:[2,85],16:[2,85],17:[2,85],18:[2,85],21:[2,85],31:[2,85],32:[2,85],39:[2,85],40:[2,85],43:[2,85],45:[2,85],46:[2,85],47:[2,85],48:[2,85],49:[2,85],50:[2,85],51:[2,85],52:[2,85],53:[2,85],54:[2,85],55:[2,85],56:[2,85],57:[2,85],58:[2,85],59:[2,85],60:[2,85],61:[2,85],62:[2,85],63:[2,85],64:[2,85],66:[2,85],67:[2,85],68:[2,85],69:[2,85],74:[2,85],77:[2,85],80:[2,85],81:[2,85],84:[2,85],90:[2,85],91:[2,85],97:[2,85],101:[2,85],111:[2,85],112:[2,85]},{1:[2,86],9:[2,86],10:[2,86],11:[2,86],15:[2,86],16:[2,86],17:[2,86],18:[2,86],21:[2,86],31:[2,86],32:[2,86],39:[2,86],40:[2,86],43:[2,86],45:[2,86],46:[2,86],47:[2,86],48:[2,86],49:[2,86],50:[2,86],51:[2,86],52:[2,86],53:[2,86],54:[2,86],55:[2,86],56:[2,86],57:[2,86],58:[2,86],59:[2,86],60:[2,86],61:[2,86],62:[2,86],63:[2,86],64:[2,86],66:[2,86],67:[2,86],68:[2,86],69:[2,86],74:[2,86],77:[2,86],80:[2,86],81:[2,86],84:[2,86],90:[2,86],91:[2,86],97:[2,86],101:[2,86],111:[2,86],112:[2,86]},{4:392,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{49:[1,393]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],97:[2,96],101:[1,168],111:[2,96],112:[2,96]},{4:394,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{81:[1,395]},{11:[1,396]},{1:[2,92],9:[2,92],10:[2,92],11:[2,92],15:[2,92],16:[2,92],17:[2,92],18:[2,92],21:[2,92],31:[2,92],32:[2,92],39:[2,92],40:[2,92],43:[2,92],45:[2,92],46:[2,92],47:[2,92],48:[2,92],49:[2,92],50:[2,92],51:[2,92],52:[2,92],53:[2,92],54:[2,92],55:[2,92],56:[2,92],57:[2,92],58:[2,92],59:[2,92],60:[2,92],61:[2,92],62:[2,92],63:[2,92],64:[2,92],66:[2,92],67:[2,92],68:[2,92],69:[2,92],74:[2,92],77:[2,92],80:[2,92],81:[2,92],84:[2,92],90:[2,92],91:[2,92],97:[2,92],101:[2,92],111:[2,92],112:[2,92]},{49:[1,397]},{15:[2,3],16:[2,3],17:[2,3],18:[2,3],111:[2,3],112:[2,3]},{4:398,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,82],9:[2,82],10:[2,82],11:[2,82],15:[2,82],16:[2,82],17:[2,82],18:[2,82],21:[2,82],31:[2,82],32:[2,82],39:[2,82],40:[2,82],43:[2,82],45:[2,82],46:[2,82],47:[2,82],48:[2,82],49:[2,82],50:[2,82],51:[2,82],52:[2,82],53:[2,82],54:[2,82],55:[2,82],56:[2,82],57:[2,82],58:[2,82],59:[2,82],60:[2,82],61:[2,82],62:[2,82],63:[2,82],64:[2,82],66:[2,82],67:[2,82],68:[2,82],69:[2,82],74:[2,82],77:[2,82],80:[2,82],81:[2,82],84:[2,82],90:[2,82],91:[2,82],97:[2,82],101:[2,82],111:[2,82],112:[2,82]},{1:[2,112],9:[2,112],10:[1,151],11:[2,112],15:[2,112],16:[2,112],17:[2,112],18:[2,112],21:[2,112],31:[2,112],32:[2,112],43:[2,112],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,112],81:[2,112],84:[2,112],90:[2,112],91:[2,112],97:[2,112],101:[1,168],111:[2,112],112:[2,112]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:399,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{54:[1,400]},{1:[2,117],9:[2,117],10:[1,151],11:[2,117],15:[2,117],16:[2,117],17:[2,117],18:[2,117],21:[2,117],31:[2,117],32:[2,117],43:[2,117],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,117],81:[2,117],84:[2,117],90:[2,117],91:[2,117],97:[2,117],101:[1,168],111:[2,117],112:[2,117]},{49:[1,401]},{73:[1,402]},{6:294,31:[1,115],32:[1,116],79:403,97:[1,295],111:[1,67],112:[1,68]},{11:[1,404]},{81:[1,405]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:406,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{11:[1,407]},{4:408,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,90],9:[2,90],10:[2,90],11:[2,90],15:[2,90],16:[2,90],17:[2,90],18:[2,90],21:[2,90],31:[2,90],32:[2,90],39:[2,90],40:[2,90],43:[2,90],45:[2,90],46:[2,90],47:[2,90],48:[2,90],49:[2,90],50:[2,90],51:[2,90],52:[2,90],53:[2,90],54:[2,90],55:[2,90],56:[2,90],57:[2,90],58:[2,90],59:[2,90],60:[2,90],61:[2,90],62:[2,90],63:[2,90],64:[2,90],66:[2,90],67:[2,90],68:[2,90],69:[2,90],74:[2,90],77:[2,90],80:[2,90],81:[2,90],84:[2,90],90:[2,90],91:[2,90],97:[2,90],101:[2,90],111:[2,90],112:[2,90]},{24:[2,105],43:[2,105],88:[2,105]},{11:[1,409]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],77:[1,410],101:[1,168]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:411,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{77:[1,412]},{43:[2,124],111:[2,124],112:[2,124]},{4:413,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,84],9:[2,84],10:[2,84],11:[2,84],15:[2,84],16:[2,84],17:[2,84],18:[2,84],21:[2,84],31:[2,84],32:[2,84],39:[2,84],40:[2,84],43:[2,84],45:[2,84],46:[2,84],47:[2,84],48:[2,84],49:[2,84],50:[2,84],51:[2,84],52:[2,84],53:[2,84],54:[2,84],55:[2,84],56:[2,84],57:[2,84],58:[2,84],59:[2,84],60:[2,84],61:[2,84],62:[2,84],63:[2,84],64:[2,84],66:[2,84],67:[2,84],68:[2,84],69:[2,84],74:[2,84],77:[2,84],80:[2,84],81:[2,84],84:[2,84],90:[2,84],91:[2,84],97:[2,84],101:[2,84],111:[2,84],112:[2,84]},{4:414,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{10:[1,151],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],97:[2,95],101:[1,168],111:[2,95],112:[2,95]},{1:[2,88],9:[2,88],10:[2,88],11:[2,88],15:[2,88],16:[2,88],17:[2,88],18:[2,88],21:[2,88],31:[2,88],32:[2,88],39:[2,88],40:[2,88],43:[2,88],45:[2,88],46:[2,88],47:[2,88],48:[2,88],49:[2,88],50:[2,88],51:[2,88],52:[2,88],53:[2,88],54:[2,88],55:[2,88],56:[2,88],57:[2,88],58:[2,88],59:[2,88],60:[2,88],61:[2,88],62:[2,88],63:[2,88],64:[2,88],66:[2,88],67:[2,88],68:[2,88],69:[2,88],74:[2,88],77:[2,88],80:[2,88],81:[2,88],84:[2,88],90:[2,88],91:[2,88],97:[2,88],101:[2,88],111:[2,88],112:[2,88]},{91:[1,415]},{15:[2,12],16:[2,12],17:[2,12],18:[2,12],111:[2,12],112:[2,12]},{54:[1,416]},{1:[2,116],9:[2,116],10:[1,151],11:[2,116],15:[2,116],16:[2,116],17:[2,116],18:[2,116],21:[2,116],31:[2,116],32:[2,116],43:[2,116],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,116],81:[2,116],84:[2,116],90:[2,116],91:[2,116],97:[2,116],101:[1,168],111:[2,116],112:[2,116]},{54:[1,417]},{81:[1,418]},{11:[1,419]},{4:420,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{15:[1,33],16:[1,35],17:[1,34],18:[1,36],20:[1,30],23:130,28:[1,132],30:[1,133],34:[1,131],35:421,36:134,37:179,38:178,40:[1,28],41:[1,180],42:[1,142],47:[1,45],48:[1,46],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{73:[1,422]},{4:423,5:3,7:10,8:4,12:[1,5],14:[1,6],15:[1,33],16:[1,35],17:[1,34],18:[1,36],19:[1,7],20:[1,30],22:[1,8],23:9,25:12,26:15,28:[1,16],30:[1,17],33:[1,18],34:[1,19],35:20,36:11,37:21,38:14,40:[1,28],41:[1,22],42:[1,26],47:[1,45],48:[1,46],49:[1,44],65:[1,47],70:[1,32],71:27,72:13,73:[1,48],74:[1,29],78:31,83:[1,37],86:[1,38],89:[1,39],92:[1,40],93:[1,41],94:[1,42],98:43,100:57,102:23,103:[1,24],104:[1,25],105:[1,51],106:52,107:53,108:[1,54],109:[1,55],110:[1,56],126:[1,59],132:49,133:[1,50],134:[1,58],136:[1,60],137:[1,61]},{1:[2,87],9:[2,87],10:[2,87],11:[2,87],15:[2,87],16:[2,87],17:[2,87],18:[2,87],21:[2,87],31:[2,87],32:[2,87],39:[2,87],40:[2,87],43:[2,87],45:[2,87],46:[2,87],47:[2,87],48:[2,87],49:[2,87],50:[2,87],51:[2,87],52:[2,87],53:[2,87],54:[2,87],55:[2,87],56:[2,87],57:[2,87],58:[2,87],59:[2,87],60:[2,87],61:[2,87],62:[2,87],63:[2,87],64:[2,87],66:[2,87],67:[2,87],68:[2,87],69:[2,87],74:[2,87],77:[2,87],80:[2,87],81:[2,87],84:[2,87],90:[2,87],91:[2,87],97:[2,87],101:[2,87],111:[2,87],112:[2,87]},{11:[1,424]},{1:[2,115],9:[2,115],10:[1,151],11:[2,115],15:[2,115],16:[2,115],17:[2,115],18:[2,115],21:[2,115],31:[2,115],32:[2,115],43:[2,115],45:[1,143],46:[1,144],47:[1,145],48:[1,146],49:[1,147],50:[1,148],51:[1,149],52:[1,150],53:[1,152],54:[1,153],55:[1,154],56:[1,155],57:[1,156],58:[1,157],59:[1,158],60:[1,159],61:[1,160],62:[1,161],63:[1,162],64:[1,163],66:[1,164],67:[1,165],68:[1,166],69:[1,167],80:[2,115],81:[2,115],84:[2,115],90:[2,115],91:[2,115],97:[2,115],101:[1,168],111:[2,115],112:[2,115]},{43:[2,123],111:[2,123],112:[2,123]},{11:[1,425]},{1:[2,89],9:[2,89],10:[2,89],11:[2,89],15:[2,89],16:[2,89],17:[2,89],18:[2,89],21:[2,89],31:[2,89],32:[2,89],39:[2,89],40:[2,89],43:[2,89],45:[2,89],46:[2,89],47:[2,89],48:[2,89],49:[2,89],50:[2,89],51:[2,89],52:[2,89],53:[2,89],54:[2,89],55:[2,89],56:[2,89],57:[2,89],58:[2,89],59:[2,89],60:[2,89],61:[2,89],62:[2,89],63:[2,89],64:[2,89],66:[2,89],67:[2,89],68:[2,89],69:[2,89],74:[2,89],77:[2,89],80:[2,89],81:[2,89],84:[2,89],90:[2,89],91:[2,89],97:[2,89],101:[2,89],111:[2,89],112:[2,89]},{1:[2,83],9:[2,83],10:[2,83],11:[2,83],15:[2,83],16:[2,83],17:[2,83],18:[2,83],21:[2,83],31:[2,83],32:[2,83],39:[2,83],40:[2,83],43:[2,83],45:[2,83],46:[2,83],47:[2,83],48:[2,83],49:[2,83],50:[2,83],51:[2,83],52:[2,83],53:[2,83],54:[2,83],55:[2,83],56:[2,83],57:[2,83],58:[2,83],59:[2,83],60:[2,83],61:[2,83],62:[2,83],63:[2,83],64:[2,83],66:[2,83],67:[2,83],68:[2,83],69:[2,83],74:[2,83],77:[2,83],80:[2,83],81:[2,83],84:[2,83],90:[2,83],91:[2,83],97:[2,83],101:[2,83],111:[2,83],112:[2,83]}],
	defaultActions: {2:[2,1],192:[2,104],200:[2,126],352:[2,127]},
	parseError: function parseError(str, hash) {
	    if (hash.recoverable) {
	        this.trace(str);
	    } else {
	        throw new Error(str);
	    }
	},
	parse: function parse(input) {
	    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
	    var args = lstack.slice.call(arguments, 1);
	    this.lexer.setInput(input);
	    this.lexer.yy = this.yy;
	    this.yy.lexer = this.lexer;
	    this.yy.parser = this;
	    if (typeof this.lexer.yylloc == 'undefined') {
	        this.lexer.yylloc = {};
	    }
	    var yyloc = this.lexer.yylloc;
	    lstack.push(yyloc);
	    var ranges = this.lexer.options && this.lexer.options.ranges;
	    // if (typeof this.yy.parseError === 'function') {
	    //     this.parseError = this.yy.parseError;
	    // } else {
	    //     this.parseError = Object.getPrototypeOf(this).parseError;
	    // }
	    function popStack(n) {
	        stack.length = stack.length - 2 * n;
	        vstack.length = vstack.length - n;
	        lstack.length = lstack.length - n;
	    }
	    function lex() {
	        var token;
	        token = self.lexer.lex() || EOF;
	        if (typeof token !== 'number') {
	            token = self.symbols_[token] || token;
	        }
	        return token;
	    }
	    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
	    while (true) {
	        state = stack[stack.length - 1];
	        if (this.defaultActions[state]) {
	            action = this.defaultActions[state];
	        } else {
	            if (symbol === null || typeof symbol == 'undefined') {
	                symbol = lex();
	            }
	            action = table[state] && table[state][symbol];
	        }
	                    if (typeof action === 'undefined' || !action.length || !action[0]) {
	                var errStr = '';
	                expected = [];
	                for (p in table[state]) {
	                    if (this.terminals_[p] && p > TERROR) {
	                        expected.push('\'' + this.terminals_[p] + '\'');
	                    }
	                }
	                if (this.lexer.showPosition) {
	                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
	                } else {
	                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
	                }
					console.log("org error:"+errStr);
					errStr = 'Syntax error, col '+ this.lexer.yylloc.first_column+': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
	
	                this.parseError(errStr, {
	                    text: this.lexer.match,
	                    token: this.terminals_[symbol] || symbol,
	                    line: this.lexer.yylineno,
	                    loc: yyloc,
	                    expected: expected
	                });
	            }
	        if (action[0] instanceof Array && action.length > 1) {
	            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
	        }
	        switch (action[0]) {
	        case 1:
	            stack.push(symbol);
	            vstack.push(this.lexer.yytext);
	            lstack.push(this.lexer.yylloc);
	            stack.push(action[1]);
	            symbol = null;
	            if (!preErrorSymbol) {
	                yyleng = this.lexer.yyleng;
	                yytext = this.lexer.yytext;
	                yylineno = this.lexer.yylineno;
	                yyloc = this.lexer.yylloc;
	                if (recovering > 0) {
	                    recovering--;
	                }
	            } else {
	                symbol = preErrorSymbol;
	                preErrorSymbol = null;
	            }
	            break;
	        case 2:
	            len = this.productions_[action[1]][1];
	            yyval.$ = vstack[vstack.length - len];
	            yyval._$ = {
	                first_line: lstack[lstack.length - (len || 1)].first_line,
	                last_line: lstack[lstack.length - 1].last_line,
	                first_column: lstack[lstack.length - (len || 1)].first_column,
	                last_column: lstack[lstack.length - 1].last_column
	            };
	            if (ranges) {
	                yyval._$.range = [
	                    lstack[lstack.length - (len || 1)].range[0],
	                    lstack[lstack.length - 1].range[1]
	                ];
	            }
	            r = this.performAction.apply(yyval, [
	                yytext,
	                yyleng,
	                yylineno,
	                this.yy,
	                action[1],
	                vstack,
	                lstack
	            ].concat(args));
	            if (typeof r !== 'undefined') {
	                return r;
	            }
	            if (len) {
	                stack = stack.slice(0, -1 * len * 2);
	                vstack = vstack.slice(0, -1 * len);
	                lstack = lstack.slice(0, -1 * len);
	            }
	            stack.push(this.productions_[action[1]][0]);
	            vstack.push(yyval.$);
	            lstack.push(yyval._$);
	            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
	            stack.push(newState);
	            break;
	        case 3:
	            return true;
	        }
	    }
	    return true;
	}};
	/* generated by jison-lex 0.2.1 */
	var lexer = (function(){
	var lexer = {

	EOF:1,

	parseError:function parseError(str, hash) {
	        if (this.yy.parser) {
	            this.yy.parser.parseError(str, hash);
	        } else {
	            throw new Error(str);
	        }
	    },

	// resets the lexer, sets new input
	setInput:function (input) {
	        this._input = input;
	        this._more = this._backtrack = this.done = false;
	        this.yylineno = this.yyleng = 0;
	        this.yytext = this.matched = this.match = '';
	        this.conditionStack = ['INITIAL'];
	        this.yylloc = {
	            first_line: 1,
	            first_column: 0,
	            last_line: 1,
	            last_column: 0
	        };
	        if (this.options.ranges) {
	            this.yylloc.range = [0,0];
	        }
	        this.offset = 0;
	        return this;
	    },

	// consumes and returns one char from the input
	input:function () {
	        var ch = this._input[0];
	        this.yytext += ch;
	        this.yyleng++;
	        this.offset++;
	        this.match += ch;
	        this.matched += ch;
	        var lines = ch.match(/(?:\r\n?|\n).*/g);
	        if (lines) {
	            this.yylineno++;
	            this.yylloc.last_line++;
	        } else {
	            this.yylloc.last_column++;
	        }
	        if (this.options.ranges) {
	            this.yylloc.range[1]++;
	        }

	        this._input = this._input.slice(1);
	        return ch;
	    },

	// unshifts one char (or a string) into the input
	unput:function (ch) {
	        var len = ch.length;
	        var lines = ch.split(/(?:\r\n?|\n)/g);

	        this._input = ch + this._input;
	        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
	        //this.yyleng -= len;
	        this.offset -= len;
	        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
	        this.match = this.match.substr(0, this.match.length - 1);
	        this.matched = this.matched.substr(0, this.matched.length - 1);

	        if (lines.length - 1) {
	            this.yylineno -= lines.length - 1;
	        }
	        var r = this.yylloc.range;

	        this.yylloc = {
	            first_line: this.yylloc.first_line,
	            last_line: this.yylineno + 1,
	            first_column: this.yylloc.first_column,
	            last_column: lines ?
	                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
	                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
	              this.yylloc.first_column - len
	        };

	        if (this.options.ranges) {
	            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
	        }
	        this.yyleng = this.yytext.length;
	        return this;
	    },

	// When called from action, caches matched text and appends it on next action
	more:function () {
	        this._more = true;
	        return this;
	    },

	// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
	reject:function () {
	        if (this.options.backtrack_lexer) {
	            this._backtrack = true;
	        } else {
	            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
	                text: "",
	                token: null,
	                line: this.yylineno
	            });

	        }
	        return this;
	    },

	// retain first n characters of the match
	less:function (n) {
	        this.unput(this.match.slice(n));
	    },

	// displays already matched input, i.e. for error messages
	pastInput:function () {
	        var past = this.matched.substr(0, this.matched.length - this.match.length);
	        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
	    },

	// displays upcoming input, i.e. for error messages
	upcomingInput:function () {
	        var next = this.match;
	        if (next.length < 20) {
	            next += this._input.substr(0, 20-next.length);
	        }
	        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
	    },

	// displays the character position where the lexing error occurred, i.e. for error messages
	showPosition:function () {
	        var pre = this.pastInput();
	        var c = new Array(pre.length + 1).join("-");
	        return pre + this.upcomingInput() + "\n" + c + "^";
	    },

	// test the lexed token: return FALSE when not a match, otherwise return token
	test_match:function (match, indexed_rule) {
	        var token,
	            lines,
	            backup;

	        if (this.options.backtrack_lexer) {
	            // save context
	            backup = {
	                yylineno: this.yylineno,
	                yylloc: {
	                    first_line: this.yylloc.first_line,
	                    last_line: this.last_line,
	                    first_column: this.yylloc.first_column,
	                    last_column: this.yylloc.last_column
	                },
	                yytext: this.yytext,
	                match: this.match,
	                matches: this.matches,
	                matched: this.matched,
	                yyleng: this.yyleng,
	                offset: this.offset,
	                _more: this._more,
	                _input: this._input,
	                yy: this.yy,
	                conditionStack: this.conditionStack.slice(0),
	                done: this.done
	            };
	            if (this.options.ranges) {
	                backup.yylloc.range = this.yylloc.range.slice(0);
	            }
	        }

	        lines = match[0].match(/(?:\r\n?|\n).*/g);
	        if (lines) {
	            this.yylineno += lines.length;
	        }
	        this.yylloc = {
	            first_line: this.yylloc.last_line,
	            last_line: this.yylineno + 1,
	            first_column: this.yylloc.last_column,
	            last_column: lines ?
	                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
	                         this.yylloc.last_column + match[0].length
	        };
	        this.yytext += match[0];
	        this.match += match[0];
	        this.matches = match;
	        this.yyleng = this.yytext.length;
	        if (this.options.ranges) {
	            this.yylloc.range = [this.offset, this.offset += this.yyleng];
	        }
	        this._more = false;
	        this._backtrack = false;
	        this._input = this._input.slice(match[0].length);
	        this.matched += match[0];
	        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
	        if (this.done && this._input) {
	            this.done = false;
	        }
	        if (token) {
	            return token;
	        } else if (this._backtrack) {
	            // recover context
	            for (var k in backup) {
	                this[k] = backup[k];
	            }
	            return false; // rule action called reject() implying the next rule should be tested instead.
	        }
	        return false;
	    },

	// return next match in input
	next:function () {
	        if (this.done) {
	            return this.EOF;
	        }
	        if (!this._input) {
	            this.done = true;
	        }

	        var token,
	            match,
	            tempMatch,
	            index;
	        if (!this._more) {
	            this.yytext = '';
	            this.match = '';
	        }
	        var rules = this._currentRules();
	        for (var i = 0; i < rules.length; i++) {
	            tempMatch = this._input.match(this.rules[rules[i]]);
	            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
	                match = tempMatch;
	                index = i;
	                if (this.options.backtrack_lexer) {
	                    token = this.test_match(tempMatch, rules[i]);
	                    if (token !== false) {
	                        return token;
	                    } else if (this._backtrack) {
	                        match = false;
	                        continue; // rule action called reject() implying a rule MISmatch.
	                    } else {
	                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
	                        return false;
	                    }
	                } else if (!this.options.flex) {
	                    break;
	                }
	            }
	        }
	        if (match) {
	            token = this.test_match(match, rules[index]);
	            if (token !== false) {
	                return token;
	            }
	            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
	            return false;
	        }
	        if (this._input === "") {
	            return this.EOF;
	        } else {
	            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
	                text: "",
	                token: null,
	                line: this.yylineno
	            });
	        }
	    },

	// return next match that has a token
	lex:function lex() {
	        var r = this.next();
	        if (r) {
	            return r;
	        } else {
	            return this.lex();
	        }
	    },

	// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
	begin:function begin(condition) {
	        this.conditionStack.push(condition);
	    },

	// pop the previously active lexer condition state off the condition stack
	popState:function popState() {
	        var n = this.conditionStack.length - 1;
	        if (n > 0) {
	            return this.conditionStack.pop();
	        } else {
	            return this.conditionStack[0];
	        }
	    },

	// produce the lexer rule set which is active for the currently active lexer condition state
	_currentRules:function _currentRules() {
	        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
	            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
	        } else {
	            return this.conditions["INITIAL"].rules;
	        }
	    },

	// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
	topState:function topState(n) {
	        n = this.conditionStack.length - 1 - Math.abs(n || 0);
	        if (n >= 0) {
	            return this.conditionStack[n];
	        } else {
	            return "INITIAL";
	        }
	    },

	// alias for begin(condition)
	pushState:function pushState(condition) {
	        this.begin(condition);
	    },

	// return the number of states currently on the stack
	stateStackSize:function stateStackSize() {
	        return this.conditionStack.length;
	    },
	options: {},
	performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

	var YYSTATE=YY_START;
	switch($avoiding_name_collisions) {
	case 0:/* skip whitespace */
	break;
	case 1:return 'NUMBER'
	break;
	case 2:return 40
	break;
	case 3:return 49
	break;
	case 4:return 50
	break;
	case 5:return 48
	break;
	case 6:return 47
	break;
	case 7:return 53
	break;
	case 8:return 34
	break;
	case 9:return 51
	break;
	case 10:return 42
	break;
	case 11:return 43
	break;
	case 12:return 58
	break;
	case 13:return 56
	break;
	case 14:return 39
	break;
	case 15:return 67
	break;
	case 16:return 66
	break;
	case 17:return 94
	break;
	case 18:return 89
	break;
	case 19:return 11
	break;
	case 20:return 'EOF'
	break;
	case 21: return 73; 
	break;
	case 22:return 'INVALID_SYMBOL'
	break;
	}
	},
	rules: [/^(?:\s+)/,/^(?:[0-9]+(\.[0-9]+)?\b)/,/^(?:::)/,/^(?:\*)/,/^(?:\/)/,/^(?:-)/,/^(?:\+)/,/^(?:\^)/,/^(?:!)/,/^(?:%)/,/^(?:\()/,/^(?:\))/,/^(?:<)/,/^(?:>)/,/^(?:\.)/,/^(?:>>)/,/^(?:<<)/,/^(?:def\b)/,/^(?:begin\b)/,/^(?:end\b)/,/^(?:$)/,/^(?:[a-zA-Z_]\w*)/,/^(?:.)/],
	conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],"inclusive":true}}
};// var lexer = 
	return lexer;
	})();// var lexer = ( /* end of lexer define */
	parser.lexer = lexer;
	// function Parser () {
	//   this.yy = {};
	// }
	// 
	// Parser.prototype = parser;parser.Parser = Parser;
	// return new Parser;
	return parser;
	})(); // var ruby = (


	

	 
	// exports.parser = ruby;
	// exports.Parser = ruby.Parser;
	// exports.parse = function () { return ruby.parse.apply(ruby, arguments); };
	exports.RUBY = ruby;
}); // define