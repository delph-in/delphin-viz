/* TODO
   -- short labels when available
   -- MRS
 */

var ERG_URL = 'http://erg.delph-in.net/rest/0.9/parse';

// Makes a few things easier for development
var DEV_MODE = false;


// Using underscore/lodash  Templates
var Templates = {};

Templates.result = [
    '<div class="result">',
        '<div class="result-inner">',
            '<div class="num"><%= resultNum %></div>',
            '<div class="tree"></div>',
            '<div class="mrs"></div>',
        '</div>',
    '</div>'].join("\n");

Templates.successStatus = [
    '<p id="parse-status">Showing <%= numResults %> of <%= readings %> analyses.</p>',
    '<div id="text-input"><%= input %></div>'
].join("\n");


// Precompile the templates
for (var template in Templates) {
    if (Templates.hasOwnProperty(template)) {
        Templates[template] = _.template(Templates[template]);
    }
}
   

function doResults(data){
    var results = data.results;

    // Update the status 
    $(Templates.successStatus({
        'input': data.input,
        'readings': data.readings,
        'numResults': results.length}))
        .appendTo($('#results-info').empty());
    
    //Create and add the results
    var $parent = $('#results-container').empty();
    
    for (var i=0; i < results.length; i++) {
        var result = results[i];
        var $result = $(Templates.result({'resultNum': i+1})).appendTo($parent);

        if (result.derivation) {
            var svg = drawTree(result.derivation, $result.find('.tree')[0]);
        }
        
        if (result.mrs) {
            var svg = drawMrs(result.mrs, $result.find('.mrs')[0]);
        }   
    }
}


$(document).ready(function(){

    $('#input-submit').click(function(event) {
        $.ajax({
            url: ERG_URL,
            dataType: 'json',
            data: {
                'derivation': 'json',
                'input': $('#input-text').val(),
                'results': $('#input-results').val()
            },
            success: function(data){
                doResults(data);
            },
            error: function(data){
                alert("Error");
            }
        });
    });

    if (DEV_MODE) {
        $.getJSON("elephant.json", function(data) {
            doResults(data);
        });
    }
});
