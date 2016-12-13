/**
 * Created by steve samson on 1/30/14.
 */

var Collection = null,
    Model = null,
    View = null,
    userModel = null,
    users = null,
    expect = require('chai').expect,
    should = require('chai').should(),
    fs = require('fs'),
    atomus = require('atomus'),
    htmlStr = fs.readFileSync('./test/index.html').toString('utf8'),
    listItemView,
    browser, $, setUpOk, seleto, output,
    createModel = function (detail) {
        var model = Model('/users');
        model.extend({
            sync: function (url, mtd, param, cb) {
                cb({url: url, method: mtd});
            }
        });

        model.populate(detail);
        return model;
    },
    createView = function(model){
        return View({
            lazy: true,
            empty_before_render: false, //allows append to the host element.
            template: "@{name} - {age} <a href='#' class='detail'>detail</a> | <a href='#' class='delete'>delete</a>",
            el: 'li',
            host: '.lists',
            events:{
                'click:.detail':'showDetails',
                'click:.update':'updateDetails',
                'click:.delete':'destroy'
            },
            destroy:function(e){
                e.preventDefault();
                $('#output').text(this.model.get('name') + " deleted");
                this.model.fire('destroy');
            },
            updateDetails:function(e){
                e.preventDefault();

                $('#output').text(this.model.get('name')  + " changed");
            },
            showDetails:function(e){
                e.preventDefault();

                $('#output').text(this.model.get('name')  + " details");
            },
            initialize:function(){
                //subscribe to the 'destroy' event on model and remove the view when the backing model is destroyed.
                this.model.on('destroy',this.remove,this);
            },
            model:createModel(model)
        });
    };



describe('#Slicks Model', function () {


    before(function (done) {
        browser = atomus()
            .external(__dirname + '/../test/seleto.js')
            .external(__dirname + '/../dist/slicks.js')
            //.external(__dirname + '/../test/stud.js')
            //.external(__dirname + '/../libs/browser/extension.js')
            .html(htmlStr)
            .ready(function (errors, window) {
                $ = window.$;
                global.window = window;
                global.slicks_tests = true;
                seleto = window.seleto;
                setUpOk = (errors === null);
                var Slicks = window.Slicks;//require('../dist/slicks');
                View = Slicks.View;
                Collection = Slicks.Collection;
                Model = Slicks.Model;
                userModel = Model('/users', {name: 'steve', age: 25});

                done();
            });
    });

    describe('#get', function () {

        it('Expects get name should return a string', function () {
            userModel.get('name').should.be.a('string');
        });

        it('Expects get name should return  steve', function () {
            userModel.get('name').should.equal('steve');
        });
        it('Expects getInt age should return a number', function () {
            userModel.getInt('age').should.be.a('number');
        });

    });

    describe('#url', function () {
        it('Should return /users', function () {
            userModel.url.should.equal('/users');
        })
    });
    describe('#populate', function () {

        it('Should return name = tom after populate', function () {
            userModel.populate({name: 'tom', gender: 'male', age: 30});
            userModel.get('name').should.equal('tom');
        });

        it('Should return ender=male after populate', function () {
            userModel.populate({name: 'tom', gender: 'male', age: 30});
            userModel.get('gender').should.equal('male');
        });

        it('Should return  age=30 after populate', function () {
            userModel.populate({name: 'tom', gender: 'male', age: 30});
            userModel.getInt('age').should.equal(30);
        });

    });

    describe('#unset', function () {
        it('Expect  get(name) to be undefined', function () {
            userModel.unset('name');
            expect(userModel.get('name')).to.be.undefined;
        })
    });

    describe('#reset', function () {
        it('Expect toObject() to be {}', function () {
            userModel.reset();
            userModel.toJSON().should.be.equal('{}');
            expect(userModel.toObject()).to.be.empty;
        })
    });

    describe('#extend', function () {
        it('Should call our modified sync while posting...', function (done) {
            userModel.extend({
                sync: function (url, mtd, param, cb) {
                    cb({message: 'called'});
                }
            });

            userModel.post('/users', {id: 'steve'}, function (e, msg) {
                msg.message.should.equals('called');
                done();
            });
        })
    });

    describe('#events', function () {
        it('Should fire events on model change', function (done) {
            userModel.on('change', function (mdl) {
                mdl.get('name').should.equal('sam');
                userModel.off();
                done();
            }, null);
            userModel.change('name', 'sam');
        });

        it('Should return sam', function () {
            userModel.set('name', 'sam');
            userModel.get('name').should.equal('sam');
        })
    });
    describe('#POST, #GET, #DELETE, #PUT', function () {
        it('Expects msg.method to be - post', function () {
            userModel.extend({
                sync: function (url, mtd, param, cb) {
                    cb({url: url, method: mtd});
                }
            });
            userModel.post('/states/ohio', {country: 'US'}, function (e, msg) {

                msg.method.should.equal('post');
            })
        });
        it('Expects msg.method to be - get', function () {

            userModel.get('/states/ohio', {country: 'US'}, function (e, msg) {

                msg.method.should.equal('get');
            })
        });

        it('Expects msg.method to be - post', function () {

            userModel.save(function (e, msg) {
                msg.method.should.equal('post');
            });
        });

        it('Expects msg.method to be - put', function () {

            userModel.set("id", 10);

            userModel.save(function (e, msg) {
                msg.method.should.equal('put');
            });
        });


        it('Expects msg.method to be - delete', function () {

            userModel.destroy(function (e, msg) {
                msg.method.should.equal('delete');
            });
        });

    });
});

