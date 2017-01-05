(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = (typeof self == 'object' && self.self === self && self) ||
            (typeof global == 'object' && global.global === global && global);

  // Set up Slicks appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['jquery', 'exports'], function($, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Slicks.
      root.Slicks = factory(root, exports, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var $;
    try { $ = require('jquery'); } catch (e) {}
    factory(root, exports, $);

  // Finally, as a browser global.
  } else {
    root.Slicks = factory(root, {}, (root.jQuery || root.Zepto || root.ender || root.$));
  }

})(function(root, exports, $){

    if (!$) {
        throw Error("Include jQuery, Seleto, Zepto or ender on your page to use Slicks-mvc");
    }

    if (typeof Array.prototype.indexOf == 'undefined') {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        }
    }
    if (typeof String.prototype.endsWith == 'undefined') {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }
    if (typeof String.prototype.startsWith == 'undefined') {
        String.prototype.startsWith = function (prefix) {
            return this.indexOf(prefix) === 0;
        };
    }

    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    const RE = /([^{]*)?(\{(\w+)\})?([^{]*)?/ig;

    var isString = function (o) {
            return typeof o === 'string';
        },
        stringbuilder = function (initialString) {
            var content = [];
            (initialString && content.push(initialString));

            return {
                append: function (text) {
                    content.push(text);
                    this.length = content.length;
                    return this;
                },
                length: content.length,
                toString: function () {
                    return content.join('');
                }
            };

        },
        renderString = function (templateString, options, cb) {
            var sb = stringbuilder();

            templateString = templateString.trim().replace(/"/g, "'");
            templateString = templateString.replace(/[\n\r]/g, ' ');
            templateString = templateString.replace(/\s+/g, ' ');

            templateString.replace(
                RE,
                function ($0, $1, $2, $3, $4) {
                    if ($1) {
                        sb.append($1);
                    }
                    if ($3) {
                        sb.append(options[$3]);
                    }

                    if ($4) {
                        sb.append($4);
                    }

                    return;
                }
            );
            cb && cb(false, sb.toString());
        },
        stud = {
            cache: {},
            buffer: function (startString) {

                return stringbuilder(startString);
            },
            render: function (name, data, cb) {
                var str = this.cache[name](data);
                if (cb) cb(str);
                else return str;
            },
            isRegistered: function (name) {
                return !!this.cache[name];
            },
            register: function (name, fn) {
                if (!name || !fn || !(typeof fn === 'function')) {
                    console.error("Cannot register template...");
                    return;
                }
                this.cache[name] = fn;
            },
            template: function (templateString, options, cb) {

                renderString(templateString, options, cb);
            }

        },
        Crypt = (function () {

        var encode = function (s) {
            var enc = "";
            var str = "";
            // make sure that input is string
            str = s + "";

            for (var i = 0; i < s.length; i++) {
                // create block
                var a = s.charCodeAt(i);
                // bitwise XOR
                var b = a ^ '120';
                enc = enc + String.fromCharCode(b);
            }
            return enc;
        };

        return {
            encrypt: function (clear) {

                return btoa(encode(clear));
            },
            decrypt: function (sealed) {

                return encode(atob(sealed));

            }
        };
    }()),
     _ = (function () {
        var happy = function (j) {
                return (j !== null && j.error === undefined);
            },
            inherits = function (base) {
                function F() {}

                F.prototype = base;
                var f = new F;
                f.parent = F.prototype;
                return f;
            },
            xtend = function () {

                var o = arguments[0];

                for (var i = 1; i < arguments.length; ++i) {
                    var options = arguments[i];
                    for (var k in options) {
                        if (options.hasOwnProperty(k)) {
                            o[k] = options[k];
                        }

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
                return Array.isArray(o);
            },
            isString = function (o) {
                return typeof o === 'string';
            },
            isObject = function (o) {
                return typeof o === 'object';
            },
            each = function (arrayOrObject, cb) {
                if (isArray(arrayOrObject)) {
                    for (var i = 0; i < arrayOrObject.length; ++i) {
                        arrayOrObject[i] && cb && cb.call(arrayOrObject[i], i, arrayOrObject[i]);
                    }
                } else if (isObject(arrayOrObject)) {
                    for (var k in arrayOrObject) {
                        cb && cb.call(arrayOrObject[k], k, arrayOrObject[k]);
                    }
                }

            },
            uid = function () {
                return '_' + Math.random().toString(36).substr(2, 9);
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
                var i = parseFloat(amount),
                    delimitNumbers = function (str) {
                        return (str + "").replace(/\b(\d+)((\.\d+)*)\b/g, function (a, b, c) {
                            return (b.charAt(0) > 0 && !(c || ".").lastIndexOf(".") ? b.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : b) + c;
                        });
                    };
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
            };


        return {
            encrypt: Crypt.encrypt,
            decrypt: Crypt.decrypt,
            happy: happy,
            xtend: xtend,
            inherits: inherits,
            isFunction: isFunction,
            makeName: makeName,
            isArray: isArray,
            each: each,
            uid: uid,
            attachEvent: attachEvent,
            detachEvent: detachEvent,
            baseName: baseName,
            isNumeric: isNumeric,
            isInteger: isInteger,
            formatFields: formatFields,
            contains: contains,
            format: format
        };

    }()),
     Ext = function () {

        (function () {
            var oldClean = $.cleanData;


            $.cleanData = function (elems) {
                for (var i = 0, elem;
                    (elem = elems[i]) !== undefined; i++) {
                    $(elem).triggerHandler("destroyed");
                }
                oldClean(elems);
            };
        })();


        $.notify = function (txt, type) {
            $('p.error, p.message, p.success').hide('slow');
            if (!txt) {
                return;
            }
            var msg = $('p.' + type);
            if (msg) {
                msg.find('.' + type.trim() + '-message').text(txt).end().fadeIn('slow');
                setTimeout(function () {
                    msg.hide('slow');
                }, type == 'error' ? 10000 + txt.length : 8000 + txt.length);
            } else {
                alert(txt);
            }
        };

        $.mapob = function ($el) {
            var map = {};
            $el.find(':input').not(':button').each(function () {
                var dis = $(this);
                var name = dis.attr('name');
                if (!name) return;
                if (dis.is(':checkbox') || dis.is(':radio')) {
                    if (dis.is(':checked')) {
                        map[name] = dis.val() == 'on' ? 'true' : dis.val();
                    } else {
                        map[name] = dis.val() == 'on' ? 'false' : '';
                    }
                } else {
                    var value = dis.val();
                    if ($.trim(value)) {
                        if (name !== 'Zebra_DatePicker_Icon' && name !== undefined) {
                            map[name] = value;
                        }
                    }
                }
            });
            return map;
        };

        $.fn.loadImage = function (src, cb) {
            return $(this).each(function () {
                var image_container = $(this);
                image_container.empty().fadeIn('slow').addClass('image_loading');
                var img = new Image();
                $(img).load(
                    function () {
                        $(this).css('display', 'none');
                        image_container.removeClass('image_loading').empty().append(this);
                        $(this).fadeIn('slow', function () {
                            cb && $.isFunction(cb) && cb();
                        });
                    }).error(
                    function () {
                        image_container.remove();
                    }).attr('src', src + '?' + (new Date()).getTime());
            });
        };
        $.fn.showMe = function (cb) {
            cb && cb();
            return $(this).each(function () {
                $(this).removeClass('hide');

            });
        };
        $.fn.hideMe = function (cb) {
            cb && cb();
            return $(this).each(function () {
                $(this).addClass('hide');

            });
        };
        $.fn.xhange = function (context) {
            return $(this).change(
                function () {
                    var sel = $(this).val();
                    var name = $(this).attr('name');
                    context.model && context.model.set(name, sel);
                }
            )
        };
        $.fn.clear = function (removeTip) {

            return $(this).each(function () {
                $(this).find('[type=file], [type=text], [type=password], [type=hidden], select, textarea')
                    .each(function () {
                        var input = $(this);
                        input.val('');
                        if (input.is('[data-validation]')) {
                            removeTip && removeTip(input);
                            input.change && input.change();
                        }
                    });
            })
        };
        $.fn.only_numeric = function () {
            return $(this).each(function () {
                $(this).keyup(function () {
                    if (!_.isNumeric($(this).val())) {
                        $(this).val('');
                    }
                });
            });
        };
        $.fn.only_integer = function () {
            return $(this).each(function () {
                $(this).keyup(function () {
                    if (!_.isInteger($(this).val())) {
                        $(this).val('');
                    }
                });
            });
        };
        $.fn.swapWith = function (tag) {
            return this.each(function () {
                var elm = $(this),
                    new_elm = null;
                switch (tag.toLowerCase()) {
                    case 'select':
                        new_elm = $('<select></select>');
                        break;
                    case 'text':
                        new_elm = $('<input type="text"/>');
                        break;
                    case 'password':
                        new_elm = $('<input type="password"/>');
                        break;
                    case 'textarea':
                        new_elm = $('<textarea></textarea>');
                        break;
                }
                elm.hide(function () {
                    new_elm.attr('name', elm.attr('name')).attr('class', elm.attr('class')).attr('id', elm.attr('id')).attr('value', elm.attr('value'));
                    elm = elm.replaceWith(new_elm);
                })
            });
        };
        $.fn.swapClass = function (c1, c2) {
            return this.each(function () {
                if ($(this).is('.' + c1)) {
                    $(this).removeClass(c1).addClass(c2);
                } else {
                    $(this).removeClass(c2).addClass(c1);
                }
            });
        };

        $.extLoaded = true;
    };

     _.template = function (cb, mdl, tmpl_name) {
        var self = this,
            load = ((mdl && mdl.toObject()) || (this.model && this.model.toObject()) || {}),
            template;
        load = this.isEditor ? load : _.formatFields(load);
        if (this.template && this.template.startsWith('@')) {

            template = this.template.substring(1);
            stud.template(template, load, function (error, str) {
                if (error) {
                    console.log(error);
                    return;
                }
                cb && cb.call(self, str);
            });

        } else {

            template = tmpl_name || this.template;
            if (!template) {
                cb && cb('');
                return;
            }
            template += '.html';
            stud.render(template, load, function (error, str) {
                if (error) {
                    console.log(error);
                    return;
                }
                cb && cb.call(self, str);
            });
        }
    };

    exports.sync = function (url, method, data, cb) {

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
    };



    var Model = function (_url, _attributes, _socket) {

            var resolveCall = function (url, params, cb) {

                    var len = arguments.length;

                    if (len < 1) {
                        throw Error("Invalid arguments error");
                    }

                    switch (len) {
                        case 3:
                            if (!_.isFunction(cb)) {
                                throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
                            }
                            break;
                        case 2:
                            cb = params;

                            if (!_.isFunction(cb)) {
                                throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
                            }
                            params = false;
                            break;
                        case 1:
                            cb = url;

                            if (!_.isFunction(cb)) {
                                throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
                            }
                            params = false;
                            url = false;
                            break;
                    }

                    var attr = params || this.toObject(),
                        mdl = Model((url || this.url), attr, this.useRealTime);
                    mdl.extend({
                        sync: this.sync
                    });
                    mdl.query = attr;
                    return {
                        model: mdl,
                        callback: cb
                    };
                },
                prepSyncing = function (method, model, cb) {


                    var url = null,
                        data = {};
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
                        if (_.happy(mdl)) {

                            cb && cb(false, mdl);
                        } else {
                            var message = mdl.text || mdl.error;
                            message = message.replace('ER_SIGNAL_EXCEPTION:', '');
                            cb && cb(message);
                        }
                    });
                },
                events = {},
                fire = function (evt, data) {

                    var cntx = null;
                    if (events[evt]) {
                        _.each(events[evt], function () {
                            cntx = this['context'];
                            data ? this.call(cntx, data) : this.call(cntx);
                        });

                    }

                },
                dirty_attributes = {},
                attributes = {},
                _Model = function (url, attribs, isRealTime) {

                    attributes = attribs || {};
                    url = url || '';

                    var proto = {
                        url: url,
                        model_name: url.replace(/\//g, ''),
                        useRealTime: isRealTime,
                        extend: function (options) {
                            if (options) {
                                _.xtend(this, options);
                            }
                            return this;
                        },
                        has: function (attr) {
                            return attributes.hasOwnProperty(attr);
                        },
                        params: function (salt) {
                            var enc = _.Crypt.encrypt(attributes, salt || Session.appName());
                            enc = encodeURIComponent(enc);
                            return enc;
                        },
                        get: function (attr) {
                            return attributes[attr];
                        },
                        getInt: function (attr) {
                            var val = attributes[attr];
                            return parseInt(val);
                        },
                        getFloat: function (attr) {
                            var val = attributes[attr];
                            return parseFloat(val);
                        },
                        set: function (key, value) {
                            attributes[key] = value;
                            dirty_attributes[key] = value;
                            return this;
                        },
                        change: function (k, v) {
                            this.set(k, v).fire('change');
                            return this;
                        },
                        unset: function (attr) {
                            delete attributes[attr];
                            fire('change', this);
                            return this;
                        },
                        populate: function (attrs) {

                            for (var k in attrs) {
                                this.set(k, attrs[k]);
                            }
                            return this;
                        },
                        fire: function (event) {
                            fire(event, this);
                            return this;
                        },
                        login: function (cb) {
                            var mdl = Model(this.url + '/login', attributes, this.useRealTime);
                            prepSyncing.call(mdl, 'post', mdl, cb);
                        },
                        unlink: function (params, cb) {
                            var mdl = Model(this.url + '/unlink', params, this.useRealTime);
                            prepSyncing.call(mdl, 'post', mdl, cb);
                            return this;
                        },
                        fetch: function (url, params, cb) {
                            var fnbody = resolveCall.apply(this, arguments);
                            prepSyncing.call(fnbody.model, 'get', fnbody.model, fnbody.callback);
                            return this;
                        },
                        post: function (url, params, cb) {
                            var fnbody = resolveCall.apply(this, arguments);
                            prepSyncing.call(fnbody.model, 'post', fnbody.model, fnbody.callback);
                            return this;
                        },
                        save: function (cb) {
                            var method = attributes.id ? 'put' : 'post',
                                self = this;

                            prepSyncing.call(this, method, this, function (e, mdl) {

                                _.xtend(mdl, {
                                    method: method,
                                    url: self.url
                                });
                                if (!e) {

                                    if (method === 'put') {
                                        for (var attr in mdl) {
                                            attributes[attr] = mdl[attr];
                                        }
                                        for (var key in dirty_attributes) {
                                            fire(key + ':change');
                                        }

                                        fire('change', self);
                                        dirty_attributes = {};

                                        if (cb && _.isFunction(cb)) {
                                            _.xtend(mdl, {
                                                message: _.makeName(self.model_name) + ' was successfully updated.'
                                            });
                                            cb(e, mdl);
                                        } else {
                                            $.notify(_.makeName(self.model_name) + ' was successfully updated.', 'success');
                                        }


                                    } else if (method === 'post') {
                                        attributes = mdl;
                                        self.isNew = true;
                                        fire('created', self);
                                        if (cb && _.isFunction(cb)) {

                                            _.xtend(mdl, {
                                                message: _.makeName(self.model_name) + ' was successfully created.'
                                            });
                                            cb(e, mdl);
                                            //global.isTest? cb(e,mdl):  cb(_.makeName(self.model_name) + ' was successfully created.', 'success');

                                        } else {
                                            $.notify(_.makeName(self.model_name) + ' was successfully created.', 'success');
                                        }
                                    }
                                } else {
                                    $.notify(e);
                                }

                            });

                            return this;
                        },
                        destroy: function (cb) {
                            var self = this,
                                md = {
                                    method: 'delete',
                                    url: self.url
                                };
                            if (!this.getInt('id')) {
                                this.fire('destroy');

                                _.xtend(md, {
                                    message: _.makeName(self.model_name) + ' was successfully deleted.'
                                });
                                cb && cb(false, md);
                                return;
                            }
                            prepSyncing.call(this, 'delete', this, function (e, mdl) {
                                if (!e) {
                                    var deleted = parseInt(mdl.affectedRows);
                                    if (deleted) {
                                        fire('destroy', self);
                                        //cb && _.isFunction(cb) && cb();
                                        if (cb && _.isFunction(cb)) {
                                            _.xtend(mdl, md);
                                            _.xtend(mdl, {
                                                message: _.makeName(self.model_name) + ' was successfully deleted.'
                                            });
                                            cb(e, mdl);
                                        } else {
                                            $.notify(_.makeName(self.model_name) + ' was successfully deleted.', 'success');
                                        }


                                    }
                                }
                            });
                            return this;
                        },
                        toObject: function () {
                            return attributes;
                        },
                        dirts: function () {
                            return dirty_attributes;
                        },
                        toJSON: function () {
                            return JSON.stringify(attributes);
                        },
                        reset: function () {
                            attributes = {};
                            fire('change', this);
                            return this;
                        },
                        on: function (event, handler, context) {

                            if (event && event.indexOf(',') != -1) {
                                var evts = event.split(',');
                                _.each(evts, function () {
                                    _.attachEvent.call(events, (this).trim(), handler, context);
                                });

                            } else {
                                _.attachEvent.call(events, (event).trim(), handler, context);
                            }
                            return this;

                        },
                        off: function (event) {
                            if (event) {
                                if (event.indexOf(',') != -1) {
                                    var evts = event.split(',');

                                    _.each(evts, function () {
                                        _.detachEvent.call(events, (this).trim());
                                    });
                                } else {
                                    _.detachEvent.call(events, event.trim());
                                }
                            } else {
                                events = {};
                            }

                            return this;
                        },
                        sync: Slicks.sync
                    };
                    return _.inherits(proto);

                };

            return _Model(_url, _attributes, _socket);
        },
        Collection = function (_url, _transport) {
            var events = {},
                changeEventListeners = [],
                fire = function (evt, data) {

                    var cntx = null;
                    if (events[evt]) {
                        _.each(events[evt], function () {
                            cntx = this['context'];
                            data ? this.call(cntx, data) : this.call(cntx);
                        });
                    }
                },
                models = {
                    list: [],
                    map: {},
                    add: function (_koll, mdl) {
                        if (mdl) {

                            if (this.map[mdl.get('id')]) {

                                var old = this.map[mdl.get('id')];
                                old.populate(mdl.toObject());
                                old.fire('change');
                                //In case; already exists.
                                return;
                            }
                            mdl.on('destroy', _koll.remove, _koll);
                            mdl.on('change', model_changed, _koll);
                            !mdl.get('id') && mdl.set('id', _.uid());
                            mdl.isNew = true;
                            this.list.push(mdl);
                            this.map[mdl.get('id')] = mdl;
                            _koll.length = this.list.length;
                            fire('add', mdl);
                            collectionChanged.call(_koll, 'add');
                        }
                    },
                    get: function (id) {
                        return this.map[id];
                    },
                    remove: function (_koll, id) {

                        var mdl = this.map[id],
                            index = this.list.indexOf(mdl);
                        if (mdl && index !== -1) {
                            this.list.splice(index, 1);
                            delete this.map[id];
                            _koll.length = this.list.length;
                            fire('remove', mdl);
                            collectionChanged.call(_koll, 'remove');
                        }
                    },
                    populate: function (_koll, mdls, _url, _transport) {
                        this.list = [];
                        this.map = {};
                        _koll.length = 0;

                        for (var k = 0; k < mdls.length; ++k) {
                            var mdl = Model(_url, mdls[k], _transport);
                            mdl.on('destroy', _koll.remove, _koll);
                            mdl.on('change', model_changed, _koll);
                            !mdl.get('id') && mdl.set('id', _.uid());
                            mdls[k] = mdl;
                            this.map[mdl.get('id')] = mdl;
                        }

                        this.list = mdls;
                        _koll.length = this.list.length;
                        _koll.fetched = true;

                        fire('reset');
                        collectionChanged.call(_koll, 'reset');
                    },
                    reset: function (_koll) {
                        this.list = [];
                        this.map = {};
                        _koll.length = this.list.length;
                        fire('change');
                        collectionChanged.call(_koll, 'change'); //added
                    }
                },
                model_changed = function (mdl) {
                    fire('change');
                },
                push = function (mdl) {
                    models.add(this, mdl);
                },
                collectionChanged = function (type) {
                    for (var i = 0; i < changeEventListeners.length; ++i) {
                        changeEventListeners[i] && changeEventListeners[i]['notifyChange'].call(changeEventListeners[i], this, type);
                    }
                },
                _List = function (url, transport) {
                    var proto = {
                        length: 0,
                        url: url || '',
                        useRealTime: transport,
                        extend: function (options) {
                            if (options) {
                                _.xtend(this, options);
                            }
                            return this;
                        },
                        notify: function (listener) {
                            changeEventListeners.push(listener);
                            return this;
                        },
                        fetch: function (q) {
                            var self = this,
                                mdl = Model(this.url, {}, this.useRealTime),
                                load = {};
                            mdl.extend({
                                sync: this.sync
                            });
                            if (q) {
                                load['query'] = q || {};
                            }

                            _.xtend(load, {
                                url: this.url
                            });

                            mdl.fetch(this.url, load, function (e, mdls) {
                                if (!e) {
                                    mdls = !_.isArray(mdls) ? [mdls] : mdls;
                                    models.populate(self, mdls, self.url, self.useRealTime);
                                }
                            });
                            return this;
                        },
                        reset: function () {
                            models.reset(this);
                            return this;
                        },
                        add: function (mdl) {
                            if (!mdl.toObject) {
                                mdl = Model(this.url, mdl, this.useRealTime);
                            }
                            push.call(this, mdl);
                            return this;

                        },
                        remove: function (mdl) {
                            models.remove(this, mdl.get('id'));
                        },
                        create: function (mdl, cb) {

                            if (!mdl.toObject) {
                                mdl = Model(this.url, mdl, this.useRealTime);
                                mdl.extend({
                                    sync: this.sync
                                });
                            }
                            mdl.on('created', this.add, this);
                            mdl.save(cb);
                            return this;
                        },
                        each: function (cb) {
                            _.each(models.list, cb);
                        },
                        on: function (event, handler, context) {

                            if (event && event.indexOf(',') != -1) {
                                var evts = event.split(',');

                                _.each(evts, function () {
                                    _.attachEvent.call(events, (this).trim(), handler, context);
                                });

                            } else {
                                _.attachEvent.call(events, event.trim(), handler, context);
                            }

                            return this;
                        },
                        off: function (event) {
                            if (event) {
                                if (event.indexOf(',') != -1) {
                                    var evts = event.split(',');

                                    _.each(evts, function () {
                                        _.detachEvent.call(events, (this).trim());
                                    });
                                } else {
                                    _.detachEvent.call(events, event.trim());
                                }
                            } else {
                                events = {};
                            }

                            return this;
                        },
                        sync: Slicks.sync,
                        emptyModel: function (attr) {
                            var mdl = Model(this.url, attr || {}, this.useRealTime);
                            mdl.on('created', this.add, this);
                            return mdl;
                        },
                        fire: function (event) {
                            fire(event);
                            return this;
                        },
                        get: function (id) {
                            return models.get(id);
                        },
                        asArray: function () {
                            return models.list;
                        },
                        new: function (url, txport) {
                            return Collection(url, txport);
                        }
                    };
                    return _.inherits(proto);
                };

            return _List(_url, _transport);
        },
        View = function (options) {

            !$.extLoaded && Ext();
            var _bind = function () {

                    var self = this,
                        proxy = function (context, handler) {

                            return function (event) {
                                if (event) {
                                    handler.call(context, event);
                                }
                            }
                        };
                    for (var k in self.events) {
                        var handler = self.events[k];
                        var triggers = k.split(',');
                        _.each(triggers, function (_k, _v) {
                            var trigger = this,
                                event_targets = trigger && trigger.split(':');
                            var evt = event_targets[0];
                            var dom = event_targets[1];
                            //console.log("evt:%s, dom:%s", evt, dom);
                            evt = evt && (evt).trim();
                            dom = dom && (dom).trim();
                            self.$el.find(dom).off();
                            self[handler] && self.$el.on(evt, dom, proxy(self, self[handler]));
                        });

                    }
                },
                _View = function () {
                    var proto = {
                        host: '#content',
                        el: 'span',
                        isEditor: false,
                        model: Model(),
                        collection: null,
                        template: '',
                        lazy: false,
                        empty_before_render: true,
                        extend: function (options) {
                            if (options) {
                                _.xtend(this, options);
                            }
                            return this;
                        },
                        initialize: function () {},
                        render: function () {
                            var self = this;
                            _.template.call(self, function (str) {

                                if (str) {
                                    if (self.empty_before_render) {
                                        self.$host.off().children().trigger('destroyed').remove();
                                    }
                                    self.$el.off().html(str).appendTo(self.$host);
                                }

                                (self.class && self.$el.attr('class', self['class']));
                                (self.id && self.$el.attr('id', self.id));
                                //self.afterRender();
                                self.beforeEvents();

                            });
                        },
                        beforeEvents: function () {
                            this.afterRender();
                        },
                        afterRender: function () {
                            var self = this;
                            //this.beforeEvents();
                            _bind.call(self);
                            if (self.notifyChange && self.collection) {
                                self.collection.notify(self);
                            }
                            this.model && this.model.on('change', this.update, this);
                            this.onDestroy();
                            self.initialize();
                        },
                        cleanUps: [],
                        onDestroy: function (f) {
                            var self = this;
                            self.$el.on('destroyed', function () {

                                if (self.collection) {
                                    self.collection.cleanUp && self.collection.cleanUp();
                                } else {
                                    self.model.cleanUp && self.model.cleanUp();
                                }
                                for (var i = 0; i < self.cleanUps.length; ++i) {
                                    self.cleanUps[i]();
                                }
                            });
                        },
                        events: {},
                        update: function (mdl) {
                            _.template.call(this, function (str) {
                                str && this.$el.off().html(str);
                                (this.class && this.$el.attr('class', this.class));
                                (this.id && this.$el.attr('id', this.id));
                                this.afterRender();
                            }, mdl);
                        },
                        notifyChange: function (_koll) {

                        },
                        remove: function (cb) {
                            this.$el.trigger('destroyed');
                            this.$el.remove();
                            this.$el.off().fadeOut('fast', function () {

                                $(this).remove();
                                cb && _.isFunction(cb) && cb();
                            });
                        },
                        hide: function (how) {
                            this.$el[how ? how : 'fadeOut']('slow');
                        },
                        show: function (how) {
                            this.$el[how ? how : 'fadeIn']('slow');
                        },
                        generatePrintContent: function ($element, cb) {
                            cb && cb();
                        },
                        print: function (options) {

                            var self = this,
                                printDocument = null,
                                printWindow = null,
                                $element = null,
                                print_options = {},
                                createPrintDialog = function () {
                                    printMarkUp(function (html) {

                                        printWindow = root.open('about:blank', 'SlicksPrinterWindow', 'width=700,height=500,scrollbars=yes,fullscreen=no,menubar=yes');
                                        printDocument = printWindow.document;

                                        printDocument.print_options = print_options;
                                        printDocument.open();
                                        printDocument.write(html);
                                        printDocument.close();
                                        triggerPrint(printWindow);
                                    });
                                },

                                triggerPrint = function (element) {

                                    if (element && element.printMe)
                                        element.printMe();
                                    else
                                        setTimeout(function () {
                                            triggerPrint(element);
                                        }, 50);
                                },

                                baseHref = function () {
                                    var port = (root.location.port) ? ':' + root.location.port : '';
                                    return root.location.protocol + '//' + root.location.hostname + port + root.location.pathname;
                                },
                                printMarkUp = function (cb) {
                                    self.generatePrintContent($element, function () {
                                        var printDefs = {};
                                        $element.find('.slick-no-print').remove();
                                        printDefs.print_title = print_options.print_title;

                                        $("link", document).filter(function () {
                                            return $(this).attr("rel").toLowerCase() == "stylesheet";
                                        }).each(function () {
                                            printDefs.print_css = $(this).attr("href");
                                        });
                                        printDefs.base_href = baseHref();
                                        var printModel = options.model || Model();
                                        printModel.populate(printDefs);
                                        _.template.call(self, function (str) {
                                            str = str.replace(/@print_body/, $element.html());
                                            cb(str);
                                        }, printModel, options.template || 'core/SlicksPrintPage');

                                    });
                                },
                                def_print_options = {
                                    print_title: '', //Print Page Title
                                    row_template: false,
                                    collection: null,
                                    add_banner: false,
                                    model: null
                                };
                            $.extend(def_print_options, options || {});
                            print_options = def_print_options;
                            $element = this.$host.clone();

                            createPrintDialog();
                        },
                        dispatch: function (path) {
                            Path.dispatch(path);
                            location.hash = path;
                        },
                        goBack: function (cb) {
                            root.history.back();
                            cb && cb();
                        }

                    };

                    var v = _.inherits(proto);

                    v.events = {};
                    var events = v.parent.events;
                    if (options.events) {
                        _.xtend(v.events, events, options.events);
                    } else {
                        v.events = events;
                    }
                    delete options.events;

                    v.extend(options);
                    v.$host = $(v.host);
                    v.$el = v.el ? $('<' + v.el + '/>') : v.$host;
                    return v;
                };
            return _View();

        },
        Router = function () {

            var Path = {
                'version': "0.8.4",
                'map': function (path) {
                    if (Path.routes.defined.hasOwnProperty(path)) {
                        return Path.routes.defined[path];
                    } else {
                        return new Path.core.route(path);
                    }
                },
                'root': function (path) {
                    Path.routes.root = path;
                },
                'rescue': function (fn) {
                    Path.routes.rescue = fn;
                },
                'history': {
                    'initial': {}, // Empty container for "Initial Popstate" checking variables.
                    'pushState': function (state, title, path) {
                        if (Path.history.supported) {
                            if (Path.dispatch(path)) {
                                history.pushState(state, title, path);
                            }
                        } else {
                            if (Path.history.fallback) {
                                root.location.hash = "#" + path;
                            }
                        }
                    },
                    'popState': function (event) {
                        var initialPop = !Path.history.initial.popped && location.href == Path.history.initial.URL;
                        Path.history.initial.popped = true;
                        if (initialPop) return;
                        Path.dispatch(document.location.pathname);
                    },
                    'listen': function (fallback) {
                        Path.history.supported = !!(root.history && root.history.pushState);
                        Path.history.fallback = fallback;

                        if (Path.history.supported) {
                            Path.history.initial.popped = ('state' in root.history), Path.history.initial.URL = location.href;
                            root.onpopstate = Path.history.popState;
                        } else {
                            if (Path.history.fallback) {
                                for (route in Path.routes.defined) {
                                    if (route.charAt(0) != "#") {
                                        Path.routes.defined["#" + route] = Path.routes.defined[route];
                                        Path.routes.defined["#" + route].path = "#" + route;
                                    }
                                }
                                Path.listen();
                            }
                        }
                    }
                },
                'match': function (path, parameterize) {
                    var params = {},
                        route = null,
                        possible_routes, slice, i, j, compare;
                    for (route in Path.routes.defined) {
                        if (route !== null && route !== undefined) {
                            route = Path.routes.defined[route];
                            possible_routes = route.partition();
                            for (j = 0; j < possible_routes.length; j++) {
                                slice = possible_routes[j];
                                compare = path;
                                if (slice.search(/:/) > 0) {
                                    for (i = 0; i < slice.split("/").length; i++) {
                                        if ((i < compare.split("/").length) && (slice.split("/")[i].charAt(0) === ":")) {
                                            params[slice.split('/')[i].replace(/:/, '')] = compare.split("/")[i];
                                            compare = compare.replace(compare.split("/")[i], slice.split("/")[i]);
                                        }
                                    }
                                }
                                if (slice === compare) {
                                    if (parameterize) {
                                        route.params = params;
                                    }
                                    return route;
                                }
                            }
                        }
                    }
                    return null;
                },
                'dispatch': function (passed_route) {
                    if (passed_route.indexOf('%') === -1) {
                        passed_route = passed_route.replace(/#\//g, '');
                        var path = passed_route.substr(0, passed_route.indexOf('/') + 1),
                            rem = passed_route.substr(path.length);
                        passed_route = '#/' + path + encodeURIComponent(rem);
                    }

                    var previous_route, matched_route;
                    if (Path.routes.current !== passed_route) {
                        Path.routes.previous = Path.routes.current;
                        Path.routes.current = passed_route;
                        matched_route = Path.match(passed_route, true);

                        if (Path.routes.previous) {
                            previous_route = Path.match(Path.routes.previous);
                            if (previous_route !== null && previous_route.do_exit !== null) {
                                previous_route.do_exit();
                            }
                        }

                        if (matched_route !== null) {
                            matched_route.run();
                            return true;
                        } else {
                            if (Path.routes.rescue !== null) {
                                Path.routes.rescue();
                            }
                        }
                    }
                },
                'listen': function () {
                    var fn = function () {
                        Path.dispatch(location.hash);
                    };

                    if (location.hash === "") {
                        if (Path.routes.root !== null) {
                            location.hash = Path.routes.root;
                        }
                    }

                    // The 'document.documentMode' checks below ensure that PathJS fires the right events
                    // even in IE "Quirks Mode".
                    if ("onhashchange" in root && (!document.documentMode || document.documentMode >= 8)) {
                        root.onhashchange = fn;
                    } else {
                        setInterval(fn, 50);
                    }


                    if (location.hash !== "") {
                        Path.dispatch(location.hash);
                    }
                },
                'core': {
                    'route': function (path) {
                        this.path = path;
                        this.action = null;
                        this.do_enter = [];
                        this.do_exit = null;
                        this.params = {};
                        this.query = function () {
                            var q = this.params['query'];

                            if (q) {
                                q = decodeURIComponent(q);
                                q = _.Crypt.decrypt(q, Session.appName());
                                return q ? JSON.parse(q) : q;
                            }
                            return q;
                        };
                        Path.routes.defined[path] = this;
                    }
                },
                'routes': {
                    'current': null,
                    'root': null,
                    'rescue': null,
                    'previous': null,
                    'defined': {}
                }
            };
            Path.core.route.prototype = {
                'to': function (fn) {
                    this.action = fn;
                    return this;
                },
                'enter': function (fns) {
                    if (fns instanceof Array) {
                        this.do_enter = this.do_enter.concat(fns);
                    } else {
                        this.do_enter.push(fns);
                    }
                    return this;
                },
                'exit': function (fn) {
                    this.do_exit = fn;
                    return this;
                },
                'partition': function () {
                    var parts = [],
                        options = [],
                        re = /\(([^}]+?)\)/g,
                        text, i;
                    while (text = re.exec(this.path)) {
                        parts.push(text[1]);
                    }
                    options.push(this.path.split("(")[0]);
                    for (i = 0; i < parts.length; i++) {
                        options.push(options[options.length - 1] + parts[i]);
                    }
                    return options;
                },
                'run': function () {
                    var halt_execution = false,
                        i, result, previous;

                    if (Path.routes.defined[this.path].hasOwnProperty("do_enter")) {
                        if (Path.routes.defined[this.path].do_enter.length > 0) {
                            for (i = 0; i < Path.routes.defined[this.path].do_enter.length; i++) {
                                result = Path.routes.defined[this.path].do_enter[i].apply(this, null);
                                if (result === false) {
                                    halt_execution = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!halt_execution) {
                        Path.routes.defined[this.path].action();
                    }
                }
            };
            Path.redirect = function (path) {
                this.dispatch(path);
                location.hash = path;
            };
            Path.goBack = function () {
                root.history.back();
            };
            return Path;
        };
    exports.Model = Model;
    exports.Collection = Collection;
    exports.View = View;
    exports.Router = Router;

    return exports;

});