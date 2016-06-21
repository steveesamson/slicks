/**
 * Created by steve on 6/21/16.
 */

module.exports = function ($) {

    if (!window.$3$$10N) require('./session');

    if (!window.dust) require('./dust-core');

    if (!window.jQuery) {
        window.jQuery = window.$ = $;
    }
    if(!$.functionsLoaded){
        require('./functions');
    }

};

