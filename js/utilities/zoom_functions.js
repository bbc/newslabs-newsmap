function zoomBounds(projection, country, path) {
  var northUp = configureNorthUp();
  var centroid = d3.geo.centroid(country),
  clip = projection.clipExtent();

  projection.rotate(northUp ? [-centroid[0], -centroid[1]] : zoom.rotateTo(centroid))
            .clipExtent(null)
            .scale(1)
            .translate([0, 0]);

  var b = path.bounds(country),
  k = Math.min(1000, .45 / Math.max(Math.max(Math.abs(b[1][0]), Math.abs(b[0][0])) / width, Math.max(Math.abs(b[1][1]), Math.abs(b[0][1])) / height));

  projection.clipExtent(clip)
            .scale(k)
            .translate([width / 2, height / 2]);
}

function zoomIn(countries, projection, path, canvas, zoom) {

  var countryId = (i = ((i0 = i) + 1) % countries.length);

  // Uncomment for testing
  /*
  countries.forEach(function(country, index) {
    if (country.name == "Ukraine") {
      countryId = index;
      i = index;
    }
  });
  */

  var countryName = countries[countryId].name;

  $.getJSON(tinataUrl(countryName))
    .done(function(response) {
      countryName = response.name;
    })

    .always(function() {
      $.getJSON(juicerUrl(countryName))
        .done(function(response) {
          console.log(response);

          // Reset sidebar to be hidden, but redisplay it as animation ends
          $("#sidebar").fadeOut();
          $("#images").html('');

          setTimeout(function() {
            structureNews(countryName, response);
          }, 4000);

          $("#banner .title").html("Stories linked to " + countryName);

          zoomBounds(projection, countries[countryId], path);

          canvas.transition()
            .ease("quad-in-out")
            .duration(2000) // see https://github.com/mbostock/d3/pull/2045
            .call(zoom.projection(projection).event);
      });
    });
}
