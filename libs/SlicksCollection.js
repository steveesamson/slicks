//var Model = require('./SlicksModel'),
//     _ = require('./SlicksUtils')();
module.exports = function(_,Model) {

    return function (_url, _transport) {
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
                this.useRealTime = _transport;
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

                _.xtend(load, {url: this.url});
                _.sync_bee.call(this, 'get', load, function (e, mdls) {
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
                    mdl.extend({sync: this.sync});
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
            sync: function (url, method, data, cb) {

                _.ajax(url, method, data, cb);
                return this;
            },
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
            }
        };

        return new _List();
    };
};