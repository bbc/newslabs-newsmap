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

function getRelevantNewsForTrending(selectedTrending, functionCallback) {
  // if the trending news are already fetched
  if (trendingTypesReady.indexOf(selectedTrending) > -1) {
    functionCallback();
    return;
  }

  var trendings = trendingData[selectedTrending];
  var trendingsKeys = Object.keys(trendings);
  var index = 0;

  trendingsKeys.forEach(function(trendingName) {
    $.getJSON(juicerUrl(trendingName.replace('_', ' '), false, 3))
      .done(function(response) {
        response["hits"].forEach(function(article) {
          trendingData[selectedTrending][trendingName][article.title.toLowerCase()] = article;
        });

        if (++index == trendingsKeys.length) {
          trendingTypesReady.push(selectedTrending);
          functionCallback();
        }
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
      var numberOfTrendings = Object.keys(trendingData[trendingType]).length;

      if (numberOfTrendings < 5) {
        var trendingName = trendingItem.id.replace('http://dbpedia.org/resource/', '');
        trendingData[trendingType][trendingName] = {};
      }
    });
  });

  response["hits"].forEach(function(article) {
    newsToDisplay["'" + article.title.toLowerCase() + "'"] = article;
  });
}

function drawArticles(sources, zoomInCallback) {
  var headlines = [];
  $("#sidebar .headlines").html('');

  for(var title in sources) {
    var article = sources[title];
    var source = article.source['source-name'];

    if (source == "NewsWeb") { source = "BBCNews"; }

    var titleAndIcon = titleAndIconFor(article);

    headlines.push(headlineFor(titleAndIcon.title, source, article, titleAndIcon.icon));
  };

  $("#sidebar .headlines").append(headlines.join(''));

  $("#news-menu").fadeIn();

  $("#sidebar").fadeIn();

  // Start the countdown to zoom to the next country AFTER the data has finished loading for the current one
  setTimeout(function() {
    zoomInCallback();
  }, invervalBetweenCycles);
}
