var Layout = {
  
  bubbles: [],
  size: '',
  mobileSize: 'medium',
  sizes: ['big', 'medium', 'small', 'smaller', 'tiny', 'tinier', 'puny'],
  sizeWidths: [300, 200, 150, 130, 110, 90, 75],
  borders: [30, 20, 15, 13, 11, 9, 8],
  labelShifts: [-30, -20, -15, -13, -11, -9, -8],
  leftOverhang: 60,

  calculatedSizes: {},
  placedObjectTypes: [],

  overlayMode: false,
  updating: false,
  blurred: false,
  loading: false,
  ambientCycler: null,
  
  init: function() {
    var self = this;
    
    self.getWindowDimensions();
    self.setBackground();
    self.setVisibility();
    self.setBubbles();
    self.hideLoader();
    self.calculateSize();
    self.placeObjects();
    self.revealObjects();
    self.setLabelTops();
    self.setButtons();
    
    Interaction.setHovers();
    Interaction.instrumentIcons();
    Connections.draw();
    Motion.start();
    if (self.blurred) Motion.stop();
    
    if (self.view == 'place') {
      $('.people').hide();
      SocialScene.init();
    }

    if (self.ambient() && self.ambientCycler == null) {
      self.ambientCycler =
        setInterval(ViewChanger.cycleAmbient,
                    SmartSpace.settings.ambientCycleInterval*1000);
    }
  },
  
  mobile: function() {
    var self = this;
    return (self.mode == 'mobile')
  },
  
  desktop: function() {
    var self = this;
    return (self.mode != 'mobile')
  },
  
  ambient: function() {
    var self = this;
    return (self.mode == 'ambient')
  },
  
  setBackground: function() {
    var d = new Date(), e = new Date(d);
    var dayFraction = (e - d.setHours(0,0,0,0)) / 10 / 86400;
    $('body').css('background-position', '0% '+dayFraction+'%');
  },
  
  setVisibility: function() {
    var self = this;
    if (self.view == 'people') {
      $('.device').hide();
      $('.person:not(.device)').show();
      $('#who-what').html('Who');
      $('#title').show();
    }
    if (self.view == 'devices') {
      $('.person:not(.device)').hide();
      $('.device').show();
      $('#who-what').html('What');
      $('#title').show();
    }
  },

  setBubbles: function() {
    self.bubbles = [];
    $('.person:visible').each(function() {
      self.bubbles.push($(this));
    });
  },
  
  showLoader: function() {
    var self = this;
    self.setBackground();
    self.loading = true;
    var loader = $('#loading');
    function fadeLoop() {
      loader.animate({opacity:'+=0.5'}, 1000);
      loader.animate({opacity:'-=0.5'}, 1000, fadeLoop);
    }
    fadeLoop();
  },
  
  hideLoader: function() {
    var self = this;
    if (self.loading) {
      $('#header').show();
      if (Layout.desktop()) $('#footer').show();
      $('#loading').remove();
      $('#title').show();

      if (self.view=='place') {
        $('#place').show();
      }

      if (Layout.mobile()) {
        $('#place').hide();
        $('#people').hide();
        $('#mobile-home').show();
      }

      var identifier = Utils.getAreaIdentifier();
      // Set the public access url
      var areaPublicUrl = 'smartpac.es/' + identifier;
      $('#footer .url').text(areaPublicUrl);

      // Set the title
      $('.space-name').text(SmartSpace.placeInfo.displayName);
      $('title').text(SmartSpace.placeInfo.displayName + ' Smart Space by reelyActive');

      self.loading = false;
    }
  },
  
  switchSize: function() {
    var self = this;
    self.size = self.calculatedSizes[self.view];
    sizeIndex = self.sizes.indexOf(self.size);
  },
  
  calculateSize: function() {
    var self = this;
    
    if (Layout.mobile()) {
      self.size = self.sizes[1];
      sizeIndex = 1;
      return;
    }
    
    $.each(self.sizeWidths, function(index, width) {
      var maxPop = (winWidth * winHeight) / (6 * width * width);
      var currentPop = $('.person:visible').length;
      if (maxPop > currentPop) {
        self.size = self.sizes[index];
        sizeIndex = self.sizes.indexOf(self.size);
        return;
      }
    });
  },
  
  changeAllSizes: function() {
    var self = this;
    $('.person:visible').each(function() {
      $(this).removeClass(self.sizes.join(' '));
      $(this).addClass(self.size);
    });
  },
  
  placeObjects: function() {
    var self = this;
    if (Layout.mobile()) return false;
    for (var sizeIndex = 0; sizeIndex < self.sizes.length; sizeIndex++) {
      if (self.placeObjectsAtSize(sizeIndex, false)) {
        self.placedObjectTypes.push(self.view);
        self.calculatedSizes[self.view] = self.size;
        return;
      }
    }
    console.log("Could not place properly");
    self.placeObjectsAtSize(self.sizes.length-1, true);
  },
  
  placeObjectsAtSize: function(sizeId, force) {
    var self = this;
    
    self.size = self.sizes[sizeId];
    self.changeAllSizes();
    window.sizeIndex = sizeId;

    var buffer = 1.2;
    var objectSize = self.sizeWidths[sizeId] * 1.5;
    var min_x = 0;
    var max_x = winWidth - objectSize;
    var min_y = $('#header').height();
    var max_y = winHeight - objectSize - $('#footer:visible').height();
    var padding_buffer = objectSize / 6;
    var max_tries = 100;

    var middleX = (min_x + max_x) / 2;
    var middleY = (min_y + max_y) / 2;

    var maxRows = Math.ceil((max_y - min_y) / objectSize);
    var maxColumns = Math.ceil((max_x - min_x) / objectSize);
    var middleY = Math.round(maxRows/2);
    var middleX = Math.round(maxColumns/2);

    var maxObjects =  maxColumns * maxRows;

    var persons = $('.person:visible');
    if (!force && persons.length > maxObjects) return false;

    if (force && maxObjects < persons.length) {
      var overflowPersons = persons.slice(maxObjects, persons.length);
      overflowPersons.each(function() {
        $(this).hide();
      });
    }

    persons = persons.slice(0, maxObjects);

    var orderingArray = persons.toArray().concat(new Array(maxObjects - persons.length));
    Utils.shuffle(orderingArray);

    var leftOffset = 0;
    var topOffset = min_y + 20;

    for(var i = 0; i < orderingArray.length; i++) {
      var person = $(orderingArray[i]);
      var x = i % maxColumns;
      var y = Math.floor(i / maxColumns);
      person.css({left: x * objectSize + leftOffset, top: y * objectSize + topOffset});
    }

    return true;
  },

  revealObjects: function() {
    $('.person').each(function() {
      $(this).css({padding: 0, opacity: 1});
    });
  },
  
  setLabelTops: function() {
    var self = this;
    self.labelTops = [];
    $.each(self.sizes, function(index, val) {
      self.labelTops.push(parseInt($('.' + val + ' > .label').css('top')));
    });
  },

  resetLabel: function(bubble) {
    var self = this;
    var label = $('.label', bubble);
    var labelTop = self.labelTops[sizeIndex];
    label.css({textShadow: 'none'});
    label.animate({top: labelTop+'px'}, {duration: 300, queue: false});
    label.animate({paddingBottom: 0}, {duration: 300, queue: false});
  },
  
  getDummy: function(type) {
    var div = $('.dummy-'+type).clone();
    div.removeClass('dummy-'+type);
    div.addClass(type);
    return div;
  },
  
  setButtons: function() {
    var self = this;
    if (self.mobile()) {
      $('#mobile-home').css({top: $('#header').outerHeight()+'px'});
      ViewChanger.mobileButtons();
      if (self.task == 'connect') {
        setTimeout(self.showConnectButton, 1000);
      }
    } else {
      ViewChanger.buttons();
    }
  },

  showConnectButton: function() {
    $('#connect-button').fadeIn(1000);
    function fadeLoop() {
      $('#connect-button .inner').animate({opacity:'+=0.7'}, 800);
      $('#connect-button .inner').animate({opacity:'-=0.7'}, 800, fadeLoop);
    }
    fadeLoop();
  },
  
  getWindowDimensions: function() {
    winWidth = $(window).width();
    winHeight = $(window).height();
  }
  
};


