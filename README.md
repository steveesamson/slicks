#Slicks

Slicks is a simple Javascript MVC framework. If you have used backbone.js, you will like Slicks.It relies on the linkedin dust templating engine for server-side precompiled templates. It makes use of browserify for requiring modules, hence, it is a fan of browserify.

##Components

Slicks has the following:
* Model
* Collection
* View
* Router


###Model
This is basically any data of interest to you. Slicks Model has these properties and methods:
####Model Options
There are two options(optional) to Slick Models. These are shown below usually passed as {url:'value',attributes:{}}:

**url:**This is the url of a REST endpoint(we will support actions too), usually on a server somewhere e.g '/user'.

**attributes:**This describes the fields in the model(not enforced now but would be enforced) e.g {name:'foo',age:10}.

**sync:** *sync* is needed to remote to your REST endpoints. It takes 4 arguments: **url, method, data and callback**. You can override this in your model to do your custom persistence logic like so:
```javascript
    var myData = {},
        id = 0,
        model = Slicks.Model({
        sync:function(url,method,data,callback){
                switch(method)
                {
                    case 'post':
                    myData[id] = data;
                    i++;
                    break;
                    case 'delete'
                    delete myData[data.id];
                    .
                    .
                    .
                }
        }
    });
```
####Model Functions
These are the exposed model functions, which should not be overridden unless you know what you are doing.

**save:**This usually sends a request to a REST endpoint for persistence. This function triggers the *'created'* event, which you can listen for **ONLY** if the model is not part of a collection. Otherwise, do not listen for this event but listen for the *'add'* event on the containing collection as it will listen for the *'created'* event and expose it as its own *'add'* event.

**destroy:**This sends a request to a REST endpoint for deletion and removes the model from a collection if it belongs to one. It also triggers the *'destroy'* event, which you can listen for **ONLY** if the model is not part of a collection. Otherwise, do not listen for this event but listen for the *'remove'* event on the containing collection as it will listen for the *'destroy'* and expose it as its own *'remove'* event.

**set:** *set* assigns/modifies model attributes e.g mod.set('name','Tom'). *set* triggers the *'change'* event, which you can listen for; it passes the modified model as argument.

**get:** *get* obviously retrieves the appropriate model attribute by passing the attribute key e.g mod.get('name').

**toObject:** *toObject* returns the model attributes as a map e.g mod.toObject().

**toJSON:** *toJSON* returns the model attributes as a JSON string e.g mod.toJSON(),

**on:** *on* is the only way of subscribing/registering to events on the model. You can even subscribe to custom events and trigger them appropriately as needed. More on this under **Model Events**.


####Model Events
Slicks Model events are intuitive and so easy to use. You can even use own custom events. All you need to do is subscribe to an event or multiple events and provide callback and context like so:
```javascript
   var model = Slicks.Model({attributes:{name:'Tom'},url:'/user'});
   model.on('change',function(cmodel){
        //The modified model is passed down. Not much use here;
        //but in a view or in a collection, of great use.
        console.log('changed model:' +  cmodel.toJSON());
   },model);
   //change the name attribute and save it; this will trigger change event.
   model.set('name','Paul').save();
```
You can equally listen to changes to each of the model attributes like so:
```javascript
    model.on('name:change',function(){
        //Do stuffs
    });
```
###Collection
Slicks Collection, in its simplest conception could be seen as an array of Slicks models.
####Collection Options
Slick collection has three (3) options(all but url are optional): url,sync and model. If, however, there is need to use a REST endpoint, the url is needed. The options are specified as a map like {url:'',model:}. The sync may be overridden to provide custom persistence and retrieval.

**url:**This is the url of a REST endpoint(we will support actions too), usually on a server somewhere e.g '/user'.

**model:**This describes the model type(not enforced now but would be enforced) e.g an instance of Slicks.Model.

**comets:** *comets* allows you to react to socket messages from socket servers. It has only one argument, the message. This works only when the watch function of the collection is being used Please see http://socket.io for more info.

**sync:** *sync* is needed to remote to your REST endpoints. It takes 4 arguments: **url, method, data and callback**. You can override this in your collection to do your custom persistence logic like so:

