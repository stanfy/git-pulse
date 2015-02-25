var stanfyPulse = new function() {

  var log;
  var elements;
  var timing;
  var avatarsReady = 0, avatarsCount = 0;
  var totalDuration = 30000; // 30 sec.

  var requestAnimFrame = (function(){
    return  window.requestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.oRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function(callback, element) {
            window.setTimeout(callback, 1000 / 60);
        };
  })();

  function prepareAvatar(id, url) {
    if (!url) {
      url = 'http://www.gravatar.com/avatar/' + id;
    }
    return $('<img id="img' + id + '">')
      .attr('src', url)
      .css('position', 'absolute')
      .css('visibility', 'hidden');
  }

  function prepareCanvas(id) {
    var nodes = elements[id];
    var w = nodes.img.width();
    var h = nodes.img.height();
    var canvas = nodes.canvas[0];
    // Set size.
    canvas.width = w * 2;
    canvas.height = h * 2;

    // Draw circled avatar.
    drawCircle(id, 0);

    nodes.canvas.addClass('pulse-start').css('position', 'absolute');
  }

  function drawCircle(id, f) {
    var canvas = elements[id].canvas[0];
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.globalAlpha = f < 0.5 ? 1 : (1 - f) * 2;
    var sMin = 0.6;
    var s = f > 0.5 ? 1 : f * 2 * (1 - sMin) + sMin;

    // Draw circled avatar.
    ctx.drawImage(elements[id].img[0], w / 4, h / 4);
    var radius = (w < h ? w : h) / 4;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Draw border.
    ctx.beginPath();
    var minR = (w < h ? w : h) / 4;
    var maxR = minR * 2;
    var r = (maxR - minR) * f + minR;
    ctx.arc(w / 2, h / 2, r, 0, 2 * Math.PI);
    ctx.stroke();
  }

  function pulseAnimation(id, duration) {
    var startTime = Date.now();
    var endTime = startTime + duration;

    function frame() {
      var curTime = Date.now();
      if (curTime <= endTime) {
        var f = (curTime - startTime) / duration;
        drawCircle(id, f);
        requestAnimFrame(frame);
      } else {
        elements[id].canvas.remove();
      }
    }

    frame();
  }

  function pulse(container, id) {
    if (elements[id].canvas.parent().length) {
      // Previous animation is not finished. We skip it in this case :(.
      return;
    }
    lastCanvas = elements[id].canvas.appendTo(container);
    pulseAnimation(id, 2000);
  }

  function onAvatarsReady(container) {
    var index = 0;
    _(log).each(function(it) {
      setTimeout(function() { pulse(container, it.id); }, timing[index++] * totalDuration);
    });
  }

  return {
    start : function(data, container, animationDuration) {
      log = data;
      avatarsReady = 0;
      avatarsCount = 0;
      if (animationDuration) {
        totalDuration = animationDuration;
      }

      // We assume that data array is chnorologically sorted.
      var d = _(data);
      var firstDate = Date.parse(d.first().ts);
      var duration = Date.parse(d.last().ts) - firstDate;

      timing = d.map(function(it) {
        return (Date.parse(it.ts) - firstDate) / duration;
      });

      elements = d.reduce(function(result, it) {
        if (!result[it.id]) {
          avatarsCount++;
          result[it.id] = {
            img: prepareAvatar(it.id, it.image)
                .on('load', function() {
                  prepareCanvas(it.id);
                  avatarsReady++;
                  if (avatarsCount == avatarsReady) {
                    onAvatarsReady(container);
                  }
                })
                .appendTo(container),
            canvas: $('<canvas id="canvas' + it.id + '">')
          };

        }
        return result;
      }, {});

    }
  }
};

var data = [
  {id: md5('rmazur@stanfy.com.ua'), ts: '2015-01-15T12:00:00Z'},
  {id: md5('ptaykalo@stanfy.com.ua'), ts: '2015-01-15T12:15:00Z'},
  {id: md5('avoitova@stanfy.com.ua'), ts: '2015-01-15T13:00:00Z'},
  {id: md5('ptaykalo@stanfy.com.ua'), ts: '2015-01-15T14:00:00Z'},
  {id: md5('avoitova@stanfy.com.ua'), ts: '2015-01-15T14:30:00Z'}
];

$(function() {
  stanfyPulse.start(sampleData, $('.pulse-container'), 30000);
})
