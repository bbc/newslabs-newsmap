$(function() {
  var zoomToCountry;
  var invervalBetweenCycles = 15000;

  var projection = configureProjection();
  var canvas = configureCanvas();
  var context = getContextFor(canvas);
  var path = configurePath(projection, context);

  var northUp = d3.select("#north-up").on("change", function() { northUp = this.checked; }).property("checked");

  queue().defer(d3.json, "data/world-110m.json")
    .defer(d3.tsv, "data/world-country-names.tsv")
    .await(ready);

  function ready(error, world, names) {

    var countries = configureCountries(world);

    var zoom = geoZoom(projection, function() {
      styleContextForProjection(context, projection, path, world, countries);
    });

    canvas.call(zoom)
      .call(zoom.event);

    function zoomIn() {

      var countryId = (i = ((i0 = i) + 1) % countries.length);

      // Uncomment for testing
      // countries.forEach(function(country, index) {
      //     if (country.name == "Ukraine") {
      //         countryId = index;
      //         i = index;
      //     }
      // });

      var countryName = countries[countryId].name;

      $.getJSON("http://tinata.org/countries/"+encodeURIComponent(countryName)+".json")
        .done(function(response) {
          countryName = response.name;
        })
      .always(function() {

        var apiKey = "9OHbOpZpVh9tQZBDjwTlTmsCF2Ce0yGQ";
        var juicerApiHost = "http://data.test.bbc.co.uk/bbcrd-juicer";
        var semanticApiHost = "";

        var url = juicerApiHost+"/articles?recent_first=yes&content_format[]=TextualFormat&like-text="+encodeURIComponent(countryName)+'&apikey='+encodeURIComponent(apiKey);

        // Whitelist of sources
        url += "&product[]=NewsWeb";
        url += "&product[]=TheGuardian";
        url += "&product[]=TheMirror";
        url += "&product[]=TheIndependent";
        url += "&product[]=ExpressStar";
        url += "&product[]=TheHuffingtonPost";
        url += "&product[]=DailyRecord";
        url += "&product[]=SkyNews";
        url += "&product[]=STV";

        $.getJSON(url).done(function(response) {
          console.log(response);
          // Reset sidebar to be hidden, but redisplay it as animation ends
          $("#sidebar").fadeOut();
          $("#images").html('');

          setTimeout(function() {
            //lookupLocation(countryName);

            $("#sidebar .title").html(countryName);

            $("#sidebar .headlines").html('');

            var images = [];
            response["hits"].forEach(function(article) {
              var source = article.source['source-name'];
              var title = article.title;
              var icon = "fa-newspaper-o";

              if (title.match(/^video/i)) {
                title = title.replace(/^VIDEO: /, "");
                icon = "fa-video-camera";
              } else if (title.match(/pictures/i)) {
                title = title.replace(/^Pictures Of The day:/i, "");
                icon = "fa-image";
              }

              if (source == "NewsWeb")
                source = "BBCNews";

              var html = '<li class="clearfix">';
              html += '<a href="'+article.url+'"><h4 style="margin-top: 0;">';
              html += '<i class="fa fa-li fa-fw '+icon+'"></i> '+title+'<br/><small>'+source+'</small>';
              html += '</h4></a>';
              html += '</li>';

              if (article.image) {
                images.push({ src: article.image,
                  source: source,
                  url: article.url
                });
              }

              $("#sidebar .headlines").append(html);
            });

            images.forEach(function(image) {
              var img = new Image();
              img.onload = function(e) {
                // Skip square images
                if (this.width == this.height)
                  return;
                // Skip small images
                if (this.width <= 75 || this.height <= 75)
                  return;
                $("#images").append('<a href="'+image.url+'" border="0"><img class="pull-right animated bounceIn" src="'+image.src+'" /></a>');
              };
              img.src = image.src;
            });
            $("#sidebar").fadeIn();

            // Start the countdown to zoom to the next country AFTER the data has finished loading for the current one
            setTimeout(function() { zoomToCountry(); }, invervalBetweenCycles);

          }, 4000);

          $("#banner .title").html("Stories linked to "+countryName);

          zoomBounds(projection, countries[countryId]);
          canvas.transition()
            .ease("quad-in-out")
            .duration(2000) // see https://github.com/mbostock/d3/pull/2045
            .call(zoom.projection(projection).event);

        });
      });

    }
    zoomToCountry = zoomIn;

    function zoomBounds(projection, o) {
      var centroid = d3.geo.centroid(o),
      clip = projection.clipExtent();

      projection
        .rotate(northUp ? [-centroid[0], -centroid[1]] : zoom.rotateTo(centroid))
        .clipExtent(null)
        .scale(1)
        .translate([0, 0]);

      var b = path.bounds(o),
      k = Math.min(1000, .45 / Math.max(Math.max(Math.abs(b[1][0]), Math.abs(b[0][0])) / width, Math.max(Math.abs(b[1][1]), Math.abs(b[0][1])) / height));

      projection
        .clipExtent(clip)
        .scale(k)
        .translate([width / 2, height / 2]);
    }

    countries = countries.filter(function(d) {
      return names.some(function(n) {
        if (d.id == n.id) return d.name = n.name;
      });
      //}).sort(function(a, b) {
      //return a.name.localeCompare(b.name);
      });

    zoomToCountry();

  };

  // Round to integer pixels for speed, and set pixel ratio.
  function roundRatioContext(context) {
    return {
      moveTo: function(x, y) { context.moveTo(Math.round(x * ratio), Math.round(y * ratio)); },
      lineTo: function(x, y) { context.lineTo(Math.round(x * ratio), Math.round(y * ratio)); },
      closePath: function() { context.closePath(); }
    };
  }

  /*
     var marker;
     var googleGeocoder = new google.maps.Geocoder();
     var googleMapOptions = { zoom: 3, mapTypeId: google.maps.MapTypeId.ROADMAP };
     var googleMap = new google.maps.Map(document.getElementById('map-overlay'), googleMapOptions);

     function lookupLocation(address) {        
     googleGeocoder.geocode( { 'address': address}, function(results, status) {
     if (status == google.maps.GeocoderStatus.OK) {
     googleMap.setCenter(results[0].geometry.location);
     if (marker)
     marker.setMap(null);
     marker = new google.maps.Marker({
     map: map,
     position: results[0].geometry.location,
     draggable: true
     });
     google.maps.event.addListener(marker, "dragend", function() {
     document.getElementById('lat').value = marker.getPosition().lat();
     document.getElementById('lng').value = marker.getPosition().lng();
     });
     document.getElementById('lat').value = marker.getPosition().lat();
     document.getElementById('lng').value = marker.getPosition().lng();
     $('#map-overlay').css({ opacity: 1 });
     }
     });
     }
     */

  // Handle window resize timeouts
  var rtime = new Date(1, 1, 2000, 12,00,00);
  var timeout = false;
  var delta = 200;
  $(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
      timeout = true;
      setTimeout(resizeend, delta);
    }
  });

  // Reload the page when done resizing
  // This is hacky but at least ensures the map is rendered correctly.
  function resizeend() {
    if (new Date() - rtime < delta) {
      setTimeout(resizeend, delta);
    } else {
      timeout = false;
      // Disabling this for now as it's not working well on some devices (causing constant reload)
      //window.location=window.location;
    }               
  }

});


