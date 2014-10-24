// Initalise PolyMaps
var po = org.polymaps;
var storage = $.localStorage;
var apikey = "9OHbOpZpVh9tQZBDjwTlTmsCF2Ce0yGQ";
var host = "http://data.bbc.co.uk/v1/bbcrd-newslabs";
var rdfTypes = {
    person: 'http://dbpedia.org/ontology/Person',
    place: 'http://dbpedia.org/ontology/Place',
    organisation: 'http://dbpedia.org/ontology/Organisation',
    country: 'http://dbpedia.org/ontology/Country',
    storyline: 'http://purl.org/ontology/storyline/Storyline',
    theme: "http://www.bbc.co.uk/ontologies/news/Theme",
    event: "http://www.bbc.co.uk/ontologies/news/Event"
};

// Add map to the div with the id "map"
var map = po.map()
    .container(document.getElementById("map").appendChild(po.svg("svg")))
    .center({
        lat: 30,
        lon: 0
    })
    .add(po.interact())
    .add(po.hash())
    .zoom(3);

map.add(po.image()
    .url(po.url("http://{S}tile.cloudmade.com" + "/1a1b06b230af4efdbb989ea99e9841af" // http://cloudmade.com/register
            + "/999/256/{Z}/{X}/{Y}.png")
        .hosts(["a.", "b.", "c.", ""])));

// Fetch the JSON that powers the SVG overlay
map.add(po.geoJson()
    .url("http://api.tinata.co.uk/js/world-polymap.json")
    .tile(false)
    .on("load", mapLoaded));

map.add(po.compass()
    .pan("none"));

var countries = {};
function mapLoaded(e) {
    $.getJSON("js/countries-data.json", function(countriesJson) {
        
        // Randomly select a country
        countries = countriesJson;
        setInterval(function() {
            var keepSearching = true;
            var randomCountryName;
            while (keepSearching === true) {
                var min = 0,
                    max = Object.keys(countries).length,
                    randomNumber = Math.floor(Math.random() * (max - min) + min);
        
                randomCountryName = Object.keys(countries)[randomNumber];
                if (countries[randomCountryName] >=5 )
                    keepSearching = false;
            };
            
            $('*[data-country-name="'+randomCountryName+'"]').click();
            
        }, 10000);
        
        $('#map').css({
            visibility: 'visible'
        });

        // for efficient lookup e.g. countries.US.name = "United States"
        for (var i = 0; i < e.features.length; i++) {
            var feature = e.features[i];
            var weight = countriesJson[feature.data.properties.name];

            // Skip countries not found in countriesJson
            if (!weight) {
                // Still plot the country, but it won't be interactive
                $(feature.element).attr("style", "fill: transparent;");
                continue;
            }

            // Draw the SVG for the country
            $(feature.element)
                .attr("style", "fill: red; opacity: " + weight / 12500 + ";")
                .attr("class", "interactive")
                .attr("data-country-name", feature.data.properties.name)
                .attr("data-country-number", weight);
            var tileStyle = "fill: transparent;";

            // Show/hide country name on mouseover
            $(feature.element).on('mouseover', function() {
                //$('#country-name').html($(this).data('countryName') + ' (' + $(this).data('countryNumber') + ')');
                $('#country-name').html( $(this).data('countryName') );
            });
            $(feature.element).on('mouseout', function() {
                $('#country-name').html('');
            });

            // Link to more information if the country is clicked
            $(feature.element).on('click touch', function() {
                $('*[data-old-style]').each(function() {
                    $(this).attr('style', $(this).attr('data-old-style') );
                });
                $('*').removeClass('highlight');
                $(this).addClass('highlight');
                $(this).attr('data-old-style', $(this).attr('style'));
                $(this).attr('style', "fill: gold;");
                countryView($(this));
            });
        }
    });
}

function countryView(country) {
    var countryName = country.data('countryName');
    $('.sidebar-title').html(countryName);
    $('ul.cwlist').html('');
    $('.marquee').html('').show();
    $('ul.peoplelist').html('');
    $('ul.storylinelist').html('');
    $('.sidebar .loading').fadeIn();
    $('.sidebar').slideDown();
    var resourceUri = getConceptUri(countryName);
    getCreativeWorks(resourceUri);
    getPeople(resourceUri);
    getStorylines(resourceUri);
}

function getStorylines(resourceUri) {
    if (resourceUri && resourceUri != '') {
        // {{host}}/things?tag=http://dbpedia.org/resource/Scotland&class=http://purl.org/ontology/storyline/Storyline&limit=10&after=2014-04-01&apikey={{apikey}}
        var uri = host + "/things?tag=" + resourceUri + "&class=http://purl.org/ontology/storyline/Storyline&limit=5&offset=0&apikey=" + apikey;
        $.getJSON(uri).done(function(data) {
            renderStorylines(data);
        });
    }
}

