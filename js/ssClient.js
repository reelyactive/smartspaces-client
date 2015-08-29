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
    info['cormorant'] = encodeURIComponent(item['url']);
    var thisOccupant = new Occupant(itemType+id, info, itemType);
    thisOccupant.insert();
  },
  
  setRefresher: function() {
    var self = this;
    if (Layout.view == 'people') {
      var refresher =
        setInterval(SmartSpace.refresh, self.settings.refreshInterval*1000);
    }
  },
  
  refresh: function() {
    var self = SmartSpace;
    
    Layout.setBackground();
    
    if (Layout.overlayMode
        || (!Motion.moving && !Layout.blurred && Layout.desktop())) {
        return false; 
    }
    
    $.getJSON(self.jsonURL, function(data) {
      Motion.stop();
      Parser.parse(data, true);
      Layout.setBubbles();
      
      $.each(Layout.bubbles, function(index, bubble) {
        if (self.ids.indexOf(person.attr('id')) < 0) { // person no longer here
          if (bubble.is(':visible')) Layout.updating = true;
          bubble.remove();
        } else {
          $('.label', bubble).removeAttr('style');
          if (bubble.hasClass('hover')) {
            bubble.trigger('mouseout');
          }
        }
      });
      
      if (Layout.updating) {
        var oldSize = size;
        Layout.calculateSize();
        if (size != oldSize) {
          $.each(Layout.bubbles, function(index, bubble) {
            bubble.removeClass(oldSize);
            bubble.addClass(size);
            bubble.css({borderWidth: ''});
          });
        }
        Layout.init();
        Layout.updating = false;
      } else {
        if (!Layout.blurred) Motion.resume();
      }
    });
  }
  
};


var Parser = {
  
  attributeNames: { // possible aliases for JSON attributes
    firstName: ['schema:givenName'],
    lastName: ['schema:familyName'],
    portraitImageUrl: ['schema:image'],
    companyName: ['schema:worksFor'],
    companyTitle: ['schema:jobTitle']
  },
  
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
      if (itemType == 'person') {
        id = item['value'];
        SmartSpace.ids.push(id);
        var isNewPerson = SmartSpace.isNewOccupant(id);
      }
      if (itemType == 'device' || isNewPerson) {
        $.ajax({
            type: 'GET',
            url: item['url'],
            dataType: 'json',
            success: function(info) {
              if (info['@graph']) { //JSON-LD
                $.each(info['@graph'], function() {
                  var type = this['@type'].split(':')[1].toLowerCase();
                  SmartSpace.ids.push(type+id);
                  var info = self.scanForAttributes(this);
                  SmartSpace.addOccupant(self.refreshing, id, info, item, type);
                });
              } else {
                if (itemType == 'device') {
                  $.each(SmartSpace.itemTypes, function(key, type) {
                    if (info.hasOwnProperty(type)) {
                      SmartSpace.ids.push(type+id);
                      SmartSpace.addOccupant(self.refreshing, id, info[type], item, type);
                    }
                  });
                } else {
                  SmartSpace.addOccupant(self.refreshing, id, info, item);
                }
              }
            },
            async: false
        });
      }
    } else { //non-hyperlocal
      SmartSpace.ids.push(id);
      SmartSpace.addOccupant(id, item, item);
    }
  },
  
  scanForAttributes: function(info) {
    var self = this;
    $.each(self.attributeNames, function(name, aliases) {
      $.each(aliases, function() {
        if (info[this]) info[name] = info[this];
      });
    });
    return info;
  }
  
};