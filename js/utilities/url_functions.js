function whiteListedSources() {
  return ["product[]=NewsWeb",
          "product[]=TheGuardian",
          "product[]=TheMirror",
          "product[]=TheIndependent",
          "product[]=ExpressStar",
          "product[]=TheHuffingtonPost",
          "product[]=DailyRecord",
          "product[]=SkyNews",
          "product[]=STV"];
}

function juicerQueryParams(countryName, apiKey) {
  return ["recent_first=yes",
          "content_format[]=TextualFormat",
          "like-text=" + encodeURIComponent(countryName),
          "api_key=" + encodeURIComponent(apiKey)];
}

function juicerUrl(countryName) {
  var apiKey = "9OHbOpZpVh9tQZBDjwTlTmsCF2Ce0yGQ";
  var juicerApiHost = "http://juicer.api.bbci.co.uk";
  var queryParams = juicerQueryParams(countryName, apiKey).concat(whiteListedSources()).join('&')

  return juicerApiHost + "/articles?" + queryParams;
}

function tinataUrl(countryName) {
  return "http://tinata.org/countries/" + encodeURIComponent(countryName) + ".json";
}

function gmapsApi(latitude, longitude) {
  return "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
    latitude + "," + longitude +
    "&result_type=country&key=AIzaSyD9v8sFqYjjKhW-OyNPdSb79cpRHuWI3bE";
}