function getCreativeWorks(resourceUri) {
    if (resourceUri && resourceUri != '') {
        var uri = host + "/creative-works?tag=" + resourceUri + " &limit=5&offset=0&apikey=" + apikey;
        $.getJSON(uri).done(function(data) {
            renderCreativeWorks(data);
        });
    }
}

function renderStorylines(data) {
    var ul = $('ul.storylinelist');
    $.each(data, function(ix, item) {
        var li = $('<li>').attr('id', "storyline" + ix);
        var url = item.uri;
        var title = item.title;
        li.append($('<a>').attr('class', "storylinelink").attr('href', url).text(title));
        // li.popover({
        //     title: label,
        //     placement: 'left',
        //     html: true,
        //     trigger: "hover",
        //     content: function() {
        //         var id = page + ix;
        //         var pop = $('<div>');
        //         var container = $('<div>').attr('class', 'tags').attr('id', id);
        //         container.html('TAGS..')
        //         pop.append(container);
        //         return pop.html();
        //     },
        // });
        ul.append(li);
    });
}

function getPeople(resourceUri) {
    var cooccurrenceUri = host + "/concepts/co-occurrences?type=http://dbpedia.org/ontology/Person&uri=" + resourceUri + "&limit=15&apikey=" + apikey;
    $.getJSON(cooccurrenceUri).done(function(data) {
        renderPeople(data);
    });
}

function renderPeople(data) {
    var ul = $('ul.peoplelist');
    $.each(data['co-occurrences'], function(ix, item) {
        var li = $('<li>').attr('id', ix);
        var title = item.label;
        var url = item.thing;
        var p = li.append('<p>').attr("class", "lead");
        p.append($('<a>').attr('class', "personlink").attr('href', url).text(title));
        li.popover({
            title: title,
            placement: 'left',
            html: true,
            trigger: "hover",
            content: function() {
                var id = 'p' + ix;
                var pop = $('<div>');
                var container = $('<div>').attr('class', 'concept-information').attr('id', id);
                getConcept(url, container, true, false);
                pop.append(container);
                return pop.html();
            },
        });
        ul.append(li);
    });
}

function getConcept(concept, selector, pop, async) {
    var defaults = {
        host: host,
        apipath: '/concepts'
    };
    var endpoint = defaults.host + defaults.apipath + '?uri=' + encodeURIComponent(concept) + "&apikey=" + apikey;
    var conceptObj = {};
    $.ajax({
        url: endpoint,
        async: async,
        dataType: 'json',
        success: function(data) {
            conceptObj = uniformConcept(data);
            if (selector) {
                renderConcept(conceptObj, selector, pop);
            }
        }
    });
    return conceptObj;
}

function uniformConcept(conceptObj) {
    if (conceptObj.type == rdfTypes.storyline) {
        var defaults = {
            host: juicerConfig.triplestore.host,
            apipath: '/storylines'
        };
        var endpoint = defaults.host + defaults.apipath + '?uri=' + encodeURIComponent(conceptObj.uri) + "&apikey=" + apikey;
        $.ajax({
            url: endpoint,
            async: false,
            dataType: 'json',
            success: function(data) {
                conceptObj.abstract = data["@graph"][0]["synopsis"];
                var topic = data["@graph"][0]["topic"];
                if (topic) {
                    if (topic["@set"]) {
                        conceptObj.topics = $.map(topic["@set"], function(val, i) {
                            return val["@id"]
                        });
                    } else {
                        conceptObj.topics = [topic["@id"]];
                    }
                    conceptObj.topics = $.map(conceptObj.topics, function(val, i) {
                        return getConcept(val, null, null, false)
                    });
                }
            }
        });
    }
    return conceptObj;
}

