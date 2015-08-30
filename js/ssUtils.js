var Utils = {
  
  getAreaIdentifier: function() {
    // Identifiers are obtained by slice to remove leading '#' or '/'.
    var identifier = window.location.hash.slice(1);
    identifier = identifier || window.location.pathname.slice(1);
    return identifier.replace(/\/$/, "") || null;
  },
  
  getJsonURL: function() {
    var identifier = Utils.getAreaIdentifier();
    if (identifier) {
      return SmartSpace.apiURL + identifier.toLowerCase();
    } else {
      return null;
    }
  },
  
  getParam: function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  },
  
  isLoadable: function(url) {
    var loadable = true;
    $.ajax({
      type: 'POST',
      url: '/loadable',
      data: { url: url },
      dataType: 'json',
      success: function(data) {
        loadable = data.loadable == 'true';
      },
      async: false
    });
    return loadable;
  },
  
  randomElement: function(items) {
    return items[Math.floor(Math.random()*items.length)];
  },
  
  cloneList: function(list) {
    var newList = jQuery.extend(true, {}, list);
    return newList;
  },

  pairwise: function(list) {
    if (list.length < 2) { return []; }
    var first = list[0],
        rest  = list.slice(1),
        pairs = rest.map(function (x) { return [first, x]; });
    return pairs.concat(Utils.pairwise(rest));
  },
  
  length: function(data) {
    var key, count = 0;
    for(key in data) {
      if(data.hasOwnProperty(key)) {
        count++;
      }
    }
    return count;
  },
  
  toRad: function(angle) {
    return angle * (Math.PI / 180);
  },
  
  parseDate: function(tdate) {
    var system_date = new Date(Date.parse(tdate));
    var user_date = new Date();
    if (K.ie) {
      system_date = Date.parse(tdate.replace(/( \+)/, ' UTC$1'))
    }
    var diff = Math.floor((user_date - system_date) / 1000);
    if (diff <= 1) {return "just now";}
    if (diff < 20) {return diff + " seconds ago";}
    if (diff < 40) {return "half a minute ago";}
    if (diff < 60) {return "less than a minute ago";}
    if (diff <= 90) {return "one minute ago";}
    if (diff <= 3540) {return Math.round(diff / 60) + " minutes ago";}
    if (diff <= 5400) {return "1 hour ago";}
    if (diff <= 86400) {return Math.round(diff / 3600) + " hours ago";}
    if (diff <= 129600) {return "1 day ago";}
    if (diff < 604800) {return Math.round(diff / 86400) + " days ago";}
    if (diff <= 777600) {return "1 week ago";}
    if (diff <= 777600*2) {return "2 weeks ago";}
    if (diff <= 777600*3) {return "3 weeks ago";}
    if (diff <= 2629743) {return "1 month ago";}
    if (diff <= 2629743*2) {return "2 months ago";}
    if (diff <= 2629743*3) {return "3 months ago";}
    if (diff <= 2629743*4) {return "4 months ago";}
    if (diff <= 2629743*5) {return "5 months ago";}
    if (diff <= 2629743*6) {return "6 months ago";}
    if (diff <= 2629743*7) {return "7 months ago";}
    if (diff <= 2629743*8) {return "8 months ago";}
    if (diff <= 2629743*9) {return "9 months ago";}
    if (diff <= 2629743*10) {return "10 months ago";}
    if (diff <= 2629743*11) {return "11 months ago";}
    if (diff <= 2629743*12) {return "a year ago";}
    return "over a year ago";
  },
  
  //+ Jonas Raoni Soares Silva
  //@ http://jsfromhell.com/array/shuffle [v1.0]
  shuffle: function(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  },

  findSimilar: function(data, excludedAttributes) {
    var result = {};
    // Iterate through each object
    data.forEach(function(person) {
      // Iterate through each attribute category (e.g. name, surname, ...)
      for(var attributeCategory in person){
        // Skip attributes that we don't care about (e.g. id)
        if (excludedAttributes.indexOf(attributeCategory) > -1)
          continue;
        // Get the value of the attribute category (e.g. George, Jeff, ...)
        var attribute = person[attributeCategory];
        // Check if the attribute category is already in the array
        if (result[attributeCategory] == undefined) {
          // Create a new attribute category
          result[attributeCategory] = {};
          // Create a new attribute in the category (e.g. George, Jeff, )
          // This is what the objects share in common
          result[attributeCategory][attribute] = [];
          // Add the id of the object
          result[attributeCategory][attribute].push(person.id);
        } else {
          // Check if the attribute in the category is already in the array
          if (result[attributeCategory][attribute] == undefined) {
            // Create a new attribute in the category (e.g. George, Jeff, )
            // This is what the objects share in common
            result[attributeCategory][attribute] = [];
            // Add the id of the object
            result[attributeCategory][attribute].push(person.id);
          } else {
            // We have found two objects which have something in common!
            result[attributeCategory][attribute].push(person.id);
          }
        }
      }
    });

    // Clean-up the results, so that we end-up 
    // only with objects sharing common attributes
    result = Utils.cleanup(result);

    return result;
  },
  
  // Remove single entries
  cleanup: function(dirtyObj) {
    // Iterate through each attribute category (e.g. name, surname, ...)
    for(var attributeCategory in dirtyObj){
      // Iterate through each attribute in the category (e.g. Jeff, George, ...)
      for(var attribute in dirtyObj[attributeCategory]){
        // If the array containing the ID's has a length of one, delete the attribute
        if (dirtyObj[attributeCategory][attribute].length == 1) {
          delete dirtyObj[attributeCategory][attribute];
          // If the category has no objects, delete it
          if (Object.keys(dirtyObj[attributeCategory]).length == 0)
            delete dirtyObj[attributeCategory];
        }
      }
    }
    return dirtyObj;
  }
  
};

