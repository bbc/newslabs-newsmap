// Handle window resize timeouts
var rtime = new Date(1, 1, 2000, 12,00,00);
var timeout = false;
var delta = 200;

var shouldPlayNews = true;

function shouldResize() {
  $(window).resize(function() {
    rtime = new Date();
    if (timeout === false) {
      timeout = true;
      setTimeout(resizeend, delta);
    }
  });
}

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

/*** UI Events ***/

function mapClickedAtPosition(position, projection, callback) {
  var longLat = projection.invert([position.x, position.y]);

  latitude = longLat[1];
  longitude = longLat[0];

  $.getJSON(gmapsApi(latitude, longitude))
    .done(function(response) {
      var countryName = null;

      if (response.results[0] != undefined || response.results[0] != null) {
        countryName = response.results[0].address_components[0].long_name;
      }

      callback(countryName);
    });
}

function toggleControl(elementId) {
  switch (elementId) {
    case 'play':
      $('.news-control a#play span').toggleClass('fa-pause');
      shouldPlayNews = !shouldPlayNews;
      break;

    case 'shuffle':
      $('.news-control a#shuffle').toggleClass('on');
      break;
  }
}

/*** Math functions ***/

function randomCountryId(countries) {
  var countryId = Math.random() * (countries.length - 1 + 1);

  if (selectedCountryIds.indexOf(countryId) == -1) {
    selectedCountryIds.push(countryId);
    return Math.floor(countryId);
  } else {
    return randomCountry();
  }
}