function renderConcept(concept, selector, pop) {
    if (concept.thumbnail) {
        var imgEl = $('<img>').attr('src', concept.thumbnail).attr('class', 'concept-img');
        imgEl.attr('onerror', 'conceptImageError(this)');
        var conceptThumb = $('<div>').attr('class', "concept-thumb").append(imgEl);
        conceptThumb.appendTo(selector);
    }
    var conceptAbstract = $('<div>').attr('class', "concept-abstract").text(concept.abstract);
    conceptAbstract.appendTo(selector);
    if (!pop) {
        // link to concept's wikipedia entry only if dbpedia resource
        var slug = (concept.uri.match(/dbpedia.org\/resource\/([^&]+)/) || [, null])[1];
        var url = null;
        if (slug) url = 'http://en.wikipedia.org/wiki/' + slug;
        if (url) {
            var conceptLink = $('<div>').add($('<a>').attr('href', url).text(url));
            conceptLink.appendTo(selector);
        }
        // link to alternative view for country/place
        if (urlparts.page.match(/(place|country)/) && conceptIsA(concept.label, "http://dbpedia.org/ontology/Country")) {
            var altView = urlparts.page == 'place' ? 'country' : 'place';
            var altLink = $('<div>').add($('<a>').attr('href', conceptUrl(altView, slug)).text('View as ' + altView));
            altLink.appendTo(selector);
        }
        // link to google maps for places
        if (concept.lat && concept.long) {
            var mapsUrl = 'https://maps.google.co.uk/?q=' + concept.lat + ',' + concept.long + '&z=15';
            var mapsLink = $('<div>').add($('<a>').attr('href', mapsUrl).text('View in google maps'));
            mapsLink.appendTo(selector);
        }
    }
    if (concept.topics) {
        var topics = $('<div>').attr('class', "topics");
        if (!pop) {
            $('<h2>').attr('class', "side-title").text('Related').appendTo(topics);
        }

        renderConcepts(concept.topics, topics);
        topics.appendTo(selector);

    }

    if (!$('.mentioned')[0]) {
        var m = $('<div>').attr('class', 'row-fluid mentioned')
            .attr('style', 'width: 93%')
            .append('<h2 style="font-weight: 300; font-size: 1.8em;">Mentioned </h2>')
            .appendTo('#concept-information');

        var s = $('<div style="margin-left: 0;">');
        s.attr('class', "storylines storyline-co span6 clearfix").appendTo(m);
        $('<h2>').attr('class', "side-title").text('Storylines').appendTo(s);

        var e = $('<div>');
        e.attr('class', "events event-co span6").appendTo(m);
        $('<h2>').attr('class', "side-title").text('Events').appendTo(e);
    }
}


function renderCreativeWorks(data) {
    $('.sidebar .loading').hide();
    var ul = $('ul.cwlist');
    var dedupedArticles = {};
    $.each(data['@graph'], function(ix, item) {
        var li = $('<li>').attr('id', ix);
        dedupedArticles[$.trim(item.title)] = item;
    });
    var ix = 0;
    for (var article in dedupedArticles) {  
        
        if (ix >= 5)      
            return;
            
        var item = dedupedArticles[article];
        var li = $('<li>').attr('id', "article" + ix);
        var url = item.primaryContentOf;
        var title = item.title;
        var thumbnail = item.thumbnail;
        var p = li.append('<p>').attr("class", "lead");
        p.append($('<a>').attr('class', "cwlink").attr('href', url).text(title));
        // li.popover({
        //     title: label,
        //     placement: 'left',
        //     html: true,
        //     trigger: "hover",
        //     content: function() {
        //         var id = page + ix;
        //         var pop = $('<div>');
        //         var container = $('<div>').attr('class', 'tags').attr('id', id);
        //         container.html('TAGS..')
        //         pop.append(container);
        //         return pop.html();
        //     },
        // });
        ul.append(li);

        $('.marquee').append("<p>" + title + "</p>");
        ix++;
    }
}

function prefix(s, key) {
    return s + key.replace(/\./g, '_');
}

function getConceptUri(countryName) {

    var resourceUri = storage.get(prefix('resourceUri', countryName));
    if (resourceUri) {
        return resourceUri;
    }
    var conceptUri = host + "/concepts/tagged?q=" + countryName + "&limit=10&apikey=" + apikey;

    $.ajax({
        async: false,
        dataType: "json",
        url: conceptUri,
        success: function(data) {
            resourceUri = data[3][0];
        }
    });
    if (!resourceUri) {
        resourceUri = 'unknown';
    }
    storage.set(prefix('resourceUri', countryName), resourceUri);
    return resourceUri;
}



function occurrences(countryName) {

    var occurrence = storage.get(prefix('occurrence', countryName));
    if (occurrence) {
        return occurrence;
    }

    var resourceUri = getConceptUri(countryName);
    if (resourceUri == 'unknown') {
        return 0;
    }

    var occurrenceUri = host + "/concepts/co-occurrences?uri=" + resourceUri + "&limit=1&apikey=" + apikey;
    $.ajax({
        async: false,
        dataType: "json",
        url: occurrenceUri,
        success: function(data) {
            occurrence = data["co-occurrences"][0].occurrence;
        }
    });
    if (!occurrence) {
        occurrence = 1;
    }
    storage.set(prefix('occurrence', countryName), occurrence);
    return occurrence;
}

function conceptImageError(img) {
    img.src = "img/placeholder.jpg";
    img.className = "concept-img concept-img--error";
    img.onerror = "";
    return true;
}
