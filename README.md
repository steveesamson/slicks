#Slicks
Slicks is a simple javascript Client MVC framework. It uses **`seleto.js`, `Dust.js`** for rendering pre-compiled templates.

#### Installation
```cli
  npm install slicks
```

####  Test
```cli
    npm test
```

##Slicks Components
Slicks has the following components:

- **`Slicks Model`**
-  **`Slicks Collection`**
-  **`Slicks View`**
-  **`Slicks Router`**
### Slicks Model
This is basically data in our application. Slicks Model accepts the following arguments(they are optional too): 

- **`url:`** This is an HTTP endpoint where a resource could be fetched. This could be REST endpoints or plain action endpoints usually on a server somewhere e.g `/users`; it defaults to null when not given.

- **`attributes:`** This represents the fields in our model; a javascript object which defaults to `{}` when not given.

- **`isRealTime:`** This is not supported yet(NSY); to be implemented(TBI). This is supposed to tell Slicks Model to use socket.io or not while communicating with an HTTP endpoint. Valid options are `true/false`; defaults to false.

> **Right now Slicks supports AJAX for communicating with its HTTP endpoints. It also support REST endpoints out-of-the-box**

Model relies on AJAX for its communication with the server or back-end-engine(BEE) and support REST out-of-the-box. For instance, urls for a model for the **`url`** `/users` would look like the following: 

- **`GET /users `**- This list all the users

- **`GET /users/4`** - This returns the user identified by ID = 4.

- **`POST /users`** - This post a submission to create a user

- **`PUT /users/4`** - This updates the user identified by ID = 4.

- **`DELETE /users/4`** - This deletes the user identified by ID = 4.

Creating a Slicks Model is as simple as:
```javascript
var model = Slicks.Model();/*url defaults to null, attributes defaults to {}*/
var another = Slicks.Model('/users');/*attributes defaults to {}*/
var yetAnother = Slicks.Model('/users',{name:'steve',age:20});
```
#### Slicks Model Exposed Interfaces
These are the exposed model functions:

- **`save:`** This usually sends a POST or PUT to an HTTP endpoint for persistence. If the model has not been saved before, the request would be `POSTed` otherwise, it would be `PUTed`. This function triggers the *`created`* event, which you can subscribe to **ONLY** if the model is not part of a collection. Otherwise, subscribe to the *`add`* event on the containing collection. `save` also triggers the `'change'` event.

- **`destroy:`** This sends a DELETE request to an HTTP endpoint for deletion and removes the model from a collection if it belongs to one. It also triggers the *`destroy`* event, which you can subscribe to **ONLY** if the model is not part of a collection. Otherwise, subscribe to the *`remove`* event on the containing collection.

- **`set:`** *set* assigns/modifies model attributes `e.g mod.set('name','Tom')`.

- **`change:`**  *change* works exactly like `set` except that it triggers the *`'change'`* event, which you can subscribe to; it passes the modified model as argument any passed callback of your subscribed listener; see **Slicks Model Events**.

- **`get:`** *get* obviously retrieves the appropriate model attribute by passing the attribute key `e.g mod.get('name')`. This also has flavours such as  **`mod.getInt() and mod.getFloat()`** for numeric values.

- **`unset:`** *unset*, as the name implies removes attributes from the Slicks model; pass the attribute key as argument. This triggers a `change` event too.
		
- **`reset:`** *reset* clears the model attributes to `{}`; the `url` is not affected by `reset`. It triggers `change` event on the model.

- **`fetch:`** *fetch* allows Slicks Model to be used to send HTTP `GET` requests to all kinds of `urls`, even when the model was not initialized with such `urls` e.g
```javascript
var model = Slicks.Model({});
/*This is possible even when model has no url at initialization*/
model.fetch('/user/roles',{userid:'ssamson'},function(e,roles){
	if(!e){
		console.log(roles);
	}
});
``` 
- **`post:`** *post* is like `fetch`(see **`fetch`**), except it rides on HTTP `POST`, e.g
```javascript
var model = Slicks.Model({}),
credentials = getCredentials();/*Some method somewhere*/

/*This is possible even when model has no url at initialization*/
model.post('/user/login',credentials,function(e,status){
	if(!e){
		console.log(status);
	}
});
``` 
- **`populate:`** *populate* helps us modify and extend model attributes like such:
```javascript
var model = Slicks.Model({name:'steve'});
model.populate({name:'Tom', age:13, address:'Unknown'});
console.log(model.toJSON());/*The name has changed and age and address were added*/
``` 
- **`toObject:`** *toObject* returns the model attributes as a map `e.g mod.toObject()`.

