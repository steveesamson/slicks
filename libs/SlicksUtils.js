module.exports = function () {
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        }
    }
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (prefix) {
            return this.indexOf(prefix) === 0;
        };
    }

    var happy = function (j) {
            return (j !== null && j.error === undefined);
        },
        xtend = function (o, options) {

            for (var k in options) {
                if(options.hasOwnProperty(k))
                {
                    o[k] = options[k];
                }

            }
        },
        isFunction = function (cb) {
            return typeof cb === "function";
        },
        makeName = function (str) {
            var index = str.indexOf('_');
            if (index < 0) {
                return str == 'id' ? str.toUpperCase() : (str.charAt(0)).toUpperCase() + str.substring(1);
            }
            var names = str.split('_');
            var new_name = '';
            names.forEach(function (s) {
                new_name += new_name.length > 0 ? " " + makeName(s) : makeName(s);
            });

            return new_name;

        },
        isArray = function (o) {
            return o instanceof Array;
        },
        isObject = function(o){
            return typeof o === 'object';
        },
        each = function (arrayOrObject, cb) {
            if(isArray(arrayOrObject)){
                for (var i = 0; i < arrayOrObject.length; ++i) {
                    arrayOrObject[i] && cb && cb.call(arrayOrObject[i],i,arrayOrObject[i]);
                }
            }else if(isObject(arrayOrObject)){
                for(var k in arrayOrObject){
                    cb && cb.call(arrayOrObject[k],k,arrayOrObject[k]);
                }
            }

        },
        uid = function () {
// Math.random should be unique because of its seeding algorithm.
// Convert it to base 36 (numbers + letters), and grab the first 9 characters
// after the decimal.
            return '_' + Math.random().toString(36).substr(2, 9);
        },
        ajax = function (url, method, data, cb) {

            $.ajax({
                type: method,
                beforeSend: function (xhr) {
                    $('.data-connecting').show();
                    Session.isAuthenticated() && xhr.setRequestHeader('x-csrf-token', Session.user().token || '');
                },
                url: url,
                data: data,
                success: function (res) {
                    $('.data-connecting').hide();
                    cb(res);
                },
                error: function () {
                    $('.data-connecting').hide();
                },
                dataType: 'json'
            });
        },
        sync_bee = function (method, model, cb) {


            var url = null, data = {};
            switch (method) {
                case 'post':
                    url = model.url;
                    data = model.toObject();
                    break;
                case 'put':
                    url = model.url + '/' + model.get('id');
                    data = model.dirts();
                    var last_updated = model.get('last_updated');
                    if (last_updated) {
                        data['last_updated'] = last_updated;
                    }
                    break;
                case 'delete':
                    url = model.url + '/' + model.get('id');
                    var last_updated = model.get('last_updated');
                    if (last_updated) {
                        data['last_updated'] = last_updated;
                    }
                    break;
                case 'get':
                    url = model.url;
                    data = model.query || {};
                    break;
                default:
                    console.log('Unknown method: ' + method);
                    return;
            }

            this.sync(url, method, data, function (mdl) {
                if (happy(mdl)) {

                    cb && cb(false, mdl);
                } else {
                    var message = mdl.text || mdl.error;
                    message = message.replace('ER_SIGNAL_EXCEPTION:', '');
                    cb && cb(message);
                }
            });
        },
        attachEvent = function (evt, handler, context) {
            handler['context'] = context;
            if (!this[evt]) {
                this[evt] = [];
            }
            this[evt].push(handler);
        },
        detachEvent = function (evt) {
            delete this[evt];
        },
        delimitNumbers = function (str) {
            return (str + "").replace(/\b(\d+)((\.\d+)*)\b/g, function (a, b, c) {
                return (b.charAt(0) > 0 && !(c || ".").lastIndexOf(".") ? b.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : b) + c;
            });
        },
        baseName = function (path) {
            if (!path) return path;
            var lookfor = '';
            if (path.indexOf('\\') > -1) {
                lookfor = '\\';
            } else if (path.indexOf('/') > -1) {
                lookfor = '/';
            } else {
                return path;
            }
            var idx = path.lastIndexOf(lookfor);
            return path.substring(idx + 1);

        },
        isNumeric = function (n) {
            if (!n) {
                return false;
            }
            n = n.toString();
            if (n.startsWith('-') && n.length === 1) {
                n += '0';
            }
            if (n.endsWith('.')) {
                n += '0';
            }

            return n && n.toString().match(/^[-+]?[0-9]+(\.[0-9]+)?$/g);

        },
        isInteger = function (n) {
            return n && n.toString().match(/^[-+]?\d+$/g);
        },
        formatFields = function (map) {
            //console.log(map);
            var copy = {};
            each(map, function (k, v) {
                copy[k] = v;
                if (contains(k, ['amount', 'price', 'sum'])) {
                    if (isNumeric(v)) {
                        copy[k] = format(v);
                    }
                }

            });

            return copy;
        },
        contains = function (str, needle) {

            str = str.toLowerCase();

            var has = false;
            if (str.length === 0) return has;
            if (isArray(needle)) {
                each(needle, function (i) {
                    if (str.indexOf(needle[i].toLowerCase()) !== -1) {
                        has = true;
                    }
                });
            } else {
                has = str.indexOf(needle.toLowerCase()) !== -1;
            }

            return has;

        },
        format = function (amount) {
            var i = parseFloat(amount);
            if (isNaN(i)) {
                i = 0.00;
            }
            var minus = '';
            if (i < 0) {
                minus = '-';
            }
            i = Math.abs(i);
            i = parseInt((i + .005) * 100);
            i = i / 100;
            var s = String(i);
            if (s.indexOf('.') < 0) {
                s += '.00';
            }
            if (s.indexOf('.') == (s.length - 2)) {
                s += '0';
            }
            s = minus + s;

            return delimitNumbers(s);
        },
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


    return {
        Crypt: require('./tiny-tea'),
        Hashid: require("hashids"),
        happy: happy,
        xtend: xtend,
        isFunction: isFunction,
        makeName: makeName,
        isArray: isArray,
        each: each,
        uid: uid,
        ajax: ajax,
        sync_bee: sync_bee,
        attachEvent: attachEvent,
        detachEvent: detachEvent,
        baseName: baseName,
        isNumeric: isNumeric,
        isInteger: isInteger,
        formatFields: formatFields,
        contains: contains,
        format: format,
        Months:months,
        Days:days
    };

};