describe('#Slicks Collection', function () {
    before(function (done) {
        var lastId = 4;
        users = Collection('/users');
        /*Extend for test purpose*/
        users.extend({
            sync: function (url, mtd, params, cb) {
                switch (mtd) {
                    case 'get':
                        cb && cb([
                            {id: 1, name: 'steve', age: 12},
                            {id: 2, name: 'sam', age: 32},
                            {id: 3, name: 'tom', age: 52},
                            {id: 4, name: 'rita', age: 17}
                        ]);
                        break;
                    /*This works for create interface*/
                    case 'post':
                        params.id = ++lastId;
                        cb && cb(params);
                        break;
                }
            }
        });
        done();
    });


    describe('#Initial State, #Length, #asArray', function () {

        it('Should return initial length 0', function () {
            users.length.should.be.equal(0);
        });

        it('Should return asArray to be empty', function () {
            expect(users.asArray()).to.be.empty;
        });
    });

    describe('#fetch, #on, #off - event subscriptions, #get(id) ', function () {

        it('Should return length 4 after fetch', function (done) {
            var checkUsers = function () {
                users.length.should.be.equal(4);
                done();
            };

            users.off().on('reset', checkUsers, users).fetch();

        });

        it('Should return age = 52 for model with id=3', function () {
            users.get(3).getInt('age').should.be.equal(52);
        });

        it('Should return sam as name for model with id=2', function () {
            users.get(2).get('name').should.be.equal('sam');
        });

    });

    describe('#create', function () {
        it('Should return length 6 after creating 2 more models', function () {
            users.create({name: 'matha', age: 75}, function () {
            }).create({name: 'phil', age: 33}, function () {
            }).length.should.be.equal(6);

        });

        it('Should return name of phil for model with id=6', function () {
            users.get(6).get('name').should.be.equal('phil');
        });

    });

    describe('#each', function () {
        it('Should return 6 as the total number of models in collection', function () {
            var total = 0;
            users.each(function () {
                total++;
            });
            total.should.equal(6);
        });
        it('Should return 21 as sum of ids of all models in collection', function () {
            var sumOfIds = 0;
            users.each(function () {
                sumOfIds += this.getInt('id');
            });

            sumOfIds.should.equal(21);
        });
    });

    describe('#emptyModel', function () {
        it('Should return a model with empty attributes', function () {
            expect(users.emptyModel().toObject()).to.be.empty;
        });

        it('Expect collection\'s url to be equal to the url of empty model returned by collection', function () {
            expect(users.emptyModel().url).to.equal(users.url);
        });
    });

    describe('#add', function () {
        it('Expect isNew to be true for added model', function (done) {
            users.off().on('add', function (mdl) {
                expect(mdl.isNew).to.equal(true);
                done()
            });
            users.add({id: 7, name: 'New Guy', age: 45});
        });
        it('Expect name of newly added model to be \'New Guy\'', function () {
            expect(users.get(7).get('name')).to.equal('New Guy');
        });

        it('Expect collection length to be 7', function () {
            expect(users.length).to.equal(7);
        });
    });

    describe('#reset', function () {
        it('Expect collection to be empty', function (done) {
            users.off().on('change', function () {
                expect(users.asArray()).to.be.empty;
                done()
            });
            users.reset();
        });
        it('Expect collection length to be zero(0)', function () {
            expect(users.length).to.equal(0);
        });
    });

    describe('#fire - collection events or custom events', function () {
        it('Expect event handler to be called when it subscribed to the fired event', function (done) {
            users.off().on('any-event', function () {
                expect('called').to.equal('called');
                done()
            });
            users.fire('any-event');
        });

    });

    describe('#extend', function () {
        it('Should return the url as /people after extending to override the url', function () {
            users.extend({url: '/people'}).url.should.be.equal('/people');
        });
        it('See the before of these tests, it is an example of extend for the sync interface', function () {
        });
    });


});

