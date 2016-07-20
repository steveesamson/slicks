module.exports = function (_, Model) {

    return function (options) {

        if (!window || !window.$) {
            throw Error("Include Seleto or jQuery on your page to use Slicks-mvc");
        }
        require('./browser/extensions');
        var $ = window.$,
            _bind = function () {

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
                delete  options['tmpl'];
                _.xtend(this.events, (options.events || {}));
                delete options.events;
                this.extend(options);
                this.$host = $(this.host);
                this.$el = this.el ? $('<' + this.el + '/>') : this.$host;//$('<' + this.host + '/>');
                !this.lazy && this.render();
                this.onDestroy();
            };

        _View.prototype = {
            host: '#content',
            el: 'span',
            isEditor: false,
            model: Model(),
            collection: null,
            template: '',
            templateFile: '',
            lazy: false,
            empty_before_render: true,
            extend: function (options) {
                if (options) {
                    for (var k in options) {
                        this[k] = options[k];
                    }
                }
                return this;
            },
            initialize: function () {
            },
            render: function () {
                var self = this;
                //this.$el = this.el ? $('<' + this.el + '/>') : $('<' + this.host + '/>');
                //this.$host = $(this.host);
                //this.$el = this.el ? $('<' + this.el + '/>') : this.$host;//$('<' + this.host + '/>');

                self.tmpl(function (str) {
                    if (str) {
                        if (self.empty_before_render) {
                            self.$host.off().children().trigger('destroyed').remove();
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
                this.model && this.model.on('change',this.update, this);
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
                this.$el.trigger('destroyed');
                this.$el.remove();
                cb && _.isFunction(cb) && cb();
                //this.$el.off().fadeOut('fast', function () {
                //
                //    $(this).remove();
                //    cb && isFunction(cb) && cb();
                //});
            },
            hide: function (how) {
                this.$el[how ? how : 'fadeOut']('slow');
            },
            show: function (how) {
                this.$el[how ? how : 'fadeIn']('slow');
            },
            reset: function () {
                this.$el.clear();
            },
            data: function (sel) {
                return $.mapob(sel ? this.$el.find(sel) : this.$el);
            },
            tmpl: function (cb, mdl, tmpl_name) {
                var self = this,
                    load = ((mdl && mdl.toObject()) || (this.model && this.model.toObject()) || {}),
                    template;
                load = this.isEditor ? load : _.formatFields(load);
                if (this.templateFile) {
                    template = tmpl_name || this.templateFile;
                    if (!template) {
                        cb && cb('');
                        return;
                    }
                    template += '.htm';
                    dust.render(template, load, function (error, str) {
                        if (error) {
                            console.log(error);
                            return;
                        }
                        cb && cb.call(self, str);
                    });
                } else {

                    template = this.template;
                    for (var x in load) {
                        var re = "{\\s?" + x + "\\s?}";
                        template = template.replace(new RegExp(re, "ig"), load[x]);
                    }
                    cb && cb(template);
                }
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
    };
};
