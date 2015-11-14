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
        if (Layout.placedObjectTypes.indexOf(Layout.view) < 0 || $('.person:visible:not(.placed)')) {
          console.log('Placing ' + Layout.view + ' view.');
          Layout.placeObjects();
        }
        Layout.switchSize();
        Connections.clear();
        Connections.draw();
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


var Areas = {
  
  areas: [],
  filters: [],
  
  init: function() {
    var self = this;
    
    if (self.areas.length > 0) {
      $('#filter-button').hover(function() {
        self.revealMenu();
      }, function(e) {
        if (e.pageY < $('#header').height()) self.hideMenu();
      });

      $('#filter-menu').mouseleave(function() {
        self.hideMenu();
      })
      
      $('#filter-button').show();
    }
  },
  
  addArea: function(id, info) {
    var self = this;
    var name = info['schema:name'];
    var area = {id, name};
    self.areas.push(area);
  },
  
  revealMenu: function() {
    var self = this;
    
    $('#filter-button').addClass('hovered');
    $('#filter-menu').stop();
    $('#filter-menu .areas').show();
    var menuHeight = $('#filter-menu .area:not(.dummy)').length*30 + 30;
    $('#filter-menu').animate({height: menuHeight+'px'}, 300);
    $('#svg').fadeOut(300);
  },
  
  hideMenu: function() {
    var self = this;
    
    $('#filter-button').removeClass('hovered');
    $('.person:visible').css({opacity: 1});
    $('#filter-menu').animate({height: 0}, 300, function() {
      $('#filter-menu .areas').hide();
    });
    $('#svg').fadeIn(300);
    
    self.applyFilters();
  },
  
  populateMenu: function() {
    var self = this;
    
    $('#filter-menu .area:not(.dummy)').remove();
    
    $.each(self.areas, function(key, area) {
      
      var menuItem = $('.area.dummy').clone();
      menuItem.removeClass('dummy');
      $('.area-name', menuItem).html(area.name);
      menuItem.data('id', area.id);
      
      if (self.filters.indexOf(area.id) >= 0)
        menuItem.addClass('clicked');
      
      menuItem.hover(function() {
        self.applyFilters();
        $('.person:visible').css({opacity: 0.3});
        $('.person.'+ area.id).css({opacity: 1, visibility: 'visible'});
      });
      
      menuItem.click(function() {
        var item = $(this);
        if (item.hasClass('clicked')) {
          item.removeClass('clicked');
        } else {
          item.addClass('clicked');
        }
        self.applyFilters();
      });
      
      $('.areas').append(menuItem);
      
    });
  },
  
  collectFilters: function() {
    var self = this;
    
    self.filters = [];
    
    $('#filter-menu .area.clicked').each(function() {
      var id = $(this).data('id');
      self.filters.push(id);
    });
  },
  
  applyFilters: function() {
    var self = this;
    
    self.collectFilters();
    
    if (self.filters.length > 0) {
      
      var selector = '';
      $.each(self.filters, function(key, id) {
        selector += ':not(.' + id + ')';
      });

      $('.person:visible').css({visibility: 'visible'}).each(function() {
        Connections.show($(this));
      });
      $('.person:visible'+selector).css({visibility: 'hidden'}).each(function() {
        Connections.hide($(this));
      });
      
      $('#filter-button').addClass('filtering').html('Filtering by area');
      
    } else {
      
      $('.person:visible').css({visibility: 'visible'}).each(function() {
        Connections.show($(this));
      });
      $('#filter-button').removeClass('filtering').html('Filter by area');
      
    }
  },
  
  clear: function() {
    var self = this;
    self.areas = [];
  }
  
}