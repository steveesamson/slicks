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
       var Slicks = require('slicks')'
       userModel = Slicks.Model({}),
       usercollection = Slicks.Collection({}),
       userView = Slicks.View();
       
