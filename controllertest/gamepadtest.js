/*
 * Gamepad API Test
 * Written in 2013 by Ted Mielczarek <ted@mielczarek.org>
 *
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
var rAF = window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;





var canvas = document.getElementById('inputCanvas');
var context = canvas.getContext('2d');
timeSeriesLength = 300;
timeSeries = [];
time = [...Array(timeSeriesLength).keys()];
colors = ['red', 'blue', 'green', 'magenta', 'teal', 'olive', 'pink', 'violet', 'sky', 'orange', 'navy', 'grey']; 
function connecthandler(e) {
  addgamepad(e.gamepad);
}
function addgamepad(gamepad) {
  controllers[gamepad.index] = gamepad; var d = document.createElement("div");
  d.setAttribute("id", "controller" + gamepad.index);
  var t = document.createElement("h1");
  t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
  d.appendChild(t);
  var b = document.createElement("div");
  b.className = "buttons";
  for (var i = 0; i < gamepad.buttons.length; i++) {
    var e = document.createElement("span");
    e.className = "button";
    //e.id = "b" + i;
    e.innerHTML = i;
    b.appendChild(e);
  }
  d.appendChild(b);
  var a = document.createElement("div");
  a.className = "axes";
  for (i = 0; i < gamepad.axes.length; i++) {
    var axisCont = document.createElement("div");

    e = document.createElement("meter");
    e.className = "axis";
    e.id = "axis-" + i;
    label = document.createElement("span");
    label.setAttribute("for", e.id);
    label.innerHTML = i+":";
    e.setAttribute("min", "-1");
    e.setAttribute("max", "1");
    e.setAttribute("value", "0");
    e.innerHTML = i;
    axisCont.appendChild(label);
    axisCont.appendChild(e);
    a.appendChild(axisCont);
    var xoption = document.createElement("option");
    var yoption = document.createElement("option");
    xoption.text = i;
    yoption.text = i;
    document.getElementById("xAxis").add(xoption);
    document.getElementById("yAxis").add(yoption);

    timeSeries[i]=Array(timeSeriesLength).fill(0);
  }
  d.appendChild(a);
  document.getElementById("start").style.display = "none";
  document.body.appendChild(d);
  rAF(updateStatus);
  document.getElementById("xAxis").selectedIndex = 0;
  document.getElementById("yAxis").selectedIndex = 1;

  initGraph(gamepad);
}

function disconnecthandler(e) {
  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  var d = document.getElementById("controller" + gamepad.index);
  document.body.removeChild(d);
  delete controllers[gamepad.index];
}

function updateStatus() {
  scangamepads();
  for (j in controllers) {
    var controller = controllers[j];
    var d = document.getElementById("controller" + j);
    var buttons = d.getElementsByClassName("button");
    for (var i = 0; i < controller.buttons.length; i++) {
      var b = buttons[i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      var touched = false;
      if (typeof (val) == "object") {
        pressed = val.pressed;
        if ('touched' in val) {
          touched = val.touched;
        }
        val = val.value;
      }
      var pct = Math.round(val * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      b.className = "button";
      if (pressed) {
        b.className += " pressed";
      }
      if (touched) {
        b.className += " touched";
      }
    }

    var axes = d.getElementsByClassName("axis");
    for (var i = 0; i < controller.axes.length; i++) {
      var a = axes[i];
      a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
      a.setAttribute("value", controller.axes[i]);
      timeSeries[i].shift();
      timeSeries[i].push(controller.axes[i]);
    }
    time.shift();
    time.push(time[timeSeriesLength-2]+1);
    drawStick(controller.axes);
  }
  data1 = [time].concat(timeSeries);
  uplot1.setData(data1);
  rAF(updateStatus);
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i] && (gamepads[i].index in controllers)) {
      controllers[gamepads[i].index] = gamepads[i];
    }
  }
}

if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", connecthandler);
  window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
}

window.onload = function () {
  var ctx = canvas.getContext("2d");
  initStick(ctx);
}

function drawStick(axes) {
  var x = axes[document.getElementById("xAxis").selectedIndex];
  var y = axes[document.getElementById("yAxis").selectedIndex];
  var ctx = canvas.getContext("2d");
  //initStick(ctx);
  drawPos(ctx, x, y);
  
}

function initStick(ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // axes
  ctx.setLineDash([]);
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  //circle
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.width-50) / 2, 0, 2 * Math.PI);
  ctx.arc(canvas.width / 2, canvas.height / 2, (canvas.width-50) / 2 / 4, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.closePath();

}
function drawPos(ctx, x, y){
  x = axisToCanvas(x);
  y = axisToCanvas(y);
  ctx.beginPath();
  if (typeof prevX !== 'undefined')
    ctx.moveTo(prevX, prevY);
  ctx.strokeStyle = "#ff000011";
  ctx.lineWidth = 3;
  ctx.lineTo(x,y);
  ctx.stroke();
  ctx.closePath();
  prevX = x;
  prevY = y;
}
function axisToCanvas(x){
  return x*(canvas.width-50)/2+(canvas.width)/2;
}

function initGraph(gamepad){
  series = gamepad.axes.map(function(x, i){
    return {
      label: 'axis-'+i,
        scale: "Value",
        value: (u, v) => v == null ? "-" : v.toFixed(1),
        stroke: colors[i],
    }});
  const opts = {
    title: "",
    width: 1600,
    height: 600,
    cursor: {
      drag: {
        setScale: false,
      }
    },
    select: {
      show: false,
    },
    series: 
    [
      {
        show:false,
        label:"t"
      }
    ].concat(series),
    axes: [
      {
        scale:'x',
        show:false
      },
      {
        scale: 'Value',
      }
    ],
    scales: {
      'x': {
        auto: true,
        time:false,
        range: (min, max) => [time[0], time[timeSeriesLength-1]],
      },
      "Value": {
        range: [-1, 1],
      }
    },
  };

if (typeof time !=='undefined'){
     data1 = [time].concat(timeSeries);
   uplot1 = new uPlot(opts, data1, document.body);
}
  uplot1.setData(data1);
  
}