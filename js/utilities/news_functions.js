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

function structureNews (countryName, response) {
  $("#sidebar .title").html(countryName);
  $("#sidebar .headlines").html('');

  var images = [];

  response["hits"].forEach(function(article) {
    var source = article.source['source-name'];

    var titleAndIcon = titleAndIconFor(article);

    if (source == "NewsWeb") { source = "BBCNews"; }

    if (article.image) {
      images.push({ src: article.image,
        source: source,
        url: article.url
      });
    }

    $("#sidebar .headlines").append(headlineFor(titleAndIcon.title, source, article, titleAndIcon.icon));
  });

  images.forEach(function(image) {
    var img = new Image();
    img.onload = function(e) {
      if (shouldSkipImage(this) == true) { return; };

      $("#images").append('<a href="'+image.url+'" border="0"><img class="pull-right animated bounceIn" src="'+image.src+'" /></a>');
    };

    img.src = image.src;
  });

  $("#sidebar").fadeIn();

  // Start the countdown to zoom to the next country AFTER the data has finished loading for the current one
  setTimeout(function() {
    zoomIn(countries, projection, path, canvas, zoom);
  }, invervalBetweenCycles);
}