```javascript
    var userCollection = Slicks.Collection({
        sync:function(url,method,data,callback){
            switch(method)
            {
                case 'post':

                    var model = Slicks.Model({attributes:data,url:this.url});
                    this.add(model);
                    callback && callback(data);
                    break;

                case 'delete'
                    var model = Slicks.Model({attributes:data,url:this.url});
                    this.remove(model);
                    callback && callback(data);

                .
                .
                .
            }
        }
    });
```
####Collection Functions
These are the exposed collection functions, which should not be overridden unless you know what you are doing.

**fetch:**This does the initial retrieval of models from the store(depending on what your store is)usually sends a GET request to a REST endpoint for retrieval. This function triggers the *'reset'* event, which you can listen for, especially in the view.

**create:**This does the persistence of models to the store. Usually, sends a request to a REST endpoint for creation of model and then add the model to the collection. It also triggers the *'add'* event, which you can listen for, especially in the view.

**add:** *add* obviously add a model to the collection but not necessarily to the store. **Note** that no event is raised here.

**remove:** *remove* obviously removes model from the collection. It raises a *'remove'* event.

**watch:** *watch* enables a collection to subscribe to socket events from the server e.g in node.js(include socket.io.js please to use this),

**on:** *on* is the only way of subscribing/registering to events on the collection. You can even subscribe to custom events and trigger them appropriately as needed. Read **Model Events** please.

**forEach:** Used to iterate over the models in the collection. Exactly like in Arrays.

###View
Slicks Views are a sensible way of managing pieces of UI in a self-contained manner. The view expects all view templates in as  pre-compiled dust.js templates.
####View Options
The following are the options available in the view:
**events:**

**host**

**el:**

**model:**

**collection:**

**template:**

**initialize:** *initialize* allows you to do prep the view. It is the first function to execute in the view, hence, it is the best place to register your events. A simple use case is as follows:

```javascript
    var useRow = Slicks.View({
        initialize:function()
        {
            this.model.on('change', this.render, this);
            this.model.on('destroy', this.remove, this);
            this.render();
        }
    });
```
####View Functions
These are the exposed view functions, which should not be overridden unless you know what you are doing.

###Router

## Installation

  npm install slicks --save

## Usage
Let us assume a user management app. The users will have attributes like name and age for instance. Further, our users will be displayed in a table as shown below:

```html
   <table class='users'>
       <thead>
         <tr>
            <th>Name</th>
            <th>Age</th>
        </tr>
       </thead>
       <tbody>

       </tbody>
   </table>
```

The next thing is to write our row template(in dust.js), which will contain each user record. Let us think of a user table row, a simple dust.js template for it looks as shown:

```html
   <!--user_row.dust-->
   <td>{name}</td><td><a href='#' class='details'>details</a></td>
```
**Note:**The above template must be compiled to javascript with dust compiler. The template above would be compiled into a user_row.js file and loaded in the head of your html file. Once that was done, the following Slick view will use the template like so:

```javascript
   var userRow = Slicks.View({
          //define host for user row
          host: '#user tbody',
          //define the template name, in this case, 'user_row'
          template: 'user_row',
          //define what wraps the template
          el: 'tr',
          events: {
              'click:.details': 'showDetails'
          },
          showDetails: function (e) {
              e.preventDefault();

              console.log(this.model.get('name') + ' was clicked.');
              this.hide();
          },
          initialize: function () {
              this.model.on('change', this.render, this);
              this.model.on('destroy', this.remove, this);
              this.render();

              var self = this;

          }
   });
```

```javascript

   var Slicks = require('slicks'),
       userCollection = Slicks.Collection({url:'/user'}),
       userTableView = Slicks.View({
            collection:userCollection,
            //specify which dom hosts this view e.g body
            host:'body',
            initialize: function () {
                /***
                Collection Events e.g.

                add:new model was added to collection,
                remove:model was removed from collection,
                reset:collection was refreshed,
                change:one or more of the models in the collection was modified

                ***/
                this.collection.on('add', this.arrival, this);
                this.collection.on('reset', this.render, this);
                this.collection.on('remove', this.render, this);
            },
            start: function () {
                this.collection.fetch();
            },
            arrival: function (mdl) {
                var tpl = this.defs();
                tpl.model = mdl;
                Slicks.View(tpl);
            },
            template:'user_row',//This takes the template's file name by default
       });
````
