var Detection = {
  
  data: null,
  
  init: function(data) {
    var self = this;
    
    if (Layout.mobile()) {
      Layout.init();
      return true;
    }
    
    self.data = data;
    $('#loading').remove();
    self.createGraph();
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

    var numReceivers = 0;
    graph.links.forEach(function(e) {
      var receiverContainer = $('#'+e.target+'.receiver-container');
      if (receiverContainer.length == 0) {
        receiverContainer = $('<div></div>');
        receiverContainer.attr({id: e.target, class: 'receiver-container'})
        receiverContainer.appendTo('body');
        numReceivers++;
      }
      var deviceDiv = $('.device-node').first().clone();
      deviceDiv.attr('id', e.source);
      deviceDiv.appendTo(receiverContainer);
      e.source = map[e.source];
      e.target = map[e.target];
      e.value = (e.value);
    });

    graph.nodes = nodes;
    
    $('.num-sensors').html(numReceivers);
    $('#detection-text').show();
    $('.sensors-text').fadeTo(1000, 1).delay(2000).fadeTo(2000, 0.7);
    $('.looking-text').delay(3000).fadeTo(1000, 1).delay(2000).fadeTo(2000, 0.7);
    $('.devices-text').delay(4500).fadeTo(1000, 1);
    $('.people-text').delay(9000).fadeTo(1000, 1);
    
    setTimeout(function() {
      $('.show-context').css('display','inline-block').show().fadeTo(1000, 0.8);
    }, 10500);
    $('.show-context').click(function() {
      Layout.init();
    });
    
    self.render(graph);
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
    
    function distance(x1, y1, x2, y2) {
      var a = x1 - x2;
      var b = y1 - y2;
      return Math.sqrt( a*a + b*b );
    }
    
    function highlightDevice(device, deviceLabel) {
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
    }
    
    var receiverDiv = $('.receiver-node');
    
    function showReceiver(receiverNode) {
      var x = receiverNode.attr('cx');
      var y = receiverNode.attr('cy');
      var id = receiverNode.attr('title');
      
      receiverDiv
        .clone()
        .appendTo('body')
        .removeClass('dummy')
        .css({left: x+'px', top: y+'px'})
        .delay(2000)
        .fadeTo(1000, 1.0);
      
      var pulseX = parseFloat(x) + receiverDiv.width()/2;
      var pulseY = parseFloat(y) + receiverDiv.height()/2;
      
      $('.device-node', '#'+id).each(function() {
        var deviceId = $(this).attr('id');
        var device = $('.device-node-dot', '#'+deviceId);
        var deviceLabel = $('.device-node-label', '#'+deviceId);
        var dist = distance(device.offset().left, device.offset().top, pulseX, pulseY);
        setTimeout(function() {
          highlightDevice(device, deviceLabel);
          setInterval(function() {
            highlightDevice(device, deviceLabel);
          }, 5000);
        }, dist*20+300+(delay*1000));
      });
      
      var pulse = $('#pulse-container').clone().attr('transform','translate('+pulseX+','+pulseY+')');
      $('animateTransform', pulse).attr('begin', delay+'s');
      $('animate', pulse).attr('begin', delay+'s');
      pulse.appendTo('#graph-svg');
      receiverNode.remove();
      
      setInterval(function() {
        var numPeople = $('.person:not(.device)').length;
        $('.num-people').html(numPeople);
      }, 5000);
    }
    
    numDetected = 0;
    var delay = 3;
    $($('.graph-node-4').get().reverse()).each(function() {
      showReceiver($(this), delay);
      delay += 1;
    });
    
    $('#pulse-svg').remove();
  },
  
  addInfo: function(id, info, itemType) {
    if (itemType == 'device') {
      var label = '';
      if (info.manufacturer == 'Unknown') {
        label = info.model;
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
  }
  
}