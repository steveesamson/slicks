/**
 * Created by steve on 7/21/16.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.stud = factory();
    }
}(this, function () {

    var isStud = function (o) {
            return o instanceof stud;
        },
        stud = function () {
            if (!isStud(this)) return new stud();
            this.cache = {};
        },
        isString = function(o){
            return typeof o === 'string';
        };
    stud.fn = stud.prototype;
    stud.fn.buffer = function () {
        return require('strbuilder')();
    };
    stud.fn.render = function (name, data, cb) {
        var str = this.cache[name](data);
        if(cb) cb(str);
        else return str;
    };
    stud.fn.isRegistered = function (name) {
        return !!this.cache[name];
    };
    stud.fn.register = function (name, fn) {
        if(!name || !fn || !(typeof fn === 'function')){
            console.error("Cannot register template...");
            return;
        }
        this.cache[name] = fn;
    };

    stud.fn.compile = function (tmplString, tmplName, cb) {

        var compileNow = function(template, name){

            var re = /([^{]*)?(\{(\w+)\})([^{]*)?/ig, sb = require('strbuilder')();
            template.replace(
                re,
                function ($0, $1, $2, $3, $4) {
                    if ($1) {
                        if (sb.length) sb.append(".append(\"" + $1 + "\")");
                        else  sb.append("b.append(\"" + $1 + "\")");
                    }
                    if ($3) {
                        if (sb.length) sb.append(".append(x['" + $3 + "'])");
                        else  sb.append("b.append(x['" + $3 + "'])");
                    }

                    if ($4) {
                        if (sb.length) sb.append(".append(\"" + $4 + "\")");
                        else  sb.append("b.append(\"" + $4 + "\")");
                    }

                    return;
                }
            );
            return "(function(c){var b = c.buffer();c.register(\"" + name + "\",function(x){" + sb.toString() + "; return b.toString();});}(stud));";
        };

        if(isString(tmplString) && isString(tmplName)){
            tmplString = tmplString.replace(/\s+/g," ");
            if(cb){
                cb(compileNow(tmplString, tmplName));
            }else return compileNow(tmplString, tmplName);
        }

    };

    return stud();
}));