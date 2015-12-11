var Connections = {
  
  lines: [],
  defaultOpacity: 0.3,
  dimOpacity: 0.1,
  collection: null,
  
  collect: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;
    
    var JSONs = [];
    $('.person:not(.device):visible').each(function() {
      if ($(this).css('visibility') != 'hidden') {
        var thisJSON = $(this).data('json');
        thisJSON.id = $(this).attr('id');
        JSONs.push(thisJSON);
      }
    });
    var excluded = [
      'id', 'companyLogoUrl', 'companyUrl', 'companyTitle', 'facebookUsername',
      'firstName', 'lastName', 'linkedInPublicUrl', 'twitterPersonalScreenName'
    ];
    self.collection = Utils.findSimilar(JSONs, excluded);
  },
  
  draw: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;

    paper = Raphael(document.getElementById('svg'), winWidth, winHeight);
    paper.clear();

    if (self.collection == null) self.collect();

    for (var key in self.collection) {
      var thisConnection = self.collection[key];
      for (var similarity in thisConnection) {
        var links = Utils.pairwise(thisConnection[similarity]);
        $(links).each(function() {
          var lineIndex = Line.getIndex(this[0], this[1]);
          if (lineIndex > 0) { // line already exists
            self.lines[lineIndex].similarities.push(similarity);
          } else {
            var line = Line.draw(paper, this[0], this[1], similarity);
            self.lines.push(line);
          }
        });
      }
    }
  },
  
  clear: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;
    self.collection = null;
    $('.person').removeData('lines');
    self.lines = [];
  },

  redraw: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;
    $(self.lines).each(function() {
      var points = Line.getPoints(this.person1, this.person2);
      var pathString = Line.path(points);
      this.points = points;
      this.line.attr({path: pathString});
    });
  },
  
  hide: function(bubble) {
    var self = this;
    var bubbleLines = bubble.data('lines');
    $(bubbleLines).each(function() { 
      this.line.attr('stroke-opacity', 0);
    });
  },
  
  show: function(bubble) {
    var self = this;
    var bubbleLines = bubble.data('lines');
    $(bubbleLines).each(function() { 
      this.line.attr('stroke-opacity', self.defaultOpacity);
    });
  },
   
  highlight: function(bubble) {
    var self = this;
    if (Layout.mobile() || noConnections) return false;

    var bubbleLines = bubble.data('lines');
    $('.label').not($('.label', bubble)).css('opacity', 0.2);
    $('.person').not(bubble).css('opacity', 0.5);

    paper.forEach(function (el) {
      el.attr('stroke-opacity', self.dimOpacity);
    });

    $(bubbleLines).each(function() { 
      this.line.attr('stroke-opacity', 0.9);
      var labelDiv = $('<div class="connectionLabel"></div>');
      var connection = self.lines[Line.getIndex(this.id1, this.id2)];
      connection.person1.css('opacity', 1.0);
      connection.person2.css('opacity', 1.0);
      var similarityString = connection.similarities.join(', ');
      labelDiv.html(similarityString);
      labelDiv.prependTo($('#svg'));
      labelDiv.css(Line.getMidpoint(this.id1, this.id2));
    });
  },
  
  unhighlight: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;
    $('.label').css('opacity', 1.0);
    $('.person').css('opacity', 1.0);
    self.reset();
  },
  
  dim: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;
    paper.forEach(function (el) {
      el.attr('stroke-opacity', self.dimOpacity);
    });
    $('.connectionLabel').remove();
  },

  reset: function() {
    var self = this;
    if (Layout.mobile() || noConnections) return false;
    paper.forEach(function (el) {
      el.attr('stroke-opacity', self.defaultOpacity);
    });
    $('.connectionLabel').remove();
  }
   
};

var Line = {
  
  getIndex: function(id1, id2) {
    var lineIndex = 0;
    $(Connections.lines).each(function(index, line) {
      if (line.ids.indexOf(id1) > -1 && line.ids.indexOf(id2) > -1)
        lineIndex = index;
    });
    return lineIndex;
  },
  
  getPoints: function(bubble1, bubble2) {
    var startPos = bubble1.offset();
    var endPos = bubble2.offset();

    var startX = startPos.left + (bubble1.outerWidth() / 2);
    var startY = startPos.top + (bubble1.outerHeight() / 2);
    var endX = endPos.left + (bubble2.outerWidth() / 2);
    var endY = endPos.top + (bubble2.outerHeight() / 2);

    return [{x: startX, y: startY}, {x: endX, y: endY}];
  },
  
  path: function(points) {
    var p1 = points[0];
    var p2 = points[1];
    return "M "+p1.x+" "+p1.y+" L "+p2.x+" "+p2.y+" Z";
  },
  
  addToPerson: function(bubble, line, id1, id2) {
    if (typeof bubble.data('lines') === 'undefined') {
      var lines = [];
      bubble.data('lines', lines);
    }
    bubble.data('lines').push({line: line, id1: id1, id2: id2});
  },
  
  getPointsFromIds: function(id1, id2) {
    var self = this;
    var bubble1 = $('#'+id1);
    var bubble2 = $('#'+id2);
    return self.getPoints(bubble1, bubble2);
  },
  
  getMidpoint: function(id1, id2) {
    var self = this;
    var points = self.getPointsFromIds(id1, id2);
    var p1 = points[0];
    var p2 = points[1];
    return {left: (p1.x+p2.x)/2, top: (p1.y+p2.y)/2};
  },

  getAngle: function(id1, id2) {
    var self = this;
    var points = self.getPointsFromIds(id1, id2);
    var p1 = points[0];
    var p2 = points[1];
    var angle = Math.atan((p2.y - p1.y) / (p2.x - p1.x)) * 180 / Math.PI;
    return angle;
  },
  
  draw: function(paper, id1, id2, similarity) {
    var self = this;
    
    var person1 = $('#'+id1);
    var person2 = $('#'+id2);

    var points = self.getPoints(person1, person2);
    var pathString = self.path(points);
    var newLine = paper.path(pathString);
    newLine.attr('stroke', '#fff');
    newLine.attr('stroke-width', 2);
    newLine.attr('stroke-opacity', 0.3);

    self.addToPerson(person1, newLine, id1, id2);
    self.addToPerson(person2, newLine, id1, id2);

    return { 
      line: newLine,
      person1: person1,
      person2: person2,
      ids: [id1, id2],
      points: points,
      similarities: [similarity]
    };
  }
  
};