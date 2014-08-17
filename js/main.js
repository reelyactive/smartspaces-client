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
  if (!overlayMode && !updating) {
    $.each(allWalkers, function(index, thisWalker) {
      thisWalker.resume();
    });
  }
  moving = true;
}

function stopMotion() {
  $.each(allWalkers, function(index, thisWalker) {
    thisWalker.pathAnimator.stop();
  });
  moving = false;
}

function startWalkers() {
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

function placeObjects() {
  var buffer = 1.3;
  var object_area = $('.'+size).height();
  var min_x = 0;
  var max_x = winWidth - buffer*object_area;
  var min_y = $('#header').height();
  var max_y = winHeight - object_area*buffer - $('#footer').height() - 50;
  var padding_buffer = object_area / 6;
  var max_tries = 100;
  //var padding_buffer = 0;

  var tries = 0;
  do {
    $('.person').each(function() {
      var rand_x=0;
      var rand_y=0;
      rand_x = Math.round(min_x + ((max_x - min_x)*(Math.random() % 1)));
      rand_y = Math.round(min_y + ((max_y - min_y)*(Math.random() % 1)));
      $(this).css({left: rand_x, top: rand_y, padding: padding_buffer});
    });
    tries = tries + 1;
  } while(check_overlap(tries));
  
  console.log(tries + ' TRIES!');
  if (tries > max_tries) {
    sizeIndex = sizeIndex + 1;
    old_size = size;
    size = sizes[sizeIndex];
    console.log('changing to ' + size);
    $('.person').each(function() {
      $(this).removeClass(old_size);
      $(this).addClass(size)
    });
    placeObjects();
  }
  
  function check_overlap(tries) {
    if (tries > max_tries) {
      console.log('too many tries');
      return false;
    }
    var total_collisions = 0;
    $('.person:not(.dummy)').each(function() {
      var collisions = $(this).collision('.person:not(#'+this.id+'), .avoid');
      var label_collisions = $('.label', $(this)).collision('.person:not(#'+this.id+'), .avoid');
      total_collisions = total_collisions + collisions.length + label_collisions.length;
    });
    //console.log(total_collisions);
    if (total_collisions > 0) {
      return true;
    } else {
      return false;
    }
  }
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

	  $(this).animate({
	    borderWidth: newBorder+'px',
	    top: '-='+increase+'px',
	    left: '-='+increase+'px'
	  }, 300, function() {
	    if ($(this).hasClass('hover')) {
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
    	    linkedin.css({width: iconSize+'px', height: iconSize+'px', left: linkedinPos.left+'px', top: linkedinPos.top+'px', borderRadius: iconSize+'px'});
          linkedin.fadeIn(300);
        }
      }
	  });
	}, function() {
	  if (overlayMode) return false;
	  
    $(this).finish();
    $(this).removeClass('hover');
	  var label = $('.label', this);
	  label.finish();
	  $('.icon', $(this)).finish();
	  $('.icon', $(this)).hide();

	  resumeMotion();

	  $(this).css({borderWidth: borders[sizeIndex] + 'px'});

    resetLabel($(this));
	});
}

function hideOverlay(person) {
  console.log('hiding overlay');
  person.removeClass('hover');
  $('.icon', person).removeClass('active');
  $('.person:not(#'+person.attr('id')+')').fadeTo(500, 1.0);
  $('#title').fadeTo(500, 1.0);
  $('#overlay').fadeOut(500, function() {
    $('.tweet').remove();
    $('.job').remove();
    //$('.degree').remove();
  });
  $('#arrow').fadeOut(500);
  $('.icon', person).fadeOut(300);
  resetLabel(person);
  person.animate({left: person.data('origX'), top: person.data('origY'), borderWidth: person.data('origBorder')}, 300, function() {
    resumeMotion();
  });
  $(document).unbind('click');
  overlayMode = false;
}

function setOverlayDimensions() {
  overlayHeight = winHeight - $('#header').height() - $('#footer').height() - 20;
  overlayTop = $('#header').height() + 10;
  overlayWidth = 300;
}