describe('#Slicks View', function () {

    describe("#Setup OK", function () {
        it("Expects setUpOk to be true ", function () {
            expect(setUpOk).to.be.equal(true);
        });

        it("Expects $ to be defined ", function () {
            expect($).to.be.defined;
        });

        it("Expects seleto to be defined ", function () {
            expect(seleto).to.be.defined;
        });
        it("Expects seleto to be equal $ ", function () {
            expect(seleto).to.be.equal($);
        });

        it("Expects output to be defined ", function () {
            output = $('#output');
            expect(output).to.be.defined;
        });


    });

    describe("#Slicks View Creation and check options", function () {

        it("Expects listItemView.$host to be defined ", function () {
            listItemView = createView({name: 'Tom', age: 34, id: 1});
            expect(listItemView.$host).to.be.defined;
        });
        it("Expects listItemView.$el listView.$el to be defined ", function () {
            expect(listItemView.$el).to.be.defined;
        });
        it("Expects  listItemView.model to be defined ", function () {
            expect(listItemView.model).to.be.defined;
        });
        it("Expects  listItemView.collection to be null ", function () {
            expect(listItemView.collection).to.be.equal(null);
        });

        it("Expects  listItemView.$host.find('li').size() to be zero ", function () {
            expect(listItemView.$host.find('li').size()).to.be.equal(0);
        });

    });

    describe('#Slicks View Render', function () {


        it("Expects listItemView.$host.find('li').size() to be equal to 1", function () {

            listItemView.render();
            expect(listItemView.$host.find('li').size()).to.be.equal(1);

        });
        it("Expects listItemView.$host.find('li').size() to be equal to 2", function () {

            var another = createView({name:'Joe',age:44, id:2});
            another.render();
            expect(listItemView.$host.find('li').size()).to.be.equal(2);

        });

        it("Expects listItemView.$host.find('li').size() to be equal to 3", function () {

            var yetanother = createView({name:'Sam',age:25, id:3});
            yetanother.render();
            expect(listItemView.$host.find('li').size()).to.be.equal(3);

        });

        it("Expects listItemView.$host.find('li').size() to be equal to 4", function () {

            var thelast = createView({name:'Pope',age:85, id:4});
            thelast.render();
            expect(listItemView.$host.find('li').size()).to.be.equal(4);

        });
    });

    describe('#Slicks View Events', function(){

        it("Expects output.text() to be 'Tom details'", function(){

            listItemView.$host.find('li').nth(1).find('a.detail').click();
            expect(output.text()).to.be.equal('Tom details');

        });
        it("Expects output.text() to be 'Joe details'", function(){

            listItemView.$host.find('li').nth(2).find('a.detail').click();
            expect(output.text()).to.be.equal('Joe details');

        });
        it("Expects output.text() to be 'Sam details'", function(){

            listItemView.$host.find('li').nth(3).find('a.detail').click();
            expect(output.text()).to.be.equal('Sam details');

        });

        it("Expects output.text() to be 'Pope details'", function(){

            listItemView.$host.find('li').nth(4).find('a.detail').click();
            expect(output.text()).to.be.equal('Pope details');

        });


        it("Expects listItemView.$host.find('li').size() to be equal to 4", function () {

            expect(listItemView.$host.find('li').size()).to.be.equal(4);

        });



        it("Expects output.text() to be 'Pope deleted'", function(){

            listItemView.$host.find('li').nth(4).find('a.delete').click();
            expect(output.text()).to.be.equal('Pope deleted');

        });

        it("Expects listItemView.$host.find('li').size() to be equal to 3", function () {

            expect(listItemView.$host.find('li').size()).to.be.equal(3);

        });


        it("Expects output.text() to be 'Sam deleted'", function(){

            listItemView.$host.find('li').nth(3).find('a.delete').click();
            expect(output.text()).to.be.equal('Sam deleted');

        });

        it("Expects listItemView.$host.find('li').size() to be equal to 2", function () {

            expect(listItemView.$host.find('li').size()).to.be.equal(2);

        });

        it("Expects output.text() to be 'Joe deleted'", function(){

            listItemView.$host.find('li').nth(2).find('a.delete').click();
            expect(output.text()).to.be.equal('Joe deleted');

        });
        it("Expects listItemView.$host.find('li').size() to be equal to 1", function () {

            expect(listItemView.$host.find('li').size()).to.be.equal(1);

        });
        it("Expects output.text() to be 'Tom deleted'", function(){

            listItemView.$host.find('li').nth(1).find('a.delete').click();
            expect(output.text()).to.be.equal('Tom deleted');

        });

        it("Expects listItemView.$host.find('li').size() to be equal to 0", function () {

            expect(listItemView.$host.find('li').size()).to.be.equal(0);

        });

    });


});