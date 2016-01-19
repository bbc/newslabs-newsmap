// Handle window resize timeouts
var rtime = new Date(1, 1, 2000, 12,00,00);
var timeout = false;
var delta = 200;

var shouldPlayNews = true;
var shouldShuffleNews = true;
var canBackward = false;

var newsToDisplay = {};
var trendingData = {};
var trendingTypesReady = [];
var selectedTrending = null;

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
  newsToDisplay = {};
  trendingData = {};
  trendingTypesReady = [];
  selectedTrending = 'News';

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

function showLoader() {
  $('#sidebar .loader').removeClass('hidden');
}

function hideLoader() {
  $('#sidebar .loader').addClass('hidden');
}

function toggleControl(elementId) {
  switch (elementId) {
    case 'play':
      $('.news-control a#play span').toggleClass('fa-pause');
      shouldPlayNews = !shouldPlayNews;
      break;

    case 'shuffle':
      $('.news-control a#shuffle').toggleClass('on');
      shouldShuffleNews = !shouldShuffleNews;
      break;
  }
}

function shouldEnableOrDisableBFControls(displayedCountriesIndexes, countries) {
  shouldEnableOrDisableBackward(displayedCountriesIndexes);
  shouldEnableOrDisableForward(countries, displayedCountriesIndexes);
}

function shouldEnableOrDisableBackward(countriesList) {
  if (countriesList == 0) {
    $('.news-control a#backward').addClass('disabled');
    canBackward = false;
  } else {
    $('.news-control a#backward').removeClass('disabled');
    canBackward = true;
  }
}

function shouldEnableOrDisableForward(countriesList, displayedCountriesList) {
  if (displayedCountriesList >= countriesList) {
    $('.news-control a#forward').addClass('disabled');
    canForward = false;
  } else {
    $('.news-control a#forward').removeClass('disabled');
    canForward = true;
  }
}

function pauseNews() {
  $('.news-control a#play span').removeClass('fa-pause');
  shouldPlayNews = false;
}

/*** Math functions ***/

function randomCountryId(countries) {
  var countryId = Math.random() * (countries.length - 1 + 1);

  if (randomCountryIndexes.indexOf(countryId) == -1) {
    var countryIndex =  Math.floor(countryId);

    randomCountryIndexes.push(countryIndex);
    return countryIndex;
  } else {
    return randomCountry();
  }
}

function orderedCountryId(countries) {
  var lastCountry = 0;

  if (orderedCountryIndexes.length == 0) {
    orderedCountryIndexes.push(lastCountry);
    return lastCountry;
  }

  if (countries.length == orderedCountryIndexes.length) {
    orderedCountryIndexes = [];
  } else {
    var lastIndex = orderedCountryIndexes.length - 1;
    lastCountry = orderedCountryIndexes[lastIndex];
  }

  if (orderedCountryIndexes.indexOf(++lastCountry) == -1) {
    orderedCountryIndexes.push(lastCountry);
    return lastCountry;
  }
}
