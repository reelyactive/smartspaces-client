var SocialScene = {
  
  initialized: false,
  boxes: [],
  colors: ['green', 'red', 'orange', 'purple', 'blue'],
  lastRandomBoxNum: -1,

  init: function() {
    var self = this;
    
    if (self.initialized) return true;
    
    self.placeBoxes();
    
    $.post('/track', {
  	  apiRoot: SmartSpace.apiURL,
  	  place: SmartSpace.placeName,
  	  attributes: Tweets.jsonAttribute
  	});
    
    $.getJSON('/'+SmartSpace.placeName+'/recent', function(data) {
      $.each(data, function(index, object) {
        Tweets.addUser(object[Tweets.jsonAttribute]);
      });
      
      Notices.init();
      Tweets.init();
      
      if (Layout.mobile()) {
        $('.spin-loader', '#place').hide();
      } else {
        var socialRefresher = setInterval(self.refresh, 5000);
        var tweetCollector = setInterval(Tweets.refresh, 60000);
      }
      
      self.initialized = true;
    });
  },
  
  setRowsAndColumns: function() {
    var self = this;
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
    self.numRows = rows;
    self.boxesPerRow = cols;
  },
  
  placeBoxes: function() {
    var self = this;
    
    if (Layout.mobile()) return true;
    
    self.setRowsAndColumns();
    
    var k = 1;
    for (i = 0; i < self.numRows; i++) {
      var row = $('<div class="row"></div>');
      for (j = 0; j < self.boxesPerRow; j++) {
        var newBox = new SocialBox(k);
        row = newBox.addToRow(row);
        k++;
      }
      row.appendTo('#social-scene');
    }
    
    $.each(self.boxes, function(key, box) {
      box.setDivs();
    });
    
    self.numBoxes = self.boxes.length;
    self.sizeLayout();
  },
  
  numBoxesFilled: function() {
    var self = this;
    return $('.social-item.filled', '#social-scene').length;
  },
  
  shownBoxes: function() {
    return $('.social-item', '#social-scene');
  },
  
  remainingSpace: function() {
    var self = this;
    var currentHeight =
      self.containerDiv.height()
      + self.containerDiv.offset().top
      + $('#footer:visible').height() + 10;
    var remainder = $(window).height() - currentHeight;
    return remainder;
  },
  
  sizeNewsArea: function() {
    var self = this;
    var newsWidth =
      $(window).width()
      - $('#trending-container:visible').outerWidth(true)
      - self.containerDiv.outerWidth(true) - 35;
    $('#news-container').css({width: newsWidth+'px'});
    var newsfeedHeight = 
      self.containerDiv.height()
      - $('#noticeboard-container').outerHeight(true)
      - $('#newsfeed-container > .header').outerHeight(true) - 15;
    $('#newsfeed').css({height: newsfeedHeight+'px'});
  },
  
  sizeLayout: function() {
    var self = this;
    self.containerDiv = $('#social-scene-container');
    var remainder = self.remainingSpace();
    var currentBoxSize = $('.social-item').height();
    var boxIncrease = remainder / self.numRows;
    var newBoxSize = currentBoxSize + boxIncrease;
    $('.social-item').css({height: newBoxSize+'px', width: newBoxSize+'px'});
    var socialSceneWidth = self.boxesPerRow * (newBoxSize + 20);
    self.containerDiv.css({width: socialSceneWidth+'px'});
    self.sizeNewsArea();
  },
  
  refresh: function() {
    if (Tweets.tweets.length > SocialScene.numBoxesFilled()) {
      Tweets.getOne();
    }
  }
  
};


