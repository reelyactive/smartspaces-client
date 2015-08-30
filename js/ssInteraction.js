var Interaction = {
  
  setHoverSizes: function() {
    var self = this;
    
    self.borderIncrease = Layout.borders[sizeIndex] * 2;
    self.newBorder = Layout.borders[sizeIndex] + self.borderIncrease;
    self.newLabelTop = Layout.labelTops[sizeIndex] + Layout.labelShifts[sizeIndex];
    self.iconSize = self.newBorder * 0.8;
    
    if (Layout.mobile()) {
      self.hoverAnimation = {
        borderWidth: self.newBorder+'px',
        top: '-='+self.borderIncrease+'px',
        marginBottom: '-='+(self.borderIncrease*2)+'px'
      };
    } else {
      self.hoverAnimation = {
        borderWidth: self.newBorder+'px',
        top: '-='+self.borderIncrease+'px',
        left: '-='+self.borderIncrease+'px'
      };
    }
  },
  
  setCSSData: function(bubble) {
    var self = this;

    bubble.data('origX', bubble.css('left'));
    bubble.data('origY', bubble.css('top'));
    bubble.data('origBorder', bubble.css('border-top-width'));
    bubble.data('origMarginBottom', bubble.css('margin-bottom'));  
  },

  getIconPosition: function (angle) {
    var self = this;

    var d = Layout.sizeWidths[sizeIndex];
    var r = d/2;
    var rPad = self.newBorder/2;
    var x = r * Math.sin(Utils.toRad(angle));
    var y = r * Math.cos(Utils.toRad(angle));
    var xPad = rPad * Math.sin(Utils.toRad(angle));
    var yPad = rPad * Math.cos(Utils.toRad(angle));
    var left = r + x + xPad - self.iconSize/2;
    var top = r - y - yPad - self.iconSize/2;
    return {'left':left, 'top':top};
  },  
  
  placeIcon: function(icon, angle) {
    var self = this;
    var pos = self.getIconPosition(angle);
    icon.css({
      width: self.iconSize+'px',
      height: self.iconSize+'px',
      lineHeight: self.iconSize+'px',
      left: pos.left+'px', top: pos.top+'px',
      borderRadius: self.iconSize+'px'
    });
    icon.fadeIn(300);
  },
  
  setHovers: function() {
    var self = this;

    self.setHoverSizes();

    $('.person:visible').unbind('mouseenter mouseleave');

    $('.person:visible').hover(function() {
      if (Layout.overlayMode) return false;

      var bubble = $(this);

      Motion.stop();
      Connections.highlight(bubble);
      self.setCSSData(bubble);
      bubble.addClass('hover');

      $('#title').css('opacity', 0.2);

      var label = $('.label', bubble);
      var labelTop = label.css('top');

      label.animate({
        top: self.newLabelTop+'px',
        paddingBottom: -Layout.labelShifts[sizeIndex]+'px'
      }, 300);
      label.css({textShadow: '0px 0px 3px rgba(0, 0, 0, 0.5)'});

      bubble.animate(self.hoverAnimation, 300, function() {
        if (bubble.hasClass('hover')) { // place icons
          var angle = 0;
          var delta = 30;
          if (bubble.data('twitter')) {
            angle += delta;
            var twitter = $('.twitter-icon', bubble);
            self.placeIcon(twitter, angle);
          }
          $('.icon:not(.twitter-icon)', bubble).each(function() {
            angle += delta;
            self.placeIcon($(this), angle);
          });
        }
      });
  	}, function() { // unhover
      if (Layout.overlayMode) return false;

      var bubble = $(this);
      var label = $('.label', bubble);

      Connections.unhighlight();
      bubble.finish();
      bubble.removeClass('hover');
      label.finish();
      $('.icon', bubble).finish();
      $('.icon', bubble).hide();
      $('#title').css('opacity', 0.8);

      Motion.resume();

      var cssReset;
      if (Layout.mobile()) {
        cssReset = {
          borderWidth: Layout.borders[sizeIndex] + 'px',
          top: 0,
          left: 0,
          marginBottom: bubble.data('origMarginBottom')
        };
      } else {
        cssReset = {borderWidth: Layout.borders[sizeIndex]};
      }
      bubble.css(cssReset);

      Layout.resetLabel(bubble);
      Connections.redraw();
    });
  },
  
  instrumentIcons: function() {
    var self = this;

    $('.icon').unbind('click');

    if (Layout.desktop()) {
      $('.icon').each(function() {
        var icon = $(this);
        if (icon.data('overlay')=='fullscreen'
            && icon.data('retrievalMode')!='proxy'
            && !Utils.isLoadable(icon.data('url'))) {
          icon.attr('href', $(this).data('url'));
          icon.attr('target', '_blank');
          icon.addClass('newtab');
          icon.click(function() {
            if (typeof activeOverlay !== 'undefined') {
              activeOverlay.hide();
            }
          });
        }
      });
    }
    
    $('.icon:not(.newtab)').click(function() {
      var icon = $(this);
      var bubble = icon.parent();
      var overlayType = icon.data('overlay');

      Connections.dim();

      if (Layout.overlayMode && icon.hasClass(overlayService+'-icon')) {

        activeOverlay.hide();

      } else {

        var personLeft = parseInt(bubble.css('left'));
        var personTop = parseInt(bubble.css('top'));

        if (Layout.mobile()) {
          bubble.data('origScroll', $(window).scrollTop());

          if (overlayType == 'fullscreen') {
            Layout.overlayMode = false;
            window.open(icon.data('url'), '_blank');
            bubble.mouseout();
          } else {
            personLeft = bubble.offset().left;
            personTop = bubble.offset().top;

            $('.person:not(#'+bubble.attr('id')+')').fadeOut(500);
            $('#footer').fadeOut(500);
            $('html, body').animate({scrollTop: personTop-50}, 500, 'swing', function() {
              bubble.css({left: personLeft, top: 50, position: 'fixed'});
              var newCSS = {left: personLeft-bubble.outerWidth()+Layout.leftOverhang};
              bubble.animate(newCSS, 1000, 'easeInOutQuint', function() {
                var overlay = new Overlay(bubble, icon);
                overlay.show();
              });
            });
          }

        } else {
          var overlay = new Overlay(bubble, icon);
          overlay.show();
        }
      }
    });
  }
  
};


