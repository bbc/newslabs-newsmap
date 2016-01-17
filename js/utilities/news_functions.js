function headlineFor(title, source, article, icon) {
  return '<li class="clearfix">' +
         '<a href="'+article.url+'"><h4 style="margin-top: 0;">' +
         '<i class="fa fa-li fa-fw '+icon+'"></i> '+title+'<br/><small>'+source+'</small>' +
         '</h4></a>' +
         '</li>';
}

function titleAndIconFor(article) {
  var title = article.title;
  var icon = "fa-newspaper-o";

  if (title.match(/^video/i)) {
    title = title.replace(/^VIDEO: /, "");
    icon = "fa-video-camera";
  } else if (title.match(/pictures/i)) {
    title = title.replace(/^Pictures Of The day:/i, "");
    icon = "fa-image";
  }

  return { title: title, icon: icon };
}

function shouldSkipImage(contextOfThis) {
  if ((contextOfThis.width == contextOfThis.height) ||
      (contextOfThis.width <= 75 || contextOfThis.height <= 75)) {
    return true;
  } else {
    return false;
  }
}

function getRelevantNewsForTrending(selectedTrending, functionCallback) {

  var trendings = trendingData[selectedTrending];

  Object.keys(trendings).forEach(function(trendingName) {
    $.getJSON(juicerUrl(trendingName.replace('_', ' '), true))
      .done(function(response) {
        response["hits"].forEach(function(article) {
          trendingData[selectedTrending][trendingName][article.title.toLowerCase()] = article;
        );

        functionCallback();
      });
  });
}

function structureNews (countryName, response) {
  $("#sidebar .title").html(countryName);
  $("#sidebar .headlines").html('');

  newsToDisplay = {};

  response['trending'].items.forEach(function(trending) {
    var trendingType = trending.id.replace(/http:\/\/dbpedia\.org\/(ontology|resource)\//, '');

    if (trendingType == 'Person') {
      trendingType = 'People';
    } else {
      trendingType += 's';
    }

    trendingData[trendingType] = {};

    trending.items.forEach(function(trendingItem) {
      var trendingName = trendingItem.id.replace('http://dbpedia.org/resource/', '');
      trendingData[trendingType][trendingName] = {};
    });
  });

  response["hits"].forEach(function(article) {
    newsToDisplay["'" + article.title.toLowerCase() + "'"] = article;
  });
}

function drawArticles(sources, zoomInCallback) {
  var images = [];
  $("#sidebar .headlines").html('');

  for(var title in sources) {
    var article = sources[title];
    var source = article.source['source-name'];

    if (source == "NewsWeb") { source = "BBCNews"; }

    var titleAndIcon = titleAndIconFor(article);

    if (article.image) {
      images.push({ src: article.image,
        source: source,
        url: article.url
      });
    }

    $("#sidebar .headlines").append(headlineFor(titleAndIcon.title, source, article, titleAndIcon.icon));
  };

  $("#news-menu").fadeIn();

  images.forEach(function(image) {
    var img = new Image();
    img.onload = function(e) {
      if (shouldSkipImage(this) == true) { return; };

      // $("#news-menu").fadeIn();
    };

    img.src = image.src;
  });

  $("#sidebar").fadeIn();

  // Start the countdown to zoom to the next country AFTER the data has finished loading for the current one
  setTimeout(function() {
    zoomInCallback();
  }, invervalBetweenCycles);
}
