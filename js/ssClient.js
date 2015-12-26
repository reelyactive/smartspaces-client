var SmartSpace = {
  
  ids: [],
  itemTypes: ['person', 'device'],
  apiURL: 'http://www.hyperlocalcontext.com/at/',
  
  init: function(apiURL) {
    var self = this;

    self.getPlaceInfo();
    Layout.showLoader();
    
    self.getParams();
    self.getSettings();
    self.getServices();
    self.jsonURL = Utils.getJsonURL();
    self.setRefresher();

    $.getJSON(self.jsonURL, function(data) {
      if (self.settings.showDetection) { 
        self.settings.showDetection = Detection.init(data);
      }
      console.log(data);
      Parser.parse(data);
      if (!self.settings.showDetection) Layout.init();
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
      ambientCycleInterval: 10,
      showDetection: true
    };

    $.ajax({
      type: 'GET',
      url: '/settings',
      dataType: 'json',
      success: function(data) {
        $.each(data, function(id, info) {
          if (info == 'true' || info == 'false') // parse boolean
            info = info == 'true';
          self.settings[id] = info;
        });
      },
      async: false
    });
    
    if (Layout.mobile()) self.settings.showDetection = false;
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
    if (!self.isNewOccupant(id, itemType) || itemType === undefined) return false;
    Layout.updating = true;
    info['cormorant'] = encodeURIComponent(item['url']);
    Detection.addInfo(id, info, itemType);
    var nearest = [];
    if (item.hasOwnProperty('nearest')) nearest = item['nearest'];
    var thisOccupant = new Occupant(id, info, itemType, nearest);
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
    
    if (Layout.overlayMode || Layout.hovering || Layout.mobile() || !Layout.activated)
      return false;
    
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
  
  socialNetworks: {
    attribute: 'schema:sameAs',
    services: {
      twitter: 'twitter.com/%twitterPersonalScreenName%'
    }
  },
  
  cachedURLs: {},
  deadURLs: [],
  refreshing: false,
  items: {},
  checkedItems: [],
  
  parse: function(data, refreshing) {
    var self = this;
    
    self.refreshing = refreshing;
    SmartSpace.ids = [];
    Areas.clear();
    self.items = {};
    self.checkedItems = [];
    
    if (data.hasOwnProperty('devices')) {
      $('#devices-button').removeClass('hidden');
      self.parseItems(data.devices, 'device');
    } else {
      self.parseItems(data);
    }
    
    if (self.refreshing && Layout.updating) {
      Layout.newObjects();
    }
    
    Areas.populateMenu();
  },
  
  parseItems: function(items, itemType) {
    var self = this;
    itemType = typeof itemType !== 'undefined' ? itemType : 'person';
    self.items = items;
    $.each(items, function(id, thisItem) {
      self.parseItem(id, thisItem, itemType);
    });
  },
  
  parseItem: function(id, item, itemType, itemNum) {
    var self = this;
    if (item.hasOwnProperty('url')) {
      var url = item['url'];
      if (self.deadURLs.indexOf(url) > -1) {
        console.log('Not checking bad URL: ' + url);
        self.checkedItems.push(item);
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
          self.checkedItems.push(item);
        } else {
          var jsonFound = false;
          var info;
          $.ajax({
            type: 'GET',
            url: url,
            success: function(data, status, jqXHR) {
              var resType = jqXHR.getResponseHeader('content-type');
              if (resType.indexOf('application/json') >= 0) {
                jsonFound = true;
                info = data;
              } else if (resType.indexOf('text/html') >= 0) {
                info = self.parseHTML(data);
                if (info != null) jsonFound = true;
              } else if (resType.indexOf('text/plain') >= 0) {
                info = $.parseJSON(data);
                if (info.hasOwnProperty('person')
                    || info.hasOwnProperty('device'))
                  jsonFound = true;
              }
              if (jsonFound) {
                self.processJSON(url, info, id, item, itemType);
              } else {
                self.noJSON(url, item);
              }
            },
            error: function(req, msg) {
              if (msg == 'error') {
                // last resort: try proxy
                console.log('Trying proxy');
                $.ajax({
                  type: 'POST',
                  url: '/remote/',
                  data: { url: url },
                  success: function(res) {
                    $.ajax({
                      type: 'GET',
                      url: '/remote/'+res.hash,
                      success: function(data) {
                        info = self.parseHTML(data);
                        if (info != null) {
                          self.processJSON(url, info, id, item, itemType);
                        } else {
                          self.noJSON(url, item);
                        }
                      },
                      error: function(req, msg) {
                        self.noJSON(url, item);
                      },
                      async: false
                    });
                  },
                  error: function(req, msg) {
                    console.log('PROXY ERROR');
                    console.log(msg);
                    self.noJSON(url, item);
                  },
                  async: false
                });
              }
            },
            async: false
          });
        }
      }
    } else { //non-hyperlocal
      SmartSpace.ids.push(id);
      //console.log('NON HYPERLOCAL');
      SmartSpace.addOccupant(self.refreshing, id, item, itemType);
      self.checkedItems.push(item);
    }
  },
  
  parseHTML: function(page) {
    var jsonFound = false;
    var info;
    $(page).filter('script').each(function() {
      if($(this).attr('type') == 'application/ld+json'
         && !jsonFound) {
        info = $.parseJSON(this.text);
        jsonFound = true;
      }
    });
    if (jsonFound) {
      return info;
    } else {
      return null;
    }
  },
  
  processJSON: function(url, info, id, item, itemType) {
    var self = this;
    self.cachedURLs[url] = info;
    self.parseInfo(id, item, itemType, info);
    self.checkedItems.push(item);
  },
  
  parseInfo: function(id, item, itemType, info) {
    var self = this;
    if (info['@graph']) { //JSON-LD
      $.each(info['@graph'], function() {
        //console.log(this);
        var type = this['@type'].split(':')[1].toLowerCase();
        if (type == 'product') type = 'device';
        var info = self.scanForAttributes(this);
        if (type == 'place') {
          Areas.addArea(id, info);
        } else {
          SmartSpace.ids.push(type+id);
          SmartSpace.addOccupant(
            self.refreshing, id, info, item, type
          );
        }
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
    if (info.hasOwnProperty(self.socialNetworks.attribute)) {
      console.log('Has social URLs');
      var socialURLs = info[self.socialNetworks.attribute];
      $.each(socialURLs, function(key, url) {
        $.each(self.socialNetworks.services, function(serviceName, urlPattern) {
          var matchString = /([^%]*)%([^%]*)%(.*)/g;
          var patternArray = matchString.exec(urlPattern);
          var prefix = patternArray[1];
          var suffix = patternArray[3];
          var alias = patternArray[2];
          var substring = '';
          var splitArray = [];
          if (prefix.length > 0)
            splitArray = url.split(prefix);
          if (splitArray.length > 1)
            substring = url.split(prefix)[1];
          if (suffix.length > 0)
            substring = substring.split(suffix)[0];
          if (substring.length > 0)
            info[alias] = substring;
        });
      });
    }
    return info;
  },
  
  noJSON: function(url, item) {
    var self = this;
    self.deadURLs.push(url);
    self.checkedItems.push(item);
  },
  
  complete: function() {
    if (Object.keys(Parser.items).length <= Parser.checkedItems.length
        && Parser.checkedItems.length > 0) {
      return true;
    } else {
      return false;
    }
  }
  
};