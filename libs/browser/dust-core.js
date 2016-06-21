//
// Dust - Asynchronous Templating v2.2.2
// http://akdubya.github.com/dustjs
//
// Copyright (c) 2010, Aleksander Williams
// Released under the MIT License.
//

function getGlobal() {
    return function () {
        return this.dust
    }.call(null)
}

var dust = {},
global = window;
(function (dust) {
    function Context(e, t, n, r) {
        this.stack = e, this.global = t, this.blocks = n, this.templateName = r
    }

    function Stack(e, t, n, r) {
        this.tail = t, this.isObject = !dust.isArray(e) && e && typeof e == "object", this.head = e, this.index = n, this.of = r
    }

    function Stub(e) {
        this.head = new Chunk(this), this.callback = e, this.out = ""
    }

    function Stream() {
        this.head = new Chunk(this)
    }

    function Chunk(e, t, n) {
        this.root = e, this.next = t, this.data = [], this.flushable = !1, this.taps = n
    }

    function Tap(e, t) {
        this.head = e, this.tail = t
    }

    if (!dust)return;
    var ERROR = "ERROR", WARN = "WARN", INFO = "INFO", DEBUG = "DEBUG", levels = [DEBUG, INFO, WARN, ERROR], logger = function () {
    };
    dust.isDebug = !1, dust.debugLevel = INFO, typeof window != "undefined" && window && window.console && window.console.log ? logger = window.console.log : typeof console != "undefined" && console && console.log && (logger = console.log), dust.log = function (e, t) {
        var t = t || INFO;
        dust.isDebug && levels.indexOf(t) >= levels.indexOf(dust.debugLevel) && (dust.logQueue || (dust.logQueue = []), dust.logQueue.push({message: e, type: t}), logger.call(console || window.console, "[DUST " + t + "]: " + e))
    }, dust.onError = function (e, t) {
        dust.log(e.message || e, ERROR);
        if (dust.isDebug)throw e;
        return t
    }, dust.helpers = {}, dust.cache = {}, dust.register = function (e, t) {
        if (!e)return;
        dust.cache[e] = t
    }, dust.render = function (e, t, n) {
        var r = (new Stub(n)).head;
        try {
            dust.load(e, r, Context.wrap(t, e)).end()
        } catch (i) {
            dust.onError(i, r)
        }
    }, dust.stream = function (e, t) {
        var n = new Stream;
        return dust.nextTick(function () {
            try {
                dust.load(e, n.head, Context.wrap(t, e)).end()
            } catch (r) {
                dust.onError(r, n.head)
            }
        }), n
    }, dust.renderSource = function (e, t, n) {
        return dust.compileFn(e)(t, n)
    }, dust.compileFn = function (e, t) {
        var n = dust.loadSource(dust.compile(e, t));
        return function (e, r) {
            var i = r ? new Stub(r) : new Stream;
            return dust.nextTick(function () {
                typeof n == "function" ? n(i.head, Context.wrap(e, t)).end() : dust.onError(new Error("Template [" + t + "] cannot be resolved to a Dust function"))
            }), i
        }
    }, dust.load = function (e, t, n) {
        var r = dust.cache[e];
        return r ? r(t, n) : dust.onLoad ? t.map(function (t) {
            dust.onLoad(e, function (r, i) {
                if (r)return t.setError(r);
                dust.cache[e] || dust.loadSource(dust.compile(i, e)), dust.cache[e](t, n).end()
            })
        }) : t.setError(new Error("Template Not Found: " + e))
    }, dust.loadSource = function (source, path) {
        return eval(source)
    }, Array.isArray ? dust.isArray = Array.isArray : dust.isArray = function (e) {
        return Object.prototype.toString.call(e) === "[object Array]"
    }, dust.nextTick = function () {
        return typeof process != "undefined" ? process.nextTick : function (e) {
            setTimeout(e, 0)
        }
    }(), dust.isEmpty = function (e) {
        return dust.isArray(e) && !e.length ? !0 : e === 0 ? !1 : !e
    }, dust.filter = function (e, t, n) {
        if (n)for (var r = 0, i = n.length; r < i; r++) {
            var s = n[r];
            s === "s" ? (t = null, dust.log("Using unescape filter on [" + e + "]", DEBUG)) : typeof dust.filters[s] == "function" ? e = dust.filters[s](e) : dust.onError(new Error("Invalid filter [" + s + "]"))
        }
        return t && (e = dust.filters[t](e)), e
    }, dust.filters = {h: function (e) {
        return dust.escapeHtml(e)
    }, j: function (e) {
        return dust.escapeJs(e)
    }, u: encodeURI, uc: encodeURIComponent, js: function (e) {
        return JSON ? JSON.stringify(e) : (dust.log("JSON is undefined.  JSON stringify has not been used on [" + e + "]", WARN), e)
    }, jp: function (e) {
        return JSON ? JSON.parse(e) : (dust.log("JSON is undefined.  JSON parse has not been used on [" + e + "]", WARN), e)
    }}, dust.makeBase = function (e) {
        return new Context(new Stack, e)
    }, Context.wrap = function (e, t) {
        return e instanceof Context ? e : new Context(new Stack(e), {}, null, t)
    }, Context.prototype.get = function (e, t) {
        return typeof e == "string" && (e[0] === "." && (t = !0, e = e.substr(1)), e = e.split(".")), this._get(t, e)
    }, Context.prototype._get = function (e, t) {
        var n = this.stack, r = 1, i, s, o, u;
        dust.log("Searching for reference [{" + t.join(".") + "}] in template [" + this.getTemplateName() + "]", DEBUG), s = t[0], o = t.length;
        if (e && o === 0)u = n, n = n.head; else {
            if (!e) {
                while (n) {
                    if (n.isObject) {
                        u = n.head, i = n.head[s];
                        if (i !== undefined)break
                    }
                    n = n.tail
                }
                i !== undefined ? n = i : n = this.global ? this.global[s] : undefined
            } else n = n.head[s];
            while (n && r < o)u = n, n = n[t[r]], r++
        }
        if (typeof n == "function") {
            var a = function () {
                return n.apply(u, arguments)
            };
            return a.isFunction = !0, a
        }
        return n === undefined && dust.log("Cannot find the value for reference [{" + t.join(".") + "}] in template [" + this.getTemplateName() + "]"), n
    }, Context.prototype.getPath = function (e, t) {
        return this._get(e, t)
    }, Context.prototype.push = function (e, t, n) {
        return new Context(new Stack(e, this.stack, t, n), this.global, this.blocks, this.getTemplateName())
    }, Context.prototype.rebase = function (e) {
        return new Context(new Stack(e), this.global, this.blocks, this.getTemplateName())
    }, Context.prototype.current = function () {
        return this.stack.head
    }, Context.prototype.getBlock = function (e, t, n) {
        if (typeof e == "function") {
            var r = new Chunk;
            e = e(r, this).data.join("")
        }
        var i = this.blocks;
        if (!i) {
            dust.log("No blocks for context[{" + e + "}] in template [" + this.getTemplateName() + "]", DEBUG);
            return
        }
        var s = i.length, o;
        while (s--) {
            o = i[s][e];
            if (o)return o
        }
    }, Context.prototype.shiftBlocks = function (e) {
        var t = this.blocks, n;
        return e ? (t ? n = t.concat([e]) : n = [e], new Context(this.stack, this.global, n, this.getTemplateName())) : this
    }, Context.prototype.getTemplateName = function () {
        return this.templateName
    }, Stub.prototype.flush = function () {
        var e = this.head;
        while (e) {
            if (!e.flushable) {
                if (e.error) {
                    this.callback(e.error), dust.onError(new Error("Chunk error [" + e.error + "] thrown. Ceasing to render this template.")), this.flush = function () {
                    };
                    return
                }
                return
            }
            this.out += e.data.join(""), e = e.next, this.head = e
        }
        this.callback(null, this.out)
    }, Stream.prototype.flush = function () {
        var e = this.head;
        while (e) {
            if (!e.flushable) {
                if (e.error) {
                    this.emit("error", e.error), dust.onError(new Error("Chunk error [" + e.error + "] thrown. Ceasing to render this template.")), this.flush = function () {
                    };
                    return
                }
                return
            }
            this.emit("data", e.data.join("")), e = e.next, this.head = e
        }
        this.emit("end")
    }, Stream.prototype.emit = function (e, t) {
        if (!this.events)return dust.log("No events to emit", INFO), !1;
        var n = this.events[e];
        if (!n)return dust.log("Event type [" + e + "] does not exist", WARN), !1;
        if (typeof n == "function")n(t); else if (dust.isArray(n)) {
            var r = n.slice(0);
            for (var i = 0, s = r.length; i < s; i++)r[i](t)
        } else dust.onError(new Error("Event Handler [" + n + "] is not of a type that is handled by emit"))
    }, Stream.prototype.on = function (e, t) {
        return this.events || (this.events = {}), this.events[e] ? typeof this.events[e] == "function" ? this.events[e] = [this.events[e], t] : this.events[e].push(t) : (dust.log("Event type [" + e + "] does not exist. Using just the specified callback.", WARN), t ? this.events[e] = t : dust.log("Callback for type [" + e + "] does not exist. Listener not registered.", WARN)), this
    }, Stream.prototype.pipe = function (e) {
        return this.on("data",function (t) {
            try {
                e.write(t, "utf8")
            } catch (n) {
                dust.onError(n, e.head)
            }
        }).on("end",function () {
            try {
                return e.end()
            } catch (t) {
                dust.onError(t, e.head)
            }
        }).on("error", function (t) {
            e.error(t)
        }), this
    }, Chunk.prototype.write = function (e) {
        var t = this.taps;
        return t && (e = t.go(e)), this.data.push(e), this
    }, Chunk.prototype.end = function (e) {
        return e && this.write(e), this.flushable = !0, this.root.flush(), this
    }, Chunk.prototype.map = function (e) {
        var t = new Chunk(this.root, this.next, this.taps), n = new Chunk(this.root, t, this.taps);
        return this.next = n, this.flushable = !0, e(n), t
    }, Chunk.prototype.tap = function (e) {
        var t = this.taps;
        return t ? this.taps = t.push(e) : this.taps = new Tap(e), this
    }, Chunk.prototype.untap = function () {
        return this.taps = this.taps.tail, this
    }, Chunk.prototype.render = function (e, t) {
        return e(this, t)
    }, Chunk.prototype.reference = function (e, t, n, r) {
        if (typeof e == "function") {
            e.isFunction = !0, e = e.apply(t.current(), [this, t, null, {auto: n, filters: r}]);
            if (e instanceof Chunk)return e
        }
        return dust.isEmpty(e) ? this : this.write(dust.filter(e, n, r))
    }, Chunk.prototype.section = function (e, t, n, r) {
        if (typeof e == "function") {
            e = e.apply(t.current(), [this, t, n, r]);
            if (e instanceof Chunk)return e
        }
        var i = n.block, s = n["else"];
        r && (t = t.push(r));
        if (dust.isArray(e)) {
            if (i) {
                var o = e.length, u = this;
                if (o > 0) {
                    t.stack.head && (t.stack.head.$len = o);
                    for (var a = 0; a < o; a++)t.stack.head && (t.stack.head.$idx = a), u = i(u, t.push(e[a], a, o));
                    return t.stack.head && (t.stack.head.$idx = undefined, t.stack.head.$len = undefined), u
                }
                if (s)return s(this, t)
            }
        } else if (e === !0) {
            if (i)return i(this, t)
        } else if (e || e === 0) {
            if (i)return i(this, t.push(e))
        } else if (s)return s(this, t);
        return dust.log("Not rendering section (#) block in template [" + t.getTemplateName() + "], because above key was not found", DEBUG), this
    }, Chunk.prototype.exists = function (e, t, n) {
        var r = n.block, i = n["else"];
        if (!dust.isEmpty(e)) {
            if (r)return r(this, t)
        } else if (i)return i(this, t);
        return dust.log("Not rendering exists (?) block in template [" + t.getTemplateName() + "], because above key was not found", DEBUG), this
    }, Chunk.prototype.notexists = function (e, t, n) {
        var r = n.block, i = n["else"];
        if (dust.isEmpty(e)) {
            if (r)return r(this, t)
        } else if (i)return i(this, t);
        return dust.log("Not rendering not exists (^) block check in template [" + t.getTemplateName() + "], because above key was found", DEBUG), this
    }, Chunk.prototype.block = function (e, t, n) {
        var r = n.block;
        return e && (r = e), r ? r(this, t) : this
    }, Chunk.prototype.partial = function (e, t, n) {
        var r;
        r = dust.makeBase(t.global), r.blocks = t.blocks, t.stack && t.stack.tail && (r.stack = t.stack.tail), n && (r = r.push(n)), typeof e == "string" && (r.templateName = e), r = r.push(t.stack.head);
        var i;
        return typeof e == "function" ? i = this.capture(e, r, function (e, t) {
            r.templateName = r.templateName || e, dust.load(e, t, r).end()
        }) : i = dust.load(e, this, r), i
    }, Chunk.prototype.helper = function (e, t, n, r) {
        var i = this;
        try {
            return dust.helpers[e] ? dust.helpers[e](i, t, n, r) : dust.onError(new Error("Invalid helper [" + e + "]"), i)
        } catch (s) {
            return dust.onError(s, i)
        }
    }, Chunk.prototype.capture = function (e, t, n) {
        return this.map(function (r) {
            var i = new Stub(function (e, t) {
                e ? r.setError(e) : n(t, r)
            });
            e(i.head, t).end()
        })
    }, Chunk.prototype.setError = function (e) {
        return this.error = e, this.root.flush(), this
    }, Tap.prototype.push = function (e) {
        return new Tap(e, this)
    }, Tap.prototype.go = function (e) {
        var t = this;
        while (t)e = t.head(e), t = t.tail;
        return e
    };
    var HCHARS = new RegExp(/[&<>\"\']/), AMP = /&/g, LT = /</g, GT = />/g, QUOT = /\"/g, SQUOT = /\'/g;
    dust.escapeHtml = function (e) {
        return typeof e == "string" ? HCHARS.test(e) ? e.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;").replace(SQUOT, "&#39;") : e : e
    };
    var BS = /\\/g, FS = /\//g, CR = /\r/g, LS = /\u2028/g, PS = /\u2029/g, NL = /\n/g, LF = /\f/g, SQ = /'/g, DQ = /"/g, TB = /\t/g;
    dust.escapeJs = function (e) {
        return typeof e == "string" ? e.replace(BS, "\\\\").replace(FS, "\\/").replace(DQ, '\\"').replace(SQ, "\\'").replace(CR, "\\r").replace(LS, "\\u2028").replace(PS, "\\u2029").replace(NL, "\\n").replace(LF, "\\f").replace(TB, "\\t") : e
    }
    global.dust = dust;
})(dust);

    //, typeof exports != "undefined" && (typeof process != "undefined" && require("./server")(dust), module.exports = dust);