var ViewChanger = {
  
  buttons: function() {
    var self = this;
    $('.button[data-view="'+Layout.view+'"]', '#footer').addClass('selected');
    $('.button', '#footer').unbind('click');
    $('.button', '#footer').click(function() {
      if (!$(this).hasClass('selected')) {
        $('.button', '#footer').removeClass('selected');
        $(this).addClass('selected');
        var newView = $(this).data('view');
        self.switchTo(newView);
      }
    })
  },

  mobileButtons: function() {
    var self = this;
    $('.selector', '#mobile-menu').unbind('click');
    $('.selector', '#mobile-menu').click(function() {
      Layout.view = $(this).data('view');
      $('#header').fadeOut(200);
      $('.button[data-view="'+Layout.view+'"]', '#footer').addClass('selected');
      $('#mobile-menu').fadeOut(200, function() {
        $('#footer').fadeIn(200);
        $('#'+Layout.view).fadeIn(200, function() {
          if (Layout.view == 'place') SocialScene.init();
          if (Layout.view == 'people') Layout.init();
        });
      });
      self.buttons();
    });
  },

  switchTo: function(newView) {
    var self = this;
    
    Layout.view = newView;
    
    Motion.stop();
    $('#people').hide();
    $('#place').hide();
    $('#'+Layout.view).show();

    if (Layout.desktop()) {
      $('body').removeClass('people place devices');
      $('body').addClass(Layout.view);
    }

    if (Layout.view == 'people' || Layout.view == 'devices') {
      $('#people').show();
      $('#svg').show();
      if (Layout.desktop()) {
        Layout.setVisibility();
        if (Layout.placedObjectTypes.indexOf(Layout.view) < 0) {
          Layout.placeObjects();
        }
        Layout.switchSize();
      }
      Interaction.setHovers();
      Interaction.instrumentIcons();
      Motion.start();
    }

    if (Layout.view == 'place') {
      $('#title.people').hide();
      $('#svg').hide();
      SocialScene.init();
    }
  },

  cycleAmbient: function() {
    var self = this;
    if (Layout.view == 'people') {
      self.switchTo('place');
    } else {
      self.switchTo('people');
    }
  },
  
}

$(window).blur(function(){
  Motion.stop();
  Layout.blurred = true;
});

$(window).focus(function(){
  Motion.resume();
  Layout.blurred = false;
});

$(window).resize(function() {
  Layout.getWindowDimensions();
  paper.setSize(winWidth, winHeight);
  if (Layout.desktop()) Social.sizeLayout();
});