- **`toJSON:`** *toJSON* returns the model attributes as a JSON string `e.g mod.toJSON()`.

- **`params:`** *params* returns the model attributes as a hash which could be used as `query-string` to routes that may need information about the model before proceeding. The route can then retrieve the model from the `path` query, parse it to model, use it and then proceed. Check **`Slicks Router`**

```javascript
var users = Slicks.Model('/users');
users.populate({name:'steve',age:25,phone:'2348099887766'});
console.log(users.params('12345'));
/*12345 is the password, it must be passed when retrieving it from the router too.*/
/* output: J1olw6wQAGd8fRDDqsK9w5wPwoZ4w7xHFyzCrcOvw5NMw5tUw53Cs8OHw4HDq8OOwoTDsSNGw7RzbgpKCMO4Vk93IsORw5FSZ8Ou , which represent the entire model graph.*/
```

- **`extend:`** *extend*, obviously allows us to modify/override or add to the exposed interfaces of Slicks Model, while `populate` helps to extend/modify Slicks Model `attributes`, `extend` provides a way to override/add interfaces to the Slicks Model itself. See `sync` example below for how to use `extend`.

- **`sync:`** *sync* is where communication with a Back-End-Engine,**`BEE`** or **`HTTP`** endpoint takes place; in fact, if there is any need to change where application data/communication go to, `sync` should be overridden, or in Slicks terms `extend`ed. The interface signature is **`sync = function(url, mtd, params, cb)`**; where `url` is endpoint URL, `mtd` is the HTTP method like `GET, POST, PUT, DELETE` and `cb` is a callback function which receives the endpoint response. Extending or overriding Slicks Model `sync` is as simple as:

```javascript
var model = Slicks.Model('/users');
model.extend({
    sync: function (url, method, param, cb) {
		/*Persist or remote somewhere here and thereafter invoke the callback*/
        cb && cb({'text':'Sync override called...','method':method});
    }
});
/*Here you can then reliably post with the the new sync - simple, huh!*/
model.post('/users', {id: 'steve'}, function (e,msg) {
    if(!e)
	{
		console.log(msg);/*prints {'text':'Sync override called...','method':'post'} */
    }
});
```   

- **`on`:**  *on*  is the only way of subscribing to events on the model. You can even subscribe to custom events and trigger them appropriately as needed. There is an equivalent **`off`**, used to unsubscribed from a Slicks Model event or all Slicks Model events. When the event is not passed, it removes all event subscriptions from the model.  See  **`Slicks Model Events`** for more details. Note the issue of context when subscribing to Slicks Model events, it is very important. All you need to do to subscribe to a Slicks Model event or multiple events is to provide callback and/or context like so:

```javascript
/*Create a Slicks model*/
var model = Slicks.Model({email:'you@me.com'}),
/*Create event listener*/
listener = function(changedModel){
	console.log(changedModel.toJSON());
};
/*Subscribe to event on model. (model, last argument) here is the context, if omitted, then context will be null in the callback.*/
model.on('change',listener, model);
/*This triggers change event and listener will be called, context is null here*/
model.change('email','me@you.com');
```
You can equally listen for changes to each of the model attributes like so:

```javascript
    model.on('name:change',function(){
        //Attribute name changed; do stuff
    });
```
-  **`fire:`** *fire* gives us the opportunity to trigger events on the model, even our custom events. For instance, the `set` interface does not trigger any event but we want to notify subscribers that the model has changed after `set`ing a model attribute. Let us see how we can do this:

```javascript
var model = Slicks.Model('/users',{name:'steve',age:30});
/*change attribute and trigger change event, subscribers will be notified*/
model.set('age',25).fire('change');/* Yes, we can chain most of model methods*/
```
#### Slicks Model Events
Slicks Model events are intuitive and so easy to use. You can even use own custom events. The following events are available on Slicks Model; and can be subscribed to.

