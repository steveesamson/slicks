if(slicks_tests === undefined)
    require('../libs/browser');

var _ = require('../libs/SlicksUtils')(),
    _Model =  require('../libs/SlicksModel')(_);

module.exports = {
    Router: require('../libs/SlicksRouter')(),
    Utils: _,
    Model:_Model,
    Collection: require('../libs/SlicksCollection')(_,_Model),
    View: require('../libs/SlicksView')(_,_Model)
};