function openOverlay() {
  setOverlayDimensions();
  var scrollable = true;
  var contentHeight = $('#overlay .'+overlayType).height() + $('#overlay .header').height() + 15;
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
  console.log('scrollable: ' + scrollable);
  $('#overlay').removeClass('scrollable');
  $('#overlay').animate({height: overlayHeight, top: overlayTop, borderRadius: '10px'}, 500, 'easeInOutCubic', function(){
    $('#overlay .loading').fadeOut(500, function() {
      $('#overlay .header').fadeIn(500);
      $('#overlay .'+overlayType).fadeIn(500);
      if (scrollable) {
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

function instrumentIcons() {
  $('.icon').unbind('click');
  $('.icon').click(function() {
    var person = $(this).parent();
    
    if (overlayMode && $(this).hasClass(overlayType+'-icon')) {
      
      hideOverlay(person);
      
    } else {
      
      overlayMode = true;
      overlayType = '';
      $('.icon').removeClass('active');
      $(this).addClass('active');
      $('#overlay').removeClass('scrollable');
      
      setOverlayDimensions();
      
      var personLeft = parseInt(person.css('left'));
      var personTop = parseInt(person.css('top'));
      var personWidth = person.width();
      var borderWidth = newBorder;
      var arrowWidth = 50;
      // overlay left of bubble
      var arrowLeft = personLeft + borderWidth - arrowWidth - 20;
      $('#arrow').css({borderLeft: arrowWidth+'px solid white', borderRight: 'none'});
      var overlayLeft = arrowLeft - overlayWidth;
      if (overlayLeft < 0) {
        // overlay right of bubble
        arrowLeft = personLeft + personWidth + borderWidth + 20;
        $('#arrow').css({borderRight: arrowWidth+'px solid white', borderLeft: 'none'});
        overlayLeft = arrowLeft + arrowWidth;
      }
      arrowTop = parseInt(person.data('origY')) + (personWidth/2) - 18;
      
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

      //person.animate({left: person.data('origX'), top: person.data('origY'), borderWidth: person.data('origBorder')}, 300);
      $('#arrow').css({left: arrowLeft+'px', top: arrowTop+'px'});
      $('#overlay').css({height: '70px', top: arrowTop+'px', left: overlayLeft+'px', borderRadius: 0});
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
      $('#arrow').fadeIn(500);
      $('.person:not(#'+person.attr('id')+')').fadeTo(500, 0.3);
      $('#title').fadeTo(500, 0.3);

      if ($(this).hasClass('twitter-icon')) { // load twitter
        
        overlayType = 'twitter';
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
            openOverlay();
          } else {
            $('#overlay .loading').html('Sorry, no tweets!');
          }
          console.log(data);
        }).fail(function(jqxhr){
          console.log(jqxhr.responseText);
        });
        
      } else {
        
        overlayType = 'linkedin';
        var publicURL = person.data('linkedin');
        $('#permalink').attr('href', publicURL);
        $.getJSON('http://smartspaces.herokuapp.com/linkedin/'+publicURL, function(data) {
          if (length(data) > 0) {
            $('#overlay .linkedin .section').hide();
            $('#overlay .header .name').html(person.data('name'));
            if (length(data.current) > 0) {
              $('.job').remove();
              $.each(data.current, function(key, job) {
                thisJob = getDummy('job');
                $('.title', thisJob).html(job.title);
                $('.company', thisJob).html(job.company.name);
                $('.description', thisJob).html(job.summary);
                thisJob.appendTo($('#overlay .linkedin .current'));
              });
              $('#overlay .linkedin .current').show();
              if (person.data('company-logo') && person.data('company-link')) {
                console.log('setting logo and link');
                var logo = $('#company-logo');
                var link = $('#company-link');
                link.attr('href', person.data('company-link'));
                link.show();
                link.css({display: 'block'});
                if (logo.attr('src') == person.data('company-logo')) {
                  console.log('already loaded');
                  openOverlay();
                } else {
                  logo.attr('src', person.data('company-logo')).load(function() {
                    console.log('image loaded');
                    openOverlay();
                  });
                }
              } else {
                openOverlay();
              }
            }
            /*
            if (length(data.past) > 0) {
              $.each(data.past, function(key, job) {
                thisJob = getDummy('job');
                $('.title', thisJob).html(job.title);
                $('.company', thisJob).html(job.company);
                $('.description', thisJob).html(job.description);
                thisJob.appendTo($('#overlay .linkedin .past'));
                $('#overlay .linkedin .past').show();
              });
            }
            if (length(data.education) > 0) {
              $.each(data.education, function(key, degree) {
                thisDegree = getDummy('degree');
                $('.type', thisDegree).html(degree.description);
                $('.school', thisDegree).html(degree.name);
                thisDegree.appendTo($('#overlay .linkedin .education'));
                $('#overlay .linkedin .education').show();
              });
            }
            */
          } else {
            $('#overlay .loading').html('Sorry, no profile found!');
          }
          console.log(data);
        }).fail(function(jqxhr){
          console.log(jqxhr.responseText);
        });
        
      }
      
    }
  });
}

function hideLoader() {
  if (loading) {
    $('#header').show();
    $('#footer').show();
    $('#loading').remove();
    $('#title').show();
    
    if (view=='place') {
      $('#place').show();
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
  if (blurred) { stopMotion(); }
}

function calculateSize() {
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
  if (overlayMode || (!moving && !blurred)) { return false; }
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
  var num = getBoxNum(box);
  var adjacentNums = [num - boxesPerRow, num + boxesPerRow, num - 1, num + 1];
  console.log(adjacentNums);
  var adjacentBoxes = [];
  $.each(adjacentNums, function(index, thisNum) {
    if (thisNum > 0 && thisNum <= numBoxes) {
      adjacentBoxes.push($('#social-item-'+thisNum));
    }
  });
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
  var randomBoxNum = Math.floor(Math.random() * numBoxes) + 1;
  var oldBox = getBox(randomBoxNum);
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
  sortHashtags();
  fillHashtags();
  tweetsLeft = cloneList(tweets);
}

function fillTweets() {
  console.log(tweetsLeft);
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

function initPlaceView() {
  placeSocialBoxes();
  $.getJSON('/'+placeName+'/recent', function(data) {
    $.each(data, function(index, object) {
      addTwitterUser(object['twitterPersonalScreenName']);
    });
    console.log(twitters);
    //twitters = ['bogdream'];
    showNewsFeed();
    showNotices();
    collectTweets();
    fillTweets();
    var socialRefresher = setInterval(refreshSocial, 5000);
    var tweetCollector = setInterval(collectTweets, 60000);
    placeViewInit = true;
  });
}

function switchView(newView) {
  view = newView;
  $('#people').hide();
  $('#place').hide();
  $('#'+view).show();
  
  $('body').removeClass();
  $('body').addClass(view);
  
  if (view == 'people') {
    setBackground();
  }
  
  if (view == 'place') {
    $('.people').hide();
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
	winWidth = $(window).width();
	winHeight = $(window).height();
	overlayMode = false;
	updating = false;
	blurred = false;
	placeViewInit = false;
	
	view = getParam('view');
  if (view.length == 0) view = 'people'; // default view
  
  $('body').addClass(view);
  
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
    hideLoader();
    viewButtons();
    
    if (view == 'place') {
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

$(window).resize(function() {
  winWidth = $(window).width();
	winHeight = $(window).height();
	sizeLayout();
});
