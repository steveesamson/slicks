/**
 * Created by steve samson on 1/29/14.
 */
/**
 * Created by steve samson on 1/9/14.
 */


module.exports = (function ($) {

//    GET   :    /:controller/find        => findAll()
//    GET   :    /:controller/find/:id        => find(id)
//    POST  :    /:controller/create        => create(id)
//    PUT   :    /:controller/update/:id        => update(id)
//    DELETE:    /:controller/destroy/:id    => destroy(id)


    var setup_socket = function (io) {

            var self = this;

            // We'll be adding methods to `io.SocketNamespace.prototype`, the prototype for the
            // Socket instance returned when the browser connects with `io.connect()`
            var Socket = io.SocketNamespace;


            /**
             * Simulate a GET request to sails
             * e.g.
             *    `socket.get('/user/3', Stats.populate)`
             *
             * @param {String} url    ::    destination URL
             * @param {Object} params ::    parameters to send with the request [optional]
             * @param {Function} cb   ::    callback function to call when finished [optional]
             */

            Socket.prototype.get = function (url, data, cb) {
                return this.request(url, data, cb, 'get');
            };


            /**
             * Simulate a POST request to sails
             * e.g.
             *    `socket.post('/event', newMeeting, $spinner.hide)`
             *
             * @param {String} url    ::    destination URL
             * @param {Object} params ::    parameters to send with the request [optional]
             * @param {Function} cb   ::    callback function to call when finished [optional]
             */

            Socket.prototype.post = function (url, data, cb) {
                return this.request(url, data, cb, 'post');
            };


            /**
             * Simulate a PUT request to sails
             * e.g.
             *    `socket.post('/event/3', changedFields, $spinner.hide)`
             *
             * @param {String} url    ::    destination URL
             * @param {Object} params ::    parameters to send with the request [optional]
             * @param {Function} cb   ::    callback function to call when finished [optional]
             */

            Socket.prototype.put = function (url, data, cb) {
                return this.request(url, data, cb, 'put');
            };


            /**
             * Simulate a DELETE request to sails
             * e.g.
             *    `socket.delete('/event', $spinner.hide)`
             *
             * @param {String} url    ::    destination URL
             * @param {Object} params ::    parameters to send with the request [optional]
             * @param {Function} cb   ::    callback function to call when finished [optional]
             */

            Socket.prototype['delete'] = function (url, data, cb) {
                return this.request(url, data, cb, 'delete');
            };


            /**
             * Simulate HTTP over Socket.io
             * @api private :: but exposed for backwards compatibility w/ <= sails@~0.8
             */

            Socket.prototype.request = request;
            function request(url, data, cb, method) {

                var socket = this;

                var usage = 'Usage:\n socket.' +
                    (method || 'request') +
                    '( destinationURL, dataToSend, fnToCallWhenComplete )';

                // Remove trailing slashes and spaces
                url = url.replace(/^(.+)\/*\s*$/, '$1');

                // If method is undefined, use 'get'
                method = method || 'get';


                if (typeof url !== 'string') {
                    throw new Error('Invalid or missing URL!\n' + usage);
                }

                // Allow data arg to be optional
                if (typeof data === 'function') {
                    cb = data;
                    data = {};
                }

                // Build to request
                var json = window.io.JSON.stringify({
                    url: url,
                    data: data
                });


                // Send the message over the socket
                socket.emit(method, json, function afterEmitted(result) {

                    var parsedResult = result;

                    if (result && typeof result === 'string') {
                        try {
                            parsedResult = window.io.JSON.parse(result);
                        } catch (e) {
                            if (typeof console !== 'undefined') {
                                console.warn("Could not parse:", result, e);
                            }
                            throw new Error("Server response could not be parsed!\n" + result);
                        }
                    }

                    // TODO: Handle errors more effectively
                    if (parsedResult === 404) throw new Error("404: Not found");
                    if (parsedResult === 403) throw new Error("403: Forbidden");
                    if (parsedResult === 500) throw new Error("500: Server error");

                    cb && cb(parsedResult);

                });
            }

            var socket = io.connect();


            socket.on('connect', function socketConnected() {

                console.log('Socket connection established!');
                // Listen for Comet messages from Sails
                socket.on('message', self.comets);
            });
            self.socket = socket;
        },
        ajax = function (url, method, data, cb) {
            console.log('url:' + url + ' method:' + method + ' data:' + JSON.stringify(data));
            $.ajax({
                type: method,
                url: url,
                data: data,
                success: cb,
                dataType: 'json'
            });
        },
        _sync = function (method, model, cb) {
            var url = null, data = {};
            switch (method) {
                case 'post':
                    url = model.url + '/create';
                    data = model.toObject();
                    break;
                case 'put':
                    url = model.url + '/update/' + model.get('id');
                    data = model.dirty_attributes;
                    break;
                case 'delete':
                    url = model.url + '/destroy/' + model.get('id');
                    break;
                case 'get':
                    url = model.url;
                    data = model.query;
                    break;
                default:
                    console.log('Unknown method: ' + method);
                    return;
            }
            this.sync(url, method, data, cb);

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
                }

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
    var Model = function (options) {
            var attributes = options.attributes || {},
                url = options.url || '',
                events = {},
                dirty_attributes = {},
                fire = function (evt, data) {

                    var cntx = null;
                    if (events[evt]) {
                        if (data) {
                            events[evt].forEach(function (handler) {
                                cntx = handler['context'];
                                handler.call(cntx, data);
                            });
                        } else {
                            events[evt].forEach(function (handler) {
                                cntx = handler['context'];
                                handler.call(cntx);
                            });
                        }

                    }

                },
                attachEvent = function (evt, handler, context) {
                    handler['context'] = context;
                    if (!events[evt]) {
                        events[evt] = [];
                    }
                    events[evt].push(handler);
                },
                get = function (attr) {
                    return attributes[attr];
                },
                set = function (key, value) {
                    attributes[key] = value;
                    dirty_attributes[key] = value;
                    this.attributes = attributes;
                    this.dirty_attributes = dirty_attributes;
                    return this;
                },
                save = function () {
                    var method = attributes.id ? 'put' : 'post',
                        self = this;

                    _sync.call(this, method, this, function (mdl) {
                        delete self.attributes;
                        delete self.dirty_attributes;
                        attributes = mdl;

                        if (method === 'put') {
                            for (var key in dirty_attributes) {
                                fire(key + ':change');
                            }
                            fire('change', self);

                            dirty_attributes = {};
                        } else if (method === 'post') {
                            fire('created', self);
                        }

                    });

                    return this;
                },
                destroy = function () {
                    var self = this;
                    _sync.call(this, 'delete', this, function (mdl) {
                        fire('destroy', self);
                    });
                },
                toObject = function () {
                    return attributes;
                },
                toJSON = function () {
                    return JSON.stringify(attributes);
                },
                onEvent = function (event, handler, context) {

                    if (event && event.indexOf(',') != -1) {
                        var evts = event.split(',');
                        evts.forEach(function (v) {

                            attachEvent(v.trim(), handler, context);
                        })
                    } else {
                        attachEvent(event.trim(), handler, context);
                    }

                },
                synchronize = function (url, method, data, cb) {
                    ajax(url, method, data, cb);
                };

            return{
                _init_: function () {

                    this.url = url;
                    return this;
                },
                get: get,
                set: set,
                save: save,
                destroy: destroy,
                toObject: toObject,
                toJSON: toJSON,
                on: onEvent,
                sync: synchronize

            }._init_();
        },
        Collection = function (options) {

            var url = options.url || '',
                events = {},
                fire = function (evt, data) {

                    var cntx = null;
                    if (events[evt]) {
                        if (data) {
                            events[evt].forEach(function (handler) {
                                cntx = handler['context'];
                                handler.call(cntx, data);
                            });
                        } else {
                            events[evt].forEach(function (handler) {
                                cntx = handler['context'];
                                handler.call(cntx);
                            });
                        }
                    }
                },
                attachEvent = function (evt, handler, context) {
                    handler['context'] = context;
                    if (!events[evt]) {
                        events[evt] = [];
                    }
                    events[evt].push(handler);
                },
                models = [],
                create = function (mdl) {
                    if (!mdl.toObject) {
                        mdl = Model(mdl);
                    }
                    mdl.on('created', append, this);
                    mdl.save();
                    return this;
                },
                watch = function () {
                    if (!window.io) {
                        console.log('NO socket.io.js! You need to include the socket.io.js on your page in order to watch realtime commets... falling back to AJAX');
                        return;
                    }
                    setup_socket.call(this, window.io);
                    this.transport = 'SOCK_IO';
                    this.socket.get(this.url + '/subscribe');
                    return this;
                },
                fetch = function (q) {
                    var self = this,
                        q = q || {},
                        load = {};

                    load['query'] = q;

                    $.extend(load, {url: url});
                    _sync.call(this, 'get', load, function (mdls) {

                        mdls.forEach(function (m) {
                            var mdl = Model({attributes: m, 'url': url});
                            push.call(self, mdl);
                        });
                        fire('reset');
                    });
                    return this;
                },
                model_changed = function (mdl) {
                    fire('change');
                },
                destroyed = function (mdl) {
                    var index = models.indexOf(mdl);
                    if (index != -1) {
                        models.splice(index, 1);
                        this.length = models.length;
                        fire('remove', mdl);
                    }

                },
                push = function (mdl) {
                    mdl.on('destroy', destroyed, this);
                    mdl.on('change', model_changed, this);
                    models.push(mdl);
                    this.length = models.length;

                },
                append = function (mdl) {
                    if (!mdl.toObject) {
                        mdl = Model(mdl);
                    }
                    push.call(this, mdl);
                    fire('add', mdl);
                    return this;
                },
                loop = function (cb) {
                    models.forEach(function (c) {
                        cb && cb(c);
                    });
                },
                onEvent = function (event, handler, context) {

                    if (event && event.indexOf(',') != -1) {
                        var evts = event.split(',');
                        evts.forEach(function (v) {

                            attachEvent(v.trim(), handler, context);
                        })
                    } else {
                        attachEvent(event.trim(), handler, context);
                    }

                    return this;
                },
                synchronize = function (url, method, data, cb) {
                    if (this.transport === 'AJAX') {
                        ajax(url, method, data, cb);

                    } else if (this.transport === 'SUCK_IO') {

                        this.socket[method](url, data, cb);
                    }

                },
                msg = function (message) {


                    console.log('New comet message received :: ', message);

                };

            return {
                _init_: function () {
                    this.length = 0;
                    this.url = url;
                    return this;
                },
                transport: 'AJAX',
                fetch: fetch,
                watch: watch,
                add: append,
                remove:destroyed,
                create: create,
                forEach: loop,
                on: onEvent,
                sync: synchronize,
                comets: msg
            }._init_();
        },
        View = function (options) {
            var has = function (key) {
                    var viewAttrs = ['events', 'host', 'el', 'model', 'collection', 'template', 'initialize'];
                    var hs = $.inArray(key, viewAttrs);
                    return hs != -1;
                },
                _bind = function () {
                    var self = this;
                    for (var k in self.events) {
                        var handler = self.events[k];
                        var triggers = k.split(',');
                        triggers.forEach(function (trigger) {
                            var event_targets = trigger && trigger.split(':');
                            var evt = event_targets[0];
                            var dom = event_targets[1];
                            evt = evt && evt.trim();
                            dom = dom && dom.trim();
//                            view_instance.$el.on(evt, dom, $.proxy(view_instance, handler));
//                            self.$el.on(evt, dom, $.proxy(self[handler],self));
                            self.$el.on(evt, dom, $.proxy(self, handler));

                        });

                    }
                },
                _tmpl = function (cb, mdl, tmpl_name) {
                    var self = this;
                    var template = tmpl_name || this.template,
                        load = (mdl && mdl.toObject()) || (this.model && this.model.toObject()) || null;
                    if (!load) {
                        console.log('View model is null, perhaps you wants to override View.render to walk render a collection.');
                        return;
                    }
                    dust.render(template, load, function (error, str) {
                        if (error) {
                            console.log(error);
                            return;
                        }
                        cb && cb.call(self, str);
                    });
                },
                init = function () {

                    var actions = {};
                    $.each(options, function (k, v) {

                        if (!has(k)) {
                            var val = options[k];
                            actions[k] = val;
                            delete  options[k];
                        }
                    })

                    delete  options['tmpl'];
                    delete  actions['tmpl'];

                    /*examples events
                     events = {


                     'click:#button1, keyup:.search':'button1',
                     'click:#button2':'button2',
                     'click:#button3':'button3',
                     'focus:.search':'button4',
                     'blur:.search':'button5'


                     }*/
                    this.events = {};
                    this.host = options.host || '#content';
                    this.el = options.el || '';
                    this.model = options.model || null;
                    this.collection = options.collection || null;
                    this.template = options.template || '';
                    this.initialize = (options.initialize && $.isFunction(options.initialize)) ? options.initialize : function () {
                        console.log("View initialized!");
                    };
                    this.render = (options.render && $.isFunction(options.render)) ? options.render : function (mdl) {
                        console.log(mdl);
                        this.tmpl(function (str) {

                            if (mdl) {
                                this.$el.off().html(str);
                            } else {
                                this.$el.off().html(str).appendTo(this.$host);
                            }
                            _bind.call(this);
                        }, mdl);
                    };
                    $.extend(this.events, (options.events || {}));

                    if (!this.el && this.model) {
                        console.log('Note that el is undefined. It must be defined.');
                        return null;
                    }
                    this.$el = $('<' + this.el + '/>');
                    this.$host = $(this.host);

                    $.extend(this, actions);
                    this.initialize();
                    return this;
                },
                remove = function () {
                    this.$el.off().fadeOut('slow', function () {
                        $(this).remove();
                    });
                },
                hide = function (how) {//fadeOut,hide,slideUp
                    this.$el[how ? how : 'fadeOut']('slow');
                },
                show = function (how) {//fadeIn,show,slideDown
                    this.$el[how ? how : 'fadeIn']('slow');
                };

            return {
                _init_: init,
                remove: remove,
                hide: hide,
                show: show,
                tmpl: _tmpl
            }._init_();


        },
        Router = function (routes) {
            $.each(routes, function (k, v) {
                if (k == 'root') {
                    Path.root(v);
                } else {
                    Path.map(k).to(v);
                }
            });
            return{
                start: Path.listen,
                help: Path.rescue
            };
        };


    return {
        Model: Model,
        Collections: Collection,
        View: View,
        Router: Router
    };
})(require('jquery'));