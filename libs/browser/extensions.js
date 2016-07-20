/**
 * Created by steve Samson <stevee.samson@gmail.com> on 5/29/14.
 */
(function ($) {

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

    (function () {
        var oldClean = $.cleanData;


        $.cleanData = function (elems) {
            for (var i = 0, elem;
                 (elem = elems[i]) !== undefined; i++) {
                $(elem).triggerHandler("destroyed");
            }
            oldClean(elems);
        };
        $.functionsLoaded = true;
    })();


    $.notify = function (txt, type) {
        //var dis = $('#content_area');
        $('p.error, p.message, p.success').hide('slow');
        if (!txt) {
            return;
        }
//        var ltype = type === 'success'? 'log': 'error';
//        console[ltype](txt);
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
                if (!$._isNumeric($(this).val())) {
                    $(this).val('');
                }
            });
        });
    };
    $.fn.only_integer = function () {
        return $(this).each(function () {
            $(this).keyup(function () {
                if (!$._isInteger($(this).val())) {
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
}(window.$));
