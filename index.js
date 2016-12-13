if (typeof String.prototype.base64Encode == 'undefined') {
    String.prototype.base64Encode = function() {
        if (typeof btoa != 'undefined') return btoa(this); // browser
        if (typeof Buffer != 'undefined') return new Buffer(this, 'utf8').toString('base64'); // Node.js
        throw new Error('No Base64 Encode');
    };
}

/** Extend String object with method to decode base64 */
if (typeof String.prototype.base64Decode == 'undefined') {
    String.prototype.base64Decode = function() {
        if (typeof atob != 'undefined') return atob(this); // browser
        if (typeof Buffer != 'undefined') return new Buffer(this, 'base64').toString('utf8'); // Node.js
        throw new Error('No Base64 Decode');
    };
}

var Crypt = (function(){


    var encode = function (s) {
        var enc = "";
        var str = "";
        // make sure that input is string
        str = s+"";

        for (var i = 0; i < s.length; i++) {
            // create block
            var a = s.charCodeAt(i);
            // bitwise XOR
            var b = a ^ k;
            enc = enc + String.fromCharCode(b);
        }
        return enc;
    };

    return{
      encrypt:function(clear, key){

          //var enc = encode(clear, key);
          //console.log("cl:%s, sd:%s",clear, enc);
          //return enc.base64Encode();
          return btoa(clear);
      },
      decrypt:function(sealed, key){

          //console.log(sealed);
          //sealed = sealed.base64Decode();
          //var dec = encode(sealed, key);
          //console.log("cl:%s, sd:%s",dec, sealed);
          //return dec;

          return atob(sealed);
      }
    };
}());

var clear = '{name:"Steve Samson", age:10, done:true, address:"34, Araromi - Iwo, Ikosi"}',
    key = '2',
    sealed = Crypt.encrypt(clear,key);


console.log(sealed);
var decr = Crypt.decrypt(sealed, key);
console.log(decr);
console.log(decr === clear);
