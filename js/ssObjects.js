var Occupant = function (id, info, itemType, nearest) {
  var self = this;
  
  itemType = typeof itemType !== 'undefined' ? itemType : 'person'; // default item type
  
  var deviceID = id;
  id = itemType + id;
  
  self.id = id;
  self.info = info;
  self.itemType = itemType;
  
  var bubble = $('#person-dummy').clone();
  
  var name = info.firstName + ' ' + info.lastName;
  var company = info.companyName;
  
  if (itemType == 'device') {
    name = info.model || 'BLE Device';
    company = info.manufacturer || info.organization;
  }
  
  $('.name', bubble).html(name);
  $('.company', bubble).html(company);
  
  bubble.data('json', info);
  bubble.removeClass('dummy');
  bubble.addClass(itemType);
  bubble.addClass('person');
  bubble.attr('id', id);
  bubble.data('name', name);
  bubble.data('deviceID', deviceID);
  
  $.each(nearest, function(key, receiver) {
    bubble.addClass(receiver.device);
  });

  if(info.portraitImageUrl == undefined) {
    info.portraitImageUrl = info.logoUrl;
  }
  
  if (info.portraitImageUrl != undefined) {
    bubble.css('background-image', 'url('+info.portraitImageUrl+')');
  }
  
  if (info.twitterPersonalScreenName) {
    bubble.data('twitter', info.twitterPersonalScreenName);
    Tweets.addUser(info.twitterPersonalScreenName);
  }
  
  if (info.companyLogoUrl) { bubble.data('company-logo', info.companyLogoUrl); }
  if (info.companyUrl) { bubble.data('company-link', info.companyUrl); }
  
  self.bubble = bubble;
  
  self.addIcons();
};

Occupant.prototype = {
  
  addIcons: function() {
    var self = this;
    $.each(SmartSpace.services, function(serviceID, service) {
      if (self.info[service.attributeName]) {
        self.bubble.data(service.attributeName, self.info[service.attributeName]);
      
        var thisIcon = $('<a class="icon" />');
        thisIcon.html(service.name.substr(0,2));
        thisIcon.data('attributeName', service.attributeName);
        thisIcon.data('overlay', service.displayType);
        thisIcon.data('retrievalMode', service.retrievalMode);
        thisIcon.data('service', service.name);
        thisIcon.addClass(service.displayType + '-icon');
      
        var urlStructure = service.urlStructure;
        var attributeValue = self.bubble.data(service.attributeName);
        var thisUrl = urlStructure.replace('%attribute%', attributeValue);
      
        thisIcon.data('url', thisUrl);
        thisIcon.insertAfter($('.icon', self.bubble).last());
      }
    });
  },
  
  insert: function() {
    var self = this;
    if (!self.bubble)
    Layout.bubbles.push(self.bubble);
    if (Layout.mobile()) {
      self.bubble.addClass(Layout.mobileSize)
    } else {
      self.bubble.addClass(Layout.size);
    }
    self.bubble.appendTo($('#people'));
    Layout.setVisibility();
  }
  
};
