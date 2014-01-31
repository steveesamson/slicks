#Slicks

Slicks is a simple Javascript MVC framework. If you have used backbone.js, you will like Slicks.

Slicks relies on the linkedin dust templating engine for server-side precompiled templates.

Slicks makes use of browserify for requiring modules, hence, it is a fan of browserify.

##Components

Slicks has the following:

* Model
* View
* Controller
* Router

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

The next thing is to write our row template(in dust.js), which will contain each user record. This is shown below:

```html
   <!--user_row.dust-->
   <td>{name}</td><td>{age}</td>
```
*Note:*The above template must be compiled to javascript with dust compiler.

```javascript

   var Slicks = require('slicks'),

       userModel = Slicks.Model({url:'/user',attributes:{name:'tom', age:16}),

       userCollection = Slicks.Collection({url:'/user'}),

       userTableView = Slicks.View({
            collection:userCollection,
            //specify which dom hosts this view e.g body
            host:'body',
            initialize: function () {
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
