var Layout = {
  
  bubbles: [],
  size: '',
  mobileSize: 'medium',
  sizes: ['big', 'medium', 'small', 'smaller', 'tiny', 'tinier', 'puny'],
  sizeWidths: [300, 200, 150, 130, 110, 90, 75],
  placementBuffer: 1.9,
  borders: [30, 20, 15, 13, 11, 9, 8],
  labelShifts: [-30, -20, -15, -13, -11, -9, -8],
  leftOverhang: 60,

  calculatedSizes: {},
  placedObjectTypes: [],

  overlayMode: false,
  hovering: false,
  updating: false,
  blurred: false,
  loading: false,
  firstInit: true,
  ambientCycler: null,
  
  init: function() {
    var self = this;
    
    console.log('Initializing layout.');
    
    self.getWindowDimensions();
    self.setBackground();
    self.setDefaultMode();
    self.setVisibility();
    self.setButtons();
    self.setFilters();
    self.hideLoader();
    self.calculateSize();
    self.placeObjects();
    self.activate();
    if (SmartSpace.settings.showDetection) {
      Detection.transition();
    } else if (self.firstInit) {
      self.revealObjects();
    }
    
    if (self.view == 'place') {
      $('.people').hide();
      SocialScene.init();
    }

    if (self.ambient() && self.ambientCycler == null) {
      self.ambientCycler =
        setInterval(ViewChanger.cycleAmbient,
                    SmartSpace.settings.ambientCycleInterval*1000);
    }
    
    self.firstInit = false;
  },
  
  activate: function() {
    var self = this;
    
    console.log('Activating layout.');
    
    Interaction.setHovers();
    Interaction.instrumentIcons();
    
    Connections.clear();
    Connections.draw();
    
    Motion.start();
    if (self.blurred) Motion.stop();
    
    self.updating = false;
  },
  
  newObjects: function() {
    var self = this;
    if (self.newInOtherView()) {
      console.log('New, but not this view.');
      self.placedObjectTypes = [];
      self.placedObjectTypes.push(self.view);
      self.updating = false;
      return false;
    }
    if (self.tooManyObjects()) {
      console.log('Screen too small / too many objects.');
      self.updating = false;
      return;
    }
    var newObjectsPlaced = self.placeNewObjects();
    if (self.unplacedObjects()) {
      self.init();
    } else {
      if (newObjectsPlaced) {
        self.activate();
      } else {
        self.updating = false;
      }
    }
  },
  
  tooManyObjects: function() {
    var self = this;
    return $('.person.placed:visible').length >= self.calcMinMax().maxObjects;
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
    if (SmartSpace.settings.forcedBackground == '') {
      var d = new Date(), e = new Date(d);
      var dayFraction = (e - d.setHours(0,0,0,0)) / 10 / 86400;
      $('body').css('background-position', '0% '+dayFraction+'%');
    } else {
      $('body').css(
        'background',
        SmartSpace.settings.forcedBackground
      );
    }
  },
  
  setDefaultMode: function() {
    var self = this;
    if (self.firstInit) {
      if ($('.person:not(.device)').length == 0)
        self.view = 'devices';
    }
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
      //$('#header').fadeIn(1000);
      //if (Layout.desktop()) $('#footer').fadeIn(1000);
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
  
  unplacedObjects: function() {
    var self = this;
    return $('.person:visible:not(.placed)').length > 0;
  },
  
  newInOtherView: function() {
    var self = this;
    var noNewPeople = self.view == 'people'
      && $('.person:visible:not(.placed):not(.device)').length == 0;
    var noNewDevices = self.view == 'device'
      && $('.person.device:visible:not(.placed)').length == 0;
    return (noNewPeople || noNewDevices);
  },
  
  placeNewObjects: function() {
    var self = this;
    
    console.log('Placing new');
    var avoidedObjects = $('.person:visible, .avoid');
    var maxTries = 300;
    var failures = 0;
    
    $('.person:visible:not(.placed)').each(function() {
      if (failures > 0 || self.tooManyObjects()) return;
      
      var bubble = $(this);
      var i = 0;
      
      do {
        var randX =
          Utils.randomNumber(0, winWidth-bubble.outerWidth());
        var randY =
          Utils.randomNumber(
            $('#header').height(), winHeight-bubble.outerHeight()-$('#footer').height()
          );
        bubble.css({left: randX, top: randY});
        i++;
        //console.log(i + ' placement tries.');
      } while (Utils.collisions(bubble, avoidedObjects) && i < maxTries);
      
      console.log(i + ' placement tries.');
      if (i < maxTries) { // space found
        bubble.addClass('placed');
        bubble.css({opacity: 1});
        bubble.data('startX', bubble.css('left'));
        bubble.data('startY', bubble.css('top'));
      } else {
        failures++;
        bubble.remove();
      }
    });
    
    return true;
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
    self.calculatedSizes[self.view] = self.size;
  },
  
  calcMinMax: function() {
    var self = this;
    
    var objectSize =
      self.sizeWidths[self.sizes.indexOf(self.size)] * self.placementBuffer;
    var min_x = 0;
    var max_x = winWidth - objectSize;
    var min_y = $('#header').height();
    var max_y = winHeight - objectSize - $('#footer').height();

    var middleX = (min_x + max_x) / 2;
    var middleY = (min_y + max_y) / 2;

    var maxRows = Math.ceil((max_y - min_y) / objectSize);
    var maxColumns = Math.ceil((max_x - min_x) / objectSize);
    var middleY = Math.round(maxRows/2);
    var middleX = Math.round(maxColumns/2);

    var maxObjects =  maxColumns * maxRows;
    
    return {
      'min_y': min_y, 'maxRows': maxRows, 'maxColumns': maxColumns,
      'maxObjects': maxObjects, 'objectSize': objectSize
    }
  },
  
  placeObjectsAtSize: function(sizeId, force) {
    var self = this;
    
    self.size = self.sizes[sizeId];
    console.log('Placing at size: ' + self.size);
    self.changeAllSizes();
    window.sizeIndex = sizeId;

    var calc =  self.calcMinMax();

    var persons = $('.person:visible');
    if (!force && persons.length > calc.maxObjects) return false;

    if (force && calc.maxObjects < persons.length) {
      var overflowPersons = persons.slice(calc.maxObjects, persons.length);
      overflowPersons.each(function() {
        $(this).hide();
      });
    }

    persons = persons.slice(0, calc.maxObjects);

    var orderingArray =
      persons.toArray().concat(new Array(calc.maxObjects - persons.length));
    Utils.shuffle(orderingArray);

    var leftOffset = 0;
    var topOffset = calc.min_y + 20;

    for(var i = 0; i < orderingArray.length; i++) {
      var person = $(orderingArray[i]);
      var x = i % calc.maxColumns;
      var y = Math.floor(i / calc.maxColumns);
      
      var noiseLevel = 20;
      var xNoise = Utils.randomNumber(0, noiseLevel);
      var yNoise = Utils.randomNumber(0, noiseLevel);
      
      person.css({
        left: x * calc.objectSize + leftOffset + xNoise,
        top: y * calc.objectSize + topOffset + yNoise
      });
      person.addClass('placed');
      person.data('startX', person.css('left'));
      person.data('startY', person.css('top'));
    }

    return true;
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
  
  setFilters: function() {
    var self = this;
    if (self.mobile()) return false;
    Areas.init();
  },

  showConnectButton: function() {
    $('#connect-button').fadeIn(1000);
    function fadeLoop() {
      $('#connect-button .inner').animate({opacity:'+=0.7'}, 800);
      $('#connect-button .inner').animate({opacity:'-=0.7'}, 800, fadeLoop);
    }
    fadeLoop();
  },
  
  revealObjects: function() {
    var self = this;
    $('.person').each(function() {
      $(this).css({padding: 0, opacity: 1});
    });
    if (self.mobile()) {
      $('#header').show();
    } else {
      $('#header').fadeIn(1000);
      if (self.desktop()) $('#footer').fadeIn(1000);
      $('#svg').fadeTo(500, 1);
    }
  },
  
  getWindowDimensions: function() {
    winWidth = $(window).width();
    winHeight = $(window).height();
  }
  
};


$(window).blur(function(){
  Layout.blurred = true;
  Motion.stop();
});

$(window).focus(function(){
  Layout.blurred = false;
  Motion.resume();
});

$(window).resize(function() {
  Layout.getWindowDimensions();
  paper.setSize(winWidth, winHeight);
  if (Layout.desktop()) SocialScene.sizeLayout();
});