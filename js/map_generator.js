// Initalise PolyMaps
var po = org.polymaps;
var storage = $.localStorage;
var apikey = "9OHbOpZpVh9tQZBDjwTlTmsCF2Ce0yGQ";
var host = "http://data.bbc.co.uk/v1/bbcrd-newslabs";

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

function mapLoaded(e) {
    $.getJSON("js/countries-data.json", function(countriesJson) {
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
                $('#country-name').html($(this).data('countryName') + ' (' + $(this).data('countryNumber') + ')');
            });
            $(feature.element).on('mouseout', function() {
                $('#country-name').html('');
            });

            // Link to more information if the country is clicked
            $(feature.element).on('click touch', function() {
                $('*').removeClass('highlight');
                $(this).addClass('highlight');
                countryView($(this));
            });
        }
    });
}

function countryView(country) {
    var countryName = country.data('countryName');
    $('.sidebar-title').html(countryName);
    $('ul.cwlist').html('');
    $('.marquee').html('');
    $('.sidebar .loading').fadeIn();
    $('.sidebar').slideDown();
    getCreativeWorks(countryName)
}

function getCreativeWorks(countryName) {
    var resourceUri = getConceptUri(countryName);
    if (resourceUri && resourceUri != '') {
        var uri = host + "/creative-works?tag=" + resourceUri + " &limit=15&offset=0&apikey=" + apikey;
        $.getJSON(uri).done(function(data) {
            renderCreativeWorks(data);
        });
    }
}

function renderCreativeWorks(data) {
    $('.sidebar .loading').hide();
    var ul = $('ul.cwlist');
    var dedupedArticles = {};
    $.each(data['@graph'], function(ix, item) {
        dedupedArticles[$.trim(item.title)] = item;
    });
    var ix = 0;
    for (var article in dedupedArticles) {
        var item = dedupedArticles[article];
        var li = $('<li>').attr('id', "article"+ix);
        var url = item.primaryContentOf;
        var title = item.title;
        var thumbnail = item.thumbnail;
        li.append($('<a>').attr('class', "cwlink").attr('href', url).text(title));
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
        
        $('.marquee').append("<p>"+title+"</p>");
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
