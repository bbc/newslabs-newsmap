$(function() {
  var projection = configureProjection();
  var canvas = configureCanvas();
  var context = getContextFor(canvas);
  var path = configurePath(projection, context);

  var numberOfBackwardClicks = 0;

  queue().defer(d3.json, "data/world-110m.json")
    .defer(d3.tsv, "data/world-country-names.tsv")
    .await(ready);

  function ready(error, world, names) {
    var countries = configureCountries(world);

    var zoom = geoZoom(projection, function() {
      styleContextForProjection(context, projection, path, world, countries);
    });

    canvas.call(zoom).call(zoom.event);

    countries = countries.filter(function(d) {
      return names.some(function(n) {
        if (d.id == n.id) return d.name = n.name;
      });
    });

    zoomIn(countries, projection, path, canvas, zoom, null);

    $('#map canvas').on('click', function(evt) {
      var xPosition = evt.clientX;
      var yPosition = evt.clientY;

      if (shouldPlayNews == true) {
        toggleControl('play');
      }

      $('#sidebar').fadeOut();
      $('#news-menu').fadeOut();
      showLoader();

      $('#news-menu .trending li.active').toggleClass('active');
      $('#news-menu .trending li a#News').parent('li').addClass('active');

      mapClickedAtPosition({x: evt.clientX, y: evt.clientY}, projection, function(countryName) {
        zoomIn(countries, projection, path, canvas, zoom, countryName);
      });
    });

    $('.news-control a').on('click', function(evt) {
      evt.preventDefault();
      var controlId = this.id;
      toggleControl(controlId);

      if (shouldPlayNews == true && controlId == 'play') {
        numberOfBackwardClicks = 0;
        zoomIn(countries, projection, path, canvas, zoom, null);
      }

      if (canBackward == true && controlId == 'backward') {
        pauseNews();

        if (++numberOfBackwardClicks == 1) {
          var lastIndex = displayedCountriesIndexes.splice(-1, 1)[0];
          countriesOnBackward.push(lastIndex);
        }

        var countryName = getCountryNameOnBackward(countries);
        zoomIn(countries, projection, path, canvas, zoom, countryName);

        // this ugly hack exists because otherwise the just removed id will
        // be inserted again and again and again ... (you got the idea, rigth?)
        displayedCountriesIndexes.splice(-1, 1);
      }

      if (canForward == true && controlId == 'forward') {
        numberOfBackwardClicks = 0;
        pauseNews();

        var countryName = getCountryNameOnForward(countries);
        zoomIn(countries, projection, path, canvas, zoom, countryName);
      }
    });

    $('#news-menu .trending li a').on('click', function(evt) {
      evt.preventDefault();
      pauseNews();
      indexTrending = 0;

      showLoader();
      selectedTrending = this.id;

      $("#sidebar .headlines").html('');
      $("#sidebar #trending-accordion").html('');
      $('#news-menu .trending li.active').toggleClass('active');
      $(this).parent('li').addClass('active');

      if (selectedTrending == 'News') {
        drawArticles(newsToDisplay, function() { return; })

      } else if (selectedTrending == 'close-sidebar') {
        $("#news-menu").fadeOut();
        $("#sidebar").fadeOut();

      } else {
        getRelevantNewsForTrending(selectedTrending, function() {
          var trendingNews = {};

          for(trendingName in trendingData[selectedTrending]) {
            drawTrendingAccordion(trendingName, trendingData[selectedTrending][trendingName]);
          };
        });
      }
    });
  };
  
  shouldResize();
});
