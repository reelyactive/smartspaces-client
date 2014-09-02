var API_URL = "http://logintolife.at/hlc-crapi.php?area=";


$.fn.preload = function() {
  this.each(function(){
    $('<img/>')[0].src = this;
  });
}

function getParam(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

String.prototype.parseURL = function() {
  return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
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

function linkifyTwitter(text) {
  return Autolinker.link(text.parseHashtag());
}

function length(data) {
  var key, count = 0;
  for(key in data) {
    if(data.hasOwnProperty(key)) {
      count++;
    }
  }
  return count;
}

function toRad(angle) {
  return angle * (Math.PI / 180);
}

var K = function () {
    var a = navigator.userAgent;
    return {
        ie: a.match(/MSIE\s([^;]*)/)
    }
}();

function parseTwitterDate(tdate) {
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
}

//var smallPath = "M58,29c0,16.016-12.984,29-29,29S0,45.016,0,29S12.984,0,29,0S58,12.984,58,29z"
var smallPath = "M23.375,11.688c0,6.455-5.233,11.688-11.688,11.688S0,18.142,0,11.688S5.233,0,11.688,0S23.375,5.233,23.375,11.688z";
//var mediumPath = "M100.252,50.125c0,27.683-22.442,50.125-50.126,50.125S0,77.807,0,50.125C0,22.44,22.442,0,50.126,0S100.252,22.44,100.252,50.125z";
var mediumPath = smallPath;
var walkers = [];

// handles whatever moves along the path
function AnimateWalker(walker){
	this.pathAnimator = new PathAnimator(path);
	this.walker = walker;
	this.reverse = Math.random()<.5; // random boolean
	console.log(this.reverse);
	this.speed = 10;
	this.easing = '';
	this.startOffset = Math.floor(Math.random()*100);;
	this.startX = parseInt($(walker).css('left'));
	this.startY = parseInt($(walker).css('top'));
	this.bg = $(walker).css('background-image');
}

AnimateWalker.prototype = {
	start : function(){
		//this.walker.style.cssText = "";
		//this.startOffset = (this.reverse || this.speed < 0) ? 100 : 0; // if in reversed mode, then animation should start from the end, I.E 100%
		this.pathAnimator.context = this; // just a hack to pass the context of every Walker inside it's pathAnimator
		this.pathAnimator.start( this.speed, this.step, this.reverse, this.startOffset, this.finish, this.easing);
	},

	// Execute every "frame"
	step : function(point){
	  /*
		this.walker.style.cssText = "top:" + (point.y + this.startY) + "px;" + 
									"left:" + (point.x + this.startX) + "px;" + 
									"background-image:" + this.bg;
		*/
		
		var newX = point.x + this.startX;
		var newY = point.y + this.startY;
		$(this.walker).css({left: newX, top: newY});
		
	},

	// Restart animation once it was finished
	finish : function(){
	  this.startOffset = (this.reverse || this.speed < 0) ? 100 : 0;
		this.start();
	},

	// Resume animation from the last completed percentage (also updates the animation with new settings' values)
	resume : function(){
		this.pathAnimator.start( this.speed, this.step, this.reverse, this.pathAnimator.percent, this.finish, this.easing);
	}
}

function generateWalker(walkerObj){
	var newAnimatedWalker = new AnimateWalker(walkerObj);
	walkers.push(newAnimatedWalker);
	return newAnimatedWalker;
}

function resumeMotion() {
  if (mode == 'mobile') return false;
  if (!overlayMode && !updating) {
    $.each(allWalkers, function(index, thisWalker) {
      thisWalker.resume();
    });
  }
  moving = true;
}

function stopMotion() {
  if (mode == 'mobile') return false;
  $.each(allWalkers, function(index, thisWalker) {
    thisWalker.pathAnimator.stop();
  });
  moving = false;
}

function startWalkers() {
  if (mode == 'mobile') return false;
  allWalkers = [];
  $('.person').each(function() {
    var thisWalker = generateWalker($(this)[0]);
  	thisWalker.start();
  	allWalkers.push(thisWalker);
  });
  moving = true;
}

function getIconPosition(angle, border, iconSize) {
  var d = sizeWidths[sizeIndex];
  var r = d/2;
  var rPad = border/2;
  var x = r * Math.sin(toRad(angle));
  var y = r * Math.cos(toRad(angle));
  var xPad = rPad * Math.sin(toRad(angle));
  var yPad = rPad * Math.cos(toRad(angle));
  var left = r + x + xPad - iconSize/2;
  var top = r - y - yPad - iconSize/2;
  return {'left':left, 'top':top};
}

//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0]
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function placeObjectsAtSize(sizeId) {
  size = sizes[sizeId];
  changeAllPersonsSize(size);
  window.sizeIndex = sizeId;

  var buffer = 1.3;
  var size = sizes[sizeId];
  var objectSize = sizeWidths[sizeId] * 1.4;
  var min_x = 0;
  var max_x = winWidth - objectSize;
  var min_y = $('#header').height();
  var max_y = winHeight - objectSize*buffer - $('#footer').height();
  var padding_buffer = objectSize / 6;
  var max_tries = 100;

  var middleX = (min_x + max_x) / 2;
  var middleY = (min_y + max_y) / 2;

  var maxRows = Math.ceil((max_y - min_y) / objectSize);
  var maxColumns = Math.ceil((max_x - min_x) / objectSize);
  var middleY = Math.round(maxRows/2);
  var middleX = Math.round(maxColumns/2);

  var maxObjects =  maxColumns * maxRows;

  var persons = $('.person');
  if (persons.length > maxRows * maxColumns) return false;
  console.log("object area", objectSize);

  var orderingArray = persons.toArray().concat(new Array(maxObjects - persons.length));
  shuffle(orderingArray);

  var leftOffset = 0;
  var topOffset = min_y + 20;

  for(var i = 0; i < orderingArray.length; i++) {
    var person = $(orderingArray[i]);
    var x = i % maxColumns;
    var y = Math.floor(i / maxColumns);
    person.css({left: x * objectSize + leftOffset, top: y * objectSize + topOffset , padding: padding_buffer});
  }

  return true;

}

function placeObjects() {
  if (mode == 'mobile') return false;
  for (var sizeIndex = 0; sizeIndex < sizes.length; sizeIndex++) {
    if (placeObjectsAtSize(sizeIndex)) return;
  }
  console.log("Could not place properly");
  placeObjectsAtSize(sizes.length);
}

function spiralCoordinates(i) {
  if (i == 0) return [0, 0];

}

function changeAllPersonsSize(size) {
    $('.person').each(function() {
      $(this).removeClass(sizes.join(' '));
      $(this).addClass(size);
    });
}

function revealObjects() {
  $('.person').each(function() {
    $(this).css({padding: 0, opacity: 1});
  });
}

function setBackground() {
  var d = new Date(), e = new Date(d);
  var dayFraction = (e - d.setHours(0,0,0,0)) / 10 / 86400;
  console.log(dayFraction);
  $('body').css('background-position', '0% '+dayFraction+'%');
}

function addTwitterUser(username) {
  if ($.inArray(username, twitters) < 0) {
    twitters.push(username);
  }
}

function addPerson(id, info) {
  var person = $('#person-dummy').clone();
  var name = info.firstName + ' ' + info.lastName;
  var company = info.companyName;
  person.removeClass('dummy');
  person.addClass('person');
  person.attr('id', id);
  if (info.portraitImageUrl != undefined) { person.css('background-image', 'url('+info.portraitImageUrl+')'); }
  person.data('name', name);
  if (info.twitterPersonalScreenName) { person.data('twitter', info.twitterPersonalScreenName); }
  if (info.linkedInPublicUrl) { person.data('linkedin', info.linkedInPublicUrl); }
  if (info.companyLogoUrl) { person.data('company-logo', info.companyLogoUrl); }
  if (info.companyUrl) { person.data('company-link', info.companyUrl); }
  $('.name', person).html(name);
  $('.company', person).html(company);
  people.push(person);
  population++;
  return person;
}

function resetPeople() {
  people = [];
  $('.person').each(function() {
    people.push($(this));
  });
}

function resetLabel(person) {
  console.log('resetting label');
  var label = $('.label', person);
  var labelTop = labelTops[sizeIndex];
  label.css({textShadow: 'none'});
  label.animate({top: labelTop+'px'}, {duration: 300, queue: false});
  label.animate({paddingBottom: 0}, {duration: 300, queue: false});
}

function setLabelTops() {
  labelTops = [];
  $.each(sizes, function(index, val) {
    labelTops.push(parseInt($('.' + val + ' > .label').css('top')));
  });
}

function setHovers() {
  $('.person').unbind('mouseenter mouseleave');

	$('.person').hover(function() {
	  if (overlayMode) return false;
	  
	  console.log('hover');
	  stopMotion();
	  
	  $(this).addClass('hover');
	  $(this).data('origX', $(this).css('left'));
	  $(this).data('origY', $(this).css('top'));
	  $(this).data('origBorder', $(this).css('border-top-width'));
	  $(this).data('origMarginBottom', $(this).css('margin-bottom'));
	  
	  var label = $('.label', this);
	  var increase, newlabelTop, iconSize;
	  var labelTop = label.css('top');

    //var sizeIndex = sizes.indexOf(size);
    increase = borders[sizeIndex] * 2;
    newBorder = borders[sizeIndex] + increase;
    newLabelTop = labelTops[sizeIndex] + labelShifts[sizeIndex];
    iconSize = newBorder * 0.8;
    
	  label.animate({
	    top: newLabelTop+'px',
	    paddingBottom: -labelShifts[sizeIndex]+'px'
	  }, 300);
	  label.css({textShadow: '0px 0px 3px rgba(0, 0, 0, 0.5)'});
	  
	  var hoverAnimation;
	  if (mode == 'mobile') {
	    hoverAnimation = {
	      borderWidth: newBorder+'px',
        top: '-='+increase+'px',
        marginBottom: '-='+(increase*2)+'px'
	    };
	  } else {
	    hoverAnimation = {
	      borderWidth: newBorder+'px',
  	    top: '-='+increase+'px',
  	    left: '-='+increase+'px'
	    };
	  }

	  $(this).animate(hoverAnimation, 300, function() {
	    if ($(this).hasClass('hover')) {
	      console.log('placing icons');
	      var twitterAngle = 0;
  	    if ($(this).data('twitter')) {
  	      twitterAngle = 30;
  	      var twitterPos = getIconPosition(twitterAngle, newBorder, iconSize);
    	    var twitter = $('.twitter-icon', $(this));
    	    twitter.css({width: iconSize+'px', height: iconSize+'px', left: twitterPos.left+'px', top: twitterPos.top+'px', borderRadius: iconSize+'px'});
  	      twitter.fadeIn(300);
  	    }
  	    /*
  	    var collisions = twitter.collision('.avoid');
  	    console.log('TWITTER COLLISIONS: ' + collisions.length);
  	    console.log(twitter.visible());
  	    */
  	    if ($(this).data('linkedin')) {
    	    var linkedinAngle = twitterAngle + 30;
    	    var linkedinPos = getIconPosition(linkedinAngle, newBorder, iconSize);
    	    var linkedin = $('.linkedin-icon', $(this));
    	    linkedin.data('url', $(this).data('linkedin'));
    	    linkedin.css({width: iconSize+'px', height: iconSize+'px', left: linkedinPos.left+'px', top: linkedinPos.top+'px', borderRadius: iconSize+'px'});
          linkedin.fadeIn(300);
        }
      }
	  });
	  console.log('done hover');
	}, function() {
	  console.log('unhover');
	  if (overlayMode) return false;
	  
    $(this).finish();
    $(this).removeClass('hover');
	  var label = $('.label', this);
	  label.finish();
	  $('.icon', $(this)).finish();
	  $('.icon', $(this)).hide();

	  resumeMotion();

    var cssReset;
    if (mode == 'mobile') {
      cssReset = {borderWidth: borders[sizeIndex] + 'px', top: 0, left: 0, marginBottom: $(this).data('origMarginBottom')};
    } else {
      cssReset = {borderWidth: borders[sizeIndex]};
    }
	  $(this).css(cssReset);

    resetLabel($(this));
	});
}

function hideOverlay(person) {
  console.log('hiding overlay');
  person.removeClass('hover');
  $('.icon', person).removeClass('active');
  $('#title').fadeTo(500, 1.0);
  $('#overlay').fadeOut(500, function() {
    $('.tweet').remove();
    $('.job').remove();
    //$('.degree').remove();
    $('#overlay').css({width: '300px', opacity: 0.8});
  });
  $('#arrow').fadeOut(500);
  $('.icon', person).fadeOut(300);
  resetLabel(person);
  var cssReset;
  if (mode == 'mobile') {
    var centeredPos = person.offset().left + person.outerWidth() - leftOverhang;
    $('#footer').show();
    $('.person:not(#'+person.attr('id')+')').show();
    cssReset = {position: 'relative', top: 0, left: 0, borderWidth: person.data('origBorder'), marginBottom: person.data('origMarginBottom')};
    person.css(cssReset);
    console.log(person.data('origScroll'));
    $(window).scrollTop(person.data('origScroll'));
  } else {
    $('.person:not(#'+person.attr('id')+')').fadeTo(500, 1.0);
    cssReset = {left: person.data('origX'), top: person.data('origY'), borderWidth: person.data('origBorder')};
    person.animate(cssReset, 300, function() {
      resumeMotion();
    });
  }
  $(document).unbind('click');
  overlayMode = false;
}

function setOverlayDimensions(overlayType) {
  getWindowDimensions();
  if (mode == 'mobile') {
    overlayHeight = winHeight - 20;
    overlayTop = 10;
    overlayWidth = winWidth - $('#arrow').offset().left - $('#arrow').width() - 10;
  } else {
    overlayHeight = winHeight - $('#header').height() - $('#footer').height() - 20;
    overlayTop = $('#header').height() + 10;
    overlayWidth = 300;
    console.log('OVERLAY TYPE');
    console.log(overlayType);
    if (overlayType == 'fullscreen') overlayWidth = winWidth - 200;
  }
}

function openOverlay(overlayType) {
  setOverlayDimensions(overlayType);
  var scrollable = true;
  if (overlayType != 'fullscreen') {
    var contentHeight = $('#overlay .'+overlayService).height() + $('#overlay .header').height() + 15;
    var minHeight = 90;
    if (contentHeight < minHeight) { contentHeight = minHeight; }
    if (contentHeight < overlayHeight) {
      var contentTop = arrowTop + 35 - (contentHeight/2);
      var dip = (overlayTop + overlayHeight) - (contentTop + contentHeight);
      if (dip < 0) { contentTop = contentTop + dip; }
      if (contentTop > overlayTop) { overlayTop = contentTop; }
      overlayHeight = contentHeight;
      scrollable = false;
    }
    var css = {height: overlayHeight, top: overlayTop, borderRadius: '10px'};
  } else {
    var css = {height: overlayHeight, width: overlayWidth, left: '100px', top: overlayTop, borderRadius: '10px', opacity: 0.9};
    $('#overlay .header').hide();
    $('#overlay iframe').css({height: overlayHeight-20+'px', margin: '10px 0'});
  }
  console.log('scrollable: ' + scrollable);
  $('#overlay').removeClass('scrollable');
  $('#overlay').animate(css, 500, 'easeInOutCubic', function(){
    $('#overlay .loading').fadeOut(500, function() {
      if (overlayType != 'fullscreen') $('#overlay .header').fadeIn(500);
      $('#overlay .'+overlayService).fadeIn(500);
      if (scrollable && overlayType == 'inline') {
        $('#overlay').addClass('scrollable');
        console.log('added scrollable');
      }
      $('#overlay').scrollTop(0);
    });
  });
}

function getDummy(type) {
  var div = $('.dummy-'+type).clone();
  div.removeClass('dummy-'+type);
  div.addClass(type);
  return div;
}

function showOverlay(person, arrowLeft, arrowTop, overlayLeft, overlayType) {
  $('#arrow').css({left: arrowLeft+'px', top: arrowTop+'px'});
  if (overlayType == 'fullscreen') $('#arrow').hide();
  var borderRadius = 0;
  if (overlayType == 'fullscreen') {
    borderRadius = '10';
  }
  $('#overlay').css({height: '70px', top: arrowTop+'px', left: overlayLeft+'px', borderRadius: borderRadius+'px'});
  $('#overlay .header').hide();
  $('#overlay .profile').hide();
  $('#overlay .loading').show();
  $('#overlay').fadeIn(500, function() {
    $(document).click(function(event) {
      if($(event.target).hasClass('icon')) { // icon clicked

      } else {
        if($(event.target).parents().index($('#overlay')) == -1) {
          if($('#overlay').is(":visible")) {
            hideOverlay(person);
          }
        }
      }        
    });
  });
  if (overlayType != 'fullscreen') $('#arrow').fadeIn(500);
  if (mode != 'mobile') {
    $('.person:not(#'+person.attr('id')+')').fadeTo(500, 0.3);
    $('#title').fadeTo(500, 0.3); 
  }
}

function getOverlayData(icon, person) {
  if (icon.hasClass('twitter-icon')) { // load twitter
    
    overlayService = 'twitter';
    var handle = person.data('twitter');
    $('#permalink').attr('href', 'http://twitter.com/'+handle);
    $.getJSON('http://smartspaces.herokuapp.com/tweets/'+handle, function(data) {
      if (length(data) > 0) {
        var bio = data[0].user.description;
        $('#overlay .header .name').html(person.data('name'));
        $('#overlay .bio').html(linkifyTwitter(bio));
        $('.tweet').remove();
        $.each(data, function(key, tweet) {
          var tweetDiv = generateTweetDiv(tweet, handle);
          tweetDiv.appendTo($('#overlay .twitter'));
        });
        openOverlay(icon.data('overlay'));
      } else {
        $('#overlay .loading').html('Sorry, no tweets!');
      }
      console.log(data);
    }).fail(function(jqxhr){
      console.log(jqxhr.responseText);
    });
    
  } else {
    
    overlayService = 'linkedin';
    var publicURL = person.data('linkedin').replace('ca.linkedin', 'www.linkedin');
    $('#linkedin-iframe').attr('src', '/remote/'+encodeURIComponent(publicURL));
    openOverlay(icon.data('overlay'));
  }
}

function instrumentIcons() {
  $('.icon').unbind('click');
  $('.icon').click(function() {
    var person = $(this).parent();
    
    if (overlayMode && $(this).hasClass(overlayService+'-icon')) {
      
      hideOverlay(person);
      
    } else {
      
      overlayMode = true;
      overlayService = '';
      $('.icon').removeClass('active');
      $(this).addClass('active');
      $('#overlay').removeClass('scrollable');
      
      var loadingType, headerType;
      if ($(this).hasClass('twitter-icon')) {
        loadingType = 'tweets';
        headerType = 'Twitter';
      } else {
        loadingType = 'LinkedIn';
        headerType = 'LinkedIn';
      }
      
      $('#overlay .loading .type').html(loadingType);
      $('#overlay .header .type').html(headerType);
      
      var thisIcon = $(this);
      var overlayType = $(this).data('overlay');
      
      setOverlayDimensions(overlayType);
      
      var personLeft = parseInt(person.css('left'));
      var personTop = parseInt(person.css('top'));
      var personWidth = person.width();
      var borderWidth = newBorder;
      var arrowWidth = 50;
      
      if (mode == 'mobile') {
        person.data('origScroll', $(window).scrollTop());
        
        if (overlayType == 'fullscreen') {
          overlayMode = false;
          window.open($(this).data('url'), '_blank');
          person.mouseout();
        } else {
          personLeft = person.offset().left;
          personTop = person.offset().top;

          $('.person:not(#'+person.attr('id')+')').fadeOut(500);
          $('#footer').fadeOut(500);
          $('html, body').animate({scrollTop: personTop-50}, 500, 'swing', function() {
            person.css({left: personLeft, top: 50, position: 'fixed'});
            person.animate({left: personLeft-person.outerWidth()+leftOverhang}, 1000, 'easeInOutQuint', function() {
              arrowLeft = person.offset().left + personWidth + borderWidth + 20;
              $('#arrow').css({borderRight: arrowWidth+'px solid white', borderLeft: 'none'});
              overlayLeft = arrowLeft + arrowWidth;
              arrowTop = 50 + (personWidth/2) + 18;
              $('#overlay').css({width: winWidth-arrowLeft-arrowWidth-10});

              showOverlay(person, arrowLeft, arrowTop, overlayLeft, overlayType);
              getOverlayData(thisIcon, person);
            });
          });
        }
        
      } else {
        // overlay left of bubble
        var arrowLeft = personLeft + borderWidth - arrowWidth - 20;
        $('#arrow').css({borderLeft: arrowWidth+'px solid white', borderRight: 'none'});
        var overlayLeft = arrowLeft - parseInt($('#overlay').css('width'));
        console.log('OVERLAYLEFT: ' + overlayLeft);
        if (overlayLeft < 0) {
          // overlay right of bubble
          arrowLeft = personLeft + personWidth + borderWidth + 20;
          $('#arrow').css({borderRight: arrowWidth+'px solid white', borderLeft: 'none'});
          overlayLeft = arrowLeft + arrowWidth;
        }
        arrowTop = parseInt(person.data('origY')) + (personWidth/2) - 18;
        
        showOverlay(person, arrowLeft, arrowTop, overlayLeft, overlayType);
        getOverlayData(thisIcon, person);
      }
      
    }
  });
}

function hideLoader() {
  if (loading) {
    $('#header').show();
    if (mode != 'mobile') $('#footer').show();
    $('#loading').remove();
    $('#title').show();
    
    if (view=='place') {
      $('#place').show();
    }
    
    if (mode == 'mobile') {
      $('#place').hide();
      $('#people').hide();
      $('#mobile-menu').show();
    }

    var identifier = getAreaIdentifier();
    // Set the public access url
    var areaPublicUrl = 'smartpac.es/' + identifier;
    $('#footer .url').text(areaPublicUrl);

    // Set the title
    $('.space-name').text(placeInfo.displayName);
    $('title').text(placeInfo.displayName + ' Smart Space by reelyActive');

    loading = false;
  }
}

function initObjects() {
  console.log('INITIALIZING');
  placeObjects();
  hideLoader();
  revealObjects();
  startWalkers();
  setLabelTops();
  setHovers();
  instrumentIcons();
  console.log('DONE INITIALIZING');
  if (blurred) { stopMotion(); }
}

function calculateSize() {
  if (mode == 'mobile') {
    size = sizes[1];
    sizeIndex = sizes.indexOf(size);
    return false;
  }
  $.each(sizeWidths, function(index, width) {
    var maxPop = (winWidth * winHeight) / (6 * width * width);
    if (maxPop > population) {
      size = sizes[index];
      sizeIndex = sizes.indexOf(size);
      console.log('size found: ' + size);
      return false;
    }
  });
}

function refresh() {
  setBackground();
  if (overlayMode || (!moving && !blurred && mode != 'mobile')) { return false; }
  console.log('REFRESHING');
  $.getJSON(jsonURL, function(data) {
    stopMotion();
    var ids = [];
    $.each(data, function(id, info) {
      ids.push(id);
      if ($('#'+id).length == 0) { // new person
        var person = addPerson(id, info);
        if (person) {
          console.log('NEW PERSON');
          updating = true;
          person.addClass(size);
          person.appendTo($('#people'));
        }
      }
    });
    $.each(people, function(index, person) {
      if (ids.indexOf(person.attr('id')) < 0) { // person no longer here
        console.log('PERSON GONE');
        console.log(person.data('name'));
        person.remove();
        population--;
        updating = true;
      } else {
        $('.label', person).removeAttr('style');
        if (person.hasClass('hover')) {
          person.trigger('mouseout');
        }
      }
    });
    if (updating) {
      resetPeople();
      var oldSize = size;
      calculateSize();
      if (size != oldSize) {
        $.each(people, function(index, person) {
          person.removeClass(oldSize);
          person.addClass(size);
          person.css({borderWidth: ''});
        });
      }
      initObjects();
      updating = false;
    } else {
      if (!blurred) { resumeMotion(); }
    }
  });
}

function remainingSocialSpace() {
  var socialSceneDiv = $('#social-scene-container');
  var currentHeight = socialSceneDiv.height() + socialSceneDiv.offset().top + $('#footer').height() + 10;
  var remainder = $(window).height() - currentHeight;
  return remainder;
}

function socialSceneFull() {
  if (remainingSocialSpace() > 0) {
    return false;
  } else {
    return true;
  }
}

function getBoxNum(box) {
  return parseInt(box.attr('id').split('social-item-')[1]);
}

function getAdjacentBoxes(box) {
  var adjacentBoxes = [];
  if (mode == 'mobile') {
    adjacentBoxes.push(box.prev('.social-item'));
    adjacentBoxes.push(box.next('.social-item'));
    console.log('ADJACENT BOXES:');
    console.log(adjacentBoxes);
  } else {
    var num = getBoxNum(box);
    var adjacentNums = [num - boxesPerRow, num + boxesPerRow, num - 1, num + 1];
    console.log(adjacentNums);
    $.each(adjacentNums, function(index, thisNum) {
      if (thisNum > 0 && thisNum <= numBoxes) {
        adjacentBoxes.push($('#social-item-'+thisNum));
      }
    });
  }
  return adjacentBoxes;
}

function isAdjacentColor(box, color) {
  var adjacentBoxes = getAdjacentBoxes(box);
  var colorFound = false;
  console.log('CHECKING COLOR:' + color);
  $.each(adjacentBoxes, function(index, thisBox) {
    if (thisBox.hasClass(color)) {
      colorFound = true;
    }
  });
  return colorFound;
}

function randomElement(items) {
  return items[Math.floor(Math.random()*items.length)];
}

function colorSocialBox(box) {
  if (box.hasClass('photo')) {
    return box;
  }
  
  var color = null;
  var unusedColors = socialColors.slice();
  
  shownBoxes().each(function() {
    if ($(this).data().hasOwnProperty('color')) {
      
      Array.prototype.remove= function(){
        var what, a= arguments, L= a.length, ax;
        while(L && this.length){
          what= a[--L];
          while((ax= this.indexOf(what))!= -1){
            this.splice(ax, 1);
          }
        }
        return this;
      }
      
      unusedColors.remove($(this).data('color'));
    }
  });
  
  if (unusedColors.length > 0) {
    color = randomElement(unusedColors);
  } else {
    do {
     color = randomElement(socialColors); 
    } while (isAdjacentColor(box, color));
  }

  box.addClass(color);
  box.data('color', color);
  return box;
}

function removeBoxColors(box) {
  $.each(socialColors, function(index, color) {
    box.removeClass(color);
  });
  return box;
}

function colorSocialBoxes() {
  shownBoxes().each(function() {
    colorSocialBox($(this));
  });
}

function makeNewBox() {
  var box = $('.social-item.dummy').clone();
  box.removeClass('dummy');
  return box;
}

function sizeNewsArea() {
  var newsWidth =
    $(window).width() - $('#trending-container:visible').outerWidth(true) - $('#social-scene-container').outerWidth(true) - 35;
  $('#news-container').css({width: newsWidth+'px'});
  var newsfeedHeight = 
    $('#social-scene-container').height() - $('#noticeboard-container').outerHeight(true) - $('#newsfeed-container > .header').outerHeight(true) - 15;
  $('#newsfeed').css({height: newsfeedHeight+'px'});
}

function emptyNoticesMessage(text) {
  $('#notices').empty();
  $('#notices').addClass('empty');
  $('#notices').html('<div class="notice">'+text+'</div>');
}

function postNotice(notice) {
  $('#notice-form').hide();
  emptyNoticesMessage('Posting notice...');
  $('.button', '#noticeboard-container').hide();
  $('#notices').show();
  $.post('/'+placeName+'/notices/new', {
	  message: notice
	}, function(data) {
	  insertNotices(data);
	  $('.button.add', '#noticeboard-container').show();
	});
}

function clearNotices() {
  emptyNoticesMessage('No notices to show.')
}

function insertNotices(notices) {
  if (notices.length > 0) {
    $('#notices').removeClass('empty');
    $('#notices').empty();
    $.each(notices, function(id, notice) {
      var noticeDiv = $('<div class="notice"></div>');
      noticeDiv.html(notice.message);
      $('#notices').append(noticeDiv);
    });
    cycleNotices();
  } else {
    clearNotices();
  }
}

function fadeNotice(notice) {
  var persist = 6; // time in seconds to show each notice
  if (notice.next().length > 0) {
    var next = notice.next();
  } else {
    var next = $('.notice').first();
  }
  notice.delay(persist * 1000).fadeOut(500, function() {
    next.fadeIn(500, function() {
      notice = next;
      fadeNotice(notice);
    });
  });
}

function cycleNotices() {
  var first = $('.notice').first();
  first.show();
  if (first.next().length > 0) {
    fadeNotice(first);
  }
}

function showNotices() {
  $('.button.add', '#noticeboard-container').click(function() {
    $('#notices').hide();
    $('#notice-form').val("").show().focus();
    $(this).hide();
    $('.button.cancel', '#noticeboard-container').show();
    $('.button.post', '#noticeboard-container').show();
  });
  
  $('.button.cancel', '#noticeboard-container').click(function() {
    $('#notice-form').hide();
    $('#notices').show();
    $(this).hide();
    $('.button.post', '#noticeboard-container').hide();
    $('.button.add', '#noticeboard-container').show();
  });
  
  $('.button.post', '#noticeboard-container').click(function() {
    postNotice($('#notice-form').val());
  });
  
  $('#notice-form').keydown(function(e) {
    if (e.keyCode == 13) {
      if (!e.shiftKey) {
        postNotice($(this).val());
      }
    }
  });
  
  $.getJSON('/'+placeName+'/notices', function(data) {
    if (data.length == 0) {
      clearNotices();
    } else {
      insertNotices(data);
    }
  });
}

function sizeLayout() {
  var remainder = remainingSocialSpace();
  var currentBoxSize = $('.social-item').height();
  numBoxes = shownBoxes().length;
  var boxIncrease = remainder / numRows;
  var newBoxSize = currentBoxSize + boxIncrease;
  $('.social-item').css({height: newBoxSize+'px', width: newBoxSize+'px'});
  var socialSceneWidth = boxesPerRow * (newBoxSize + 20);
  $('#social-scene-container').css({width: socialSceneWidth+'px'});
  sizeNewsArea();
}

function placeSocialBoxes() {
  var windowW = $(window).width();
  var windowH = $(window).height();
  var rows, cols;
  if (windowW > 1300 && windowH > 800) {
    rows = 3; cols = 4;
  } else if (windowW > 1150 && windowH > 700) {
    rows = 3; cols = 3;
  } else if (windowW > 1050 && windowH > 500) {
    rows = 2; cols = 3;
  } else {
    rows = 2; cols = 2;
  }
  numRows = rows;
  boxesPerRow = cols;
  var k = 1;
  for (i = 0; i < numRows; i++) {
    var row = $('<div class="row"></div>');
    for (j = 0; j < boxesPerRow; j++) {
      var newBox = makeNewBox();
      newBox.attr('id', 'social-item-'+k);
      newBox.appendTo(row);
      k++;
    }
    row.appendTo('#social-scene');
  }
  numBoxes = k;
  sizeLayout();
}

function getBox(boxNum) {
  return $('#social-item-'+boxNum, '#social-scene');
}

function calculateTweetWeight(tweet) {
  var retweeterFollowers = 0;
  var boost = 1;
  if (tweet.hasOwnProperty('retweeted_status')) {
    var retweeterFollowers = tweet.user.followers_count;
  }
  if (tweet.entities.hasOwnProperty('media') && tweet.entities.media[0].type == 'photo') {
    boost = boost + visualBoost;
  }
  var favs = tweet.favorite_count;
  var rts = tweet.retweet_count;
  var followers = tweet.user.followers_count + (retweeterFollowers / 2) + 50;
  var weight = (favs + (3*rts) + 0.1) / followers;
  return weight * 1000 * boost;
}

function cloneList(list) {
  var newList = jQuery.extend(true, {}, list);
  return newList;
}

function pullHashtags(tweet) {
  if (tweet.entities.hasOwnProperty('hashtags')) {
    $.each(tweet.entities.hashtags, function(index, hashtag) {
      hashtags.push(hashtag.text);
    });
  }
}

function sortHashtags() {
  var histogramMap = {};
  for(var i=0, len=hashtags.length; i<len; i++){
    var key = hashtags[i];
    histogramMap[key] = (histogramMap[key] || 0) + 1;
  }
  var histogram = [];
  for(key in histogramMap) histogram.push({key: key, freq: histogramMap[key]});
  histogram.sort(function(a,b){return b.freq - a.freq});
  sortedHashtags = histogram;
}

function fillHashtags() {
  var minimum = 5;
  var numTags = 10;
  if (sortedHashtags.length >= minimum) {
    $('#trending-container').show();
    $('#trending').empty();
    $(sortedHashtags).slice(0, numTags).each(function(index, object) {
      var hashtag = object.key;
      var hashtagDiv = $('.trending-topic.dummy').clone();
      hashtagDiv.removeClass('dummy');
      $('.text', hashtagDiv).attr('href', 'http://twitter.com/hashtag/'+hashtag);
      $('.tag', hashtagDiv).html(hashtag);
      $('#trending').append(hashtagDiv);
    });
  } else {
    $('#trending-container').hide();
  }
  sizeNewsArea();
}

function decreaseFont(box) {
  var fontSize = parseInt(box.css('font-size'));
  var userPadding = parseInt($('.from', box).css('padding'));
  var contentPadding = parseInt($('.content', box).css('padding'));
  fontSize = fontSize - 1 + 'px';
  if (userPadding > 3) {
    userPadding = userPadding - 1 + 'px';
  }
  if (contentPadding > 4) {
    contentPadding = contentPadding - 2 + 'px';
  }
  box.css({'font-size': fontSize, 'line-height': fontSize});
  $('.from, .via', box).css({'padding': userPadding});
  $('.content', box).css({'padding': contentPadding});
}

function contentOverflow(box) {
  var buffer = 20;
  var availableArea = box.height() - ($('.from', box).height() * 2) - buffer;
  var content = $('.content', box);
  var from = $('.from', box);
  var via = $('.via', box);
  if (content.height() > availableArea
   || content.outerWidth() > box.width()+2
   || from.outerWidth() > box.width()
   || via.outerWidth() > box.width())
  {
    return true;
  } else {
    return false;
  }
}

function tailorSocialBox(box) {
  while (contentOverflow(box)) {
    console.log('DECREASING FONT');
    decreaseFont(box);
  }
}

function insertTweet(box, tweetObject) {
  var tweet = tweetObject['data'];
  console.log(tweetObject);
  if (tweet.hasOwnProperty('retweeted_status')) {
    var from = tweet.retweeted_status.user.screen_name;
    var text = tweet.retweeted_status.text;
    var tweetID = tweet.retweeted_status.id_str;
    var via = tweet.user.screen_name
    $('.via .user', box).html(linkifyTwitter('@'+via));
    $('.via', box).show();
    box.addClass('retweet');
  } else {
    var from = tweet.user.screen_name;
    var text = tweet.text;
    var tweetID = tweet.id_str;
  }
  $('.from', box).html(linkifyTwitter('@'+from));
  $('.content', box).html(linkifyTwitter(text));
  console.log(box);
  box.attr('href', 'https://twitter.com/'+from+'/status/'+tweetID);
  box.removeClass('photo');
  
  if (tweet.entities.hasOwnProperty('media')) {
    $.each(tweet.entities.media, function(index, element) {
      if (element.type == 'photo') {
        box.css({backgroundImage: 'url('+element.media_url+')'});
        box.addClass('photo');
        box = removeBoxColors(box);
        box.removeData('color');
      }
    });
  }
  
  box.addClass('filled');
  box.data('tweet-id', tweet.id);
  return box;
}

function shownBoxes() {
  return $('.social-item', '#social-scene');
}

function numBoxesFilled() {
  return $('.social-item.filled', '#social-scene').length;
}

function isShown(tweet) {
  var found = false;
  shownBoxes().each(function() {
    if ($(this).data('tweet-id') == tweet['data'].id) {
      found = true;
      console.log('found');
    }
  });
  return found;
}

function replenishTweetsLeft() {
  if (tweetsLeft.length == 0) {
    console.log('RE-CLONING');
    tweetsLeft = cloneList(tweets);
  }
}

function getMoreTweets(numTweets) {
  console.log('NUMBER OF TWEETS: ' + tweets.length);
  console.log('NUMBER OF TWEETS LEFT: ' + tweetsLeft.length);
  replenishTweetsLeft();
  if (tweets.length < numTweets) {
    numTweets = tweets.length;
  }
  if (numTweets == 1) {
    var tweet = null;
    do {
      tweet = tweetsLeft.pop(numTweets)[0];
      replenishTweetsLeft();
    } while (isShown(tweet));
    return [tweet];
  } else {
    return tweetsLeft.pop(numTweets);
  }
}

function freshTweet() {
  do {
    var randomBoxNum = Math.floor(Math.random() * numBoxes) + 1;
    var oldBox = getBox(randomBoxNum);
  } while (oldBox.is(':hover') || randomBoxNum==lastRandomBoxNum);
  lastRandomBoxNum = randomBoxNum;
  var newBox = makeNewBox();
  var tweet = getMoreTweets(1)[0];
  
  newBox.attr('id', oldBox.attr('id'));
  newBox = insertTweet(newBox, tweet);
  newBox = colorSocialBox(newBox);
  newBox.css({opacity: 0});
  oldBox.fadeTo(500, 0, function() {
    oldBox.replaceWith(newBox);
    tailorSocialBox(newBox);
    newBox.fadeTo(500, 1.0);
  });
}

function processCachedTweets(data, username) {
  if (data.hasOwnProperty(username)) {
    return data[username]; // server has returned cached data
  } else {
    return data;
  }
}

function collectTweets() {
  console.log('Collecting tweets.');
  $.each(twitters, function(index, username) {
    $.ajax({
        type: 'GET',
        url: 'twitter/'+username,
        dataType: 'json',
        success: function(data) {
          var twitterJSON = processCachedTweets(data, username);
          var i = 0;
          $.each(twitterJSON, function(index, tweet) {
            if ($.inArray(tweet.id, tweetIDs) == -1) {
              var weight = calculateTweetWeight(tweet);
              tweets.push({'key': tweet.id, 'weight': weight, 'data': tweet});
              tweetIDs.push(tweet.id);
              pullHashtags(tweet);
              i++;
            }
          });
          if (i > 0) console.log('Added ' + i + ' tweets from ' + username + '.');
        },
        data: {},
        async: false
    });
  });
  if (mode != 'mobile') sortHashtags();
  if (mode != 'mobile') fillHashtags();
  tweetsLeft = cloneList(tweets);
}

function fillTweets() {
  console.log(tweetsLeft);
  if (mode == 'mobile') {
    var shownTweets = getMoreTweets(50);
    $.each(shownTweets, function(index, tweet){
      var box = makeNewBox();
      console.log('Inserting tweet.');
      var boxTweet = insertTweet(box, tweet);
      boxTweet.appendTo('#social-scene');
      colorSocialBox(boxTweet);
    });
  } else {
    var shownTweets = getMoreTweets(numBoxes);
    var i = 1;
    $.each(shownTweets, function(index, tweet){
      var box = getBox(i);
      console.log('Inserting tweet.');
      insertTweet(box, tweet);
      tailorSocialBox(box);
      colorSocialBox(box);
      i++;
    });
  }
}

function generateTweetDiv(tweet, username) {
  var tweetDiv = getDummy('tweet');
  $('.content', tweetDiv).html(linkifyTwitter(tweet.text));
  $('.timestamp', tweetDiv).html(parseTwitterDate(tweet.created_at));
  var permalink = 'https://twitter.com/'+username+'/status/'+tweet.id_str;
  $('.timestamp', tweetDiv).attr('href', permalink);
  return tweetDiv;
}

function showNewsFeed() {
  if (placeInfo.hasOwnProperty('twitter')) {
    var username = placeInfo.twitter;
    $.getJSON('twitter/'+username, function(data) {
      var twitterJSON = processCachedTweets(data, username);
      if (length(twitterJSON) > 0) {
        $.each(twitterJSON, function(index, tweet) {
          var tweetDiv = generateTweetDiv(tweet, username);
          tweetDiv.appendTo($('#newsfeed'));
        });
      } else {
        // no tweets
      }
    });
  } else {
    console.log('No official Twitter.');
  }
}

function refreshSocial() {
  if (tweets.length > numBoxesFilled()) {
    freshTweet();
  }
}

function viewButtons() {
  $('.button[data-view="'+view+'"]', '#footer').addClass('selected');
  $('.button', '#footer').click(function() {
    if (!$(this).hasClass('selected')) {
      $('.button', '#footer').removeClass('selected');
      $(this).addClass('selected');
      var newView = $(this).data('view');
      switchView(newView);
    }
  })
}

function mobileButtons() {
  $('.selector', '#mobile-menu').click(function() {
    view = $(this).data('view');
    $('#header').fadeOut(200);
    $('.button[data-view="'+view+'"]', '#footer').addClass('selected');
    $('#mobile-menu').fadeOut(200, function() {
      $('#footer').fadeIn(200);
      $('#'+view).fadeIn(200, function() {
        if (view == 'place' && !placeViewInit) initPlaceView();
      });
    });
    viewButtons();
  });
}

function initPlaceView() {
  if (mode != 'mobile') placeSocialBoxes();
  $.getJSON('/'+placeName+'/recent', function(data) {
    $.each(data, function(index, object) {
      addTwitterUser(object['twitterPersonalScreenName']);
    });
    console.log(twitters);
    //twitters = ['bogdream'];
    if (mode != 'mobile') showNewsFeed();
    if (mode != 'mobile') showNotices();
    if (mode == 'mobile') $('.spin-loader', '#place').hide();
    collectTweets();
    fillTweets();
    if (mode != 'mobile') var socialRefresher = setInterval(refreshSocial, 5000);
    if (mode != 'mobile') var tweetCollector = setInterval(collectTweets, 60000);
    placeViewInit = true;
  });
}

function switchView(newView) {
  view = newView;
  $('#people').hide();
  $('#place').hide();
  console.log('SHOWING ' + view);
  $('#'+view).show();
  
  if (mode != 'mobile') {
    $('body').removeClass();
    $('body').addClass(view);
  }
  
  if (view == 'people') {
    setBackground();
  }
  
  if (view == 'place') {
    $('#title.people').hide();
    if (!placeViewInit) initPlaceView();
  }
}

function getAreaIdentifier() {
  // Identifiers are obtained by slice to remove leading '#' or '/'.
  var identifier = window.location.hash.slice(1);
  identifier = identifier || window.location.pathname.slice(1);

  return identifier || null;
}

function getJsonUrl() {
  var identifier = getAreaIdentifier();
  if (identifier) {
    return API_URL + identifier.toLowerCase();
  } else {
    return null;
  }
}

$(document).ready(function(){
  sizes = ['big', 'medium', 'small', 'smaller', 'tiny', 'tinier', 'puny'];
	size = '';
	path = '';
	sizeWidths = [300, 200, 150, 130, 110, 90, 75];
	borders = [30, 20, 15, 13, 11, 9, 8];
	labelShifts = [-30, -20, -15, -13, -11, -9, -8];
	getWindowDimensions();
	overlayMode = false;
	updating = false;
	blurred = false;
	moving = false;
	placeViewInit = false;
	leftOverhang = 60;
	
	view = getParam('view');
  if (view.length == 0) view = 'people'; // default view
  
  mode = getParam('mode');
  if (mode.length == 0) mode = 'desktop'; // default mode
  
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    mode = 'mobile';
  }
  
  $('body').addClass(view);
  $('body').addClass(mode);
  
  if (view == 'people') {
    setBackground();
    var refresher = setInterval(refresh, 60000);
  }
	
	socialColors = ['green', 'red', 'orange', 'purple', 'blue'];
	twitters = [];
	tweets = new WeightedList();
	tweetIDs = [];
	visualBoost = 30;
	hashtags = [];
	sortedHashtags = [];
	lastRandomBoxNum = -1;
	
	jsonURL = $('body').data('json');
  jsonURL = getJsonUrl();
  console.log('API URL', jsonURL)
  placeName = getAreaIdentifier();
  
	people = [];
  population = 0;
  
  loading = true;
  var loader = $('#loading');
  function fadeLoop() {
    loader.animate({opacity:'+=0.5'}, 1000);
    loader.animate({opacity:'-=0.5'}, 1000, fadeLoop);
  }
  fadeLoop();
  
  placeInfo = {};
  $.getJSON('/'+placeName+'/info', function(data) {
    $.each(data, function(id, info) {
      placeInfo[id] = info;
    });
  });
  
	$.post('/track', {
	  apiRoot: API_URL,
	  place: placeName,
	  attributes: 'twitterPersonalScreenName'
	});
	
	$.getJSON(jsonURL, function(data) {
    $.each(data, function(id, info) {
      addPerson(id, info);
      console.log('added ' + id);
    });
    
    calculateSize();
    
    if (size == 'big' || size == 'medium') {
      path = mediumPath;
    } else {
      path = smallPath;
    }
    
    $.each(people, function(index, person) {
      person.addClass(size);
      person.appendTo($('#people'));
    });
    
    initObjects();    
    
    if (mode == 'mobile') {
      $('#mobile-menu').css({top: $('#header').outerHeight()+'px'});
      mobileButtons();
    } else {
      viewButtons();
    }
    
    hideLoader();
    
    if (view == 'place') {
      $('.people').hide();
      initPlaceView();
    }
  });
});


$(window).blur(function(){
  stopMotion();
  blurred = true;
});

$(window).focus(function(){
  resumeMotion();
  blurred = false;
});

function getWindowDimensions() {
  winWidth = $(window).width();
	winHeight = $(window).height();
}

$(window).resize(function() {
  getWindowDimensions();
	if (mode != 'mobile') sizeLayout();
});