String.prototype.parseURL = function() {
  return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g,
    function(url) {
		  return '<a href="'+url+'" target="_blank">'+url+'</a>';
	});
};

String.prototype.parseUsername = function() {
	return this.replace(/[@]+[A-Za-z0-9-_]+/g, function(u) {
		var username = u.replace("@","")
		return '<a href="http://twitter.com/'+username+'" target="_blank">'+u+'</a>';
	});
};

String.prototype.parseHashtag = function() {
	return this.replace(/[#]+[A-Za-z0-9-_]+/g, function(t) {
		var tag = t.replace("#","")
		return '<a href="http://twitter.com/hashtag/'+tag+'" target="_blank">'+t+'</a>';
	});
};

$.fn.preload = function() {
  this.each(function(){
    $('<img/>')[0].src = this;
  });
};

var K = function () {
  var a = navigator.userAgent;
  return {
      ie: a.match(/MSIE\s([^;]*)/)
  }
}();

Array.prototype.remove = function(){
  var what, a = arguments, L = a.length, ax;
  while(L && this.length){
    what = a[--L];
    while((ax = this.indexOf(what))!= -1){
      this.splice(ax, 1);
    }
  }
  return this;
};

/**
 * js-weighted-list.js
 * 
 * version 0.2
 * 
 * This file is licensed under the MIT License, please see MIT-LICENSE.txt for details.
 * 
 * https://github.com/timgilbert/js-weighted-list is its home.
 */

