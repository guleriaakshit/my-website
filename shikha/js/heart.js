window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };

window.isDevice =
  /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    (navigator.userAgent || navigator.vendor || window.opera).toLowerCase()
  );

var loaded = false;
var init = function () {
  if (loaded) return;
  loaded = true;

  var mobile = window.isDevice;
  var canvas = document.getElementById("heart");
  var ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas(); // Call once at the start

  var heartPosition = function (rad) {
    return [
      Math.pow(Math.sin(rad), 3),
      -(
        15 * Math.cos(rad) -
        5 * Math.cos(2 * rad) -
        2 * Math.cos(3 * rad) -
        Math.cos(4 * rad)
      ),
    ];
  };

  var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
  };

  var traceCount = mobile ? 20 : 50;
  var pointsOrigin = [];
  var dr = mobile ? 0.3 : 0.1;

  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
  for (var i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));

  var heartPointsCount = pointsOrigin.length;
  var targetPoints = [];

  var pulse = function (kx, ky) {
    for (var i = 0; i < pointsOrigin.length; i++) {
      targetPoints[i] = [];
      targetPoints[i][0] = kx * pointsOrigin[i][0] + canvas.width / 2;
      targetPoints[i][1] = ky * pointsOrigin[i][1] + canvas.height / 2;
    }
  };

  var particles = [];
  for (var i = 0; i < heartPointsCount; i++) {
    var x = Math.random() * canvas.width;
    var y = Math.random() * canvas.height;
    particles[i] = {
      vx: 0,
      vy: 0,
      speed: Math.random() + 5,
      q: ~~(Math.random() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * Math.random() + 0.7,
      f:
        "hsla(0," +
        ~~(40 * Math.random() + 60) +
        "%," +
        ~~(60 * Math.random() + 20) +
        "%,.3)",
      trace: [],
    };
    for (var k = 0; k < traceCount; k++) particles[i].trace[k] = { x: x, y: y };
  }

  var config = {
    traceK: 0.4,
    timeDelta: 0.01,
  };

  var time = 0;
  var loop = function () {
    var n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (var i = particles.length; i--; ) {
      var u = particles[i];
      var q = targetPoints[u.q];
      var dx = u.trace[0].x - q[0];
      var dy = u.trace[0].y - q[1];
      var length = Math.sqrt(dx * dx + dy * dy);

      if (10 > length) {
        if (0.95 < Math.random()) {
          u.q = ~~(Math.random() * heartPointsCount);
        } else {
          if (0.99 < Math.random()) {
            u.D *= -1;
          }
          u.q += u.D;
          u.q %= heartPointsCount;
          if (0 > u.q) {
            u.q += heartPointsCount;
          }
        }
      }

      u.vx += (-dx / length) * u.speed;
      u.vy += (-dy / length) * u.speed;
      u.trace[0].x += u.vx;
      u.trace[0].y += u.vy;
      u.vx *= u.force;
      u.vy *= u.force;

      for (var k = 0; k < u.trace.length - 1; ) {
        var T = u.trace[k];
        var N = u.trace[++k];
        N.x -= config.traceK * (N.x - T.x);
        N.y -= config.traceK * (N.y - T.y);
      }

      ctx.fillStyle = u.f;
      for (var k = 0; k < u.trace.length; k++) {
        ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
      }
    }

    window.requestAnimationFrame(loop);
  };

  loop();
};

if (
  document.readyState === "complete" ||
  document.readyState === "loaded" ||
  document.readyState === "interactive"
) {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init, false);
}
