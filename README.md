#Slicks

Slicks is a simple Javascript MVC framework. If you have used backbone.js, you will like Slicks.It relies on the linkedin dust templating engine for server-side precompiled templates. It makes use of browserify for requiring modules, hence, it is a fan of browserify.

##Components

Slicks has the following:
* `Model`
* `Collection`
* `View`
* `Router`


###Model
This is basically any data of interest to you. Slicks Model has these properties and methods:
####Model Options
There are two options(optional) to Slick Models. These are shown below usually passed as `{url:'value',attributes:{}}`:

**`url:`**This is the url of a REST endpoint(we will support actions too), usually on a server somewhere e.g `'/user'`

**`attributes:`**This describes the fields in the model(not enforced now but would be enforced) e.g `{name:'foo',age:10}`.

**`sync:`** *sync* is needed to remote to your REST endpoints. It takes 4 arguments: **`url, method, data and callback`**. You can override this in your model to do your custom persistence logic like so:

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

**`save:`**This usually sends a request to a REST endpoint for persistence. This function triggers the *`created`* event, which you can listen for **ONLY** if the model is not part of a collection. Otherwise, do not listen for this event but listen for the *`add`* event on the containing collection as it will listen for the *`created`* event and expose it as its own *`add`* event.

**`destroy:`**This sends a request to a REST endpoint for deletion and removes the model from a collection if it belongs to one. It also triggers the *`destroy`* event, which you can listen for **ONLY** if the model is not part of a collection. Otherwise, do not listen for this event but listen for the *`remove`* event on the containing collection as it will listen for the *`destroy`* and expose it as its own *`remove`* event.

**`set:`** *set* assigns/modifies model attributes `e.g mod.set('name','Tom')`. *set* triggers the *`change`* event, which you can listen for; it passes the modified model as argument.

**`get:`** *get* obviously retrieves the appropriate model attribute by passing the attribute key `e.g mod.get('name')`.

**`toObject:`** *toObject* returns the model attributes as a map `e.g mod.toObject()`.

**`toJSON:`** *toJSON* returns the model attributes as a JSON string `e.g mod.toJSON()`.

**`on`:** *on* is the only way of subscribing/registering to events on the model. You can even subscribe to custom events and trigger them appropriately as needed. More on this under **`Model Events`**.


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
Slick collection has four (4) options(all but `url` are optional): `url,sync, comets and model`. If, however, there is need to use a `REST endpoint`, the `url` is needed. The options are specified as a map like `{url:'',model:}`. The sync may be overridden to provide custom persistence and retrieval.

**`url:`**This is the url of a `REST endpoint`(we will support actions too), usually on a server somewhere e.g `'/user'`.

**`model:`**This describes the model type(not enforced now but would be enforced) e.g an instance of `Slicks.Model`.

**`comets:`** *comets* allows you to react to socket messages from socket servers. It has only one argument, the `message`. This works only when the `watch` function of the collection is being used. Please see http://socket.io for more info.

**`sync:`** *sync* is needed to remote to your `REST endpoints`. It takes 4 arguments: **`url, method, data and callback`**. You can override this in your collection to do your custom persistence logic like so:

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

                case 'delete':
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

**`fetch:`**This does the initial retrieval of models from the store(depending on what your store is)usually sends a `GET` request to a `REST endpoint` for retrieval. This function triggers the *`reset`* event, which you can listen for, especially in the view.

**`create:`**This does the persistence of models to the store. Usually, sends a request to a `REST endpoint` for creation of model and then add the model to the collection. It also triggers the *`add`* event, which you can listen for, especially in the view.

**`add:`** *add* obviously add a model to the collection but not necessarily to the store. **Note** that no event is raised here.

**`remove:`** *remove* obviously removes model from the collection. It raises a *`remove`* event.

**`watch:`** *watch* enables a collection to subscribe to socket events from the server `e.g node.js(include socket.io.js please to use this)`

**`on:`** *on* is the only way of subscribing/registering to events on the collection. You can even subscribe to custom events and trigger them appropriately as needed. Read **Model Events** please.

**`forEach:`** Used to iterate over the models in the collection. Exactly like in Arrays.

###View
Slicks Views are a sensible way of managing pieces of UI in a self-contained manner. The view expects all view templates in as  pre-compiled `dust.js` templates.
####View Options
The following are the options available in the view:

**`events:`** *events* gives us the opportunity to bind events to the view declaratively. For instance given the following template:

```html
   <!--user_row.dust-->
   <td>{name}</td><td><a href='#' class='details'>details</a>|<a href='#' class='remove'>delete</a></td>
```
A view can bind event to the anchor with `class='details'` like this:
```javascript

    var user = Slicks.Model({url:'/user', attributes:{name:'tom', age:25}}),
        userRow = Slicks.View({
             model:user,
             events: {
                'click:.details': 'showDetails',
                'click:.remove': 'delete'
            },
            showDetails: function (e) {
                e.preventDefault();
                console.log('Details: ' + this.model.toJSON());
            },
            'delete': function (e) {
                e.preventDefault();
                this.model.destroy();
            }
        });
```
**We used click event in the sample above but we could have used any of `blur, focus etc`.**

**`host:`** The *host* represents a dom or any valid selector, which will be the container for the view i.e the view will be appended to the host.

**`el:`** *el* is a wrapper around the template, usually an html tag `e.g tr for table row, li for list item and so on`.

**`model:`** The *model* is always needed if the view is not a collection view but optional for collection views.

**`collection:`** The *collection* is mandatory when the view is a collection view.

**`template:`**The *template* is usually the file name of the dust template from which the template was generated. For instance, a `dust.js` template named `'user_row.dust'` automatically compiles to `'user_row.js'` and is registered as `'user_row'`.

**`initialize:`** *initialize* allows you to do view prep. It is the first function to execute in the view, hence, it is the best place to register your events. A simple use case is as follows:

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

**`remove:`** *remove* is usually called when the backing model for the view has been delete/destroyed. You will normally need not call this function unless you want a custom behaviour.

**`hide:`** *hide* is used to hide the view for whatever reason. You can pass arguments like *`fadeOut, hide and slideUp`* to this function to control its behaviour.

**`show:`** *show* is used to display the view if it was hidden for whatever reason. You can pass arguments like *`fadeIn, show and slideDown`* to this function to control its behaviour.

**`render:`** *render*, when called, will add the view to the dom, displaying the state of its model. *render* should be overridden in view that display contents of collection.

###Router
??

## Installation
```cli
  npm install slicks --save
```
## Usage
Let us assume a user management view. The users will have attributes like `name and age` for instance. Further, our users will be displayed in a table as shown below:

```html
    <!--user.dust table template-->
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
   <!--user_row.dust-->
   <td>{name}</td><td><a href='#' class='details'>details</a>|<a href='#' class='remove'>delete</a></td>
```

**Note:**The above template must be compiled to javascript with `dust compiler`. The template above would be compiled into a `user_row.js` file and loaded in the head of your html file. Once that was done, the following Slick view will use the template like so:

Now let us tie everything together as shown below(I believe it is clear as it is heavy on comments):

```javascript

    var Slicks = require('slicks'),
       userCollection = Slicks.Collection({url:'/user'}),
       userTableView = Slicks.View({
            collection:userCollection,
            //specify which dom hosts this view e.g body
            host:'body',
            el:'table',
            template:'user',
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
                this.forEach(function(user){
                    self.addRow(user);
                })
            },
            addRow: function (user) {
                var rowView = this.userRow(user);
                rowView.render();
            },
            userRow:function(user){

                //This creates a user row view, setting its model to the passed user model and returns it.
                return Slicks.View({
                       model:user,
                      //define host for user row, the tbody of the user table
                      host: this.$el.find('tbody'),
                      //define the template name, in this case, 'user_row'
                      template: 'user_row',
                      //define what wraps the template
                      el: 'tr',
                      //View events to be bound to doms
                      events: {
                          'click:.details': 'showDetails',
                          'click:.remove':'delete'
                      },
                      //Handlers for view events
                      showDetails: function (e) {
                          e.preventDefault();
                          console.log('Details: ' + this.model.toJSON());
                      },
                      'delete': function (e) {
                          e.preventDefault();
                          this.model.destroy();
                      },
                      //View initialization
                      initialize: function () {
                          this.model.on('change', this.render, this);
                          this.model.on('destroy', this.remove, this);
                      }
                  });

            }
       });
````

#Test

```cli
    npm test
```
