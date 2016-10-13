var Detection = {
  
  data: null,
  graph: null,
  active: true,
  numReceivers: 0,
  transitioning: false,
  allDetected: false,
  intervals: [],
  
  init: function(data) {
    var self = this;
    
    if (Layout.mobile()) {
      Layout.init();
      return true;
    }
    
    lastNumDetected = -1;
    
    self.data = data;
    self.createGraph();
    
    if (self.numReceivers == 0) {
      return false;
    }
    
    self.data = data;
    $('#loading').remove();
    self.initUI();
    return true;
  },

  createGraph: function() {
    var self = this;
    
    var graph = self.transformDataToGraph();

    var map = {};
    var nodes = [];

    graph.transmitters.forEach(function(t) {
      map[t.id] = nodes.length;
      t.group = 3;
      nodes.push(t);
    });

    graph.receivers.forEach(function(t) {
      map[t.id] = nodes.length;
      t.group = 4;
      nodes.push(t);
    });

    graph.links.forEach(function(e) {
      var receiverContainer = $('#'+e.target+'.receiver-container');
      if (receiverContainer.length == 0) {
        receiverContainer = $('<div></div>');
        receiverContainer.attr({id: e.target, class: 'receiver-container'})
        receiverContainer.appendTo('body');
        self.numReceivers++;
      }
      var deviceDiv = $('.device-node').first().clone();
      deviceDiv.attr('id', e.source);
      deviceDiv.appendTo(receiverContainer);
      e.source = map[e.source];
      e.target = map[e.target];
      e.value = (e.value);
    });

    graph.nodes = nodes;
    
    self.graph = graph;
  },
  
  initUI: function() {
    var self = this;
    
    $('.num-sensors').html(self.numReceivers);
    if (self.numReceivers == 1) {
      $('.sensors-are').html('is');
      $('.sensors-plural').html('sensor');
    }
    $('#detection-text').show();
    $('.sensors-text').fadeTo(1000, 1).delay(2000).fadeTo(2000, 0.7);
    $('.looking-text').delay(2000).fadeTo(1000, 1).delay(2000).fadeTo(2000, 0.7);
    $('.devices-text').delay(3000).fadeTo(1000, 1);
    $('.people-text').delay(6000).fadeTo(1000, 1);
    
    function initCheck() {
      if (Parser.complete() && self.allDetected) {
        Layout.init();
      } else {
        setTimeout(initCheck, 1000);
      }
    }
    
    setTimeout(initCheck, 7000);
    
    self.render(self.graph);
    
    $('#graph-svg').hide();
    setTimeout(function() {
      $('#graph-svg').show();
    }, 2000)
  },

  transformDataToGraph: function() {
    var self = this;
    
    var transmitters = [];
    var receivers = [];
    var edges = [];

    for (var deviceId in self.data.devices) {

      var device = self.data.devices[deviceId];

      // Simple way to check if it's a transmitter: transmitters have a `nearest`
      // field and recievers do not.
      var isTransmitter = device.nearest;

      // We only want to look at transmitters, so skip it if it's a receiver.
      if (!isTransmitter) continue;

      transmitters.push({
        id: deviceId
      });

      if (device.nearest) device.nearest.forEach(function(nearestReceiver) {

        var receiverId = nearestReceiver.device;

        var found = false;
        for (var i = 0; i < receivers.length; i++) {
          if (receivers[i].id == receiverId) {
            found = true;
            break;
          }
        }

        if (!found) {
          receivers.push({id: receiverId});
        }

        var edge = {
          source: deviceId,
          target: receiverId,
          value: nearestReceiver.rssi
        };

        edges.push(edge);
      });

    }

    return { links: edges, transmitters: transmitters, receivers: receivers };
  },

  render: function(graph) {
    var self = this;
    
    function linkStrengthMapper(link) {
      return link.value / 2;
    }
    
    var color = d3.scale.category10();
    
    Layout.getWindowDimensions();
    
    var force = d3.layout.force()
        .charge(-1500)
        .gravity(0.4)
        .friction(0.6)
        .linkStrength(0.5)
        .linkDistance(linkStrengthMapper)
        .size([winWidth-10, winHeight-10]);

    var svg = d3.select("body").append("svg")
        .attr('id', 'graph-svg');

    force
        .nodes(graph.nodes)
        .links(graph.links)
        .start();
        
    force.on("tick", function() {
      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });

    });
    
    var node = svg.selectAll(".node")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("title", function(d) { return d.id })
        .attr("class", function(d) { return "graph-node-"+d.group })
        .attr("r", 12)
        .style("fill", function(d) { if (d.group == 3) { return 'white'; } else { return 'orange'; } })
        .call(force.drag);
        
    var k = 0;
    while ((force.alpha() > 1e-4) && (k < 500)) {
        force.tick(),
        k = k + 1;
    }

    node.append("title")
        .text(function(d) { return d.name; });
    
    $('.graph-node-3').each(function() {
      var x = $(this).attr('cx');
      var y = $(this).attr('cy');
      var id = $(this).attr('title');
      $('#'+id+'.device-node').removeClass('dummy').css({left: x+'px', top: y+'px'});
      $(this).remove();
    });
    
    self.receiverDiv = $('.receiver-node');
    
    numDetected = 0;
    var initDelay = 2;
    var maxDelay = 6;
    self.pulseDelay = initDelay;
    $($('.graph-node-4').get().reverse()).each(function() {
      self.showReceiver($(this), self.pulseDelay);
      if (self.pulseDelay >= maxDelay) {
        self.pulseDelay = initDelay;
      } else {
        self.pulseDelay += 1;
      }
    });
    
    $('#pulse-svg').remove();
    
    var interval = setInterval(function() {
      if (lastNumDetected == numDetected) self.allDetected = true;
      lastNumDetected = numDetected;
    }, 2000);
    self.intervals.push(interval);
  },
  
  highlightDevice: function(device, deviceLabel) {
    var self = this;
    
    if (!self.active) return false;
    
    device.fadeTo(200, 0.8).fadeTo(300, 0.5);
    deviceLabel.fadeTo(200, 1.0).delay(1000).fadeTo(1000, 0);
    if (!device.is("[detected]")) {
      numDetected++;
      $('.num-detected').html(numDetected);
      if (numDetected == 1) {
        $('.detected-clause').html('device has');
      } else {
        $('.detected-clause').html('devices have')
      }
      device.attr('detected', 'true');
    }
  },
  
  showReceiver: function(receiverNode) {
    var self = this;
    
    var x = receiverNode.attr('cx');
    var y = receiverNode.attr('cy');
    var id = receiverNode.attr('title');
    
    self.receiverDiv
        .clone()
        .appendTo('body')
        .removeClass('dummy')
        .css({left: x+'px', top: y+'px'})
        .attr('id', 'receiver'+id)
        .delay(1000)
        .fadeTo(500, 1.0);
    
    var pulseX = parseFloat(x) + self.receiverDiv.outerWidth()/2;
    var pulseY = parseFloat(y) + self.receiverDiv.outerHeight()/2;
    
    $('.device-node', '#'+id).each(function() {
      var deviceId = $(this).attr('id');
      var device = $('.device-node-dot', '#'+deviceId);
      var deviceLabel = $('.device-node-label', '#'+deviceId);
      var dist = Utils.distance(device.offset().left, device.offset().top, pulseX, pulseY);
      setTimeout(function() {
        self.highlightDevice(device, deviceLabel);
        var interval = setInterval(function() {
          self.highlightDevice(device, deviceLabel);
        }, 5000);
        self.intervals.push(interval);
      }, dist*20+300+(self.pulseDelay*1000));
    });
    
    var pulse = $('#pulse-container').clone().attr('transform','translate('+pulseX+','+pulseY+')');
    $('animateTransform', pulse).attr('begin', self.pulseDelay+'s');
    $('animate', pulse).attr('begin', self.pulseDelay+'s');
    pulse.appendTo('#graph-svg');
    receiverNode.remove();
    
    setTimeout(function() {
      $('#'+id+'.receiver-container').addClass('pulsed');
    }, 5000 + self.pulseDelay*1000);
    
    var interval = setInterval(function() {
      var numPeople = $('.person:not(.device)').length;
      $('.num-people').html(numPeople);
      if (numPeople > 0) $('.people-text').css({visibility: 'visible'});
    }, 5000);
    self.intervals.push(interval);
  },
  
  allPulsed: function() {
    var self = this;
    if ($('.receiver-container:not(.pulsed)').length > 0) {
      console.log('NOT ALL PULSED');
      return false;
    } else {
      console.log('ALL PULSED');
      return true;
    }
  },
  
  addInfo: function(id, info, itemType) {
    if (itemType == 'device') {
      var label = '';
      if (info.manufacturer == 'Unknown') {
        label = info.model;
      } else if(info.hasOwnProperty('organization')) {
        label = info.organization;
      } else {
        label = info.manufacturer + ' ' + info.model;
      }
      $('.device-node-label', '#'+id+'.device-node').html(label);
    }
  },
  
  hide: function() {
    $('.receiver-container').hide();
    $('.receiver-node').hide();
    $('#graph-svg').remove();
    $('#detection-text').hide();
  },
  
  transition: function() {
    var self = this;
    
    self.active = false;
    self.transitioning = true;
    
    Motion.stop();
    
    $('.person:visible').each(function() {
      var bubble = $(this);
      var id = bubble.data('deviceID');
      var bubblePos = bubble.offset();
      var deviceNode =  $('#'+id+'.device-node');
      if (deviceNode.length == 0) {
        receiverNode = $('#receiver'+id);
        deviceNode = $('.device-node')
          .first().clone().removeClass('dummy')
          .css({
            left: parseInt(receiverNode.css('left'))+11+'px',
            top: parseInt(receiverNode.css('top'))+11+'px',
            zIndex: 0
          });
        deviceNode.appendTo('body');
      }
      
      deviceNode.addClass('persist');
      
      $('.device-node-label', deviceNode).remove();
      
      var nodeX = bubblePos.left + bubble.outerWidth()/2 - deviceNode.outerWidth()/2;
      var nodeY = bubblePos.top + bubble.outerHeight()/2 - deviceNode.outerHeight()/2;
      
      var width = bubble.css('width');
      var height = bubble.css('height');
      var left = parseInt(bubble.css('left')) + parseInt(bubble.css('border-left-width'));
      var top = parseInt(bubble.css('top')) + parseInt(bubble.css('border-left-width'));
      
      deviceNode.delay(2000).animate({left: nodeX, top: nodeY}, 800, 'easeInOutQuad', function() {
        $(this).animate({left: left+'px', top: top+'px'}, 500, 'easeInOutQuad');
        var nodeDot = $('.device-node-dot', $(this));
        nodeDot.animate({width: width, height: height, opacity: 0.2},
          500, 'easeInOutQuad', function() {
            $(this).parent().fadeOut(300, function() {
              $(this).remove();
            }
          );
          $('#svg').fadeTo(300, 1.0);
          bubble.fadeTo(300, 1.0);
        });
      });
    });
    
    var persistingDots = $('.device-node.persist .device-node-dot');
    if (Layout.view == 'people') {
      persistingDots.fadeTo(100, 1).delay(200).fadeTo(100, 0.5).delay(200).fadeTo(100, 1);
    } else {
      persistingDots.fadeTo(300, 1);
    }
    
    $('#graph-svg').delay(1000).fadeOut(500);
    
    $('.device-node:not(.persist)').delay(1000).fadeOut(500, function() {
      $(this).remove();
    });
    $('.receiver-node').delay(1500).fadeOut(500);
    $('#detection-text').delay(2000).fadeOut(500);
    
    setTimeout(function() {
      Motion.resume();
      self.transitioning = false;
      $('#header').fadeIn(1000);
      if (Layout.desktop()) $('#footer').fadeIn(1000);
      
      $.each(self.intervals, function(key, interval) {
        clearInterval(interval);
      });
    }, 3800);
  }
  
}
