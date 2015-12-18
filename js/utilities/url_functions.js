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
          "apikey=" + encodeURIComponent(apiKey)];
}

function juicerUrl(countryName) {
  var apiKey = "9OHbOpZpVh9tQZBDjwTlTmsCF2Ce0yGQ";
  var juicerApiHost = "http://data.test.bbc.co.uk/bbcrd-juicer";
  var queryParams = juicerQueryParams(countryName, apiKey).concat(whiteListedSources()).join('&')

  return juicerApiHost + "/articles?" + queryParams;
}

function tinataUrl(countryName) {
  return "http://tinata.org/countries/" + encodeURIComponent(countryName) + ".json";
}

