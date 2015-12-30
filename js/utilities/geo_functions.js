var invervalBetweenCycles = 15000;

var degrees = 180 / Math.PI,
    ratio = window.devicePixelRatio || 1,
    width =  $("#map").width(),
    height = $("#map").height() - 90,
    p = ratio;

var i = -1,
    i0 = i;

var randomCountryIndexes = [];
var orderedCountryIndexes = [];
var displayedCountriesIndexes = [];
var countriesOnBackward = [];

function configureNorthUp() {
  return d3.select("#north-up").on("change", function() {
    northUp = this.checked;
  }).property("checked");
}

function configureProjection() {
  return d3.geo.orthographic()
           .rotate([0, -30])
           .scale(height / 2 - 1)
           .translate([width / 2, height / 2])
           .clipExtent([[-p, -p], [width + p, height + p]])
           .precision(.5);
}
        
function configureCanvas() {
  return d3.select("#map").append("canvas")
           .attr("width", width * ratio)
           .attr("height", height * ratio)
           .style("width", width + "px")
           .style("height", height + "px");
}

function getContextFor(canvas) {
  return canvas.node().getContext("2d");
}

// Round to integer pixels for speed, and set pixel ratio.
function roundRatioContext(context) {
  return {
    moveTo: function(x, y) { context.moveTo(Math.round(x * ratio), Math.round(y * ratio)); },
    lineTo: function(x, y) { context.lineTo(Math.round(x * ratio), Math.round(y * ratio)); },
    closePath: function() { context.closePath(); }
  };
}

function configurePath(projection, context) {
  return d3.geo.path()
           .projection(projection)
           .context(roundRatioContext(context));
}

function configureCountries(world) {
  return topojson.feature(world, world.objects.countries).features;
}

function getCountryNameOnBackward(countries) {
  if (displayedCountriesIndexes.length > 0) {
    var lastCountryIndex = displayedCountriesIndexes.splice(-1, 1)[0];

    countriesOnBackward.push(lastCountryIndex);

    shouldEnableOrDisableBackward(displayedCountriesIndexes);

    return countries[lastCountryIndex].name
  }
}

function getCountryNameOnForward(countries) {
  if (countriesOnBackward.length > 0) {
    var nextCountryIndex = countriesOnBackward.splice(0, 1)[0];

    displayedCountriesIndexes.push(nextCountryIndex);

    return countries[nextCountryIndex].name;

  } else {
    return null;
  }
}

function geoZoom(projection, onZoomCallback) { 

  return d3.geo.zoom()
        .projection(projection)
        .duration(function(S) { return 5000 * Math.sqrt(S); }) // assume ease="quad-in-out"
        .scaleExtent([height / 2 - 1, Infinity])
        .on("zoom", function() {
          onZoomCallback();
        });
}

function styleContextForProjection(context, projection, path, world, countries) {
  var globe = {type: "Sphere"},
      graticule = d3.geo.graticule()(),
      land = topojson.feature(world, world.objects.land),
      borders = topojson.mesh(world, world.objects.countries);

  projection.clipAngle(Math.asin(Math.min(1, .5 * Math.sqrt(width * width + height * height) / projection.scale())) * degrees);
  context.clearRect(0, 0, width * ratio, height * ratio);
  context.fillStyle = "#626262", context.beginPath(), path(globe), context.fill();
  context.strokeStyle = "#6B88F3", context.lineWidth = .25 * ratio, context.beginPath(), path(graticule), context.stroke();
  context.fillStyle = "#3F3F3F", context.beginPath(), path(land), context.fill();
  context.fillStyle = "#3F3F3F", context.beginPath(), path(land), context.fill();            
  context.fillStyle = "#F6F6F6", context.beginPath(), path(countries[i0]), context.fill();
  context.fillStyle = "#F6F6F6", context.beginPath(), path(countries[i]), context.fill();
  context.strokeStyle = "#9C864C", context.lineWidth = 1 * ratio, context.beginPath(), path(borders), context.stroke();
  context.strokeStyle = "#fff", context.lineWidth = 3 * ratio, context.beginPath(), path(globe), context.stroke();
}
