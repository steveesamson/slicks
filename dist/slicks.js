(function (factory) {

    // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
    // We use `self` instead of `window` for `WebWorker` support.
    var root = (typeof self == 'object' && self.self === self && self) ||
        (typeof global == 'object' && global.global === global && global);


    if (typeof define === 'function' && define.amd) {
        define([], function () {
            factory(root);
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(root);
    } else {
        root.Slicks = factory(root);
    }
}(function (root) {

    var $ = root.$,
        stud = root.stud,
        io = root.io;


    if (!root.sessionStorage) {
        console.log("Unsupported browser, please switch to a modern browser, i.e chrome or firefox");
    }

    if (!$) {
        console.log("Include jQuery on your page to use Slicks");
    }

    if (!stud) {
        console.log("Include Stud.js on your page to use Slicks");
    }

    /*!
     Extending JavaScript
     */

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
    if (typeof String.prototype.startsWithi == 'undefined') {
        String.prototype.startsWithi = function (prefix) {
            return this.toLocaleLowerCase().indexOf(prefix.toLocaleLowerCase(), 0) === 0;
        };

    }

    if (!Array.isArray) {
        Array.isArray = function (arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    /*!
     Utilities
     */

    var _ = (function () {
        var happy = function (j) {
                return (j !== null && j.error === undefined);
            },
            isString = function (o) {
                return typeof o === 'string';
            },
            isObject = function (o) {
                return !Array.isArray(o) && typeof o === 'object';
            },
            each = function (arrayOrObject, cb) {
                if (Array.isArray(arrayOrObject)) {
                    for (var i = 0; i < arrayOrObject.length; ++i) {
                        arrayOrObject[i] && cb && cb.call(arrayOrObject[i], i, arrayOrObject[i]);
                    }
                } else if (isObject(arrayOrObject)) {
                    for (var k in arrayOrObject) {
                        cb && cb.call(arrayOrObject[k], k, arrayOrObject[k]);
                    }
                }

            },
            map = function (array, cb) {
                var accepted = [];
                each(array, function (i) {

                    var valid = cb && cb.call(this, i);
                    if (valid) {
                        accepted.push(valid);
                    }
                });
                return accepted;
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
            inherits = function (base, options, type) {

                var F = null,
                    o = null,
                    type = type ? type : '';

                switch (type.toLowerCase()) {
                    case 'view':
                        F = function F() {
                        };

                        F.prototype = base;

                        o = new F();
                        o.parent = F.prototype;
                        delete options['hooks'];

                        for (var k in options) {

                            if (k === 'events') {
                                var evt = {};
                                xtend(evt, o.parent.events || {}, options[k]);
                                o[k] = evt;
                                delete options[k];
                                continue;

                            }

                            o[k] = options[k];

                        }
                        break;
                    case 'model':
                        F = function F() {
                            this.url = options.url || '';
                            this.model_name = this.url.replace(/\//g, '');
                        };

                        F.prototype = base;

                        o = new F();
                        o.parent = F.prototype;

                        break;

                    case 'collection':
                        F = function F() {
                            this.url = options.url || '';
                            this.length = 0;
                        };

                        F.prototype = base;

                        o = new F();
                        o.parent = F.prototype;

                        break;


                }

                return o;
            },
            isFunction = function (cb) {
                return typeof cb === "function";
            },
            varName = function (str) {

                return str ? str.replace(/\s+/g, '_').toLowerCase() : str;
            },
            makeName = function (str) {
                var index = str.indexOf('_');
                if (index < 0) {
                    return str == 'id' ? str.toUpperCase() : (str.charAt(0)).toUpperCase() + str.substring(1);
                }
                var names = str.split('_');
                var new_name = '';

                each(names, function (i, s) {

                    new_name += new_name.length > 0 ? " " + makeName(s) : makeName(s);

                });

                return new_name;

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
                var copy = {}, valids = ['amount', 'price', 'sum', 'charge'];
                each(map, function (k, v) {
                    copy[k] = v;

                    for (var i = 0; i < valids.length; ++i) {
                        if (k.indexOf(valids[i]) !== -1 && isNumeric(v)) {
                            copy[k] = format(v);
                            break;
                        }
                    }


                });

                return copy;
            },
            contains = function (needle, array) {


                var has = false;
                if (!needle) return has;

                needle = needle.trim().toLowerCase();

                if (Array.isArray(array)) {
                    each(array, function (i, v) {

                        if (needle === v.trim().toLowerCase()) {
                            has = true;
                        }
                    });
                } else {
                    has = array.toLowerCase().indexOf(needle) !== -1;
                }

                return has;

            },
            format = function (amount) {
                var i = parseFloat(amount),
                    delimitNumbers = function (str) {
                        return (str + "").replace(/\b(\d+)((\.\d+)*)\b/g, function (a, b, c) {
                            var num = (b.charAt(0) > 0 && !(c || ".").lastIndexOf(".") ? b.replace(/(\d)(?=(\d{3})+$)/g, "$1,") : b) + c;
                            return num.endsWith('.00') ? num.substring(0, num.length - 3) : num;
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
            },
            template = function (cb, mdl, templateOrTemplateName) {
                var self = this,
                    load = ((mdl && mdl.toObject()) || (this.model && this.model.toObject()) || {}),
                    template = templateOrTemplateName || this.template;

                load = this.isEditor ? load : formatFields(load);

                var b4Ret = function (str) {

                    var $str = $('<div/>').html(str);

                    $str.find('[data-hideif]').hideIf(load);

                    return $str.html();

                };

                if (!template) {
                    if (cb) cb('');
                    else return "";

                    return;
                }

                if (template && template.startsWith('@')) {

                    template = template.substring(1);
                    if (cb) {

                        stud.template(template, load, function (error, str) {
                            if (error) {
                                console.log(error);
                                return;
                            }

                            cb && cb.call(self, b4Ret(str));
                        });
                    } else {
                        var str = stud.template(template, load);

                        return b4Ret(str);
                    }


                } else {

                    template += '.html';
                    if (cb) {
                        stud.render(template, load, function (error, str) {
                            if (error) {
                                console.log(error);
                                return;
                            }


                            cb && cb.call(self, b4Ret(str));
                        });
                    } else {
                        var str = stud.render(template, load);


                        return b4Ret(str);
                    }

                }

            },
            ext = function (fileName) {

                var result = fileName.split('.');

                return result.length === 1 ? "" : result.pop();
            },
            inArray = function (needle, array) {

                if (isString(array) && contains(',', array)) {
                    array = array.toLowerCase().split(',');
                }

                if (isString(array)) {
                    array = [array];
                }

                if (!needle) return false;
                needle = needle.toLowerCase();
                var found = false;
                each(array, function (i, v) {
                    if (v.trim().toLowerCase() === needle) {
                        found = true;
                    }
                });

                return found;
            },
            robaac = function (_roles) {

                //console.log('Extract: ', JSON.stringify(_roles));

                var roles = _roles || {},
                    normalizeRoles = function () {
                        var map = {};

                        each(roles, function (role, def) {

                            map[role] = {

                                can: {},
                                permissions: []

                            };

                            if (def.inherits) {

                                map[role].inherits = def.inherits;
                            }

                            each(def.can, function (i, operation) {

                                if (isString(operation)) {

                                    map[role].permissions.push(operation);
                                    map[role].can[operation] = function () {
                                        return true;
                                    };

                                } else if (isObject(operation)) {

                                    map[role].permissions.push(operation.name);
                                    map[role].can[operation.name] = new Function("param", "return " + operation.when + ";");

                                }

                            });

                        });

                        roles = map;
                    };

                normalizeRoles();


                return {
                    cans: function (role) {

                        return roles[role] && roles[role].permissions;
                    },
                    has: function (role, action) {

                        return roles[role] && roles[role].permissions.indexOf(action) !== -1;
                    },
                    can: function (role, operation, options, cb) {

                        if (!roles[role]) return cb ? cb(false) : false;

                        options && _.xtend(options, {owner: Session.user().id});

                        var $role = roles[role];

                        // Check if this role has this operation
                        if ($role.can[operation]) {

                            // If the function check passes return true
                            if ($role.can[operation](options)) {
                                return cb ? cb(true) : true;
                            }
                        }

                        // Check if there are any parents
                        if (!$role.inherits || $role.inherits.length < 1) {
                            return cb ? cb(false) : false;
                        }

                        var cans = 0;

                        each($role.inherits, function (i, _role) {

                            if (this.can(_role, operation, options)) {
                                ++cans;
                            }
                        });

                        return cb ? cb(cans > 0) : (cans > 0);
                        // Check child roles until one returns true or all return false
                        //return $role.inherits.some(childRole => this.can(childRole, operation, options));
                    }
                };
            },
            Mobile = {
                isAndroid: function () {
                    return navigator.userAgent.match(/Android/i);
                },
                isBlackBerry: function () {
                    return navigator.userAgent.match(/BlackBerry/i);
                },
                isIOS: function () {
                    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
                },
                isOpera: function () {
                    return navigator.userAgent.match(/Opera Mini/i);
                },
                isWindows: function () {
                    return navigator.userAgent.match(/IEMobile/i);
                },
                isAny: function () {
                    return (Mobile.isAndroid() || Mobile.isBlackBerry() || Mobile.isIOS() || Mobile.isOpera() || Mobile.isWindows());
                }
            };


        return {
            happy: happy,
            xtend: xtend,
            inherits: inherits,
            isFunction: isFunction,
            makeName: makeName,
            each: each,
            uid: uid,
            attachEvent: attachEvent,
            detachEvent: detachEvent,
            baseName: baseName,
            isNumeric: isNumeric,
            isInteger: isInteger,
            formatFields: formatFields,
            contains: contains,
            format: format,
            isString: isString,
            isObject: isObject,
            template: template,
            inArray: inArray,
            ext: ext,
            varName: varName,
            map: map,
            robaac: robaac,
            Mobile: Mobile
        };

    }());

    root.Keys = {
        Enter: 13,
        Shift: 16,
        Tab: 9,
        Escape: 27,
        LeftArrow: 37
    };

    _.each(Keys, function (i, v) {

        Keys['is' + i] = (function (compare) {
            return function (e) {
                return (e.keyCode || e.which) === compare;

            };
        })(v);

    });


    /*!
     Extending JQuery, these are plugins
     */
    (function () {
        var oldClean = $.cleanData;

        $.cleanData = function (elems) {
            //console.log('Cleaning...');
            for (var i = 0, elem;
                 (elem = elems[i]) !== undefined; i++) {
                $(elem).trigger("destroyed");
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
            var image_container = $(this),
                containerContent = image_container.html();
            image_container.empty().fadeIn('slow').addClass('image_loading');
            var img = new Image();
            $(img).load(
                function () {
                    $(this).css('display', 'none');
                    image_container.removeClass('image_loading').empty().append(this);
                    $(this).fadeIn('slow', function () {
                        cb && _.isFunction(cb) && cb();
                    });
                }).error(
                function () {
                    //console.log('Error dey oo');
                    image_container.removeClass('image_loading').empty().append(containerContent);
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
            $(this).find('[type=file], [type=text], [type=password], [type=hidden], select, textarea, .slick-select')
                .each(function () {
                    var input = $(this);
                    if (!input.is('.slick-select')) {
                        input.val('');
                        if (input.is('[data-validation]')) {
                            removeTip && removeTip(input);
                            input.change && input.change();
                        }
                    } else {
                        input.find("li[data-value='']").click();
                    }

                });
        })
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
    $.fn.slickIntegral = function () {
        return this.each(function () {
            var dis = $(this),
            //_name = dis.data('name'),
                _min_value = parseInt(dis.data('min-value') || '0');

            //dis.html("<div class='operators'><a href='#' class='minus' title='Reduce value'><i class='icon-minus'></i></a><a  href='#' class='plus' title='Increase value'><i class='icon-plus'></i></a></div><input type='text' class='numeral " + _name + "' name='" + _name + "' value='" + _value + "' />");
            var numeral = dis.find('.numeral'),
                plus = dis.find('.plus'),
                minus = dis.find('.minus'),
                val = numeral.val();
            if (parseInt(val) < _min_value) {
                numeral.val(_min_value);
            }

            numeral.off().on('keyup', function (e) {
                var val = $(this).val();
                if (!_.isInteger(val)) {
                    numeral.css('border', '1px solid red!important');
                    numeral.focus().click();
                } else {
                    var val = parseInt(val);
                    if (val < _min_value) {
                        numeral.val(_min_value);
                    }
                    numeral.css('border', '1px solid #ccc!important').change();

                }
            });
            minus.off().on('click', function (e) {
                e.preventDefault();
                var val = parseInt(numeral.val() || '0') - 1;
                if (val < _min_value) {
                    val = _min_value;
                }
                numeral.val(val).change();
            });
            plus.off().on('click', function (e) {
                e.preventDefault();
                var val = parseInt(numeral.val()) + 1;
                numeral.val(val).change();
            });

        });
    };

    $.fn.hideIf = function (load) {

        //console.log('Load: ',load);

        return this.each(function () {

            var dis = $(this),
                condition = dis.attr('data-hideif').split(':');
            if (condition.length < 3) dis.remove();

            var key = condition[0].trim(),
                opCode = condition[1].trim(),
                value = condition[2].trim(),
                result = false;

            //console.log('If: ',key, opCode, value);

            switch (opCode) {
                case '!!':
                    result = (load[key]);
                    break;
                case '=':
                    result = (load[key] == value);
                    break;
                case '!=':
                    result = (load[key] != value);
                    break;
                case '>':
                    result = (Number(load[key]) > Number(value));
                    break;
                case '>=':
                    result = (Number(load[key]) >= Number(value));
                    break;
                case '<':
                    result = (Number(load[key]) < Number(value));
                    break;
                case '<=':
                    result = (Number(load[key]) <= Number(value));
                    break;
            }

            //console.log('Result: ',result);
            result && dis.remove();

        });
    };


    $('.data-connecting').hide();

    /*!
     Session Management
     */

    if (typeof  root.sessionStorage !== 'undefined') {

        sessionStorage.clear();

        root.Session = (function () {
            if (!sessionStorage['heap']) {
                sessionStorage.setItem('heap', JSON.stringify({}));
            }

            var changeListener = [];
            return {
                set: function (k, v) {
                    var heap = JSON.parse(sessionStorage.getItem('heap'));
                    heap[k] = v;
                    sessionStorage.setItem('heap', JSON.stringify(heap));
                },
                unset: function (k) {

                    var heap = JSON.parse(sessionStorage.getItem('heap'));
                    delete heap[k];
                    sessionStorage.setItem('heap', JSON.stringify(heap));
                },
                get: function (k) {
                    var heap = JSON.parse(sessionStorage.getItem('heap'));
                    return heap[k];
                },
                reset: function (appName) {
                    sessionStorage.setItem('heap', JSON.stringify({}));
                    this.appName(appName);
                },
                user: function (options) {
                    if (options) {
                        var me = JSON.parse(sessionStorage.getItem('_u53r_'));
                        _.xtend(me, options);

                        sessionStorage.setItem('_u53r_', JSON.stringify(me));

                        _.each(changeListener, function () {
                            this();
                        });

                    } else {
                        return JSON.parse(sessionStorage.getItem('_u53r_'));
                    }

                },
                appName: function (_appName) {
                    if (_appName) {
                        sessionStorage.setItem('_@ppN@m3_', _appName);
                    } else {
                        return sessionStorage.getItem('_@ppN@m3_');
                    }
                },
                faker: function (_faker) {
                    if (_faker) {
                        sessionStorage.setItem('_f@k3r_', JSON.stringify(_faker));

                    } else {
                        return JSON.parse(sessionStorage.getItem('_f@k3r_'));

                    }
                },
                unsetFaker: function () {

                    sessionStorage.removeItem('_f@k3r_');
                },
                isAuthenticated: function () {

                    return (this.user() && this.user().domain) && (this.user().domain === this.appName());

                },
                cans: function () {
                    var Robaac = this.user() ? _.robaac(this.user().roles) : null;
                    return Robaac && Robaac.cans(this.user().role);
                },
                has: function (action) {
                    var Robaac = this.user() ? _.robaac(this.user().roles) : null;
                    return Robaac && Robaac.has(this.user().role, action);
                },
                can: function (action, param) {

                    var Robaac = this.user() ? _.robaac(this.user().roles) : null;
                    return Robaac && ( param ? Robaac.can(this.user().role, action, param) : Robaac.has(this.user().role, action));
                },
                enforcePermissions: function (context, $el) {

                    var permits = [],
                        _data = context.model ? context.model.toObject() : {},
                        role = this.user() ? this.user().role : null,
                        roles = this.user() ? this.user().roles : null,
                        Robaac = roles ? _.robaac(roles) : null;


                    if (Robaac && roles && role) {
                        _.each(roles[role].can, function (i, operation) {

                            operation = _.isString(operation) ? operation : operation.name;

                            Robaac.can(role, operation, _data, function (r) {

                                r && permits.push('.rbk-' + operation);
                            });
                        });

                        //console.log('Permits: ', permits.join(','));

                        $el.find('[class*=rbk-]').not(permits.join(',')).remove();
                    }


                },
                inRole: function (role) {
                    return (this.user() && (this.user().role === role)) ? true : false;
                },

                login: function (user, _appName) {

                    this.appName(_appName);

                    user.domain = _appName;

                    sessionStorage.setItem('_u53r_', JSON.stringify(user));

                    this.unsetFaker();

                    this.begin();
                },
                begin: function () {

                    var wait = 10,
                        self = this,
                        timer,
                        get_out = function () {

                            clearTimeout(timer);
                            self.logout();
                            //Router.dispatch('#/logout');
                        },
                        resetTimer = function (e) {
                            clearTimeout(timer);
                            timer = setTimeout(get_out, 60000 * wait);
                        };
                    root.document.onkeypress = resetTimer;
                    root.document.onmousemove = resetTimer;
                },
                onChange: function (cb) {
                    changeListener.push(cb);
                },
                logout: function (cb) {
                    var appName = sessionStorage.getItem('_@ppN@m3_');

                    sessionStorage.clear();
                    this.reset(appName);

                    if (cb) {
                        cb()
                    } else {
                        Router.dispatch('#/');
                        location.hash = '#/';
                    }

                }
            };
        })();

        $(root).on('hashchange', function () {
            $(this).scrollTop(0);
        });
    }


    /*!
     Slick Object
     */
    var Slicks = {
        cleanUps: {},
        cometListeners: {},
        onCometsNotify: function (listener) {

            Slicks.cometListeners[listener.listenerID] = listener;
        },
        stopCometsOn: function (listener) {

            delete Slicks.cometListeners[listener.listenerID];
        },
        onComets: function (comets) {

            _.each(Slicks.cometListeners, function (k, v) {

                v.onComets.call(v, comets);

            });

        },
        sync: function (url, method, data, cb) {

            $.ajax({
                type: method,
                contentType: 'application/x-www-form-urlencoded',
                beforeSend: function (xhr) {
                    $('.data-connecting').show();
                    Session && Session.isAuthenticated() && xhr.setRequestHeader('x-csrf-token', Session.user().token || '');
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
        cypher: (function () {

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
                encrypt: function (clear, key) {

                    return btoa(encode(clear));
                },
                decrypt: function (sealed, key) {

                    return encode(atob(sealed));

                }
            };
        }())
    };


    /*!
     Extending Slicks sync when IO is available.
     */
    if (io) {
        var socket = io.connect();

        socket.on('connect', function () {
            console.log('Connected to server...');

            Slicks.sync = function (url, method, data, cb) {

                //console.log('URL:',url, ' DATA:', data, ' MTD:',method);

                Session.isAuthenticated() && _.xtend(data, {'x-csrf-token': Session.user().token});

                socket.emit(method, {path: url, data: data}, cb);

            };


        });

        socket.on('disconnect', function () {
            console.log('Dis-connected from server...');
        });

        socket.on('comets', Slicks.onComets);


    } else {
        console.log("Include socket.io on your page to use Socket IO");
    }


    var prepSyncing = function (method, model, cb) {


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

            //console.log("url:%s, mtd:%s, data:%s", url, method, data);

            this.sync(url, method, data, function (mdl) {
                //console.log(mdl);
                if (_.happy(mdl)) {

                    cb && cb(false, mdl);
                } else {
                    var message = mdl.error;
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
                mdl = Model((url || this.url), attr);
            mdl.query = attr;

            return {
                model: mdl,
                callback: cb
            };
        };

    var Router = (function (/*routes*/) {

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
                //console.log("1 Passed: "  + passed_route);
                if (passed_route.indexOf('%') === -1) {
                    passed_route = passed_route.replace(/#\//g, '');
                    var path = passed_route.substr(0, passed_route.indexOf('/') + 1),
                        rem = passed_route.substr(path.length);
                    passed_route = '#/' + path + encodeURIComponent(rem);
                }

                //console.log("2 Passed: "  + passed_route);
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
                            q = Slicks.cypher.decrypt(q, Session.appName());
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

    }());

    var fireEvents = function (evt, data) {

        var cntx = null,
            events = this;

        if (events[evt]) {
            if (data) {
                _.each(events[evt], function () {
                    cntx = this['context'];
                    this.call(cntx, data);
                });

            } else {
                _.each(events[evt], function () {
                    cntx = this['context'];
                    this.call(cntx);
                });

            }

        }

    };

    var Model = function (url, attribs) {

        if (typeof url !== 'undefined' && !_.isString(url)) {
            attribs = url;
            url = "";
        }


        var modelEvents = {},
            dirty_attributes = {},
            attributes = attribs || {},
            modelProto = {
                extend: function (options) {

                    if (options) {
                        _.xtend(this, options);
                    }
                    return this;
                },
                has: function (attr) {
                    return attributes.hasOwnProperty(attr);
                },
                onComets: function (comet) {
                    var self = this,
                        model_name = this.url.replace(/\//g, '');
                    if (comet.room !== model_name) {
                        return;
                    }
                    switch (comet.verb) {

                        case 'update':
                            if (comet.data.id && self.model.get('id') == comet.data.id) {

                                delete comet.data.id;
                                self.model.set(comet.data).fire('change');

                            }

                            break;

                    }
                },
                params: function (param) {

                    var enc = Slicks.cypher.encrypt(JSON.stringify(param || attributes), Session.appName());
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
                    if (key && value !== undefined) {
                        attributes[key] = value;
                        dirty_attributes[key] = value;
                    } else if (_.isObject(key)) {
                        _.xtend(attributes, key);
                        _.xtend(dirty_attributes, key);
                    }

                    return this;
                },
                change: function (k, v) {
                    if (k && v) {

                        this.set(k, v).fire('change');

                    } else if (_.isObject(k)) {
                        this.set(k).fire('change');
                    }

                    return this;
                },
                unset: function (attr) {
                    delete attributes[attr];
                    return this;
                },
                fire: function (event) {
                    fireEvents.call(modelEvents, event, this);
                    return this;
                },
                login: function (cb) {
                    var mdl = Model(this.url + '/login', attributes);
                    prepSyncing.call(mdl, 'post', mdl, cb);
                },
                unlink: function (params, cb) {
                    var mdl = Model(this.url + '/unlink', params);
                    prepSyncing.call(mdl, 'post', mdl, cb);
                    return this;
                },
                spinx: function (params, cb) {
                    var mdl = Model(this.url + '/spinx', params);
                    prepSyncing.call(mdl, 'post', mdl, cb);
                    return this;
                },
                fetch: function (url, params, cb) {
                    var fnbody = resolveCall.apply(this, arguments);
                    //prepSyncing.call(fnbody.model, 'get', fnbody.model, fnbody.callback);
                    prepSyncing.call(this, 'get', fnbody.model, fnbody.callback);
                    return this;
                },
                post: function (url, params, cb) {
                    var fnbody = resolveCall.apply(this, arguments);
                    //prepSyncing.call(fnbody.model, 'post', fnbody.model, fnbody.callback);
                    prepSyncing.call(this, 'post', fnbody.model, fnbody.callback);
                    return this;
                },
                save: function (cb) {
                    //var method = attributes.id ? 'put' : 'post',
                    var method = this.getInt('id') ? 'put' : 'post',
                        self = this;

                    prepSyncing.call(this, method, this, function (e, mdl) {
                        if (!e) {
                            if (method === 'put') {
                                for (var attr in mdl) {
                                    attributes[attr] = mdl[attr];
                                }
                                for (var key in dirty_attributes) {
                                    fireEvents.call(modelEvents, key + ':change');
                                }

                                fireEvents.call(modelEvents, 'change', self);
                                dirty_attributes = {};

                                if (cb && _.isFunction(cb)) {
                                    cb(_.makeName(self.model_name) + ' was successfully updated.', 'success');
                                } else {
                                    $.notify(_.makeName(self.model_name) + ' was successfully updated.', 'success');
                                }


                            } else if (method === 'post') {
                                attributes = mdl;
                                self.isNew = true;
                                fireEvents.call(modelEvents, 'created', self);
                                if (cb && _.isFunction(cb)) {

                                    cb(_.makeName(self.model_name) + ' was successfully created.', 'success');

                                } else {
                                    $.notify(_.makeName(self.model_name) + ' was successfully created.', 'success');
                                }
                            }
                        } else {
                            $.notify(e, 'error');
                            cb(e, 'error');
                        }

                    });

                    return this;
                },
                destroy: function (cb) {
                    var self = this;
                    if (!this.getInt('id')) {
                        this.fire('destroy');
                        cb && cb(_.makeName(self.model_name) + ' was successfully deleted.', 'success');
                        return;
                    }
                    prepSyncing.call(this, 'delete', this, function (e, mdl) {
                        if (!e) {
                            var deleted = parseInt(mdl.affectedRows);
                            if (deleted) {
                                fireEvents.call(modelEvents, 'destroy', self);
                                //cb && _.isFunction(cb) && cb();
                                if (cb && _.isFunction(cb)) {
                                    cb(_.makeName(self.model_name) + ' was successfully deleted.', 'success');
                                } else {
                                    $.notify(_.makeName(self.model_name) + ' was successfully deleted.', 'success');
                                }


                            }
                        } else {
                            $.notify(e, 'error');
                            cb(e, 'error');
                        }
                    });
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
                    //    attributes = {};
                    //for (var k in attributes) delete attributes[k];
                    _.each(attributes, function (k, v) {
                        delete attributes[k];
                    });

                    fireEvents.call(modelEvents, 'change', this);
                    return this;
                },
                on: function (event, handler, context) {

                    if (event && event.indexOf(',') != -1) {
                        var evts = event.split(',');
                        _.each(evts, function (i, evt) {
                            _.attachEvent.call(modelEvents, $.trim(evt), handler, context);
                        });

                    } else {
                        _.attachEvent.call(modelEvents, $.trim(event), handler, context);
                    }

                },
                off: function (event) {
                    if (event) {
                        if (event.indexOf(',') != -1) {
                            var evts = event.split(',');

                            _.each(evts, function (i, evt) {
                                _.detachEvent.call(modelEvents, (evt).trim());
                            });
                        } else {
                            _.detachEvent.call(modelEvents, event.trim());
                        }
                    } else {
                        modelEvents = {};
                    }

                    return this;
                },
                sync: Slicks.sync
            };


        return _.inherits(modelProto, {
            url: url
        }, 'model');

    };

    var Collection = function (url) {
        var collectionEvents = {},
            changeEventListeners = [],
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
                        fireEvents.call(collectionEvents, 'add', mdl);
                        //fireEvents('add', mdl);
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
                        //fireEvents('remove', mdl);
                        fireEvents.call(collectionEvents, 'remove', mdl);
                        collectionChanged.call(_koll, 'remove');
                    }
                },
                populate: function (_koll, mdls, _url, _transport) {
                    this.list.splice(0, this.list.length);
                    //    this.map = {};
                    for (var k in this.map) delete this.map[k];
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

                    //fireEvents('reset');
                    fireEvents.call(collectionEvents, 'reset');
                    collectionChanged.call(_koll, 'reset');
                },
                reset: function (_koll) {
                    this.list.splice(0, this.list.length);
                    //    this.map = {};
                    for (var k in this.map) delete this.map[k];

                    _koll.length = this.list.length;
                    //fireEvents('reset');
                    fireEvents.call(collectionEvents, 'reset');
                    collectionChanged.call(_koll, 'reset'); //added
                }
            },
            model_changed = function (mdl) {
                fireEvents.call(collectionEvents, 'change');
            },
            push = function (mdl) {
                models.add(this, mdl);
            },
            collectionChanged = function (type) {

                for (var i = 0; i < changeEventListeners.length; ++i) {
                    changeEventListeners[i] && changeEventListeners[i]['notifyChange'].call(changeEventListeners[i], this, type);
                }
            },
            collectionProto = {
                extend: function (options) {
                    if (options) {
                        _.xtend(this, options);
                    }
                    return this;
                },
                notify: function (listener) {
                    changeEventListeners.push(listener);
                },
                onComets: function (comet) {
                    var self = this,
                        model_name = self.url.replace(/\//g, '');
                    if (comet.room !== model_name) {
                        return;
                    }
                    switch (comet.verb) {
                        case 'create':
                            self.add(comet.data);
                            break;
                        case 'update':
                            if (comet.data.id) {

                                var m = self.get(comet.data.id);
                                delete comet.data.id;

                                m && m.set(comet.data).fire('change');

                            }

                            break;
                        case 'destroy':
                            var tobe_removed = self.get(comet.data.id);
                            tobe_removed && tobe_removed.fire('destroy');
                            break;
                    }
                },
                fetch: function (q) {
                    var self = this,
                        load = {};
                    if (q) {
                        load['query'] = q || {};
                    }

                    _.xtend(load, {
                        url: this.url
                    });
                    prepSyncing.call(this, 'get', load, function (e, mdls) {
                        if (!e) {
                            mdls = !Array.isArray(mdls) ? [mdls] : mdls;
                            models.populate(self, mdls, self.url);
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
                        mdl = Model(this.url, mdl);
                    }
                    push.call(this, mdl);
                    return this;

                },
                remove: function (mdl) {
                    models.remove(this, mdl.get('id'));
                },
                create: function (mdl, cb) {

                    if (!mdl.toObject) {
                        mdl = Model(this.url, mdl);
                    }
                    mdl.on('created', this.add, this);
                    mdl.save(cb);
                    return this;
                },
                each: function (cb) {
                    _.each(models.list, function (i, model) {
                        this && cb && cb(model);
                    });
                },
                on: function (event, handler, context) {

                    if (event && event.indexOf(',') != -1) {
                        var evts = event.split(',');

                        _.each(evts, function (i, evt) {
                            _.attachEvent.call(collectionEvents, $.trim(evt), handler, context);
                        });
                    } else {
                        _.attachEvent.call(collectionEvents, event.trim(), handler, context);
                    }

                    return this;
                },
                off: function (event) {
                    if (event) {
                        if (event.indexOf(',') != -1) {
                            var evts = event.split(',');

                            _.each(evts, function (i, evt) {
                                _.detachEvent.call(collectionEvents, (evt).trim());
                            });
                        } else {
                            _.detachEvent.call(collectionEvents, event.trim());
                        }
                    } else {
                        collectionEvents = {};
                    }

                    return this;
                },
                sync: Slicks.sync,
                emptyModel: function (attr) {
                    var mdl = Model(this.url, attr || {});
                    mdl.on('created', this.add, this);
                    return mdl;
                },
                fire: function (event) {
                    fireEvents.call(collectionEvents, event);
                    return this;
                },
                get: function (id) {
                    return models.get(id);
                },
                asArray: function () {
                    return models.list;
                },
                toJSON: function () {

                    return _.map(models.list, function (i, model) {
                        return model.toJSON();
                    });
                },
                populate: function (mdls, url) {
                    models.populate(this, mdls, url);
                }
            };

        return _.inherits(collectionProto, {
            url: url
        }, 'collection');

    };

    var View = function (options) {

        var bindViewEvents = function () {
                var self = this;
                for (var k in self.events) {
                    var handler = self.events[k];
                    var triggers = k.split(',');
                    _.each(triggers, function () {
                        var trigger = this,
                            event_targets = trigger && trigger.split(':');
                        var evt = event_targets[0];
                        var dom = event_targets[1];
                        evt = evt && $.trim(evt);
                        dom = dom && $.trim(dom);
                        self.$el.find(dom).unbind();
                        self.$el.find(dom).length && self[handler] && self.$el.on(evt, dom, $.proxy(self, handler));

                    });

                }
            },
            applySteps = function () {


                this.afterRender();
                bindViewEvents.call(this);
                this.afterEvents();

                if (this.isReactive) {

                    this.listenerID = _.uid();

                    Slicks.onCometsNotify(this);

                    console.log('Binding on: ', this.host);

                    Slicks.cleanUps[this.host] = (function (context) {

                        return function () {
                            console.log('stopCometsOn called...');
                            Slicks.stopCometsOn(context);
                        }

                    })(this);
                }


            },
            removeTip = function (input) {
                var attached_tip = input.data('tip');
                (attached_tip && attached_tip.remove());
            },
            error_text = function (input, error_type, extra) {
                var message = null,
                    input_name = input.attr('name') || 'field';
                var input_name = _.makeName(input_name);


                switch (error_type.toLowerCase()) {
                    case 'required':
                        message = input_name + ' is mandatory.';
                        break;
                    case 'match':
                        message = input_name + ' does not match ' + _.makeName(extra);
                        break;
                    case 'captcha':
                        message = input_name + ' does not match the image.';
                        break;
                    case 'email':
                        message = input_name + ' should be a valid email.';
                        break;
                    case 'integer':
                        message = input_name + ' must be an integer.';
                        break;
                    case 'number':
                        message = input_name + ' should be a number.';
                        break;
                    case 'min-length':
                        message = input_name + ' must be at least ' + extra + ' characters long.';
                        break;
                    case 'length':
                        message = input_name + ' must be exactly ' + extra + ' characters long.';
                        break;
                    default:
                        message = error_type;
                }
                console.log(message);
                return message;
            },
            tip = function ($ctx, input, error_type, extra) {

                var input_id = input.attr('name'),
                    host = $ctx.find('.input-group.' + input_id),
                    ttip = $('<div class="error"/>').hide();

                if (host) {
                    removeTip(input);
                    host.prepend(ttip);

                    input.data('tip', ttip);
                    ttip.text(error_text(input, error_type, extra)).fadeIn('slow');
                } else {
                    $.notify(error_text(input, error_type, extra), 'error');
                }

            },
            viewProto = {
                host: '#content',
                isReactive: false,
                model: null,
                collection: null,
                template: '@',
                lazy: false,
                addCaptcha: false,
                empty_before_render: true,
                hooks: {},
                reCaptcha: function () {
                    var self = this;
                    this.model.spinx({}, function (e, cap) {
                        if (!e) {
                            self.captcha = cap;
                            var Captcha = Slicks.View({
                                host: self.$el.find('.input-group.captcha'),
                                template: 'core/SlicksCaptcha',
                                events: {
                                    'click:.re-cha': 'reCha'
                                },
                                reCha: function (e) {
                                    self.reCaptcha();
                                },
                                model: Slicks.Model('', {captcha: cap.data}),
                                afterRender: function () {
                                    this.$host.showMe();
                                }
                            });
                            Captcha.render();
                        }
                    });
                },
                render: function () {

                    //console.log('Cleaning on: ', this.host);
                    this.isReactive && Slicks.cleanUps[this.host] && Slicks.cleanUps[this.host]();


                    this.beforeRender();

                    this.$host = $(this.host);


                    _.template.call(this, function (str) {
                        if (str) {

                            if (this.empty_before_render) {

                                this.$host.off().children().trigger('destroyed').remove();
                                this.$host.empty();
                            }

                            //this.$el = $(str);
                            //this.$el.find('[data-showif]').remove();
                            //this.$el.appendTo(this.$host);
                            //console.log(str);

                            this.$el = $(str).appendTo(this.$host);


                        }
                        (this.class && this.$el.attr('class', this['class']));
                        (this.id && this.$el.attr('id', this.id));

                        applySteps.call(this);
                    });


                },
                onComets: function (comet) {

                    //console.log('VComets: ', comet);
                    this.model && this.model.onComets(comet);
                    this.collection && this.collection.onComets(comet);
                },
                beforeRender: function () {
                    //this.model && this.model.on('change', this.update, this);
                    //console.log("ModelAndCollectionEvents...");
                },
                afterEvents: function () {

                },
                afterRender: function () {


                    this.$el.find('[data-image]').each(function (i) {
                        var _self = $(this),
                            _src = _self.data('image');
                        _self.loadImage(_src);
                    });

                    //console.log('Base afterRender');

                    this.addCaptcha && !Session.isAuthenticated() && this.reCaptcha();

                    var afterRenderHook = this.hooks['afterRender'];
                    afterRenderHook && afterRenderHook.call(this);


                },
                beforeDestroy: function () {


                    this.isReactive && Slicks.stopCometsOn(this);


                },
                events: {},
                update: function (mdl) {

                    _.template.call(this, function (str) {

                        str && this.$el.off().html($(str).html());
                        (this.class && this.$el.attr('class', this.class));
                        (this.id && this.$el.attr('id', this.id));

                        applySteps.call(this);

                    }, mdl);
                },
                closing: function (e) {
                    e && e.preventDefault();

                    if (this.dialog) {
                        this.dialog.close.call(this.dialog, e);
                    } else {
                        this.close(e);
                    }
                },
                close: function () {

                    this.beforeDestroy();
                    this.$el.off().fadeOut('fast');
                },
                remove: function (cb) {

                    this.beforeDestroy();
                    this.$el.off().fadeOut('fast', function () {
                        cb && _.isFunction(cb) && cb();
                    }).remove();
                },
                hide: function (how) {
                    this.$el[how ? how : 'fadeOut']('slow');
                },
                show: function (how) {
                    this.$el[how ? how : 'fadeIn']('slow');
                },
                dispatch: function (path) {
                    Router.dispatch(path);
                    location.hash = path;
                },
                goBack: function (cb) {
                    root.history.back();
                    cb && cb();
                },
                //Remove from here
                reset: function () {

                    this.$el.clear(removeTip);
                },
                validate: function (sel) {
                    var regexes = {
                            number: /^[-+]?[0-9]+(\.[0-9]+)?$/g,
                            integer: /^[-+]?\d+$/g,
                            email: /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}$/ig
                        },
                        has_error = false;

                    var self = this,
                        $sel = sel ? $(sel) : this.$el;
                    $sel.find('[data-validation]').each(function () {
                        var input = $(this),
                            input_value = input.val().trim(),
                            input_name = input.attr('name') || 'field',
                            input_name = _.makeName(input_name),
                            validations = input.data('validation'),
                            validations = validations.split('|');

                        for (var i = 0; i < validations.length; ++i) {


                            var validation = validations[i],
                                type_details = validation.split(':'),
                                value = type_details[0].trim();

                            var error_found = false;
                            removeTip(input);
                            switch (value.toLowerCase()) {
                                case 'required':
                                    if (input_value === '') {
                                        tip($sel, input, 'required');
                                        has_error = error_found = true;
                                    }
                                    break;
                                case 'captcha':
                                    if (input_value !== self.captcha.text) {
                                        tip($sel, input, 'captcha');
                                        has_error = error_found = true;
                                    }
                                    break;

                                case 'match':
                                    if (type_details.length < 2) {
                                        $.notify(input_name + ': match validation requires party target', 'error');
                                    }

                                    var $party = self.$el.find('#' + type_details[1].trim());

                                    if (input_value !== $party.val()) {
                                        tip($sel, input, 'match', type_details[1].trim());
                                        has_error = error_found = true;
                                    }
                                    break;
                                case 'email':
                                    if (!input_value.match(regexes['email'])) {
                                        tip($sel, input, 'email');
                                        has_error = error_found = true;
                                    }
                                    break;
                                case 'integer':
                                    if (!input_value.match(regexes['integer'])) {
                                        tip($sel, input, 'integer');
                                        has_error = error_found = true;
                                    }
                                    break;
                                case 'number':
                                    if (!input_value.match(regexes['number'])) {
                                        tip($sel, input, 'number');
                                        has_error = error_found = true;
                                    }
                                    break;
                                case 'min-length':
                                    if (type_details.length < 2) {
                                        $.notify(input_name + ': min-length validation requires width', 'error');
                                    }

                                    if (input_value.length < parseInt(type_details[1])) {
                                        tip($sel, input, 'min-length', type_details[1]);
                                        has_error = error_found = true;
                                    }
                                    break;
                                case 'length':
                                    if (type_details.length < 2) {
                                        $.notify(input_name + ': length validation requires width', 'error');
                                    }

                                    if (input_value.length !== parseInt(type_details[1])) {
                                        tip($sel, input, 'length', type_details[1]);
                                        has_error = error_found = true;
                                    }
                                    break;
                            }
                            if (error_found) {
                                break;
                            }

                        }//end

                    });
                    return !has_error;
                },
                notify: function (inputName, msg) {
                    tip(this.$el, this.$el.find("[name=" + inputName + "]"), msg);
                },
                unNotify: function (inputName) {
                    removeTip(this.$el.find("[name=" + inputName + "]"));
                },
                data: function (sel) {
                    return $.mapob(sel ? this.$el.find(sel) : this.$el);
                },
                populateSelect: function (_$el, _preloads) {

                    var self = this,
                        $el = _$el || this.$el,
                        preloads = _preloads || this.preloads;
                    preloads && _.each(preloads, function () {
                        var select = this,
                            mdl = null,
                            $slick_select = $el.find('.slick-select.' + select['name']),
                            $selectIcon = $slick_select.find('[class*=icon-]'),
                            $selectText = $slick_select.find('.shown-' + select['name']),
                            $selectHidden = $slick_select.find('.hidden-' + select['name']),
                            $select = $slick_select.find('ul'),
                            $item = null,
                            $selectCue = $selectText.html(),
                            $Unselected = "@<li data-value=''>" + $selectCue + "</li>",
                            applyUpdates = function (text, value, graph) {
                                $selectHidden.val(value);
                                $selectText.html(text);
                                self.model && self.model.set(select.name, value);
                                if (select.onchange) {
                                    select.onchange.call(self, text, value, graph);
                                }
                            },
                            addEvents = function () {

                                var selectClicked = function () {


                                    var pos = $slick_select.position(),
                                        offset = $slick_select.offset(),

                                        selectInputHeight = $slick_select.outerHeight(),

                                        windowTop = $(window).scrollTop(),
                                        windowHeight = windowTop + $(window).height(),

                                        refHeight = $select.outerHeight() + offset.top;

                                    if (refHeight + selectInputHeight >= windowHeight) {

                                        //console.log('flipping...');
                                        var newTop = (pos.top - $select.outerHeight() - selectInputHeight + 18);
                                        //if(newTop < windowTop) newTop = windowTop;
                                        $select.css("top", newTop + 'px');

                                    } else {
                                        //console.log('normalizing...');
                                        $select.css("top", "100%");
                                    }


                                    //add here.
                                    $select.show(function () {

                                        $(document).keydown(function (e) {

                                            $select.scrollTop(0);

                                            var c = String.fromCharCode(e.which);
                                            var matches = $select.find('li').filter(function () {
                                                return $(this).text().startsWithi(c);
                                            });
                                            if (matches.size()) {
                                                var first = matches.get(0);
                                                var pos = $(first).position();
                                                $select.scrollTop(pos.top);
                                            }


                                        });


                                        $slick_select.hover(function () {

                                        }, function () {
                                            $slick_select.off('hover');
                                            $select.scrollTop(0).hide();
                                            $(document).unbind('keydown');
                                        });

                                    });

                                };
                                $selectText.on('click', selectClicked);

                                $selectIcon.on('click', selectClicked);
                                //
                                //$select.find('li').on('click', function (e) {
                                //        var $itm = $(this);
                                //        applyUpdates($itm.html(), $itm.data('value'));
                                //        $select.scrollTop(0).hide();
                                //    }
                                //);
                                updateNow();


                            },
                            updateNow = function () {
                                if (self.model) {

                                    var val = self.model.get(select.name);
                                    //var text = $select.find("li[data-value='" + val + "']").html();
                                    $select.find("li[data-value='" + val + "']").click();
                                    //if (!text) {
                                    //    text = $selectCue;
                                    //}
                                    //applyUpdates(text, val);

                                }
                            },
                            renderItems = function (sels) {

                                var mdl = Model('');
                                //$select.append($($Unselected));


                                var v = View({
                                    empty_before_render: false,
                                    host: $select,
                                    model: mdl,
                                    template: $Unselected,
                                    afterRender: function () {
                                        var dis = this;
                                        this.$el.on('click', function (e) {

                                            applyUpdates(dis.$el.html(), dis.$el.data('value'), dis.model.toObject());
                                            $select.scrollTop(0).hide();
                                        });
                                    }
                                });
                                v.render();


                                _.each(sels, function () {

                                    mdl = Model('', this);

                                    var v = View({
                                        empty_before_render: false,
                                        host: $select,
                                        model: mdl,
                                        template: select.item_template,
                                        afterRender: function () {
                                            var dis = this;
                                            this.$el.on('click', function (e) {
                                                applyUpdates(dis.$el.html(), dis.$el.data('value'), dis.model.toObject());
                                                $select.scrollTop(0).hide();
                                            });
                                        }
                                    });
                                    v.render();

                                    //_.template.call(self, function (str) {
                                    //    //                                                console.log(str);
                                    //    $select.append($(str));
                                    //}, mdl, select.item_template);

                                });


                            };


                        if (select.fetch) {


                            var attr = select.args || {},
                                mdl = Model(select.fetch, attr);
                            mdl.query = attr;
                            prepSyncing.call(mdl, 'get', mdl, function (e, sels) {
                                if (!e) {
                                    (!select.append && $select.empty());

                                    renderItems(sels);

                                    addEvents();

                                    if (select.cascaded) {

                                        select.onchange = function () {

                                            var val = $(this).val(),
                                                _arg = select.cascaded.args || {};
                                            _arg[select.cascaded['join_on']] = val;
                                            select.cascaded.args = _arg;
                                            self.populateSelect(false, [select.cascaded]);
                                        }

                                    }

                                }

                            });


                        } else {

                            if (select.data) {
                                (!select.append && $select.empty());

                                renderItems(select.data);
                                addEvents();

                            } else {

                                addEvents();
                            }


                        }


                    });
                },
                generatePrintContent: function ($element, cb) {
                    cb && cb();
                },
                print: function (options) {

                    var self = this,
                        printDocument = null,
                        printWindow = null,
                        $element = this.$host.clone(),
                        print_options = {},
                        triggerPrint = function () {

                            if (printWindow && printWindow.printMe)
                                printWindow.printMe();
                            else
                                setTimeout(function () {
                                    triggerPrint(printWindow);
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
                        createPrintDialog = function () {

                            printMarkUp(function (html) {

                                printWindow = root.open('about:blank', 'SlicksPrinterWindow', 'width=700,height=500,scrollbars=yes,fullscreen=no,menubar=yes');
                                printDocument = printWindow.document;

                                printDocument.print_options = print_options;
                                printDocument.open();
                                printDocument.write(html);
                                printDocument.close();
                                triggerPrint();
                            });

                        },

                        def_print_options = {
                            print_title: '', //Print Page Title
                            row_template: false,
                            collection: null,
                            add_banner: false,
                            model: null
                        };
                    _.xtend(def_print_options, options || {});
                    print_options = def_print_options;


                    createPrintDialog();
                }
            };

        if (options.afterRender) {
            viewProto.hooks['afterRender'] = options.afterRender;
            delete options.afterRender;
        }

        return _.inherits(viewProto, options, 'view');

    };


    _.xtend(Slicks, {
        '$': $,
        'Model': Model,
        'Collection': Collection,
        'View': View,
        'Router': Router
    });
    Slicks._ = _;

    return Slicks;

}));