var SmartSpace = {
  
  ids: [],
  itemTypes: ['person', 'device'],
  apiURL: 'http://www.hyperlocalcontext.com/at/',
  
  init: function(apiURL) {
    var self = this;

    Layout.showLoader();

    self.getParams();
    self.getSettings();
    self.getPlaceInfo();
    self.getServices();
    self.jsonURL = Utils.getJsonURL();
    self.setRefresher();

    $.getJSON(self.jsonURL, function(data) {
      Parser.parse(data);
      Layout.init();
    });
  },
  
  getParams: function() {    
    Layout.view = Utils.getParam('view');
    if (Layout.view.length == 0) Layout.view = 'people'; // default view

    Layout.mode = Utils.getParam('mode');
    if (Layout.mode.length == 0) Layout.mode = 'desktop'; // default mode

    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      Layout.mode = 'mobile';

    Layout.task = Utils.getParam('task');
    
    $('body').addClass(Layout.view);
    $('body').addClass(Layout.mode);
  },
  
  getPlaceInfo: function() {
    var self = this;
    
    self.placeName = Utils.getAreaIdentifier();
    self.placeInfo = {};
    
    $.ajax({
      type: 'GET',
      url: '/'+self.placeName+'/info',
      dataType: 'json',
      success: function(data) {
        $.each(data, function(id, info) {
          self.placeInfo[id] = info;
        });
        self.apiURL = self.placeInfo.apiUrl;
      },
      async: false
    });
  },
  
  getSettings: function() {
    var self = this;
    
    self.settings = {
      refreshInterval: 60,
      ambientCycleInterval: 10
    };

    $.ajax({
      type: 'GET',
      url: '/settings',
      dataType: 'json',
      success: function(data) {
        $.each(data, function(id, info) {
          self.settings[id] = info;
        });
      },
      async: false
    });
  },
  
  getServices: function() {
    var self = this;

    self.services = {};

    $.ajax({
      type: 'GET',
      url: '/'+self.placeName+'/services',
      dataType: 'json',
      success: function(data) {
        self.services = data;
      },
      async: false
    });
  },
  
  isNewOccupant: function(id, itemType) {
    return $('#'+itemType+id).length == 0;
  },

  addOccupant: function(refreshing, id, info, item, itemType) {
    var self = this;
    if (!self.isNewOccupant(id, itemType)) return false;
    Layout.updating = true;
    info['cormorant'] = encodeURIComponent(item['url']);
    var thisOccupant = new Occupant(itemType+id, info, itemType);
    thisOccupant.insert();
  },
  
  setRefresher: function() {
    var self = this;
    var refresher =
      setInterval(SmartSpace.refresh, self.settings.refreshInterval*1000);
  },
  
  refresh: function() {
    var self = SmartSpace;
    
    Layout.setBackground();
    
    if (Layout.overlayMode || Layout.hovering) return false;
    
    console.log('Refreshing.');
    
    $.getJSON(self.jsonURL, function(data) {
      Motion.stop();
      Parser.parse(data, true);
      
      var bubbleRemoved = false;
      $.each($('.person'), function() {
        var bubble = $(this);
        if (self.ids.indexOf(bubble.attr('id')) < 0) { // person no longer here
          bubble.remove();
          bubbleRemoved = true;
        }
      });
      
      if (bubbleRemoved) {
        Connections.clear();
        Connections.draw();
      }
      
      Motion.resume();
    });
  }
  
};


var Parser = {
  
  attributeNames: { // possible aliases for JSON attributes
    firstName: ['schema:givenName'],
    lastName: ['schema:familyName'],
    portraitImageUrl: ['schema:image'],
    companyName: ['schema:worksFor'],
    companyTitle: ['schema:jobTitle'],
    model: ['schema:model'],
    manufacturer: [{'schema:manufacturer': 'schema:name'}]
  },
  
  cachedURLs: {},
  deadURLs: [],
  refreshing: false,
  
  parse: function(data, refreshing) {
    var self = this;
    self.refreshing = refreshing;
    SmartSpace.ids = [];
    if (data.hasOwnProperty('devices')) {
      $('#devices-button').removeClass('hidden');
      self.parseItems(data.devices, 'device');
    } else {
      self.parseItems(data);
    }
    if (self.refreshing && Layout.updating) {
      Layout.newObjects();
    }
  },
  
  parseItems: function(items, itemType) {
    var self = this;
    itemType = typeof itemType !== 'undefined' ? itemType : 'person';
    $.each(items, function(id, thisItem) {
      self.parseItem(id, thisItem, itemType);
    });
  },
  
  parseItem: function(id, item, itemType) {
    var self = this;
    if (item.hasOwnProperty('url')) {
      var url = item['url'];
      if (self.deadURLs.indexOf(url) > -1) {
        console.log('Not checking dead URL: ' + url);
        return false;
      }
      if (itemType == 'person') {
        id = item['value'];
        SmartSpace.ids.push(id);
        var isNewPerson = SmartSpace.isNewOccupant(id);
      }
      if (itemType == 'device' || isNewPerson) {
        if (self.cachedURLs.hasOwnProperty(url)) {
          var info = self.cachedURLs[url];
          self.parseInfo(id, item, itemType, info);
        } else {
          $.ajax({
            type: 'GET',
            url: url,
            dataType: 'json',
            success: function(info) {
              self.cachedURLs[url] = info;
              self.parseInfo(id, item, itemType, info);
            },
            error: function(req, msg) {
              self.deadURLs.push(url);
            },
            async: false
          });
        }
      }
    } else { //non-hyperlocal
      SmartSpace.ids.push(id);
      SmartSpace.addOccupant(self.refreshing, id, item, item);
    }
  },
  
  parseInfo: function(id, item, itemType, info) {
    var self = this;
    if (info['@graph']) { //JSON-LD
      $.each(info['@graph'], function() {
        var type = this['@type'].split(':')[1].toLowerCase();
        if (type == 'product') type = 'device';
        SmartSpace.ids.push(type+id);
        var info = self.scanForAttributes(this);
        SmartSpace.addOccupant(
          self.refreshing, id, info, item, type
        );
      });
    } else {
      if (itemType == 'device') {
        $.each(SmartSpace.itemTypes, function(key, type) {
          if (info.hasOwnProperty(type)) {
            SmartSpace.ids.push(type+id);
            SmartSpace.addOccupant(
              self.refreshing, id, info[type], item, type
            );
          }
        });
      } else {
        SmartSpace.addOccupant(
          self.refreshing, id, info, item
        );
      }
    }
  },
  
  scanForAttributes: function(info) {
    var self = this;
    $.each(self.attributeNames, function(name, aliases) {
      $.each(aliases, function() {
        var alias = this;
        if ($.isPlainObject(alias)) {
          $.each(alias, function(key, val) {
            if (info[key] && info[key][val])
              info[name] = info[key][val];
          });
        } else {
          if (info[alias]) info[name] = info[alias];
        }
      });
    });
    return info;
  }
  
};