- `created:` a model was created.
- `change:` a model attribute changes.
- `destroy:` a model was deleted.
These can be subscribed to like the following:
```javascript
var jobs = Slicks.Model();
  /*Override 'sync' interface of the model*/
  jobs.extend({
      sync: function (url, mtd, param, cb) {
          cb({url:url, method:mtd});
      }
  });
/*Yes, you can chain your subscriptions*/
jobs.on('change',function(changedModel){
	console.log('Modified: ' +changedModel.toJSON());
})
.on('destroy',function(destroyedModel){
   console.log('Destroyed: ' + destroyedModel.toJSON());
})
.on('created',function(createdModel){
	console.log('Created: ' +createdModel.toJSON());
});

/*Trigger the events */
jobs.change('title','Developer').save(function(e,msg){
	/*Do stuff */
}).destroy(function(e,msg){
	/*Do stuff */
});
```

---
### Slicks Collection
Slicks Collection, in its simplest conception could be seen as an array or list of Slicks Models.
Slicks Collection has two(2) arguments: `url` and `isRealTime`. Of the 2 arguments, only `isRealTime` is optional as it is not supported yet(NSY); to be implemented(TBI).

**`url:`**This is the url of an HTTP `endpoint`(REST or plain actions endpoints), usually on a server somewhere e.g `'/user'`. Slicks Collection can be created like so:
```javascript
var collection = Slicks.Collection('/users');
```

#### Slicks Collection Exposed Interfaces
These are the exposed Slicks Collection functions:

- **`fetch:`** This does the initial retrieval of models from the store(depending on what your store is)usually sends a `GET` request to an `HTTP` endpoint for retrieval. This function triggers the *`reset`* event, which you can subscribe to for notification, especially in a view. See this in action:

```javascript
var users = Slicks.Collection('/users'),
   printUsers = function(){
       users.each(function(user){
           console.log(user.toJSON());
       });
   };
users.on('reset',printUsers).fetch();
```

- **`create:`** This creates a Slicks Model, based on the passed options, and save it, by sending a `POST` request to the `HTTP` endpoint; it thereafter, adds the created model to its list of models. This also triggers the *`add`* event, which can be subscribed to, especially in the view. Check this:
```javascript
	var users = Slicks.Collection('/users');
	/*Note that the passed in callback could be omitted*/
	users.create({name:'tom peters',age:45},function(e,createdModel){
		if(!e){
			console.log('Model created: ' + createdModel);
		}
	});
```

- **`add:`** *add* obviously add a Slicks Model to the collection but not necessarily to the store. **Note** that no event is raised here, however, if there are needs to notify the view, one can manually fire an `add` event on the collection.

- **`reset:`** *reset* clears the collection's list of Slicks Models to `[]`; the length is also updated; the `url` is not affected by `reset`. It triggers `change` event on the model.

- **`remove:`** *remove* obviously removes model from the collection. It fires a *`remove`* event.

- **`extend:`** *extend* helps us modify/extend the exposed functions of the Slicks Collection. Read Slicks Model *`extend`* interface for better understanding.

- **`asArray:`** *asArray* returns all Slicks Models in a Slicks Collection as an array of Slicks Models.

- **`get(Slicks Model):`** This can be used to retrieve a Slicks model from a collection, say if the model has a valid id.
- **`emptyModel:`** This is a handy method to retrieve a model, based on the collection's `url`, so that thereafter, the model can participate in all events related to the collection. For instance, when such model is saved, it is added to the collection automatically.

