$(function() {
    var zoomToCountry;
    var invervalBetweenCycles = 15000;
    
    var degrees = 180 / Math.PI,
        ratio = window.devicePixelRatio || 1,
        width =  $("#map").width(),
        height = $("#map").height(),
        p = ratio;
        
    var projection = d3.geo.orthographic()
        .rotate([0, -30])
        .scale(height / 2 - 1)
        .translate([width / 2, height / 2])
        .clipExtent([[-p, -p], [width + p, height + p]])
        .precision(.5);

    var canvas = d3.select("#map").append("canvas")
        .attr("width", width * ratio)
        .attr("height", height * ratio)
        .style("width", width + "px")
        .style("height", height + "px");

    var c = canvas.node().getContext("2d");

    var path = d3.geo.path()
        .projection(projection)
        .context(roundRatioContext(c));

    var northUp = d3.select("#north-up").on("change", function() { northUp = this.checked; }).property("checked");

    queue()
        .defer(d3.json, "data/world-110m.json")
        .defer(d3.tsv, "data/world-country-names.tsv")
        .await(ready);
        
    function ready(error, world, names) {

      var globe = {type: "Sphere"},
          graticule = d3.geo.graticule()(),
          land = topojson.feature(world, world.objects.land),
          borders = topojson.mesh(world, world.objects.countries),
          countries = d3.shuffle(topojson.feature(world, world.objects.countries).features),
          i = -1,
          i0 = i,
          zoom = d3.geo.zoom()
                  .projection(projection)
                  .duration(function(S) { return 5000 * Math.sqrt(S); }) // assume ease="quad-in-out"
                  .scaleExtent([height / 2 - 1, Infinity])
                  .on("zoom", function() {
                    projection.clipAngle(Math.asin(Math.min(1, .5 * Math.sqrt(width * width + height * height) / projection.scale())) * degrees);
                    c.clearRect(0, 0, width * ratio, height * ratio);
                    c.fillStyle = "#194677", c.beginPath(), path(globe), c.fill();
                    c.strokeStyle = "#6B88F3", c.lineWidth = .25 * ratio, c.beginPath(), path(graticule), c.stroke();
                    c.fillStyle = "#D1B76E", c.beginPath(), path(land), c.fill();
                    c.fillStyle = "#D1B76E", c.beginPath(), path(land), c.fill();            
                    c.fillStyle = "#f00", c.beginPath(), path(countries[i0]), c.fill();
                    c.fillStyle = "#f00", c.beginPath(), path(countries[i]), c.fill();
                    c.strokeStyle = "#9C864C", c.lineWidth = 1 * ratio, c.beginPath(), path(borders), c.stroke();
                    c.strokeStyle = "#fff", c.lineWidth = 3 * ratio, c.beginPath(), path(globe), c.stroke();
                  });
//          .on("zoomend", zoomToCountryCallback);

      canvas
          .call(zoom)
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
              var juicerApiHost = "http://data.bbc.co.uk/bbcrd-juicer";
              var url = juicerApiHost+"/articles.json?recent_first=yes&content_format[]=TextualFormat&text="+encodeURIComponent(countryName)+'&apikey='+encodeURIComponent(apiKey);
      
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
                  // Reset sidebar to be hidden, but redisplay it as animation ends
                 $("#sidebar").fadeOut();
                 $("#images").html('');
              
                 setTimeout(function() {
                    //lookupLocation(countryName);
            
                     $("#sidebar .title").html(countryName);

                      $("#sidebar .headlines").html('');
                                
                      var images = [];
                      response["articles"].forEach(function(article) {
                          var source = article.source;
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
                              images.push({ src: article.image.src,
                                            source: source,
                                            url: article.url
                                          });
                          }
                      
                         $("#sidebar .headlines").append(html);
                     });
             
                     images.forEach(function(image) {
                                      
                         var img = new Image();
                         img.onload = function(e) {
                             if (this.width >= 75 && this.height >= 75)
                                 $("#images").append('<a href="'+image.url+'" border="0"><img class="pull-right animated bounceIn" src="'+image.src+'" /></a>');
                        };
                       img.src = image.src;

                     });
                    $("#sidebar").fadeIn();

                    // Start the countdown to zoom to the next country AFTER the data has finished loading for the current one
                    setTimeout(function() { zoomToCountry(); }, invervalBetweenCycles);
                    
                 }, 4000);
      
                  $("#banner .title").html("Headlines linked to "+countryName+" in the BBC News Labs Juicer");

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
            window.location=window.location;
        }               
    }
    
});


