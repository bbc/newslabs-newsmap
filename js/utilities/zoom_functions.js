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
        setTimeout(function() {
          zoomIn(countries, projection, path, canvas, zoom);
        }, invervalBetweenCycles);

      }, 4000);

      $("#banner .title").html("Stories linked to "+countryName);

      zoomBounds(projection, countries[countryId], path);
      canvas.transition()
        .ease("quad-in-out")
        .duration(2000) // see https://github.com/mbostock/d3/pull/2045
        .call(zoom.projection(projection).event);

    });
  });
}