var Tweets = {
  
  users: [],
  remaining: [],
  ids: [],
  hashtags: [],
  sortedHashtags: [],
  visualBoost: 30,
  jsonAttribute: 'twitterPersonalScreenName',
  
  init: function() {
    var self = this;
    self.tweets = new WeightedList();
    self.showNewsFeed();
    self.collect();
    self.fill();
  },
  
  addUser: function(username) {
    var self = this;
    if ($.inArray(username, self.users) < 0) {
      self.users.push(username);
    }
  },
  
  calculateWeight: function(tweet) {
    var self = this;
    var retweeterFollowers = 0;
    var boost = 1;
    if (tweet.hasOwnProperty('retweeted_status')) {
      var retweeterFollowers = tweet.user.followers_count;
    }
    if (tweet.entities.hasOwnProperty('media')
        && tweet.entities.media[0].type == 'photo') {
      boost = boost + self.visualBoost;
    }
    var favs = tweet.favorite_count;
    var rts = tweet.retweet_count;
    var followers = tweet.user.followers_count + (retweeterFollowers / 2) + 50;
    var weight = (favs + (3*rts) + 0.1) / followers;
    return weight * 1000 * boost;
  },
  
  isShown: function(tweet) {
    var self = this;
    var found = false;
    SocialScene.shownBoxes().each(function() {
      if ($(this).data('tweet-id') == tweet['data'].id) {
        found = true;
      }
    });
    return found;
  },
  
  collect: function() {
    var self = this;
    $.each(self.users, function(index, username) {
      $.ajax({
          type: 'GET',
          url: '/twitter/'+username,
          dataType: 'json',
          success: function(data) {
            var twitterJSON = self.processCached(data, username);
            var i = 0;
            $.each(twitterJSON, function(index, tweet) {
              if ($.inArray(tweet.id, self.ids) == -1) {
                var weight = self.calculateWeight(tweet);
                self.tweets.push({'key': tweet.id, 'weight': weight, 'data': tweet});
                self.ids.push(tweet.id);
                self.pullHashtags(tweet);
                i++;
              }
            });
            //if (i > 0) console.log('Added ' + i + ' tweets from ' + username + '.');
          },
          data: {},
          async: false
      });
    });
    self.sortHashtags();
    self.fillHashtags();
    self.remaining = Utils.cloneList(self.tweets);
  },

  refresh: function() {
    Tweets.collect();
  },
  
  replenishRemaining: function() {
    var self = this;
    if (self.remaining.length == 0) {
      self.remaining = Utils.cloneList(self.tweets);
    }
  },
  
  getMore: function(numTweets) {
    var self = this;
    self.replenishRemaining();
    if (self.tweets.length < numTweets) {
      numTweets = self.tweets.length;
    }
    if (numTweets == 1) {
      var tweet = null;
      do {
        tweet = self.remaining.pop(numTweets)[0];
        self.replenishRemaining();
      } while (self.isShown(tweet));
      return [tweet];
    } else {
      return self.remaining.pop(numTweets);
    }
  },
  
  getOne: function() {
    var self = this;
    do {
      var randomBoxNum = Math.floor(Math.random() * SocialScene.numBoxes);
      var oldBox = SocialScene.boxes[randomBoxNum];
    } while (oldBox.box.is(':hover') || randomBoxNum==SocialScene.lastRandomBoxNum);
    SocialScene.lastRandomBoxNum = randomBoxNum;
    var tweet = self.getMore(1)[0];
    oldBox.replaceTweet(tweet);
  },
  
  fill: function() {
    var self = this;
    if (Layout.mobile()) {
      var shownTweets = self.getMore(20);
      $.each(shownTweets, function(index, tweet){
        var box = new SocialBox(index);
        box.addToPage();
        box.insertTweet(tweet);
      });
    } else {
      var shownTweets = self.getMore(SocialScene.numBoxes);
      var i = 0;
      $.each(shownTweets, function(index, tweet){
        var box = SocialScene.boxes[i];
        box.insertTweet(tweet);
        box.tailor();
        i++;
      });
    }
  },
  
  linkify: function(text) {
    return Autolinker.link(text.parseHashtag());
  },

  generateDiv: function(tweet, username) {
    var self = this;
    var tweetDiv = Layout.getDummy('tweet');
    $('.content', tweetDiv).html(self.linkify(tweet.text));
    $('.timestamp', tweetDiv).html(Utils.parseDate(tweet.created_at));
    var permalink = 'https://twitter.com/'+username+'/status/'+tweet.id_str;
    $('.timestamp', tweetDiv).attr('href', permalink);
    return tweetDiv;
  },
  
  showNewsFeed: function() {
    var self = this;
    if (Layout.mobile()) return true;
    if (SmartSpace.placeInfo.hasOwnProperty('twitter')) {
      var username = SmartSpace.placeInfo.twitter;
      $.getJSON('/twitter/'+username, function(data) {
        var twitterJSON = self.processCached(data, username);
        if (Utils.length(twitterJSON) > 0) {
          $.each(twitterJSON, function(index, tweet) {
            var tweetDiv = self.generateDiv(tweet, username);
            tweetDiv.appendTo($('#newsfeed'));
          });
        } else {
          // no tweets
        }
      });
    } else {
      console.log('No official Twitter.');
    }
  },

  processCached: function(data, username) {
    if (data.hasOwnProperty(username)) {
      return data[username]; // server has returned cached data
    } else {
      return data;
    }
  },
  
  pullHashtags: function(tweet) {
    var self = this;
    if (tweet.entities.hasOwnProperty('hashtags')) {
      $.each(tweet.entities.hashtags, function(index, hashtag) {
        self.hashtags.push(hashtag.text);
      });
    }
  },

  sortHashtags: function() {
    var self = this;
    if (Layout.mobile()) return true;
    var histogramMap = {};
    for(var i=0, len=self.hashtags.length; i<len; i++){
      var key = self.hashtags[i];
      histogramMap[key] = (histogramMap[key] || 0) + 1;
    }
    var histogram = [];
    for(key in histogramMap) histogram.push({key: key, freq: histogramMap[key]});
    histogram.sort(function(a,b){return b.freq - a.freq});
    self.sortedHashtags = histogram;
  },

  fillHashtags: function() {
    var self = this;
    if (Layout.mobile()) return true;
    var minimum = 5;
    var numTags = 10;
    if (self.sortedHashtags.length >= minimum) {
      $('#trending-container').show();
      $('#trending').empty();
      $(self.sortedHashtags).slice(0, numTags).each(function(index, object) {
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
    SocialScene.sizeNewsArea();
  }
  
};


var Notices = {
  
  persist: 6, // time in seconds to show each notice
  
  init: function() {
    var self = this;
    self.containerDiv = $('#noticeboard-container');
    self.div = $('#notices');
    self.form = $('#notice-form');
    self.button = $('.button', self.containerDiv);
    self.addButton = $('.button.add', self.containerDiv);
    self.cancelButton = $('.button.cancel', self.containerDiv);
    self.postButton = $('.button.post', self.containerDiv);
    self.show();
  },
  
  emptyMessage: function(text) {
    var self = this;
    self.div.empty();
    self.div.addClass('empty');
    self.div.html('<div class="notice">'+text+'</div>');
  },
  
  clear: function() {
    var self = this;
    self.emptyMessage('No notices to show.')
  },
  
  post: function(notice) {
    var self = this;
    self.form.hide();
    self.emptyMessage('Posting notice...');
    self.button.hide();
    self.div.show();
    $.post('/'+SmartSpace.placeName+'/notices/new', {
  	  message: notice
  	}, function(data) {
  	  self.insert(data);
  	  self.addButton.show();
  	});
  },
  
  insert: function(notices) {
    var self = this;
    if (notices.length > 0) {
      self.div.removeClass('empty');
      self.div.empty();
      $.each(notices, function(id, notice) {
        var noticeDiv = $('<div class="notice"></div>');
        noticeDiv.html(notice.message);
        self.div.append(noticeDiv);
      });
      self.cycle();
    } else {
      self.clear();
    }
  },

  show: function() {
    var self = this;
    
    if (Layout.mobile()) return true;
    
    self.addButton.click(function() {
      self.div.hide();
      self.form.val("").show().focus();
      $(this).hide();
      self.cancelButton.show();
      self.postButton.show();
    });

    self.cancelButton.click(function() {
      self.form.hide();
      self.div.show();
      $(this).hide();
      self.postButton.hide();
      self.addButton.show();
    });

    self.postButton.click(function() {
      self.post(self.form.val());
    });

    self.form.keydown(function(e) {
      if (e.keyCode == 13) {
        if (!e.shiftKey) {
          self.post($(this).val());
        }
      }
    });

    $.getJSON('/'+SmartSpace.placeName+'/notices', function(data) {
      if (data.length == 0) {
        self.clear();
      } else {
        self.insert(data);
      }
    });
  },
  
  fade: function(notice) {
    var self = this;
    if (notice.next().length > 0) {
      var next = notice.next();
    } else {
      var next = $('.notice').first();
    }
    notice.delay(self.persist * 1000).fadeOut(500, function() {
      next.fadeIn(500, function() {
        notice = next;
        Notices.fade(notice);
      });
    });
  },
  
  cycle: function() {
    var self = this;
    var first = $('.notice').first();
    first.show();
    if (first.next().length > 0) {
      self.fade(first);
    }
  }
};


var SocialBox = function (boxNum) {
  var self = this;
  var box = $('.social-item.dummy').clone();
  box.removeClass('dummy');
  self.num = boxNum;
  box.attr('id', 'social-item-'+boxNum);
  self.box = box;
  SocialScene.boxes.push(self);
};

SocialBox.prototype = {
  setDivs: function() {
    var self = this;
    self.box = $('#social-item-'+self.num, '#social-scene');
    self.content = $('.content', self.box);
    self.from = $('.from', self.box);
    self.via = $('.via', self.box);
  },

  addToRow: function(row) {
    var self = this;
    row = row.append(self.box);
    return row;
  },

  addToPage: function() {
    var self = this;
    self.box.appendTo('#social-scene');
    self.setDivs();
  },

  getAdjacent: function() {
    var self = this;
    var adjacentBoxes = [];
    if (Layout.mobile()) {
      adjacentBoxes.push(self.box.prev('.social-item'));
      adjacentBoxes.push(self.box.next('.social-item'));
    } else {
      var adjacentNums =
        [self.num - boxesPerRow, self.num + boxesPerRow, self.num - 1, self.num + 1];
      $.each(adjacentNums, function(index, thisNum) {
        if (thisNum > 0 && thisNum <= SocialScene.numBoxes) {
          adjacentBoxes.push($('#social-item-'+thisNum));
        }
      });
    }
    return adjacentBoxes;
  },

  isAdjacentColor: function(color) {
    var self = this;
    var adjacentBoxes = self.getAdjacent();
    var colorFound = false;
    $.each(adjacentBoxes, function(index, thisBox) {
      if (thisBox.hasClass(color)) {
        colorFound = true;
      }
    });
    return colorFound;
  },

  color: function() {
    var self = this;
  
    if (self.box.hasClass('photo')) return true;
  
    var color = null;
    var unusedColors = SocialScene.colors.slice();
  
    $.each(SocialScene.boxes, function(key, box) {
      if (box.box.data().hasOwnProperty('color')) {      
        unusedColors.remove($(this).data('color'));
      }
    });
  
    if (unusedColors.length > 0) {
      color = Utils.randomElement(unusedColors);
    } else {
      do {
       color = Utils.randomElement(SocialScene.colors); 
      } while (self.isAdjacentColor(color));
    }

    self.box.addClass(color);
    self.box.data('color', color);
  },

  decreaseFont: function() {
    var self = this;
  
    var fontSize = parseInt(self.box.css('font-size'));
    var userPadding = parseInt(self.from.css('padding'));
    var contentPadding = parseInt(self.content.css('padding'));
  
    fontSize = fontSize - 1 + 'px';
    if (userPadding > 3) userPadding = userPadding - 1 + 'px';
    if (contentPadding > 4) contentPadding = contentPadding - 2 + 'px';
  
    self.box.css({'font-size': fontSize, 'line-height': fontSize});
    self.from.css({'padding': userPadding});
    self.via.css({'padding': userPadding});
    self.content.css({'padding': contentPadding});
  },

  contentOverflow: function() {
    var self = this;
    var buffer = 20;
    var availableArea = self.box.height() - ($('.from', self.box).height() * 2) - buffer;
    if (self.content.height() > availableArea
     || self.content.outerWidth() > self.box.width()+2
     || self.from.outerWidth() > self.box.width()
     || self.via.outerWidth() > self.box.width())
    {
      return true;
    } else {
      return false;
    }
  },

  tailor: function() {
    var self = this;
    while (self.contentOverflow()) {
      self.decreaseFont();
    }
  },

  addTweetContent: function(tweetObject) {
    var self = this;
  
    var newBox = self.box.clone();
  
    var tweet = tweetObject['data'];
    if (tweet.hasOwnProperty('retweeted_status')) {
      var from = tweet.retweeted_status.user.screen_name;
      var text = tweet.retweeted_status.text;
      var tweetID = tweet.retweeted_status.id_str;
      var via = tweet.user.screen_name
      $('.via .user', newBox).html(Tweets.linkify('@'+via));
      $('.via', newBox).show();
      newBox.addClass('retweet');
    } else {
      var from = tweet.user.screen_name;
      var text = tweet.text;
      var tweetID = tweet.id_str;
    }
  
    $('.from', newBox).html(Tweets.linkify('@'+from));
    $('.content', newBox).html(Tweets.linkify(text));
    newBox.attr('href', 'https://twitter.com/'+from+'/status/'+tweetID);
    newBox.removeClass('photo');

    if (tweet.entities.hasOwnProperty('media')) {
      $.each(tweet.entities.media, function(index, element) {
        if (element.type == 'photo') {
          newBox.css({backgroundImage: 'url('+element.media_url+')'});
          newBox.addClass('photo');
          $.each(SocialScene.colors, function(index, color) {
            newBox.removeClass(color);
          });
          newBox.removeData('color');
        }
      });
    }

    newBox.addClass('filled');
    newBox.data('tweet-id', tweet.id);
  
    return newBox;
  },

  insertTweet: function(tweetObject) {
    var self = this;
    self.box.replaceWith(self.addTweetContent(tweetObject));
    self.setDivs();
    self.color();
  },

  replaceTweet: function(tweetObject) {
    var self = this;
    var newBox = self.addTweetContent(tweetObject);
    newBox.css({opacity: 0});
    self.box.fadeTo(500, 0, function() {
      self.box.replaceWith(newBox);
      self.setDivs();
      self.color();
      self.tailor();
      self.box.fadeTo(500, 1.0);
    });
  }
};