- **`sync:`** *sync*, like in `Slicks Model` is where communications to the back-end-engines, `BEE` or `HTTP` endpoints take place. The interface signature is **`sync = function(url, mtd, params, cb)`**; where `url` is endpoint URL, `mtd` is the HTTP method like `GET, POST, PUT, DELETE` and `cb` is a callback function which receives the endpoint response. By default, it does AJAX request to HTTP endpoints for the `create` and `fetch` interfaces. `sync` can be overridden via the Slicks Collection's `extend` interface like so, note that this is the earlier example extended:
```javascript
var users = Slicks.Collection('/users'),
   printUsers = function(){
       users.each(function(user){
           console.log(user.toJSON());
       });
   };
/*extend sync for mock purpose */   
users.extend({sync:function(url,mtd, params, cb){
    switch(mtd){
	    /*This works for fetch interface*/
        case 'get':
            cb && cb([
                {name:'steve',age:12},
                {name:'sam',age:32},
                {name:'tom',age:52},
                {name:'rita',age:17}
            ]);
            break;
        /*This works for create interface*/    
        case 'post':
	        params.id = 34;
	        cb && cb(params);
        break;
    }
}});

/*Yes chaining is ok*/
users.on('reset',printUsers).fetch().create({name:'Mary', age:10},function(e, msg){
	if(!e){
		console.log(msg);/*Newly created user details*/	
	}	
});
```
- **`on:`** *on* is the only way of subscribing to events on Slicks Collection. You can even subscribe to custom events and trigger them appropriately as needed. Read. There is an equivalent **`off`**, used to unsubscribed to a collection's event or all collection's events. When the event is not passed, it removes all event subscriptions from the collection. **Slicks Model Events** please. Note the issue of context when subscribing to Slicks Collection's events is very important, check the following examples:
```javascript
	var users = Slicks.Collection('/users'),
   printWithNoContext = function(){
	   console.log('With No Context');
	   /*context 'this' is null. */
       users.each(function(user){
           console.log(user.toJSON());
       });
   },
   printWithContext = function(){
	   console.log('With Context');
	   /*context 'this' is users*/
       this.each(function(user){
           console.log(user.toJSON());
       });
   };
	
	/*Extend sync for this purpose*/
	users.extend({sync:function(url,mtd, params, cb){
    switch(mtd){
	    /*This works for fetch interface*/
        case 'get':
            cb && cb([
                {name:'steve',age:12},
                {name:'sam',age:32},
                {name:'tom',age:52},
                {name:'rita',age:17}
            ]);
            break;
    }
}});

users.on('reset',printWithNoContext).on('reset',printWithContext, users).fetch();
```
-  **`fire:`** *fire* gives us the opportunity to trigger events on the model, even our custom events.

- **`each:`** Used to iterate over the models in the collection. Like in Arrays' forEach but with better performance. See the `code example above` for the use of Slicks Collection's `each` interface.

---

### Slicks View
Slicks Views are a sensible way of managing pieces of user interface, UI in a self-contained manner. The view expects all view templates in either pre-compiled `Dust.js` templates or inline text-based templates.

For instance, take a template for a list of users, the following shows the user item template and the compiled version for Dust.js use.
```html
<!--userItem.dust -->
{name} - {age} <a href='#' class='del_button'>delete</a>
```

```javascript
/*Compiled userItem.js Dust template*/
 (function (dust) {
    dust.register("userItem.dust", body_0);
    function body_0(chk, ctx) {
        return chk.w("").f(ctx.get(["name"], false), ctx, "h").w(" - ").f(ctx.get(["age"], false), ctx, "h").w(" <a href='#' class='del_button'>delete</a>");
    }

    body_0.__dustBody = !0;
    return body_0
}(dust));
```
#### These are the Slicks View exposed options
Slicks View has several options, which make the it highly customizable to your heart desires. The following are the options available in the `Slicks View`:

- **`events:`** *events* gives us the opportunity to bind events to the view declaratively. For instance given the following template:

```html
<!--userItem.dust -->
{name} - {age} <a href='#' class='del_button'>delete</a>
```
A view can bind event to the anchor with `class='del_button'` like this:
```javascript

    var userModel = Slicks.Model({url:'/user', attributes:{name:'tom', age:25}}),
        userItemView = Slicks.View({
             model:userModel,
             el:'li',//This wraps the template
             template:"{name} - {age} <a href='#' class='del_button'>delete</a>",
             events: {
                'click:.del_button': 'delete'
            },
            'delete': function (e) {
                e.preventDefault();
                this.model.destroy();
            }
        });
```
We used **`click`** event in the sample above but we could have used any of `blur, focus, change, keyup, keypress etc`.

- **`host:`** The *host* represents a DOM or any valid selector, which will be the container for the Slicks View i.e the view will be added to the `host`.

- **`el:`** *el* is a wrapper around the template, usually an html tag `e.g tr for table row, li for list item, table for table and so on`.