var WeightedList = (function() {

  function _WeightedList(initial) { 
    this.weights = {};
    this.data = {};
    this.length = 0;
    this.hasData = false;

    initial = typeof initial !== 'undefined' ? initial : [];

    if (Array.isArray(initial)) {
      for (var i = 0; i < initial.length; i++) {
        //var item = initial[i];
        //this.push(item[0], item[1], item[2]);
        this.push(initial[i]);
      }
    } else {
      throw new Error('Unknown object "' + initial.toString() + '" passed to ' + 
                      'WeightedList constructor! (Expected array or nothing)');
    }
  }

  _WeightedList.prototype = {
    /**
     * Add a single item to the list.  The parameter passed in represents a single 
     * key, with a weight and optionally some data attached.
     * 
     * The parameter to this function can either be a 2-3 element array of 
     * [k, w, d] for key, weight and data (data is optional) or an object with the 
     * values {'key': k, 'weight': w, 'data': d} where d is optional.
     */
    push: function(element) {
      var key, weight, data;

      if (Array.isArray(element)) {
        key = element[0], weight = element[1], data = element[2];
        if (typeof key === 'undefined') {
          // Eg, wl.push([])
          throw new Error('In WeightedList.push([ ... ]), need at least two elements');
        } else if (typeof weight === 'undefined') {
          // I suppose we could default to 1 here, but the API is already too forgiving
          throw new Error('In array passed to WeightedList.push([ ... ]), second ' + 
                          'element is undefined!');
        }
      } else if (typeof element === 'object') {
        // We expect {"key": "zombies", "weight": 10, "data": {"fast": true}}
        key = element.key, weight = element.weight, data = element.data;
        if (typeof key === 'undefined') {
          throw new Error("In WeightedList.push({ ... }), no {'key': 'xyzzy'} pair found");
        } else if (typeof weight === 'undefined') {
          // I suppose we could default to 1 here, but the API is already too forgiving
          throw new Error('In array passed to WeightedList.push({ ... }), no ' + 
                          "{'weight': 42} pair found");
        }
    } else {
        // else what the heck were you trying to give me?
        throw new Error('WeightedList.push() passed unknown type "' + typeof element + 
                        '", expected [key, weight] or {"key": k, "weight": w}');
      }
      return this._push_values(key, weight, data);

    },
    /**
     * Add an item to the list
     * @access private
     * @param {String} key the key under which this item is stored
     * @param {number} weight the weight to assign to this key
     * @param {?Object} data any optional data associated wth this key
     */
    _push_values: function(key, weight, data) {
      //console.debug('k:', key, 'w:', weight, 'd:', data);

      if (this.weights[key]) {
        throw new Error('');
      }
      if (typeof weight !== typeof 1) {
        throw new Error('Weight must be numeric (got ' + weight.toString() + ')');
      }
      if (weight <= 0)  {
        throw new Error('Weight must be >= 0 (got ' + weight + ')');
      }

      this.weights[key] = weight;

      if (typeof data !== 'undefined') {
        this.hasData = true;
        this.data[key] = data;
      }
      this.length++;
    },
    
    /** 
     * Add the given weight to the list item with the given key.  Note that if 
     * the key does not already exist, this operation will silently create it.
     * 
     * @todo might be nice to have a version of this that would throw an error 
     *       on an unknown key.
     */
    addWeight: function(key, weight) {
      this.weights[key] += weight;
    },
    
    /**
     * Select n random elements (without replacement), default 1.
     * If andRemove is true (default false), remove the elements
     * from the list.  (This is what the pop() method does.)
     */
    peek: function(n, andRemove) {
      if (typeof n === 'undefined') {
        n = 1;
      }
      andRemove = !!andRemove;

      if (this.length - n < 0) {
        throw new Error('Stack underflow! Tried to retrieve ' + n + 
                        ' element' + (n === 1 ? '' : 's') + 
                        ' from a list of ' + this.length);
      }

      var heap = this._buildWeightedHeap();
      //console.debug('heap:', heap);
      var result = [];
      
      for (var i = 0; i < n; i++) {
        var key = heap.pop();
        //console.debug('k:', key);
        if (this.hasData) {
          result.push({key: key, data: this.data[key]});
        } else {
          result.push(key);
        }
        if (andRemove) {
          delete this.weights[key];
          delete this.data[key];
          this.length--;
        }
      }
      return result;
    },
    
    /**
     * Return the entire list in a random order (note that this does not mutate the list)
     */
    shuffle: function() {
      return this.peek(this.length);
    },
    
    /**
     * 
     */
    pop: function(n) {
      return this.peek(n, true);
    },
    
    /**
     * Build a WeightedHeap instance based on the data we've got
     */
    _buildWeightedHeap: function() {
      var items = [];
      for (var key in this.weights) if (this.weights.hasOwnProperty(key)) {
        items.push([key, this.weights[key]]);
      }
      //console.log('items',items);
      return new _WeightedHeap(items);
    }
  };

  /**
   * This is a javascript implementation of the algorithm described by 
   * Jason Orendorff here: http://stackoverflow.com/a/2149533/87990
   */
  function _HeapNode(weight, value, total) {
    this.weight = weight;
    this.value = value;
    this.total = total;  // Total weight of this node and its children
  }
  /**
   * Note, we're using a heap structure here for its tree properties, not as a 
   * classic binary heap. A node heap[i] has children at heap[i<<1] and at 
   * heap[(i<<1)+1]. Its parent is at h[i>>1]. Heap[0] is vacant.
   */
  function _WeightedHeap(items) {
    this.heap = [null];   // Math is easier to read if we index array from 1
    
    // First put everything on the heap 
    for (var i = 0; i < items.length; i++) {
      var weight = items[i][1];
      var value = items[i][0];
      this.heap.push(new _HeapNode(weight, value, weight));
    }
    // Now go through the heap and add each node's weight to its parent
    for (i = this.heap.length - 1; i > 1; i--) {
      this.heap[i>>1].total += this.heap[i].total;
    }
    //console.debug('_Wh heap', this.heap);
  }

  _WeightedHeap.prototype = {
    pop: function() {
      // Start with a random amount of gas
      var gas = this.heap[1].total * Math.random();
      
      // Start driving at the root node
      var i = 1;  
      
      // While we have enough gas to keep going past i:
      while (gas > this.heap[i].weight) {
        gas -= this.heap[i].weight;     // Drive past i
        i <<= 1;                        // Move to first child
        if (gas > this.heap[i].total) {
          gas -= this.heap[i].total;    // Drive past first child and its descendants
          i++;                          // Move on to second child
        }
      }
      // Out of gas - i is our selected node.
      var value = this.heap[i].value;
      var selectedWeight = this.heap[i].weight;
      
      this.heap[i].weight = 0;          // Make sure i isn't chosen again
      while (i > 0) {
        // Remove the weight from its parent's total
        this.heap[i].total -= selectedWeight;
        i >>= 1;  // Move to the next parent
      }
      return value;
    }
  };

  //  NB: another binary heap implementation is at
  // http://eloquentjavascript.net/appendix2.html

  return _WeightedList;
})();

