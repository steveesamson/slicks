/**
 * Created by steve samson on 1/30/14.
 */
var Slicks = require('../dist/slicks'),
    model = Slicks.Model('/users'{name:'steve',age:25}),
    should = require('chai').should();

describe('#Model',function(){
    describe('#get',function(){
        it('Should be a string',function(){
            model.get('name').should.be.a('string');
        });
        it('Should return  steve',function(){
            model.get('name').should.equal('steve');
        });

    });
    describe('#set',function(){
        it('Should return sam',function(){
            model.set('name','sam');
            model.get('name').should.equal('sam');
        })
    });
    describe('#url',function(){
        it('Should return /users',function(){
            model.url.should.equal('/users');
        })
    });
});