- **`model:`** The *model* is  a Slicks Model which is optional if no model was needed; it must, however, be specified if the view must render the state of a model.

- **`collection:`** The *collection* is mandatory when the view is a collection Slicks View. Collection views are such views like `table` , `dl`, `ol`  and  `ul`.

- **`templateFile:`** The *templateFile* is usually the file name of the dust template from which the template was generated. For instance, a `dust.js` template named `'user_row.dust'` automatically compiles to `'user_row.js'` and is registered as `'user_row.dust'` while another template named `'core/base.dust'` compiles to `'core/base.js'` and registered as `'core/base.dust'`.
-  **`template:`** The *template* is the inline text-based template supplied directly to the view. This can be used when the view is not involving; something like a list item could use the inline template type. However, a more involving template will be better as a `dust.js` pre-compiled template file, hence, `templateFile` will be the way to go. **Note** that `templateFile` take precedence over `template` as both will not be used together on the same Slick View.

- **`initialize:`** *initialize* allows you to do implement view setups. It is the first routine to run in the view, hence, it is the best place to register your events. A simple use case is as follows:

```javascript

var userItemView = Slicks.View({
      model:userModel,
      el:'li',//This wraps the template
      template:"{name} - {age} <a href='#' class='del_button'>delete</a>",
      //templateFile:'users/userItem',
      initialize:function()
	  {
	      this.model.on('change', this.render, this);
	      this.model.on('destroy', this.remove, this);
	      this.render();
	  },
      events: {
         'click:.del_button': 'delete'
     },
     'delete': function (e) {
         e.preventDefault();
         this.model.destroy();
     }
});
```
- **`remove:`** *remove* is usually called when the backing model for the view has been delete/destroyed. You will normally need not call this function unless you want a custom behaviour(the view listens to for the `destroy` event and remove the view appropriately).

- **`hide:`** *hide* is used to hide the view for whatever reason. You can pass arguments like *`fadeOut and slideUp`* to this function to control its behaviour.

- **`show:`** *show* is used to display the view if it was hidden for whatever reason. You can pass arguments like *`fadeIn, slideDown`* to this function to control its behaviour.

- **`render:`** *render*, when called, will add the view to the DOM, displaying the state of its model. *render* should be overridden in view that display contents of collection for consistent rendering.

- **`empty_before_render:`** *empty_before_render* is by default `true`; it determines whether/or not the view's `host`should be emptied before rendering should take place.

- **`beforeEvents:`** *beforeEvents* is called before any event is bound to the view and should be overridden appropriately when needed.

- **`lazy:`** *lazy* defaults to `false` and it determines whether the view should be rendered immediately or not.

- **`data:`** *data*, when called returns a JSON object  representing all the values of inputs on a form view.

- **`reset:`** *reset* clear all the values on a view; useful, especially on form views.

- **`extend:`** *extend* helps us modify/extend the options of the Slicks View. Read Slicks Model *`extend`* interface for better understanding.

