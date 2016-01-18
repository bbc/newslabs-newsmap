var indexTrending = 0;

function accordionHeadingFor(index, panelTitle, headlines) {
  var inClass = '';

  if (index == 0) { var inClass = 'in';  }
  
  var title = decodeURI(panelTitle).replace(/(_|-)/g, ' ');

  return '<div class="panel panel-default">' +
         '<div class="panel-heading" role="tab" id="panel-' + index + '">' +
         '<h4 class="panel-title">' +
         '<a role="button" data-toggle="collapse" ' +
         ' data-parent="#trending-accordion" href="#collapse-' + index  + '" ' +
         'aria-expanded="true" aria-controls="collapse-' + index + '">' +
         title +
         '</a></h4></div>' +
         '<div id="collapse-' + index + '" class="panel-collapse collapse ' + inClass + '" ' +
         ' role="tabpanel" aria-labelledby="panel-' + index + '">' +
         '<div class="panel-body">' +
         '<ul class="trending-headlines">' +
         headlines.join('') +
         '</ul>' +
         '</div></div></div>';
}

function drawTrendingAccordion(panelTitle, sources) {
  var images = [];
  $("#sidebar .headlines").html('');

  var headlines = [];

  for(var title in sources) {
    var article = sources[title];
    var source = article.source['source-name'];


    if (source == "NewsWeb") { source = "BBCNews"; }

    var titleAndIcon = titleAndIconFor(article);
    headlines.push(headlineFor(titleAndIcon.title, source, article, titleAndIcon.icon));
  };

  $("#sidebar #trending-accordion").append(accordionHeadingFor(indexTrending, panelTitle, headlines));
  indexTrending++;
}