/*!
 * Autolinker.js
 * Version 0.6.0
 * 
 * Copyright(c) 2014 Gregory Jacobs.
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 * 
 * https://github.com/gregjacobs/Autolinker.js
 */
var Autolinker={htmlRegex:/<(\/)?(\w+)(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g,prefixRegex:/^(https?:\/\/)?(www\.)?/,link:function(h,d){d=d||{};var k=Autolinker.htmlRegex,r=Autolinker.matcherRegex,i=("newWindow" in d)?d.newWindow:true,e=("stripPrefix" in d)?d.stripPrefix:true,a=d.truncate,g=("twitter" in d)?d.twitter:true,o=("email" in d)?d.email:true,s=("urls" in d)?d.urls:true,j,q=0,b,m="",l=0;function f(t){t=t.replace(r,function(O,A,x,w,v,u){var E=A,D=x,L=w,y=v,F=u,C="",B="",M=[];var G=O.charAt(O.length-1);if(G===")"){var z=O.match(/\(/g),J=O.match(/\)/g),N=(z&&z.length)||0,K=(J&&J.length)||0;if(N<K){O=O.substr(0,O.length-1);B=")"}}var I=O,H=O;if((E&&!g)||(y&&!o)||(F&&!s)){return C+H+B}if(E){C=D;I="https://twitter.com/"+L;H="@"+L}else{if(y){I="mailto:"+y;H=y}else{if(!/^[A-Za-z]{3,9}:/i.test(I)){I="http://"+I}}}if(e){H=H.replace(Autolinker.prefixRegex,"")}if(H.charAt(H.length-1)==="/"){H=H.slice(0,-1)}M.push('href="'+I+'"');if(i){M.push('target="_blank"')}if(a&&H.length>a){H=H.substring(0,a-2)+".."}return C+"<a "+M.join(" ")+">"+H+"</a>"+B});return t}while((j=k.exec(h))!==null){var n=j[0],c=j[2],p=!!j[1];b=h.substring(q,j.index);q=j.index+n.length;if(c==="a"){if(!p){l++;m+=f(b)}else{l--;if(l===0){m+=b}}}else{if(l===0){m+=f(b)}}m+=n}if(q<h.length){m+=f(h.substring(q))}return m}};Autolinker.matcherRegex=/((^|\s)@(\w{1,15}))|((?:[\-;:&=\+\$,\w\.]+@)[A-Za-z0-9\.\-]*[A-Za-z0-9\-]\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b)|((?:(?:(?:[A-Za-z]{3,9}:(?:\/\/)?)[A-Za-z0-9\.\-]*[A-Za-z0-9\-])|(?:(?:www\.)[A-Za-z0-9\.\-]*[A-Za-z0-9\-])|(?:[A-Za-z0-9\.\-]*[A-Za-z0-9\-]\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b))(?:[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[-A-Za-z0-9+&@#\/%=~_()|])?)/g;