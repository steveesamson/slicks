/*
 *  * Created by steve samson on 1/9/14.
 *  Updated on June 21, 2016.
 */
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        console.log("RequireJS");
        define(["jquery"], factory);
    } else if (typeof exports === "object") {
        console.log("CommonJS");
        module.exports = factory(require("jquery"));
    } else {
        console.log("BrowserJS");
        root.Slicks = factory(root.$);
    }
}(this,function ($) {

//    GET   :    /:controller        => find()
//    GET   :    /:controller/:id    => find(id)
//    POST  :    /:controller        => create()
//    PUT   :    /:controller/:id    => update(id)
//    DELETE:    /:controller/:id    => destroy(id)


    if (!$) {
        throw Error("Include jQuery on your page to use Slicks-mvc");
    }


    !global.isTest && require('../libs/browser')($);

    var Crypt = require('../libs/tiny-tea'),
        transportMode = {AJAX: 'AJAX', SOCKET_IO: 'SOCKET_IO'},
        _happy = function (j) {
            return (j !== null && j.error === undefined);
        },
        extend = function (o, options) {

            for (var k in options) {
                o[k] = options[k];
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
        each = function(list, cb){
            for(var i=0; i < list.length; ++i){
                list[i] && cb && cb.call(list[i]);
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
        _sync = function (method, model, cb) {


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
                if (_happy(mdl)) {

                    cb && cb(false, mdl);
                } else {
                    var message = mdl.text || mdl.error;
                    message = message.replace('ER_SIGNAL_EXCEPTION:', '');
                    cb && cb(message);
                }
            });
        },
        resolveCall = function (url, params, cb) {

            var len = arguments.length;

            if (len < 1) {
                throw Error("Invalid arguments error");
            }

            switch (len) {
                case 3:
                    if (typeof cb !== 'function') {
                        throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
                    }
                    break;
                case 2:
                    cb = params;

                    if (typeof cb !== 'function') {
                        throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
                    }
                    params = false;
                    break;
                case 1:
                    cb = url;

                    if (typeof cb !== 'function') {
                        throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
                    }
                    params = false;
                    url = false;
                    break;
            }

            var attr = params || this.toObject(),
                mdl = Model((url || this.url), attr, this.useRealTime);
            mdl.extend({sync: this.sync});
            mdl.query = attr;
            return {model: mdl, callback: cb};
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
        Path = {
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
                            window.location.hash = "#" + path;
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
                    Path.history.supported = !!(window.history && window.history.pushState);
                    Path.history.fallback = fallback;

                    if (Path.history.supported) {
                        Path.history.initial.popped = ('state' in window.history), Path.history.initial.URL = location.href;
                        window.onpopstate = Path.history.popState;
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
                var params = {}, route = null, possible_routes, slice, i, j, compare;
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
                if ("onhashchange" in window && (!document.documentMode || document.documentMode >= 8)) {
                    window.onhashchange = fn;
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
                            q = Crypt.decrypt(q, Session.appName());
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
            var parts = [], options = [], re = /\(([^}]+?)\)/g, text, i;
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
            var halt_execution = false, i, result, previous;

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
    var
        //Model = function (_url, _attributes, _socket) {
        //
        //    var events = {},
        //        Hashid = require("hashids"),
        //        hash = new Hashid("_53cr3t3-+", 5),
        //        fire = function (evt, data) {
        //
        //            var cntx = null;
        //            if(events[evt]) {
        //                each(events[evt], function () {
        //                    cntx = this['context'];
        //                    data ? this.call(cntx, data): this.call(cntx);
        //                });
        //
        //            }
        //
        //        },
        //        dirty_attributes = {},
        //        attributes = _attributes || {},
        //        _Model = function () {
        //            this.url = _url || '';
        //            this.model_name = this.url.replace(/\//g, '');
        //            this.transport = _socket ? transportMode.SOCKET_IO : transportMode.AJAX;
        //        };
        //    _Model.prototype = {
        //        extend: function (map) {
        //            for (var k in map) {
        //                this[k] = map[k];
        //            }
        //            return this;
        //        },
        //        has: function (attr) {
        //            return attributes.hasOwnProperty(attr);
        //        },
        //        params: function (salt) {
        //            var enc = Crypt.encrypt(attributes, salt || Session.appName());
        //            enc = encodeURIComponent(enc);
        //            return enc;
        //        },
        //        hash: function (_hash) {
        //            if (_hash) {
        //                return hash.decode(_hash);
        //            } else {
        //                return hash.encode(this.getInt('id'));
        //            }
        //        },
        //        get: function (attr) {
        //            return attributes[attr];
        //        },
        //        getInt: function (attr) {
        //            var val = attributes[attr];
        //            return parseInt(val);
        //        },
        //        getFloat: function (attr) {
        //            var val = attributes[attr];
        //            return parseFloat(val);
        //        },
        //        set: function (key, value) {
        //            attributes[key] = value;
        //            dirty_attributes[key] = value;
        //            return this;
        //        },
        //        change: function (k, v) {
        //            this.set(k, v).fire('change');
        //            return this;
        //        },
        //        unset: function (attr) {
        //            delete attributes[attr];
        //            fire('change', this);
        //            return this;
        //        },
        //        populate: function (attrs) {
        //
        //            for (var k in attrs) {
        //                this.set(k, attrs[k]);
        //            }
        //            return this;
        //        },
        //        fire: function (event) {
        //            fire(event, this);
        //            return this;
        //        },
        //        login: function (cb) {
        //            var mdl = Model(this.url + '/login', attributes, this.transport);
        //            _sync.call(mdl, 'post', mdl, cb);
        //        },
        //        unlink: function (params, cb) {
        //            var mdl = Model(this.url + '/unlink', params, this.transport);
        //            _sync.call(mdl, 'post', mdl, cb);
        //            return this;
        //        },
        //        fetch: function (url, params, cb) {
        //            var fnbody = resolveCall.apply(this, arguments);
        //            _sync.call(fnbody.model, 'get', fnbody.model, fnbody.callback);
        //            return this;
        //        },
        //        post: function (url, params, cb) {
        //            var fnbody = resolveCall.apply(this, arguments);
        //            _sync.call(fnbody.model, 'post', fnbody.model, fnbody.callback);
        //            return this;
        //        },
        //        save: function (cb) {
        //            var method = attributes.id ? 'put' : 'post',
        //                self = this;
        //
        //            _sync.call(this, method, this, function (e, mdl) {
        //
        //                extend(mdl, {method: method, url: self.url});
        //                if (!e) {
        //
        //                    if (method === 'put') {
        //                        for (var attr in mdl) {
        //                            attributes[attr] = mdl[attr];
        //                        }
        //                        for (var key in dirty_attributes) {
        //                            fire(key + ':change');
        //                        }
        //
        //                        fire('change', self);
        //                        dirty_attributes = {};
        //
        //                        if (cb && isFunction(cb)) {
        //                            extend(mdl, {message: makeName(self.model_name) + ' was successfully updated.'});
        //                            cb(e, mdl);
        //                        } else {
        //                            $.notify(makeName(self.model_name) + ' was successfully updated.', 'success');
        //                        }
        //
        //
        //                    } else if (method === 'post') {
        //                        attributes = mdl;
        //                        self.isNew = true;
        //                        fire('created', self);
        //                        if (cb && isFunction(cb)) {
        //
        //                            extend(mdl, {message: makeName(self.model_name) + ' was successfully created.'});
        //                            cb(e, mdl);
        //                            //global.isTest? cb(e,mdl):  cb(makeName(self.model_name) + ' was successfully created.', 'success');
        //
        //                        } else {
        //                            $.notify(makeName(self.model_name) + ' was successfully created.', 'success');
        //                        }
        //                    }
        //                } else {
        //                    $.notify(e);
        //                }
        //
        //            });
        //
        //            return this;
        //        },
        //        destroy: function (cb) {
        //            var self = this,
        //                md = {method: 'delete', url: self.url};
        //            if (!this.getInt('id')) {
        //                this.fire('destroy');
        //
        //                extend(md, {message: makeName(self.model_name) + ' was successfully deleted.'});
        //                cb && cb(false, md);
        //                return;
        //            }
        //            _sync.call(this, 'delete', this, function (e, mdl) {
        //                if (!e) {
        //                    var deleted = parseInt(mdl.affectedRows);
        //                    if (deleted) {
        //                        fire('destroy', self);
        //                        //cb && isFunction(cb) && cb();
        //                        if (cb && isFunction(cb)) {
        //                            extend(mdl, md);
        //                            extend(mdl, {message: makeName(self.model_name) + ' was successfully deleted.'});
        //                            cb(e, mdl);
        //                        } else {
        //                            $.notify(makeName(self.model_name) + ' was successfully deleted.', 'success');
        //                        }
        //
        //
        //                    }
        //                }
        //            });
        //            return this;
        //        },
        //        toObject: function () {
        //            return attributes;
        //        },
        //        dirts: function () {
        //            return dirty_attributes;
        //        },
        //        toJSON: function () {
        //            return JSON.stringify(attributes);
        //        },
        //        reset: function () {
        //            attributes = {};
        //            fire('change', this);
        //            return this;
        //        },
        //        on: function (event, handler, context) {
        //
        //            if (event && event.indexOf(',') != -1) {
        //                var evts = event.split(',');
        //                each(evts, function () {
        //                    attachEvent.call(events, (this).trim(), handler, context);
        //                });
        //
        //            } else {
        //                attachEvent.call(events, (event).trim(), handler, context);
        //            }
        //            return this;
        //
        //        },
        //        off:function(event){
        //            if (event) {
        //                if(event.indexOf(',') != -1){
        //                    var evts = event.split(',');
        //
        //                    each(evts, function () {
        //                        detachEvent.call(events, (this).trim());
        //                    });
        //                }else{
        //                    detachEvent.call(events, event.trim());
        //                }
        //            } else {
        //                events = {};
        //            }
        //
        //            return this;
        //        },
        //        sync: function (url, method, data, cb) {
        //            ajax(url, method, data, cb);
        //        }
        //    };
        //    return new _Model();
        //},
        Collection = function (_url, _transport) {
            var events = {},
                changeEventListeners = [],
                fire = function (evt, data) {

                    var cntx = null;
                    if (events[evt]) {
                        each(events[evt], function () {
                            cntx = this['context'];
                            data? this.call(cntx, data) : this.call(cntx);
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
                            !mdl.get('id') && mdl.set('id', uid());
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
                            !mdl.get('id') && mdl.set('id', uid());
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
                        collectionChanged.call(_koll, 'change');//added
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
                _List = function () {
                    this.length = 0;
                    this.url = _url || '';
                    this.useRealTime = _transport ? transportMode.SOCKET_IO : transportMode.AJAX;
                };
            _List.prototype = {
                extend: function (options) {
                    if (options) {
                        for (var k in options) {
                            this[k] = options[k];
                        }
                    }

                    return this;
                },
                notify: function (listener) {
                    changeEventListeners.push(listener);
                    return this;
                },
                fetch: function (q) {
                    var self = this,
                        load = {};
                    if (q) {
                        load['query'] = q || {};
                    }

                    extend(load, {url: this.url});
                    _sync.call(this, 'get', load, function (e, mdls) {
                        if (!e) {
                            mdls = !isArray(mdls) ? [mdls] : mdls;
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
                        mdl = Model(this.url, mdl, this.useRealTime === transportMode.SOCKET_IO);
                        mdl.extend({sync:this.sync});
                    }
                    mdl.on('created', this.add, this);
                    mdl.save(cb);
                    return this;
                },
                forEach: function (cb) {
                    each(models.list, function () {
                        this && cb && cb(this);
                    });
                },
                on: function (event, handler, context) {

                    if (event && event.indexOf(',') != -1) {
                        var evts = event.split(',');

                        each(evts, function () {
                            attachEvent.call(events, (this).trim(), handler, context);
                        });

                    } else {
                        attachEvent.call(events, event.trim(), handler, context);
                    }

                    return this;
                },
                off:function(event){
                    if (event) {
                        if(event.indexOf(',') != -1){
                            var evts = event.split(',');

                            each(evts, function () {
                                detachEvent.call(events, (this).trim());
                            });
                        }else{
                            detachEvent.call(events, event.trim());
                        }
                    } else {
                        events = {};
                    }

                    return this;
                },
                sync: function (url, method, data, cb) {

                    ajax(url, method, data, cb);
                    return this;
                },
                emptyModel: function (attr) {
                    var mdl = Model(this.url, attr || {}, this.useRealTime === 'SOCKET_IO');
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
                }
            };

            return new _List();
        },
        View = function (options) {

            var _bind = function () {
                    var self = this;
                    for (var k in self.events) {
                        var handler = self.events[k];
                        var triggers = k.split(',');
                        each(triggers, function () {
                            var trigger = this,
                                event_targets = trigger && trigger.split(':');
                            var evt = event_targets[0];
                            var dom = event_targets[1];
                            evt = evt && (evt).trim();
                            dom = dom && (dom).trim();
                            self.$el.find(dom).unbind();
                            self[handler] && self.$el.on(evt, dom, $.proxy(self, handler));
                        });

                    }
                },
                removeTip = function (input) {
                    var attached_tip = input.data('tip');
                    (attached_tip && attached_tip.remove());
                },
                _View = function () {
                    delete  options['tmpl'];
                    extend(this.events, (options.events || {}));
                    delete options.events;
                    this.extend(options);
                    !this.lazy && this.render();
                    this.onDestroy();
                };

            _View.prototype = {
                host: '#content',
                el: 'span',
                isEditor:false,
                model: Model(),
                collection: null,
                template: '',
                lazy: false,
                empty_before_render: true,
                extend: function (options) {
                    if (options) {
                        for (var k in options) {
                            this[k] = options[k];
                        }
                    }
                },
                initialize: function () {
                },
                render: function () {
                    var self = this;
                    //this.$el = this.el ? $('<' + this.el + '/>') : $('<' + this.host + '/>');
                    this.$host = $(this.host);
                    this.$el = this.el ? $('<' + this.el + '/>') : this.$host;//$('<' + this.host + '/>');

                    self.tmpl(function (str) {
                        if (str) {
                            if (self.empty_before_render) {
                                self.$host.off().children().remove();
                            }
                            self.$el.off().html(str).appendTo(self.$host);
                        }
                        (self.class && self.$el.attr('class', self['class']));
                        (self.id && self.$el.attr('id', self.id));
                        self.afterRender();

                    });
                },
                beforeEvents: function () {
                },
                afterRender: function () {
                    var self = this;
                    this.beforeEvents();
                    _bind.call(self);
                    if (self.notifyChange && self.collection) {
                        self.collection.notify(self);
                    }
                    self.initialize();
                    self.myAfterRender && self.myAfterRender();
                },
                cleanUps: [],
                onDestroy: function (f) {
                    var self = this;
                    self.$el.bind('destroyed', function () {

                        //console.log('destroyed called...');
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
                    this.tmpl(function (str) {
                        str && this.$el.off().html(str);
                        (this.class && this.$el.attr('class', this.class));
                        (this.id && this.$el.attr('id', this.id));
                        this.afterRender();
                    }, mdl);
                },
                notifyChange: function (_koll) {

                },
                remove: function (cb) {
                    var self = this;
                    this.$el.off().fadeOut('fast', function () {

                        $(this).remove();
                        cb && isFunction(cb) && cb();
                    });
                },
                hide: function (how) {
                    this.$el[how ? how : 'fadeOut']('slow');
                },
                show: function (how) {
                    this.$el[how ? how : 'fadeIn']('slow');
                },
                reset: function () {
                    this.$el.clear(removeTip);
                },
                data: function (sel) {
                    return $.mapob(sel ? this.$el.find(sel) : this.$el);
                },
                tmpl: function (cb, mdl, tmpl_name) {
                    var self = this;
                    var template = tmpl_name || this.template;
                    if (!template) {
                        cb && cb('');
                        return;
                    }
                    template += '.htm';
                    var load = (mdl && mdl.toObject()) || (this.model && this.model.toObject()) || {};
                    load = this.isEditor ? load : $.formatFields(load);

                    dust.render(template, load, function (error, str) {
                        if (error) {
                            console.log(error);
                            return;
                        }
                        cb && cb.call(self, str);
                    });
                },
                dispatch: function (path) {
                    Path.dispatch(path);
                    location.hash = path;
                },
                goBack: function (cb) {
                    window.history.back();
                    cb && cb();
                }

            };
            return new _View();
        },
        Router = function (/*routes*/) {
            Path.redirect = function (path) {
                this.dispatch(path);
                location.hash = path;
            };
            Path.goBack = function () {
                window.history.back();
            };
            return Path;
        };


    var _slick = {
        $: $,
        Model: Model,
        Collection: Collection,
        View: View,
        Router: Router
    };


    return _slick;
//})(window.jQuery);
}));






//module.exports = (function ($) {
//
////    GET   :    /:controller        => find()
////    GET   :    /:controller/:id    => find(id)
////    POST  :    /:controller        => create()
////    PUT   :    /:controller/:id    => update(id)
////    DELETE:    /:controller/:id    => destroy(id)
//
//
//    if (!$) {
//        throw Error("Include jQuery on your page to use Slicks-mvc");
//    }
//
//
//    !global.isTest && require('../libs/browser')($);
//
//    var Crypt = require('../libs/tiny-tea'),
//        transportMode = {AJAX: 'AJAX', SOCKET_IO: 'SOCKET_IO'},
//        _happy = function (j) {
//            return (j !== null && j.error === undefined);
//        },
//        extend = function (o, options) {
//
//            for (var k in options) {
//                o[k] = options[k];
//            }
//        },
//        isFunction = function (cb) {
//            return typeof cb === "function";
//        },
//        makeName = function (str) {
//            var index = str.indexOf('_');
//            if (index < 0) {
//                return str == 'id' ? str.toUpperCase() : (str.charAt(0)).toUpperCase() + str.substring(1);
//            }
//            var names = str.split('_');
//            var new_name = '';
//            names.forEach(function (s) {
//                new_name += new_name.length > 0 ? " " + makeName(s) : makeName(s);
//            });
//
//            return new_name;
//
//        },
//        isArray = function (o) {
//            return o instanceof Array;
//        },
//        each = function(list, cb){
//            for(var i=0; i < list.length; ++i){
//                list[i] && cb && cb.call(list[i]);
//            }
//        },
//        uid = function () {
//// Math.random should be unique because of its seeding algorithm.
//// Convert it to base 36 (numbers + letters), and grab the first 9 characters
//// after the decimal.
//            return '_' + Math.random().toString(36).substr(2, 9);
//        },
//        ajax = function (url, method, data, cb) {
//
//            $.ajax({
//                type: method,
//                beforeSend: function (xhr) {
//                    $('.data-connecting').show();
//                    Session.isAuthenticated() && xhr.setRequestHeader('x-csrf-token', Session.user().token || '');
//                },
//                url: url,
//                data: data,
//                success: function (res) {
//                    $('.data-connecting').hide();
//                    cb(res);
//                },
//                error: function () {
//                    $('.data-connecting').hide();
//                },
//                dataType: 'json'
//            });
//        },
//        _sync = function (method, userModel, cb) {
//
//
//            var url = null, data = {};
//            switch (method) {
//                case 'post':
//                    url = userModel.url;
//                    data = userModel.toObject();
//                    break;
//                case 'put':
//                    url = userModel.url + '/' + userModel.get('id');
//                    data = userModel.dirts();
//                    var last_updated = userModel.get('last_updated');
//                    if (last_updated) {
//                        data['last_updated'] = last_updated;
//                    }
//                    break;
//                case 'delete':
//                    url = userModel.url + '/' + userModel.get('id');
//                    var last_updated = userModel.get('last_updated');
//                    if (last_updated) {
//                        data['last_updated'] = last_updated;
//                    }
//                    break;
//                case 'get':
//                    url = userModel.url;
//                    data = userModel.query || {};
//                    break;
//                default:
//                    console.log('Unknown method: ' + method);
//                    return;
//            }
//
//            this.sync(url, method, data, function (mdl) {
//                if (_happy(mdl)) {
//
//                    cb && cb(false, mdl);
//                } else {
//                    var message = mdl.text || mdl.error;
//                    message = message.replace('ER_SIGNAL_EXCEPTION:', '');
//                    cb && cb(message);
//                }
//            });
//        },
//        resolveCall = function (url, params, cb) {
//
//            var len = arguments.length;
//
//            if (len < 1) {
//                throw Error("Invalid arguments error");
//            }
//
//            switch (len) {
//                case 3:
//                    if (typeof cb !== 'function') {
//                        throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
//                    }
//                    break;
//                case 2:
//                    cb = params;
//
//                    if (typeof cb !== 'function') {
//                        throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
//                    }
//                    params = false;
//                    break;
//                case 1:
//                    cb = url;
//
//                    if (typeof cb !== 'function') {
//                        throw Error("Invalid arguments error; expecting a function but found a " + typeof cb);
//                    }
//                    params = false;
//                    url = false;
//                    break;
//            }
//
//            var attr = params || this.toObject(),
//                mdl = Model((url || this.url), attr, this.transport);
//            mdl.extend({sync: this.sync});
//            mdl.query = attr;
//            return {userModel: mdl, callback: cb};
//        },
//        attachEvent = function (evt, handler, context) {
//            handler['context'] = context;
//            if (!this[evt]) {
//                this[evt] = [];
//            }
//            this[evt].push(handler);
//        },
//        Path = {
//            'version': "0.8.4",
//            'map': function (path) {
//                if (Path.routes.defined.hasOwnProperty(path)) {
//                    return Path.routes.defined[path];
//                } else {
//                    return new Path.core.route(path);
//                }
//            },
//            'root': function (path) {
//                Path.routes.root = path;
//            },
//            'rescue': function (fn) {
//                Path.routes.rescue = fn;
//            },
//            'history': {
//                'initial': {}, // Empty container for "Initial Popstate" checking variables.
//                'pushState': function (state, title, path) {
//                    if (Path.history.supported) {
//                        if (Path.dispatch(path)) {
//                            history.pushState(state, title, path);
//                        }
//                    } else {
//                        if (Path.history.fallback) {
//                            window.location.hash = "#" + path;
//                        }
//                    }
//                },
//                'popState': function (event) {
//                    var initialPop = !Path.history.initial.popped && location.href == Path.history.initial.URL;
//                    Path.history.initial.popped = true;
//                    if (initialPop) return;
//                    Path.dispatch(document.location.pathname);
//                },
//                'listen': function (fallback) {
//                    Path.history.supported = !!(window.history && window.history.pushState);
//                    Path.history.fallback = fallback;
//
//                    if (Path.history.supported) {
//                        Path.history.initial.popped = ('state' in window.history), Path.history.initial.URL = location.href;
//                        window.onpopstate = Path.history.popState;
//                    } else {
//                        if (Path.history.fallback) {
//                            for (route in Path.routes.defined) {
//                                if (route.charAt(0) != "#") {
//                                    Path.routes.defined["#" + route] = Path.routes.defined[route];
//                                    Path.routes.defined["#" + route].path = "#" + route;
//                                }
//                            }
//                            Path.listen();
//                        }
//                    }
//                }
//            },
//            'match': function (path, parameterize) {
//                var params = {}, route = null, possible_routes, slice, i, j, compare;
//                for (route in Path.routes.defined) {
//                    if (route !== null && route !== undefined) {
//                        route = Path.routes.defined[route];
//                        possible_routes = route.partition();
//                        for (j = 0; j < possible_routes.length; j++) {
//                            slice = possible_routes[j];
//                            compare = path;
//                            if (slice.search(/:/) > 0) {
//                                for (i = 0; i < slice.split("/").length; i++) {
//                                    if ((i < compare.split("/").length) && (slice.split("/")[i].charAt(0) === ":")) {
//                                        params[slice.split('/')[i].replace(/:/, '')] = compare.split("/")[i];
//                                        compare = compare.replace(compare.split("/")[i], slice.split("/")[i]);
//                                    }
//                                }
//                            }
//                            if (slice === compare) {
//                                if (parameterize) {
//                                    route.params = params;
//                                }
//                                return route;
//                            }
//                        }
//                    }
//                }
//                return null;
//            },
//            'dispatch': function (passed_route) {
//                if (passed_route.indexOf('%') === -1) {
//                    passed_route = passed_route.replace(/#\//g, '');
//                    var path = passed_route.substr(0, passed_route.indexOf('/') + 1),
//                        rem = passed_route.substr(path.length);
//                    passed_route = '#/' + path + encodeURIComponent(rem);
//                }
//
//                var previous_route, matched_route;
//                if (Path.routes.current !== passed_route) {
//                    Path.routes.previous = Path.routes.current;
//                    Path.routes.current = passed_route;
//                    matched_route = Path.match(passed_route, true);
//
//                    if (Path.routes.previous) {
//                        previous_route = Path.match(Path.routes.previous);
//                        if (previous_route !== null && previous_route.do_exit !== null) {
//                            previous_route.do_exit();
//                        }
//                    }
//
//                    if (matched_route !== null) {
//                        matched_route.run();
//                        return true;
//                    } else {
//                        if (Path.routes.rescue !== null) {
//                            Path.routes.rescue();
//                        }
//                    }
//                }
//            },
//            'listen': function () {
//                var fn = function () {
//                    Path.dispatch(location.hash);
//                };
//
//                if (location.hash === "") {
//                    if (Path.routes.root !== null) {
//                        location.hash = Path.routes.root;
//                    }
//                }
//
//                // The 'document.documentMode' checks below ensure that PathJS fires the right events
//                // even in IE "Quirks Mode".
//                if ("onhashchange" in window && (!document.documentMode || document.documentMode >= 8)) {
//                    window.onhashchange = fn;
//                } else {
//                    setInterval(fn, 50);
//                }
//
//
//                if (location.hash !== "") {
//                    Path.dispatch(location.hash);
//                }
//            },
//            'core': {
//                'route': function (path) {
//                    this.path = path;
//                    this.action = null;
//                    this.do_enter = [];
//                    this.do_exit = null;
//                    this.params = {};
//                    this.query = function () {
//                        var q = this.params['query'];
//
//                        if (q) {
//                            q = decodeURIComponent(q);
//                            q = Crypt.decrypt(q, Session.appName());
//                            return q ? JSON.parse(q) : q;
//                        }
//                        return q;
//                    };
//                    Path.routes.defined[path] = this;
//                }
//            },
//            'routes': {
//                'current': null,
//                'root': null,
//                'rescue': null,
//                'previous': null,
//                'defined': {}
//            }
//        };
//    Path.core.route.prototype = {
//        'to': function (fn) {
//            this.action = fn;
//            return this;
//        },
//        'enter': function (fns) {
//            if (fns instanceof Array) {
//                this.do_enter = this.do_enter.concat(fns);
//            } else {
//                this.do_enter.push(fns);
//            }
//            return this;
//        },
//        'exit': function (fn) {
//            this.do_exit = fn;
//            return this;
//        },
//        'partition': function () {
//            var parts = [], options = [], re = /\(([^}]+?)\)/g, text, i;
//            while (text = re.exec(this.path)) {
//                parts.push(text[1]);
//            }
//            options.push(this.path.split("(")[0]);
//            for (i = 0; i < parts.length; i++) {
//                options.push(options[options.length - 1] + parts[i]);
//            }
//            return options;
//        },
//        'run': function () {
//            var halt_execution = false, i, result, previous;
//
//            if (Path.routes.defined[this.path].hasOwnProperty("do_enter")) {
//                if (Path.routes.defined[this.path].do_enter.length > 0) {
//                    for (i = 0; i < Path.routes.defined[this.path].do_enter.length; i++) {
//                        result = Path.routes.defined[this.path].do_enter[i].apply(this, null);
//                        if (result === false) {
//                            halt_execution = true;
//                            break;
//                        }
//                    }
//                }
//            }
//            if (!halt_execution) {
//                Path.routes.defined[this.path].action();
//            }
//        }
//    };
//    var Model = function (_url, _attributes, _socket) {
//
//            var events = {},
//                Hashid = require("hashids"),
//                hash = new Hashid("_53cr3t3-+", 5),
//                fire = function (evt, data) {
//
//                    var cntx = null;
//                    if(events[evt]) {
//                        each(events[evt], function () {
//                            cntx = this['context'];
//                            data ? this.call(cntx, data): this.call(cntx);
//                        });
//
//                    }
//
//                },
//                dirty_attributes = {},
//                attributes = _attributes || {},
//                _Model = function () {
//                    this.url = _url || '';
//                    this.model_name = this.url.replace(/\//g, '');
//                    this.transport = _socket ? transportMode.SOCKET_IO : transportMode.AJAX;
//                };
//            _Model.prototype = {
//                extend: function (map) {
//                    for (var k in map) {
//                        this[k] = map[k];
//                    }
//                    return this;
//                },
//                has: function (attr) {
//                    return attributes.hasOwnProperty(attr);
//                },
//                params: function (salt) {
//                    var enc = Crypt.encrypt(attributes, salt || Session.appName());
//                    enc = encodeURIComponent(enc);
//                    return enc;
//                },
//                hash: function (_hash) {
//                    if (_hash) {
//                        return hash.decode(_hash);
//                    } else {
//                        return hash.encode(this.getInt('id'));
//                    }
//                },
//                get: function (attr) {
//                    return attributes[attr];
//                },
//                getInt: function (attr) {
//                    var val = attributes[attr];
//                    return parseInt(val);
//                },
//                getFloat: function (attr) {
//                    var val = attributes[attr];
//                    return parseFloat(val);
//                },
//                set: function (key, value) {
//                    attributes[key] = value;
//                    dirty_attributes[key] = value;
//                    return this;
//                },
//                change: function (k, v) {
//                    this.set(k, v).fire('change');
//                    return this;
//                },
//                unset: function (attr) {
//                    delete attributes[attr];
//                    fire('change', this);
//                    return this;
//                },
//                populate: function (attrs) {
//
//                    for (var k in attrs) {
//                        this.set(k, attrs[k]);
//                    }
//                    return this;
//                },
//                fire: function (event) {
//                    fire(event, this);
//                    return this;
//                },
//                login: function (cb) {
//                    var mdl = Model(this.url + '/login', attributes, this.transport);
//                    _sync.call(mdl, 'post', mdl, cb);
//                },
//                unlink: function (params, cb) {
//                    var mdl = Model(this.url + '/unlink', params, this.transport);
//                    _sync.call(mdl, 'post', mdl, cb);
//                    return this;
//                },
//                fetch: function (url, params, cb) {
//                    var fnbody = resolveCall.apply(this, arguments);
//                    _sync.call(fnbody.userModel, 'get', fnbody.userModel, fnbody.callback);
//                    return this;
//                },
//                post: function (url, params, cb) {
//                    var fnbody = resolveCall.apply(this, arguments);
//                    _sync.call(fnbody.userModel, 'post', fnbody.userModel, fnbody.callback);
//                    return this;
//                },
//                save: function (cb) {
//                    var method = attributes.id ? 'put' : 'post',
//                        self = this;
//
//                    _sync.call(this, method, this, function (e, mdl) {
//
//                        extend(mdl, {method: method, url: self.url});
//                        if (!e) {
//
//                            if (method === 'put') {
//                                for (var attr in mdl) {
//                                    attributes[attr] = mdl[attr];
//                                }
//                                for (var key in dirty_attributes) {
//                                    fire(key + ':change');
//                                }
//
//                                fire('change', self);
//                                dirty_attributes = {};
//
//                                if (cb && isFunction(cb)) {
//                                    extend(mdl, {message: makeName(self.model_name) + ' was successfully updated.'});
//                                    cb(e, mdl);
//                                } else {
//                                    $.notify(makeName(self.model_name) + ' was successfully updated.', 'success');
//                                }
//
//
//                            } else if (method === 'post') {
//                                attributes = mdl;
//                                self.isNew = true;
//                                fire('created', self);
//                                if (cb && isFunction(cb)) {
//
//                                    extend(mdl, {message: makeName(self.model_name) + ' was successfully created.'});
//                                    cb(e, mdl);
//                                    //global.isTest? cb(e,mdl):  cb(makeName(self.model_name) + ' was successfully created.', 'success');
//
//                                } else {
//                                    $.notify(makeName(self.model_name) + ' was successfully created.', 'success');
//                                }
//                            }
//                        } else {
//                            $.notify(e);
//                        }
//
//                    });
//
//                    return this;
//                },
//                destroy: function (cb) {
//                    var self = this,
//                        md = {method: 'delete', url: self.url};
//                    if (!this.getInt('id')) {
//                        this.fire('destroy');
//
//                        extend(md, {message: makeName(self.model_name) + ' was successfully deleted.'});
//                        cb && cb(false, md);
//                        return;
//                    }
//                    _sync.call(this, 'delete', this, function (e, mdl) {
//                        if (!e) {
//                            var deleted = parseInt(mdl.affectedRows);
//                            if (deleted) {
//                                fire('destroy', self);
//                                //cb && isFunction(cb) && cb();
//                                if (cb && isFunction(cb)) {
//                                    extend(mdl, md);
//                                    extend(mdl, {message: makeName(self.model_name) + ' was successfully deleted.'});
//                                    cb(e, mdl);
//                                } else {
//                                    $.notify(makeName(self.model_name) + ' was successfully deleted.', 'success');
//                                }
//
//
//                            }
//                        }
//                    });
//                    return this;
//                },
//                toObject: function () {
//                    return attributes;
//                },
//                dirts: function () {
//                    return dirty_attributes;
//                },
//                toJSON: function () {
//                    return JSON.stringify(attributes);
//                },
//                reset: function () {
//                    attributes = {};
//                    fire('change', this);
//                    return this;
//                },
//                on: function (event, handler, context) {
//
//                    if (event && event.indexOf(',') != -1) {
//                        var evts = event.split(',');
//                        each(evts, function () {
//                            attachEvent.call(events, (this).trim(), handler, context);
//                        });
//
//                    } else {
//                        attachEvent.call(events, (event).trim(), handler, context);
//                    }
//                    return this;
//
//                },
//                sync: function (url, method, data, cb) {
//                    ajax(url, method, data, cb);
//                }
//            };
//            return new _Model();
//        },
//        Collection = function (_url, _transport) {
//            var events = {},
//                changeEventListeners = [],
//                fire = function (evt, data) {
//
//                    var cntx = null;
//                    if (events[evt]) {
//                        each(events[evt], function () {
//                            cntx = this['context'];
//                            data? this.call(cntx, data) : this.call(cntx);
//                        });
//                    }
//                },
//                models = {
//                    list: [],
//                    map: {},
//                    add: function (_koll, mdl) {
//                        if (mdl) {
//
//                            if (this.map[mdl.get('id')]) {
//
//                                var old = this.map[mdl.get('id')];
//                                old.populate(mdl.toObject());
//                                old.fire('change');
//                                //In case; already exists.
//                                return;
//                            }
//                            mdl.on('destroy', _koll.remove, _koll);
//                            mdl.on('change', model_changed, _koll);
//                            !mdl.get('id') && mdl.set('id', uid());
//                            mdl.isNew = true;
//                            this.list.push(mdl);
//                            this.map[mdl.get('id')] = mdl;
//                            _koll.length = this.list.length;
//                            fire('add', mdl);
//                            collectionChanged.call(_koll, 'add');
//                        }
//                    },
//                    get: function (id) {
//                        return this.map[id];
//                    },
//                    remove: function (_koll, id) {
//
//                        var mdl = this.map[id],
//                            index = this.list.indexOf(mdl);
//                        if (mdl && index !== -1) {
//                            this.list.splice(index, 1);
//                            delete this.map[id];
//                            _koll.length = this.list.length;
//                            fire('remove', mdl);
//                            collectionChanged.call(_koll, 'remove');
//                        }
//                    },
//                    populate: function (_koll, mdls, _url, _transport) {
//                        this.list = [];
//                        this.map = {};
//                        _koll.length = 0;
//
//                        for (var k = 0; k < mdls.length; ++k) {
//                            var mdl = Model(_url, mdls[k], _transport);
//                            mdl.on('destroy', _koll.remove, _koll);
//                            mdl.on('change', model_changed, _koll);
//                            !mdl.get('id') && mdl.set('id', uid());
//                            mdls[k] = mdl;
//                            this.map[mdl.get('id')] = mdl;
//                        }
//
//                        this.list = mdls;
//                        _koll.length = this.list.length;
//                        _koll.fetched = true;
//
//                        fire('reset');
//                        collectionChanged.call(_koll, 'reset');
//                    },
//                    reset: function (_koll) {
//                        this.list = [];
//                        this.map = {};
//                        _koll.length = this.list.length;
//                        fire('reset');
//                        collectionChanged.call(_koll, 'reset');//added
//                    }
//                },
//                model_changed = function (mdl) {
//                    fire('change');
//                },
//                push = function (mdl) {
//                    models.add(this, mdl);
//                },
//                collectionChanged = function (type) {
//                    for (var i = 0; i < changeEventListeners.length; ++i) {
//                        changeEventListeners[i] && changeEventListeners[i]['notifyChange'].call(changeEventListeners[i], this, type);
//                    }
//                },
//                _List = function () {
//                    this.length = 0;
//                    this.url = _url || '';
//                    this.transport = _transport ? transportMode.SOCKET_IO : transportMode.AJAX;
//                };
//            _List.prototype = {
//                extend: function (options) {
//                    if (options) {
//                        for (var k in options) {
//                            this[k] = options[k];
//                        }
//                    }
//
//                    return this;
//                },
//                notify: function (listener) {
//                    changeEventListeners.push(listener);
//                    return this;
//                },
//                fetch: function (q) {
//                    var self = this,
//                        load = {};
//                    if (q) {
//                        load['query'] = q || {};
//                    }
//
//                    extend(load, {url: this.url});
//                    _sync.call(this, 'get', load, function (e, mdls) {
//                        if (!e) {
//                            mdls = !isArray(mdls) ? [mdls] : mdls;
//                            models.populate(self, mdls, self.url, self.transport);
//                        }
//                    });
//                    return this;
//                },
//                reset: function () {
//                    models.reset(this);
//                    return this;
//                },
//                add: function (mdl) {
//                    if (!mdl.toObject) {
//                        mdl = Model(this.url, mdl, this.transport);
//                    }
//                    push.call(this, mdl);
//                    return this;
//
//                },
//                remove: function (mdl) {
//                    models.remove(this, mdl.get('id'));
//                },
//                create: function (mdl, cb) {
//
//                    if (!mdl.toObject) {
//                        mdl = Model(this.url, mdl, this.transport === transportMode.SOCKET_IO);
//                        mdl.extend({sync:this.sync});
//                    }
//                    mdl.on('created', this.add, this);
//                    mdl.save(cb);
//                    return this;
//                },
//                forEach: function (cb) {
//                    each(models.list, function () {
//                        this && cb && cb(this);
//                    });
//                },
//                on: function (event, handler, context) {
//
//                    if (event && event.indexOf(',') != -1) {
//                        var evts = event.split(',');
//
//                        each(evts, function () {
//                            attachEvent.call(events, (this).trim(), handler, context);
//                        });
//
//                    } else {
//                        attachEvent.call(events, event.trim(), handler, context);
//                    }
//
//                    return this;
//                },
//                sync: function (url, method, data, cb) {
//
//                    ajax(url, method, data, cb);
//                    return this;
//                },
//                emptyModel: function (attr) {
//                    var mdl = Model(this.url, attr || {}, this.transport === 'SOCKET_IO');
//                    mdl.on('created', this.add, this);
//                    return mdl;
//                },
//                firstModel: function () {
//                    return models.list[0];
//                },
//                fire: function (event) {
//                    fire(event);
//                    return this;
//                },
//                get: function (id) {
//                    return models.get(id);
//                },
//                asArray: function () {
//                    return models.list;
//                }
//            };
//
//            return new _List();
//        },
//        View = function (options) {
//
//            var _bind = function () {
//                    var self = this;
//                    for (var k in self.events) {
//                        var handler = self.events[k];
//                        var triggers = k.split(',');
//                        each(triggers, function () {
//                            var trigger = this,
//                                event_targets = trigger && trigger.split(':');
//                            var evt = event_targets[0];
//                            var dom = event_targets[1];
//                            evt = evt && (evt).trim();
//                            dom = dom && (dom).trim();
//                            self.$el.find(dom).unbind();
//                            self[handler] && self.$el.on(evt, dom, $.proxy(self, handler));
//                        });
//
//                    }
//                },
//                removeTip = function (input) {
//                    var attached_tip = input.data('tip');
//                    (attached_tip && attached_tip.remove());
//                },
//                _View = function () {
//                    delete  options['tmpl'];
//                    extend(this.events, (options.events || {}));
//                    delete options.events;
//                    this.extend(options);
//                    !this.lazy && this.render();
//                    this.onDestroy();
//                };
//
//            _View.prototype = {
//                host: '#content',
//                el: 'span',
//                isEditor:false,
//                userModel: Model(),
//                collection: null,
//                template: '',
//                lazy: false,
//                empty_before_render: true,
//                extend: function (options) {
//                    if (options) {
//                        for (var k in options) {
//                            this[k] = options[k];
//                        }
//                    }
//                },
//                initialize: function () {
//                },
//                render: function () {
//                    var self = this;
//                    //this.$el = this.el ? $('<' + this.el + '/>') : $('<' + this.host + '/>');
//                    this.$host = $(this.host);
//                    this.$el = this.el ? $('<' + this.el + '/>') : this.$host;//$('<' + this.host + '/>');
//
//                    self.tmpl(function (str) {
//                        if (str) {
//                            if (self.empty_before_render) {
//                                self.$host.off().children().remove();
//                            }
//                            self.$el.off().html(str).appendTo(self.$host);
//                        }
//                        (self.class && self.$el.attr('class', self['class']));
//                        (self.id && self.$el.attr('id', self.id));
//                        self.afterRender();
//
//                    });
//                },
//                beforeEvents: function () {
//                },
//                afterRender: function () {
//                    var self = this;
//                    this.beforeEvents();
//                    _bind.call(self);
//                    if (self.notifyChange && self.collection) {
//                        self.collection.notify(self);
//                    }
//                    self.initialize();
//                    self.myAfterRender && self.myAfterRender();
//                },
//                cleanUps: [],
//                onDestroy: function (f) {
//                    var self = this;
//                    self.$el.bind('destroyed', function () {
//
//                        //console.log('destroyed called...');
//                        if (self.collection) {
//                            self.collection.cleanUp && self.collection.cleanUp();
//                        } else {
//                            self.userModel.cleanUp && self.userModel.cleanUp();
//                        }
//                        for (var i = 0; i < self.cleanUps.length; ++i) {
//                            self.cleanUps[i]();
//                        }
//                    });
//                },
//                events: {},
//                update: function (mdl) {
//                    this.tmpl(function (str) {
//                        str && this.$el.off().html(str);
//                        (this.class && this.$el.attr('class', this.class));
//                        (this.id && this.$el.attr('id', this.id));
//                        this.afterRender();
//                    }, mdl);
//                },
//                notifyChange: function (_koll) {
//
//                },
//                remove: function (cb) {
//                    var self = this;
//                    this.$el.off().fadeOut('fast', function () {
//
//                        $(this).remove();
//                        cb && isFunction(cb) && cb();
//                    });
//                },
//                hide: function (how) {
//                    this.$el[how ? how : 'fadeOut']('slow');
//                },
//                show: function (how) {
//                    this.$el[how ? how : 'fadeIn']('slow');
//                },
//                reset: function () {
//                    this.$el.clear(removeTip);
//                },
//                data: function (sel) {
//                    return $.mapob(sel ? this.$el.find(sel) : this.$el);
//                },
//                tmpl: function (cb, mdl, tmpl_name) {
//                    var self = this;
//                    var template = tmpl_name || this.template;
//                    if (!template) {
//                        cb && cb('');
//                        return;
//                    }
//                    template += '.htm';
//                    var load = (mdl && mdl.toObject()) || (this.userModel && this.userModel.toObject()) || {};
//                    load = this.isEditor ? load : $.formatFields(load);
//
//                    dust.render(template, load, function (error, str) {
//                        if (error) {
//                            console.log(error);
//                            return;
//                        }
//                        cb && cb.call(self, str);
//                    });
//                },
//                dispatch: function (path) {
//                    Path.dispatch(path);
//                    location.hash = path;
//                },
//                goBack: function (cb) {
//                    window.history.back();
//                    cb && cb();
//                }
//
//            };
//            return new _View();
//        },
//        Router = function (/*routes*/) {
//            Path.redirect = function (path) {
//                this.dispatch(path);
//                location.hash = path;
//            };
//            Path.goBack = function () {
//                window.history.back();
//            };
//            return Path;
//        };
//
//
//    var _slick = {
//        $: $,
//        Model: Model,
//        Collection: Collection,
//        View: View,
//        Router: Router
//    };
//
//
//    return _slick;
////})(window.jQuery);
//})(require('jquery'));