###Slicks Router
Slick Router is a fork of Pathjs(details at https://github.com/mtrpcic/pathjs), a wonderful piece of module for mapping routes, for deep-linking amongst pages and handling browsers history.
 
#### These are the Slicks Router exposed interfaces
- **`goBack:`** *goBack*  can be used to go to the previous view.
- **`map:`**  This is where we assign a  request path to a handler routine.
```javascript
var Router = Slicks.Router();
/*:id is mandatory here, otherwise, this route will never be matched.*/
Router.map('#/comments/:id').to(function () {
	var commentId = this.params['id']
   alert('Comments with ID: ' + commentId);
});
```
- **`root:`** This specifies the default route in situation where no path is specified. See the listing below.

- **`rescue:`**  It traps all requests that do not match any configured route. See listing  under usage.

- **`dispatch:`** *dispatch* allows us navigate to another view by passing the **`path`** to the target view.
- **`listen:`** *listen* is very important, in fact, if you forgot to tell Slicks Router to listen, none of your routes would function at all. See listings below..

Slicks Router, in its simplest form,  allows you define your routes like so:
```javascript
var Router = Slicks.Router();
/*:id is mandatory here, otherwise, this route will never be matched.*/
Router.map('#/comments/:id').to(function () {
	var commentId = this.params['id']
   alert('Comments with ID: ' + commentId);
});
/*:id is optional here, so works for both '#/users' and '#/users/4'*/
Router.map('#/users(/:id)').to(function () {
   alert('Users');
});

Router.map('#/users/register/:query').to(function () {
/*this.query() is a JSON representing the passed model to be registered.*/
/*Check params under Slicks Model Exposed Interfaces*/
   alert('New user details: ' + JSON.stringify(this.query()));
});

/*Landing route when none is specified*/
Router.root("#/");
/*Notifications when a non-existent route is called*/
Router.rescue(function () {
    alert('404: Sorry, resource not found');
});
/*Call this last to start the Router.IMPORTANT*/
Router.listen();
    
```
## Simple Usage
Let us assume a user management view. The users will have attributes like `name and age` for instance. Further, our users will be displayed in a table as shown below:

```html
    <!--1. user.dust table template-->
      <thead>
      
         <tr>
            <th>Name</th>
            <th></th>
        </tr>
       </thead>
       <tbody>
       </tbody>
```
The above compiles to `user.js`. The next thing is to write our row template(in `dust.js`), which will contain each user record. Let us think of a user table row, a simple `dust.js` template for it looks as shown:

```html
   <!--2. user_row.dust-->
   <td>{name}</td><td><a href='#' class='details'>details</a>|<a href='#' class='remove'>delete</a></td>
```

**Note:**The above template must be compiled to javascript with `dust compiler`. The template above would be compiled into a `user_row.js` file and loaded in the head of your html file. Once that was done, the following Slick view will use the template like so:
Alternatively, inline template could be used.

Now let us tie everything together as shown below(I believe it is clear as it is heavy on comments):

```javascript

    var Slicks = require('slicks'),
       userCollection = Slicks.Collection('/user'),
       userTableView = Slicks.View({
            collection:userCollection,
            //specify which dom hosts this view e.g body
            host:'body',
            //define what wraps the template
            el:'table',
            /*See user.dust in 1 above*/
            templateFile:'user',
            initialize: function () {
                /***
                Collection Events e.g.

                add:new model was added to collection,
                remove:model was removed from collection,
                reset:collection was refreshed,
                change:one or more of the models in the collection was modified

                ***/
                this.collection.on('add', this.addRow, this);
                this.collection.on('reset', this.refresh, this);
            },
            start: function () {
                this.render();
                this.collection.fetch();
            },
            refresh:function(){

                //Save reference to view
                var self = this;
                this.collection.each(function(user){
                    self.addRow(user);
                })
            },
            addRow: function (user) {
                var rowView = this.userRow(user);
                rowView.render();
            },
            userRow:function(user){

                /*This creates a user row view,
                setting its model to the passed user model and returns it.*/
                return Slicks.View({
                       model:user,
                      /*define host for user row, the tbody of the user table*/
                      host: this.$el.find('tbody'),
                      /*define the template file, here, 'user_row.dust' 
                      in 2. above. Note that we could have used 'template' 
                      in place of 'templateFile' */
                      templateFile: 'user_row',
                      /*define what wraps the template*/
                      el: 'tr',
                      /*View events to be bound to the view*/
                      events: {
                          'click:.details': 'showDetails',
                          'click:.remove':'delete'
                      },
                      /*Handlers for view events*/
                      showDetails: function (e) {
                          e.preventDefault();
                          console.log('Details: ' + this.model.toJSON());
                      },
                      'delete': function (e) {
                          e.preventDefault();
                          this.model.destroy();
                      },
                      /*View initialization*/
                      initialize: function () {
                          this.model.on('change', this.render, this);
                          this.model.on('destroy', this.remove, this);
                      }
                  });

            }
       });

       /*Defining application routes*/
           var Router = Slicks.Router;
           
           Router.map('#/comments').to(function () {
              alert("Comments!");
           });
           Router.map('#/users').to(function () {
             userTableView.start();
           });
            Router.root('#/users');
           
           //When no route was matched
           Router.rescue(function () {
               alert(
                   '404: Sorry, resource not found'
               );
           });
           /*This is important. Without this, routing will not work.*/
           Router.listen();
```

Thank you, this is the end for now.