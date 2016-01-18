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

function zoomIn(countries, projection, path, canvas, zoom, countryName) {
  var countryId = -1;

  if (countryName == null || countryName == undefined) {
    if (shouldShuffleNews == true) {
      countryId = randomCountryId(countries);
    } else {
      countryId = orderedCountryId(countries);
    }

    displayedCountriesIndexes.push(countryId);
    countryName = countries[countryId].name;

    shouldEnableOrDisableBFControls(displayedCountriesIndexes.length, countries.length);

  } else {
    countries.forEach(function(country, index) {
      if (country.name == countryName) {
        countryId = index;
        displayedCountriesIndexes.push(countryId);
      }
    });
  }

  i = countryId;

  zoomBounds(projection, countries[countryId], path);

  canvas.transition()
    .ease("quad-in-out")
    .duration(2000) // see https://github.com/mbostock/d3/pull/2045
    .call(zoom.projection(projection).event);

  $.getJSON(tinataUrl(countryName))
    .done(function(response) {
      countryName = response.name;
    })
    .always(function() {
      $.getJSON(juicerUrl(countryName, true, 10))
        .done(function(response) {

          $("#news-menu").fadeOut();
          $("#sidebar").fadeOut();
          selectedTrending = null;

          setTimeout(function() {
            structureNews(countryName, response);
            drawArticles(newsToDisplay, function() {
              if (shouldPlayNews == true) {
                zoomIn(countries, projection, path, canvas, zoom, null);
              }
            });
          }, 1000);

          $("#banner .title").html("Stories linked to " + countryName);
      });
    });
}
