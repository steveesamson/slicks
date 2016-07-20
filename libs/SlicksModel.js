module.exports = function(_){

    return function (_url, _attributes, _socket) {

        var isModel = function (o) {
                return o instanceof _Model;
            },
            resolveCall = function (url, params, cb) {

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
                    mdl = _Model((url || this.url), attr, this.useRealTime);
                mdl.extend({sync: this.sync});
                mdl.query = attr;
                return {model: mdl, callback: cb};
            },
            events = {},
            hash = new _.Hashid("_53cr3t3-+", 5),
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

                if (!isModel(this)) {
                    return new _Model(url, attribs, isRealTime);
                }

                attributes = attribs || {};
                this.url = url || '';
                this.model_name = this.url.replace(/\//g, '');
                this.useRealTime = isRealTime;// ? transportMode.SOCKET_IO : transportMode.AJAX;
            };
        _Model.prototype = {
            extend: function (map) {
                for (var k in map) {
                    this[k] = map[k];
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
            hash: function (_hash) {
                if (_hash) {
                    return hash.decode(_hash);
                } else {
                    return hash.encode(this.getInt('id'));
                }
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
                var mdl = _Model(this.url + '/login', attributes, this.useRealTime);
                _.sync_bee.call(mdl, 'post', mdl, cb);
            },
            unlink: function (params, cb) {
                var mdl = _Model(this.url + '/unlink', params, this.useRealTime);
                _.sync_bee.call(mdl, 'post', mdl, cb);
                return this;
            },
            fetch: function (url, params, cb) {
                var fnbody = resolveCall.apply(this, arguments);
                _.sync_bee.call(fnbody.model, 'get', fnbody.model, fnbody.callback);
                return this;
            },
            post: function (url, params, cb) {
                var fnbody = resolveCall.apply(this, arguments);
                _.sync_bee.call(fnbody.model, 'post', fnbody.model, fnbody.callback);
                return this;
            },
            save: function (cb) {
                var method = attributes.id ? 'put' : 'post',
                    self = this;

                _.sync_bee.call(this, method, this, function (e, mdl) {

                    _.xtend(mdl, {method: method, url: self.url});
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
                                _.xtend(mdl, {message: _.makeName(self.model_name) + ' was successfully updated.'});
                                cb(e, mdl);
                            } else {
                                $.notify(_.makeName(self.model_name) + ' was successfully updated.', 'success');
                            }


                        } else if (method === 'post') {
                            attributes = mdl;
                            self.isNew = true;
                            fire('created', self);
                            if (cb && _.isFunction(cb)) {

                                _.xtend(mdl, {message: _.makeName(self.model_name) + ' was successfully created.'});
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
                    md = {method: 'delete', url: self.url};
                if (!this.getInt('id')) {
                    this.fire('destroy');

                    _.xtend(md, {message: _.makeName(self.model_name) + ' was successfully deleted.'});
                    cb && cb(false, md);
                    return;
                }
                _.sync_bee.call(this, 'delete', this, function (e, mdl) {
                    if (!e) {
                        var deleted = parseInt(mdl.affectedRows);
                        if (deleted) {
                            fire('destroy', self);
                            //cb && _.isFunction(cb) && cb();
                            if (cb && _.isFunction(cb)) {
                                _.xtend(mdl, md);
                                _.xtend(mdl, {message: _.makeName(self.model_name) + ' was successfully deleted.'});
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
            sync: function (url, method, data, cb) {
                ajax(url, method, data, cb);
            }
        };
        return new _Model(_url, _attributes, _socket);
    };
};