var Overlay = function (bubble, icon) {
  var self = this;

  self.bubble = bubble;
  self.icon = icon;
  Layout.overlayMode = true;
  overlayService = '';

  $('.icon').removeClass('active');
  icon.addClass('active');
  $('#overlay').removeClass('scrollable');

  var loadingType, headerType;
  if (icon.hasClass('twitter-icon')) {
    loadingType = 'tweets';
    headerType = 'Twitter';
  } else {
    loadingType = icon.data('service');
    headerType = icon.data('service');
  }

  $('#overlay .loading .type').html(loadingType);
  $('#overlay .header .type').html(headerType);

  self.type = icon.data('overlay');
  self.minHeight = 90;
  self.arrowWidth = 50;
  self.setDimensions();
  self.setCSS();

  activeOverlay = self;
};

Overlay.prototype = {
  setDimensions: function() {
    var self = this;

    Layout.getWindowDimensions();

    if (Layout.mobile()) {
      self.height = winHeight - 20;
      self.top = 10;
      self.width = winWidth - $('#arrow').offset().left - $('#arrow').width() - 10;
    } else {
      self.height = winHeight - $('#header').height() - $('#footer:visible').height() - 20;
      self.top = $('#header').height() + 10;
      self.width = 300;
      if (self.type == 'fullscreen') self.width = winWidth - 200;
    }
  },

  setCSS: function() {
    var self = this;

    var personLeft = parseInt(self.bubble.css('left'));
    var personTop = parseInt(self.bubble.css('top'));
    var personWidth = self.bubble.width();

    self.borderRadius = 0;
    if (self.type == 'fullscreen') self.borderRadius = '10';

    if (Layout.mobile()) {
      self.arrowLeft = 60;
      $('#arrow').css({
        borderRight: self.arrowWidth+'px solid white',
        borderLeft: 'none'
      });
      self.left = self.arrowLeft + self.arrowWidth;
      self.arrowTop = 50 + (personWidth/2) + 18;
      $('#overlay').css({width: winWidth-self.arrowLeft-self.arrowWidth-10}); 
    } else {
      // overlay left of bubble
      self.arrowLeft = personLeft + Interaction.newBorder - self.arrowWidth - 20;
      $('#arrow').css({
        borderLeft: self.arrowWidth+'px solid white',
        borderRight: 'none'
      });
      self.left = self.arrowLeft - parseInt($('#overlay').css('width'));
      if (self.left < 0) {
        // overlay right of bubble
        self.arrowLeft = personLeft + personWidth + Interaction.newBorder + 20;
        $('#arrow').css({
          borderRight: self.arrowWidth+'px solid white',
          borderLeft: 'none'
        });
        self.left = self.arrowLeft + self.arrowWidth;
      }
      self.arrowTop = parseInt(self.bubble.data('origY')) + (personWidth/2) - 18;
    }
  },

  place: function() {
    var self = this;

    $('#arrow').css({left: self.arrowLeft+'px', top: self.arrowTop+'px'});
    if (self.type == 'fullscreen') $('#arrow').hide();

    $('#overlay').css({
      height: '70px',
      top: self.arrowTop+'px',
      left: self.left+'px',
      borderRadius: self.borderRadius+'px'
    });
    $('#overlay .header').hide();
    $('#overlay .profile').hide();
    $('#overlay .loading').show();

    $('#overlay').fadeIn(500, function() {
      $(document).click(function(event) {
        if($(event.target).hasClass('icon')) { // icon clicked

        } else {
          if($(event.target).parents().index($('#overlay')) == -1) {
            if($('#overlay').is(":visible")) {
              self.hide();
            }
          }
        }        
      });
    });
  
    if (self.type != 'fullscreen') $('#arrow').fadeIn(500);

    if (Layout.desktop()) {
      $('.person:not(#'+self.bubble.attr('id')+'):visible').fadeTo(500, 0.3);
      $('#title').fadeTo(500, 0.3); 
    }
  },

  populate: function() {
    var self = this;

    if (self.icon.hasClass('twitter-icon')) { // load twitter
      overlayService = 'twitter';
      var handle = self.bubble.data('twitter');
      $('#permalink').attr('href', 'http://twitter.com/'+handle);

      $.getJSON('http://smartspaces.herokuapp.com/tweets/'+handle, function(data) {
        if (Utils.length(data) > 0) {
          var bio = data[0].user.description;
          $('#overlay .header .name').html(self.bubble.data('name'));
          $('#overlay .bio').html(Tweets.linkify(bio));
          $('.tweet').remove();
          $.each(data, function(key, tweet) {
            var tweetDiv = Tweets.generateDiv(tweet, handle);
            tweetDiv.appendTo($('#overlay .twitter'));
          });
          self.open();
        } else {
          $('#overlay .loading').html('Sorry, no tweets!');
        }
      }).fail(function(jqxhr){
        console.log(jqxhr.responseText);
      });
    } else {
      overlayService = self.icon.data('attributeName');
      var retrievalMode = self.icon.data('retrievalMode');
      var url = self.icon.data('url');

      $('#overlay .header .name').html(self.bubble.data('name'));
      $('#permalink').attr('href', url);

      if (retrievalMode == 'proxy') {
        $.post('/remote', { url: url }, function(data) {
          $('#iframe').attr('src', '/remote/'+data.hash);
          self.open(self.icon.data('overlay'));
        }, 'json');
      } else {
        $('#iframe').attr('src', self.icon.data('url'));
        self.open();
      }
    }
  },

  open: function() {
    var self = this;

    self.setDimensions();
    var scrollable = true;
    var showIframe = false;

    if (self.type == 'api') {
      var contentHeight =
        $('#overlay .'+overlayService).height() + $('#overlay .header').height() + 15;
      if (contentHeight < self.minHeight) contentHeight = self.minHeight;
      if (contentHeight < self.height) {
        var contentTop = arrowTop + 35 - (contentHeight/2);
        var dip = (self.top + self.height) - (contentTop + contentHeight);
        if (dip < 0) { contentTop = contentTop + dip; }
        if (contentTop > self.top) { self.top = contentTop; }
        self.height = contentHeight;
        scrollable = false;
      }
      var css = {
        height: self.height,
        top: self.top,
        borderRadius: '10px'
      };
    } else {
      var css = {
        height: self.height,
        width: self.width,
        top: self.top,
        borderRadius: '10px',
        opacity: 0.9
      };
      var verticalMargin = 50;
      if (self.type == 'fullscreen') {
        css.left = '100px';
        var verticalAdjust = 20;
      }
      $('#overlay .header').hide();
      $('#overlay iframe').css({
        height: self.height-verticalMargin+'px',
        margin: '10px 0'
      });
    }
  
    $('#overlay').removeClass('scrollable');
    $('#overlay').animate(css, 500, 'easeInOutCubic', function(){
      $('#overlay .loading').fadeOut(500, function() {
        if (self.type != 'api') $('#iframe').show();
        if (self.type != 'fullscreen') $('#overlay .header').fadeIn(500);
        $('#overlay .'+overlayService).fadeIn(500);
        if (scrollable && self.type == 'api') {
          $('#overlay').addClass('scrollable');
        }
        $('#overlay').scrollTop(0);
      });
    });
  },

  show: function() {
    var self = this;
    self.place();
    self.populate();
  },

  hide: function() {
    var self = this;

    Connections.unhighlight();
    self.bubble.removeClass('hover');
    $('.icon', self.bubble).removeClass('active');

    $('#title').fadeTo(500, 1.0);
    $('#overlay').fadeOut(500, function() {
      $('.tweet').remove();
      $('.job').remove();
      $('#overlay').css({width: '300px', opacity: 0.8});
      $('#iframe').attr('src', '');
      $('#iframe').hide();
    });
    $('#arrow').fadeOut(500);
    $('.icon', self.bubble).fadeOut(300);

    Layout.resetLabel(self.bubble);

    var cssReset;
    if (Layout.mobile()) {
      var centeredPos =
        self.bubble.offset().left + self.bubble.outerWidth() - Layout.leftOverhang;
      $('#footer').show();
      $('.person:not(.device)').show();
      cssReset = {
        position: 'relative',
        top: 0, left: 0,
        borderWidth: self.bubble.data('origBorder'),
        marginBottom: self.bubble.data('origMarginBottom')
      };
      self.bubble.css(cssReset);
      $(window).scrollTop(self.bubble.data('origScroll'));
    } else {
      $('.person:not(#'+self.bubble.attr('id')+'):visible').fadeTo(500, 1.0);
      cssReset = {
        left: self.bubble.data('origX'),
        top: self.bubble.data('origY'),
        borderWidth: self.bubble.data('origBorder')
      };
      self.bubble.animate(cssReset, 300, function() {
        Motion.resume();
      });
    }

    $(document).unbind('click');
    Layout.overlayMode = false;
  }
};