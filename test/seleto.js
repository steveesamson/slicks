// custom selector implementation
// nickname: seleto
;(function (root) {
    'use strict';

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) {
                    return i;
                }
            }
            return -1;
        };
    }
    if (!Array.prototype.unique) {
        Array.prototype.unique = function () {
            var a = [], l = this.length;
            for (var i = 0; i < l; i++) {
                for (var j = i + 1; j < l; j++)
                    if (this[i] === this[j]) j = ++i;
                a.push(this[i]);
            }
            return a;
        };
    }


    // useful native methods
    // ----------------------------------------------------
    var slice = Array.prototype.slice,
        fireEvent = function (evt) {
            var self = this;
            if (window.CustomEvent) {
                self.dispatchEvent(new CustomEvent(evt));
            } else if (document.createEvent) {
                var ev = document.createEvent('HTMLEvents');
                ev.initEvent(evt, true, false);
                self.dispatchEvent(ev);
            } else { // Internet Explorer
                self.fireEvent(evt);
            }
        },
        clean = function (str) {
            return str.replace(/\[\s*(\w+)\s*=\s*(\w+)\s*\]/g, "[$1=$2]").replace(/\[\s*(\w+(-?\w+)*)\s*\]/gi, "[$1]");
        },
        forEach = function (array, callback) {
            var i, length = array.length;
            for (i = 0; i < length; ++i) {
                callback.call(array[i], i, array[i]);
            }
        },
        /** Faster rounding function to avoid heavy use of Math.round  */
        round = function (n) {
            return (n + 0.5) << 0;
        },
        makeArray = function (array) {
            var ret = [];

            // Need to use typeof to fight Safari childNodes crashes
            if (typeof array != "array")
                for (var i = 0, length = array.length; i < length; i++)
                    ret.push(array[i]);
            else
                ret = array.slice(0);

            return ret;
        },
        elNameIs = function (name) {
            return this.nodeName && this.nodeName.toUpperCase() == name.toUpperCase();
        },
        hasClass = function (klass) {

            if (!this.setAttribute) {
                return false;
            }
            var attrs = this.getAttribute('class'),
                attrList = attrs ? attrs.split(" ") : [];

            attrList = map(attrList, function () {
                return this.trim();
            });

            return attrList.indexOf(klass.trim()) !== -1;
        },
        hasAttr = function (attr) {
            return !!this.getAttribute(attr);
        },
        isChecked = function () {
            return this.checked === true || this.checked;
        },
        hasAttrVal = function (attr, val) {
            return (this.getAttribute(attr) === val);
        },
        hasPseudo = function (key) {
            var self = this;
            switch (key) {
                case 'checked':
                    return isChecked.call(this);
                    break;
                default:
                    return hasAttrVal.call(self, 'type', key);
            }
        },
        isUndefined = function (o) {
            return o === undefined;
        },
        isAsserted = function (selector) {
            var self = this,
                matched = false;

            var resolved = resolveSelector(selector);
            if (resolved) {
                switch (resolved.Rex) {
                    case 'CLS':
                        var cls = resolved[1].slice(1, resolved[1].length);
                        matched = hasClass.call(self, cls);
                        break;
                    case 'EL':
                        var el = resolved[1];
                        matched = elNameIs.call(self, el);
                        break;
                    case 'ID':
                        var id = resolved[1].slice(1, resolved[1].length);
                        matched = hasAttrVal.call(self, 'id', id);
                        break;
                    case 'ATT':
                        matched = hasAttr.call(self, resolved[1]);
                        break;
                    case 'ATT_VAL':
                        matched = hasAttrVal.call(self, resolved[1], resolved[2]);
                        break;
                    case 'ATT_VAL_ATT_VAL':// /^\[\s?(\w+)\s?=\s?(\w+)\s?\]\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                        matched = hasAttrVal.call(self, resolved[1], resolved[2]);
                        matched = hasAttrVal.call(self, resolved[3], resolved[4]) && matched;
                        break;
                    case 'ATT_VAL_SD':// /^\[\s?(\w+)\s?=\s?(\w+)\s?\](:)(\w+)$/gi,
                        matched = hasAttrVal.call(self, resolved[1], resolved[2]);
                        matched = hasPseudo.call(self, resolved[4]) && matched;
                        break;
                    case 'SD':
                        matched = hasPseudo.call(self, resolved[2]);
                        break;
                    case 'EL_ATT': // /^(\w+)\[\s?(\w+(-?\w+)*)\s?\]$/gi
                        var el = resolved[1];
                        matched = elNameIs.call(self, el);
                        matched = hasAttr.call(self, resolved[2]) && matched;

                        break;
                    case 'ATT_SD':// /^\[\s?(\w+(-?\w+)*)\s?\](:)(\w+)$/gi,
                        matched = hasAttr.call(self, resolved[2]);
                        matched = hasPseudo.call(self, resolved[3]) && matched;
                        break;
                    case 'SD_SD':// /^(:)(\w+)(:)(\w+)$/gi,
                        matched = hasPseudo.call(self, resolved[2]);
                        matched = hasPseudo.call(self, resolved[4]) && matched;
                        break;
                    case 'SD_ATT':// /^(:)(\w+)\[\s?(\w+(-?\w+)*)\s?\]$/gi,
                        matched = hasPseudo.call(self, resolved[2]);
                        matched = hasAttr.call(self, resolved[3]) && matched;
                        break;
                    case 'SD_ATT_VAL':// /^(:)(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                        matched = hasPseudo.call(self, resolved[2]);
                        matched = hasAttrVal.call(self, resolved[3], resolved[4]) && matched;
                        break;
                    case 'EL_SD':// /^(\w+)(:)(\w+)$/gi,
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasPseudo.call(self, resolved[3]) && matched;
                        break;
                    case 'EL_SD_SD':// /^(\w+)(:)(\w+)(:)(\w+)$/gi,
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasPseudo.call(self, resolved[3]) && matched;
                        matched = hasPseudo.call(self, resolved[5]) && matched;
                        break;
                    case 'ID_CLS':// /^(#\w+)(\.\w+)$/gi,
                        var id = resolved[1].slice(1, resolved[1].length),
                            cls = resolved[2].slice(1, resolved[2].length);
                        matched = hasAttrVal.call(self, 'id', id);
                        matched = hasClass.call(self, cls) && matched;
                        break;
                    case 'EL_CLS':// /^(\w+)(\.\w+)$/gi,
                        var cls = resolved[2].slice(1, resolved[2].length);
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasClass.call(self, cls) && matched;
                        break;
                    case 'CLS_CLS':// /^(\.\w+)(\.\w+)$/gi,
                        var cls = resolved[1].slice(1, resolved[1].length),
                            cls1 = resolved[2].slice(1, resolved[2].length);
                        matched = hasClass.call(self, cls);
                        matched = hasClass.call(self, cls1) && matched;
                        break;
                    case 'EL_ATT_VAL':// /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasAttrVal.call(self, resolved[2], resolved[3]) && matched;
                        break;
                    case 'EL_ATT_VAL_ATT_VAL':// /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasAttrVal.call(self, resolved[2], resolved[3]) && matched;
                        matched = hasAttrVal.call(self, resolved[4], resolved[5]) && matched;
                        break;
                    case 'EL_ATT_SD': // /^(\w+)\[\s?(\w+(-?\w+)*)\s?\](:)(\w+)$/gi
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasAttr.call(self, resolved[2]) && matched;
                        matched = hasPseudo.call(self, resolved[5]) && matched;
                        break;
                    case 'EL_ATT_VAL_SD':// /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\](:)(\w+)$/gi,
                        matched = elNameIs.call(self, resolved[1]);
                        matched = hasAttrVal.call(self, resolved[2], resolved[3]) && matched;
                        matched = hasPseudo.call(self, resolved[5]) && matched;
                        break;
                    default:
                        throw Error("Unknown selector Key - '" + resolved.Rex + "'");
                }
            }
            return matched;

        },
        is = function (groupSelector) {
            var self = this,
                matched = true;
            groupSelector = map(clean(groupSelector).split(','), function () {
                return this.trim();
            });

            forEach(groupSelector, function () {
                //var selector = ;

                forEach(map(this.split(' '), function () {
                    return this.trim();
                }), function () {
                    matched = isAsserted.call(self, this) && matched;
                });
            });

            return matched;
        },
        isNodeCollection = function (o) {

            return (o instanceof HTMLCollection) || (isArray(o)) || (o instanceof NodeList);
        },
        map = function (array, cb) {
            var accepted = [];
            forEach(array, function (i) {

                var valid = cb && cb.call(this, i);
                if (valid) {
                    accepted.push(valid);
                }
            });
            return accepted;
        },
    // returns true if passed in object is a DOM element...
        isElement = function (o) {
            return (
                (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
                o && typeof o === "object" &&
                o.nodeType === 1 && typeof o.nodeName === "string")
            );
        },
        isString = function (s) {
            return typeof s === 'string';
        },
        isFunction = function (f) {
            return typeof f === 'function';
        },
        isArray = Array.isArray, //use native version here
        isMe = function (d) {
            return d instanceof seleto;
        },
        resolveSelector = function (selector) {
            var resolved,
                Rex = {
                    EL_ATT_VAL_ATT_VAL: /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                    ATT_VAL_ATT_VAL: /^\[\s?(\w+)\s?=\s?(\w+)\s?\]\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                    EL_ATT_VAL_SD: /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\](:)(\w+)$/gi,
                    EL_SD_SD: /^(\w+)(:)(\w+)(:)(\w+)$/gi,
                    ATT_VAL_SD: /^\[\s?(\w+)\s?=\s?(\w+)\s?\](:)(\w+)$/gi,
                    EL_ATT_VAL: /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                    EL_ATT_SD: /^(\w+)\[\s?(\w+(-?\w+)*)\s?\](:)(\w+)$/gi,
                    SD_ATT_VAL: /^(:)(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                    SD_ATT: /^(:)(\w+)\[\s?(\w+(-?\w+)*)\s?\]$/gi,
                    ID_CLS: /^(#\w+)(\.\w+)$/gi,
                    EL_CLS: /^(\w+)(\.\w+)$/gi,
                    EL_SD: /^(\w+)(:)(\w+)$/gi,
                    EL_ATT: /^(\w+)\[\s?(\w+(-?\w+)*)\s?\]$/gi,
                    CLS_CLS: /^(\.\w+)(\.\w+)$/gi,
                    ATT_VAL: /^\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                    ATT_SD: /^\[\s?(\w+(-?\w+)*)\s?\](:)(\w+)$/gi,
                    SD_SD: /^(:)(\w+)(:)(\w+)$/gi,
                    ID: /^(#\w+)$/gi,
                    CLS: /^(\.\w+)$/gi,
                    EL: /^(\w+)$/gi,
                    STR: /^(\*)$/gi,
                    SD: /^(:)(\w+)$/gi,
                    ATT: /^\[\s?(\w+(-?\w+)*)\s?\]$/gi
                };
            for (var k in Rex) {
                resolved = Rex[k].exec(selector);
                if (resolved) {
                    resolved.Rex = k;
                    break;
                }
            }
            if (!resolved) {
                throw Error("Unknown selector:'" + selector + "'");
            } else return resolved;
        },
        Dom = function (a, b) {
            if (!a) return null;
            var cntx = (b || document), _sliced = a.slice(1, a.length), isID = (a[0] === '#'), isClass = (a[0] === '.'), isAll = (a === '*');
            cntx = isNodeCollection(cntx) ? cntx[0] : cntx;
            var list = isID ? document.getElementById(_sliced) : isClass ? cntx.getElementsByClassName(_sliced) : isAll ? document.getElementsByTagName(a) : cntx.getElementsByTagName(a);
            return !!list ? (isElement(list) ? [list] : slice.call(list)) : list;
        },
        walkTree = function (_start, cb, stack) {
            stack.splice(0, stack.length);

            var confirm = function (el) {
                    if (el.nodeType === 1) {
                        var valid = cb && cb.call(el);
                        if (valid) {
                            stack.push(el);
                        }
                    }
                },
                walkDom = function (start) {
                    confirm(start);
                    if (start.children && start.children.length) {

                        forEach(start.children, function () {
                            confirm(this);
                            walkDom(this);
                        });
                    }
                };

            if (isArray(_start)) {
                forEach(_start, function () {
                    walkDom(this);
                });
            } else walkDom(_start);
        },
        fetchNodes = function (selectors, context) {

            var nodes = (context && !isString(context)) ? context : null,
                WithAttributeAndValue = function (arr, resolved, i, j) {
                    var nds = (arr && arr.length) ? arr : null,
                        cb = function () {
                            return hasAttr.call(this, resolved[i]) && hasAttrVal.call(this, resolved[i], resolved[j]) ? this : null;
                        };
                    if (nds) {

                        var buff = [];
                        walkTree(nds, cb, buff);
                        nds = buff;
                    } else {
                        nds = map(Dom('*'), cb);
                    }
                    return nds;
                },
                withPseudo = function (key, resolved, i, j) {
                    switch (key.trim().toLowerCase()) {
                        case 'checked':
                            var buff = [],
                                cb = function () {
                                    return isChecked.call(this) ? this : null;
                                };
                            if (nodes) {

                                walkTree(nodes, cb, buff);
                                nodes = buff;
                            } else {
                                nodes = map(Dom('*'), cb);
                            }
                            break;
                        default:
                            nodes = WithAttributeAndValue(nodes, resolved, i, j);
                    }
                },
                withAttribute = function (attr) {
                    var buff = [],
                        cb = function () {
                            return hasAttr.call(this, attr) ? this : null;
                            //return this.getAttribute(attr) ? this : null;
                        };
                    if (nodes) {
                        walkTree(nodes, cb, buff);
                        nodes = buff;
                    } else {
                        nodes = map(Dom('*'), cb);
                    }

                },
                withClass = function (_class) {
                    nodes = isNodeCollection(nodes) ? map(nodes, function () {
                        return hasClass.call(this, _class) ? this : null;
                    }) : hasClass.call(nodes, _class) ? nodes : null;
                };
            forEach(selectors, function () {
                //console.log("this: " + this);
                var resolved = resolveSelector(this);
                //console.log(resolved);
                if (resolved) {
                    switch (resolved.Rex) {
                        case 'ID_CLS':
                            var id = resolved[1],
                                _class = resolved[2];
                            _class = _class.slice(1, _class.length);
                            //console.log("id:%s, class:%s", id, _class);
                            nodes = nodes ? Dom(id, nodes) : Dom(id);
                            nodes = (nodes && hasClass.call(nodes, _class)) ? nodes : null;
                            break;
                        case 'EL_CLS':
                            var element = resolved[1],
                                _class = resolved[2];
                            _class = _class.slice(1, _class.length);
                            nodes = nodes ? Dom(element, nodes) : Dom(element);
                            withClass(_class);
                            break;

                        case 'CLS_CLS':
                            var _klass = resolved[1],
                                _class = resolved[2];
                            _class = _class.slice(1, _class.length);
                            nodes = nodes ? Dom(_klass, nodes) : Dom(_klass);
                            withClass(_class);
                            break;
                        case 'CLS':
                        case 'ID':
                        case 'EL':
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            break;

                        case 'EL_ATT_VAL':
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            nodes = WithAttributeAndValue(nodes, resolved, 2, 3);
                            break;
                        case 'EL_ATT_VAL_ATT_VAL':// /^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            nodes = WithAttributeAndValue(nodes, resolved, 2, 3);
                            nodes = WithAttributeAndValue(nodes, resolved, 4, 5);
                            break;
                        case 'EL_ATT':///^(\w+)\[\s?(\w+(-?\w+)*)\s?\]$/gi
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            withAttribute(resolved[2]);
                            break;
                        case 'ATT_SD':///^\[\s?(\w+(-?\w+)*)\s?\](:)(\w+)$/gi,
                            withAttribute(resolved[1]);
                            resolved[3] = "type";
                            withPseudo(resolved[4], resolved, 3, 4);
                            break;
                        case 'ATT_VAL':
                            nodes = WithAttributeAndValue(nodes, resolved, 1, 2);
                            break;

                        case 'ATT_VAL_ATT_VAL': // /^\[\s?(\w+)\s?=\s?(\w+)\s?\]\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                            nodes = WithAttributeAndValue(nodes, resolved, 1, 2);
                            nodes = WithAttributeAndValue(nodes, resolved, 3, 4);
                            break;
                        case 'ATT_VAL_SD':// /^\[\s?(\w+)\s?=\s?(\w+)\s?\](:)(\w+)$/gi,
                            nodes = WithAttributeAndValue(nodes, resolved, 1, 2);
                            resolved[3] = 'type';
                            withPseudo(resolved[4].trim(), resolved, 3, 4);
                            break;
                        case 'EL_ATT_VAL_SD':///^(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\](:)(\w+)$/gi
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            nodes = WithAttributeAndValue(nodes, resolved, 2, 3);
                            resolved[4] = 'type';
                            withPseudo(resolved[5].trim(), resolved, 4, 5);
                            break;
                        case 'EL_ATT_SD':///^(\w+)\[\s?(\w+(-?\w+)*)\s?\](:)(\w+)$/gi
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            withAttribute(resolved[2]);
                            resolved[4] = 'type';
                            withPseudo(resolved[5], resolved, 4, 5);
                            break;
                        case 'EL_SD':// /^(\w+)(:)(\w+)$/gi,
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            resolved[1] = "type";
                            resolved[2] = resolved[3];
                            withPseudo(resolved[2], resolved, 1, 2);
                            break;
                        case 'EL_SD_SD':// /^(\w+)(:)(\w+)(:)(\w+)$/gi
                            nodes = nodes ? Dom(resolved[1], nodes) : Dom(resolved[1]);
                            resolved[2] = "type";
                            withPseudo(resolved[3], resolved, 2, 3);

                            resolved[4] = "type";
                            withPseudo(resolved[5], resolved, 4, 5);
                            break;

                        case 'SD_SD':// /^(:)(\w+)(:)(\w+)$/gi
                            resolved[1] = "type";
                            withPseudo(resolved[2], resolved, 1, 2);
                            resolved[3] = "type";
                            withPseudo(resolved[4], resolved, 3, 4);
                            break;
                        case 'SD_ATT':// /^(:)(\w+)\[\s?(\w+(-?\w+)*)\s?\]$/gi,
                            resolved[1] = "type";
                            withPseudo(resolved[2], resolved, 1, 2);
                            withAttribute(resolved[3]);
                            break;

                        case 'SD_ATT_VAL':// /^(:)(\w+)\[\s?(\w+)\s?=\s?(\w+)\s?\]$/gi,
                            resolved[1] = "type";
                            withPseudo(resolved[2], resolved, 1, 2);
                            nodes = WithAttributeAndValue(nodes, resolved, 3, 4);
                            break;
                        case 'SD':
                            resolved[1] = "type";
                            withPseudo(resolved[1], resolved, 1, 2);
                            break;
                        case 'ATT':
                            withAttribute(resolved[1]);
                            break;
                        default:
                            throw Error("Unknown selector Key - '" + resolved.Rex + "'");
                    }
                }

            });
            return nodes;
        },
        Events = (function () {
        // addEvent/removeEvent written by Dean Edwards, 2005
        // with input from Tino Zijdel
        // http://dean.edwards.name/weblog/2005/10/add-event/

            var addEvent = function (element, type, handler) {
                if (element.addEventListener) {
                    element.addEventListener(type, handler, false);
                } else {
                    if (!handler.$$guid) handler.$$guid = addEvent.guid++;
                    if (!element.events) element.events = {};
                    var handlers = element.events[type];
                    if (!handlers) {
                        handlers = element.events[type] = {};
                        if (element["on" + type]) {
                            handlers[0] = element["on" + type];
                        }
                    }
                    handlers[handler.$$guid] = handler;


                    element["on" + type] = handleEvent.call(element);
                }
            },

            removeEvent = function (element, type, handler) {
                if (element.removeEventListener) {
                    element.removeEventListener(type, handler, false);
                } else {
                    if (type) {
                        if (element.events && element.events[type]) {
                            delete element.events[type][handler.$$guid];
                        }
                    }
                }

            },
            handleEvent = function () {
                var self = this;
                return function (event) {
                    var returnValue = true;
                    event = event || fixEvent(window.event);
                    var handlers = this.events[event.type];
                    for (var i in handlers) {
                        this.$$handleEvent = handlers[i];
                        if (this.$$handleEvent.call(self, event) === false) {
                            returnValue = false;
                        }
                    }
                    return returnValue;
                };
            },
            fixEvent = function (event) {
                event.preventDefault = fixEvent.preventDefault;
                event.stopPropagation = fixEvent.stopPropagation;
                return event;
            };
            addEvent.guid = 1;
            fixEvent.preventDefault = function () {
                this.returnValue = false;
            };
            fixEvent.stopPropagation = function () {
                this.cancelBubble = true;
            };

            return {
                addEvent: addEvent,
                removeEvent: removeEvent
            };

        }()),
        delegateEvents = function (event, targetOrHandler, handlerOrUndefined) {
            var matched = seleto(targetOrHandler, this.nodes[0]);
            if (matched.length > 0) {

                matched.each(function () {
                    Events.addEvent(this, event, handlerOrUndefined);
                });
            }
        };
    var seleto = (function () {
        var nodes = null;
        return function (selectorOrCallback, context) {
            if (!isMe(this)) {
                return new seleto(selectorOrCallback, context);
            }

            var self = this,
                updateState = function (items) {

                    this.nodes = items.unique();
                    this.length = this.nodes.length;
                };
            self.length = 0;
            self.nodes = [];
            self.nodeList = function () {
                return nodes;
            };

            if (isUndefined(selectorOrCallback)) {
                return this;
            }

            if (isFunction(selectorOrCallback)) {
                if (document.readyState != 'loading') {
                    selectorOrCallback();
                } else {
                    document.addEventListener('DOMContentLoaded', selectorOrCallback);
                }

            } else {

                if (isArray(selectorOrCallback)) {
                    //console.log('isNodeCollection');
                    nodes = selectorOrCallback;
                    //nodes = slice.call(selectorOrCallback);
                    updateState.call(self, selectorOrCallback);
                } else if (isElement(selectorOrCallback)) {
                    //console.log('isElement');
                    nodes = selectorOrCallback;
                    updateState.call(self, [selectorOrCallback]);

                } else if (isString(selectorOrCallback)) {


                    if (selectorOrCallback.match(/<(\"[^\"]*\"|'[^']*'|[^'\">])*>/ig)) {
                        //console.log('Fragment');
                        var fragment = document.createElement("div");
                        fragment.innerHTML = selectorOrCallback;
                        nodes = fragment.children;
                        selectorOrCallback = isElement(nodes) ? [nodes] : slice.call(nodes);
                        updateState.call(self, selectorOrCallback);
                    } else {

                        var selectorCollection = map(clean(selectorOrCallback).split(','), function () {
                            return this.trim();
                        });
                        //console.log(selectorCollection);
                        forEach(selectorCollection, function (i) {

                            var selectors = map(this.split(' '), function () {
                                return this.trim().replace(/\s+/g, "");
                            });
                            //console.log(selectors);

                            //console.log("context: " + context);
                            nodes = context ? fetchNodes(selectors, context) : fetchNodes(selectors);
                            if (nodes) {
                                self.nodes = isArray(nodes) ? self.nodes.concat(nodes.unique()) : (function () {
                                    self.nodes.push(nodes);
                                    return self.nodes
                                }());
                                self.length = self.nodes.length;
                            }

                        });
                    }
                }
            }
        };
    }());
//empty seleto for utility
    seleto.noNodes = function () {
        return seleto()
    };
    seleto.fn = seleto.prototype;
    seleto.fn.slice = slice;
    seleto.fn.each = function (callback) {
        forEach(this.nodes, callback);
    };
    seleto.fn.find = function (selector) {

        if (this.length === 0) {
            return seleto.noNodes();
        }
        return seleto(selector, this.nodes);
    };
    seleto.fn.parent = function () {
        if (this.length === 0) {
            return seleto.noNodes();
        }
        var parent = this.nodes[0].parentNode;
        return parent && parent.nodeType !== 11 ? seleto(parent) : seleto.noNodes();
    };
    seleto.fn.contents = function (elem) {
        elNameIs.call(elem, 'iframe') ? elem.contentDocument || elem.contentWindow.document : makeArray(elem.childNodes);
    };
    /**
     * Wrapper for getBoundingClientRect that returns a
     * subset ('top','left') and includes a 'width' and 'height'.
     * It also rounds the pixel measurements to the nearest integer value
     *
     * @param {HTMLElement|jQuery} DOM element to get rectangle for
     * @returns {Object}
     */
    seleto.fn.rec = function () {
        if (this.nodes.length === 0) {
            return;
        }
        var rect = this.nodes[0].getBoundingClientRect();
        return {
            top: round(rect.top),
            left: round(rect.left),
            height: round(rect.bottom) - round(rect.top),
            width: round(rect.right) - round(rect.left)
        };
    };
    /**
     * Wrap an HTMLElement around each element in a list of elements
     * Modified global function based on Kevin Jurkowski's implementation
     * here: http://stackoverflow.com/questions/3337587/wrapping-a-dom-element-using-pure-javascript/13169465#13169465
     */
    seleto.fn.wrap = function (wrapper) {

        if (this.nodes.length === 0) {
            return;
        }
        if (isString(wrapper)) {
            var d = seleto(wrapper);
            wrapper = d.nodes[0];
        }

        if (isMe(wrapper)) {
            wrapper = wrapper.nodes[0];
        }

        var elms = this.nodes;

        for (var i = elms.length - 1; i >= 0; i--) {

            var child = (i > 0) ? wrapper.cloneNode(true) : wrapper;
            var el = elms[i];

            var parent = el.parentNode;
            var sibling = el.nextSibling;

            child.appendChild(el);

            if (sibling) {
                parent.insertBefore(child, sibling);
            } else {
                parent.appendChild(child);
            }
        }

        return this;
    };

    /**
     * Wrap an HTMLElement around another set of elements
     * Modified global function based on Kevin Jurkowski's implementation
     * here: http://stackoverflow.com/questions/3337587/wrapping-a-dom-element-using-pure-javascript/13169465#13169465
     */
    seleto.fn.wrapAll = function (wrapper) {
        if (this.nodes.length === 0) {
            return;
        }

        if (isString(wrapper)) {
            var d = seleto(wrapper);
            wrapper = d.nodes[0];
        }

        if (isMe(wrapper)) {
            wrapper = wrapper.nodes[0];
        }

        var elms = this.nodes;

        var el = elms.length ? elms[0] : elms,
            parent = el.parentNode,
            sibling = el.nextSibling;


        this.each(function () {
            wrapper.appendChild(this);
        });


        if (sibling) {
            parent.insertBefore(wrapper, sibling);
        }
        else {
            parent.appendChild(wrapper);
        }
        return this;
    };
    seleto.fn.html = function (stringOrCallback) {
        if (stringOrCallback === undefined) {
            return this.length > 0 ? this.nodes[0].innerHTML : null;
        }
        var response;
        if (isString(stringOrCallback)) {
            this.each(function () {
                this.innerHTML = stringOrCallback;
            });
        } else {
            this.each(function (i, el) {
                if ((response = stringOrCallback.call(this, i, this.innerHTML)) !== false) {
                    this.innerHTML = response;
                }
            });

        }
        return this;
    };
    seleto.fn.children = function () {
        if (this.length === 0) {
            return seleto.noNodes();
        }
        var children = this.nodes[0].children;
        if (children && children.nodeType !== 11) {

            children = slice.call(children);
            return seleto(children);
        } else {
            return seleto.noNodes();
        }
    };
    seleto.fn.empty = function () {
        return this.html('');
    };
    seleto.fn.val = function (inVal) {
        if (this.length === 0) {
            return;
        }

        if (isUndefined(inVal)) {
            return this.nodes[0].value;
        } else {

            this.each(function () {
                this.value = inVal;
            });
        }


    };
    seleto.fn.is = function (target) {
        if (this.length === 0 || target === undefined) {
            return;
        }
        if (isString(target)) {
            return is.call(this.nodes[0], target);

        } else if (isMe(target)) {
            return (this.nodes[0] === target.nodes[0]);
        }
    };
    seleto.fn.filter = function (selector) {
        if (this.length === 0) return seleto.noNodes();
        return seleto(map(this.nodes, function () {
            return is.call(this, selector) ? this : null;
        }));
    };
    seleto.fn.appendTo = function (target) {
        if (this.length === 0 || target === undefined) {
            return;
        }
        if (isString(target)) {
            var _d = seleto(target);
            _d.append(this);
        } else if (isMe(target)) {
            target.append(this);
        }

        return this;
    };
    seleto.fn.before = function (stringOrSeleto) {
        if (this.length === 0) {
            return seleto.noNodes();
        }
        var d = isString(stringOrSeleto)? seleto(stringOrSeleto) : isMe(stringOrSeleto)? stringOrSeleto:null;
        this.each(function () {
            this.parentNode.insertBefore(d.nodes[0], this);
        });

        return this;

    };
    seleto.fn.after = function (stringOrSeleto) {
        if (this.length === 0) {
            return seleto.noNodes();
        }

        var d = isString(stringOrSeleto)? seleto(stringOrSeleto) : isMe(stringOrSeleto)? stringOrSeleto:null;
        this.each(function () {
            this.parentNode.insertBefore(d.nodes[0], this.nextSibling );
        });
        return this;
    };
    seleto.fn.append = function (cnt) {
        if (this.length === 0) {
            return;//seleto.noNodes();
        }

        var d = isString(cnt) ? seleto(cnt) : isMe(cnt) ? cnt : null;

        this.each(function () {
            this.appendChild(d.nodes[0]);
        });
        return this;
    };
    seleto.fn.prepend = function (cnt) {
        if (this.length === 0) {
            return;
        }
        var d = isString(cnt) ? seleto(cnt) : isMe(cnt) ? cnt : null;

        this.each(function () {
            this.insertBefore(d.nodes[0], this.firstChild);
        });

        return this;
    };
    seleto.fn.clone = function () {
        if (this.length === 0) {
            return seleto.noNodes();
        }
        //var cloned = this.nodes[0].cloneNode(true);
        var cloned = map(this.nodes, function () {
            return this.cloneNode(true);
        });
        if (cloned) {
            return seleto(cloned);
        } else return seleto.noNodes();
    };
    seleto.fn.remove = function () {

        this.each(function () {
            this.parentNode.removeChild(this);
        });
        return this;
    };
    seleto.fn.even = function () {
        if (this.length === 0) return seleto.noNodes();
        var self = this;
        return seleto(map(self.nodes, function (i) {
            return ((i + 1) % 2) === 0 ? this : null;
        }));
    };
    seleto.fn.odd = function () {
        if (this.length === 0) return seleto.noNodes();
        var self = this;
        return seleto(map(self.nodes, function (i) {
            return ((i + 1) % 2) !== 0 ? this : null;
        }));
    };

    seleto.fn.first = function () {
        if (this.length === 0) return seleto.noNodes();

        return seleto(this.nodes[0]);
    };

    seleto.fn.last = function () {
        if (this.length === 0) return seleto.noNodes();

        return seleto(this.nodes[this.length - 1]);
    };
    seleto.fn.nth = function(postition){
        if ((this.length === 0) || (postition > this.length)) return seleto.noNodes();
        return seleto(this.nodes[postition - 1]);
    };

    seleto.fn.text = function (str) {
        if (isUndefined(str)) {
            return this.nodes[0].textContent;
        }

        return this.each(function () {
            this.textContent = str;
        });
        //return this;
    };
    seleto.fn.not = function (selector) {
        if (this.length === 0 || selector === undefined) {
            return;
        }

        var self = this,
            selectorNodes = [];
        if (isString(selector)) {
            var d = this.filter(selector);
            selectorNodes = d.nodes;
            //console.log(selectorNodes);
        } else if (isMe(selector)) {
            selectorNodes = selector.nodes;
        }


        //console.log(selectorNodes);

        var self = this;
        forEach(selectorNodes, function () {
            var index = self.nodes.indexOf(this);
            if (index !== -1) {
                self.nodes.splice(index, 1);
                --self.length;
            }
        });
        //self.length = self.nodes.length;
        return this;
    };
    seleto.fn.on = function (event, targetOrHandler, handlerOrUndefined) {
        var self = this,
            isDelegated = !isFunction(targetOrHandler) && isFunction(handlerOrUndefined);
        this.each(function () {
            isDelegated
                ? delegateEvents.call(self, event, targetOrHandler, handlerOrUndefined)
                : Events.addEvent(this, event, targetOrHandler);
        });
        return this;
    };
    seleto.fn.trigger = function (event) {
        if (!event) return this;

        this.each(function () {
            fireEvent.call(this, event);
        });
        return this;
    };
    seleto.fn.size = function () {
        //console.log(this.length);
        return this.length;
    };
    seleto.fn.el = function (index) {
        return (this.length && this.length > index) ? this.nodes[index] : null;
    };
    seleto.fn.off = function (event, handler) {

        if(event && handler) {
            this.each(function () {
                Events.removeEvent(this, event, handler);
            });
        }else{
            this.each(function () {
                var elClone = this.cloneNode(true);
                this.parentNode.replaceChild(elClone, this);
            });
        }
        return this;
    };
    seleto.fn.click = function (callback) {
        if (callback) {
            return this.on('click', callback);
        }
        return this.trigger('click');
    };
    seleto.fn.change = function (callback) {

        if (callback) {
            return this.on('change', callback);
        }
        return this.trigger('change');

    };
    seleto.fn.css = function (name, value) {
        if (this.length === 0) {
            return this;
        }

        this.each(function () {
            var _this = this;
            // Don't set styles on text and comment nodes
            if (!_this || _this.nodeType === 3 || _this.nodeType === 8 || !_this.style) {
                return;
            }
            if (name && isUndefined(value)) {
                if (isString(name)) {
                    return _this.style[name];
                } else if (typeof name === 'object') {
                    for (var k in name) {
                        _this.style[k] = name[k];
                    }
                }
            } else if (name && value && isString(name) && isString(value)) {
                _this.style[name] = value;
            }
        });
        return this;
    };
    seleto.fn.prop = function (name, value) {
        if (this.length === 0) {
            return this;
        }

        if (!isUndefined(value)) {
            this.each(function () {
                this[name] = value;
            });
            return this;
        }
        if (name && isString(name)) {
            return this.nodes[0][name];
        }

        return this;

    };
    seleto.fn.data = function (key, value) {
        if (!key) {
            return seleto.noNodes();
        }
        return this.attr('data-' + key, value);
    };
    seleto.fn.attr = function (key, value) {
        if (this.length === 0) {
            return this;
        }
        var self = this;

        if (key && isUndefined(value)) {
            if (isString(key)) {
                if (!self.nodes[0].getAttribute) {
                    return '';
                } else  return self.nodes[0].getAttribute(key);
            }
        } else if (key && value && isString(key) && isString(value)) {
            return self.each(function () {
                if (!this || this.nodeType === 3 || this.nodeType === 8 || !this.setAttribute) {
                    return;
                }
                this.setAttribute(key, value);
                this[key] = value;
            });
        }
    };
    seleto.fn.addClass = function (klass) {
        if (this.length === 0 || klass === undefined) {
            return this;
        }
        var self = this;
        if (isString(klass)) {
            var classes = klass.split(',');

            self.each(function () {
                if (!this.setAttribute) return;
                var el = this,
                    attrs = el.getAttribute('class'),
                    attrList = attrs ? attrs.split(" ") : [];
                forEach(classes, function () {
                    attrList.push(this);
                });
                el.setAttribute('class', attrList.join(" "));
            });
        }
        return this;
    };
    seleto.fn.removeClass = function (klass) {
        if (this.length === 0 || klass === undefined) {
            return this;
        }
        var self = this;
        if (isString(klass)) {
            var classes = klass.split(',');
            classes = map(classes, function () {
                return this.trim();
            });
            self.each(function () {
                if (!this.setAttribute) return;
                var el = this,
                    attrs = el.getAttribute('class'),
                    attrList = attrs ? attrs.split(" ") : [];

                attrList = map(attrList, function () {
                    return this.trim();
                });
                forEach(classes, function () {
                    var idx = attrList.indexOf(this);
                    if (idx !== -1) {
                        attrList.splice(idx, 1);
                    }

                });
                el.setAttribute('class', attrList.join(" "));
            });
        }
        return this;
    };
    seleto.fn.hasClass = function (klass) {
        if (this.length === 0) return false;
        return hasClass.call(this.nodes[0], klass);
    };
    seleto.fn.toggleClass = function (klass) {
        if (this.length === 0 || klass === undefined) {
            return this;
        }
        var self = this;
        if (isString(klass)) {

            self.each(function () {
                var d = seleto(this);
                !hasClass.call(this, klass) ? d.addClass(klass) : d.removeClass(klass);
            });
        }
        return this;
    };
    root.seleto = seleto;
    root.$ = seleto;

}(this));