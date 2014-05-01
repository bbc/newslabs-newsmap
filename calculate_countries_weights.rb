#!/usr/bin/env ruby

require 'uri'
require 'json'
require 'net/http'

APIKEY = "AnFFozaQZFwCGLhqLa0u3t03N5qRkVsd"
HOST = "http://data.bbc.co.uk/v1/bbcrd-newslabs"

def get_resource_uri(country_name)
  concept_uri = "#{HOST}/concepts/tagged?q=#{URI.encode(country_name)}&limit=10&apikey=#{APIKEY}"
  resp = Net::HTTP.get(URI(concept_uri))
  begin
    data = JSON.parse(resp)
    data[3][0]
  rescue
    nil
  end
end

def get_occurrence(resource_uri)
  r_uri = resource_uri
  return 0 unless r_uri
  occurrence_uri = "#{HOST}/concepts/co-occurrences?uri=#{URI.encode(r_uri)}&limit=1&apikey=#{APIKEY}";
  resp = Net::HTTP.get(URI(occurrence_uri))
  begin
    data = JSON.parse(resp)
    data['co-occurrences'][0]['occurrence']
  rescue
    0
  end
end

def collect_occurrences(country_names)
  puts "Countries: #{country_names}"
  occurrences = {}
  i = 0
  country_names.map do |country_name|
    puts i if (i % 10) == 0
    occurs = get_occurrence(get_resource_uri(country_name))
    occurrences[country_name] = occurs
    i += 1
  end
  occurrences
end

def get_country_names
  resp = Net::HTTP.get(URI("http://api.tinata.co.uk/countries.json"))
  data = JSON.parse(resp)
  data.map { |c| c['name'] }
end

data = collect_occurrences(get_country_names)
File.open('countries-data.json', 'w') { |file| file.write(data.to_json) }
