/* TODO
   -- implement result line status
   -- when cross-site enabled, test out results number 
   -- ask Stephan about getting lex_type identifiers
   -- ask Stephan about getting to/from character span values 
   -- MRS
 */

ERG_URL = 'http://erg.delph-in.net/rest/0.9/parse';



// Using underscore.js template
Templates = {};
Templates.result = [
    '<div class="result">',
        '<div class="result-inner">',
            '<div class="num"><%= resultNum %></div>',
            '<div class="tree"></div>',
        '</div>',
    '</div>'].join("\n");


// Precompile the templates
for (var template in Templates) {
    if (Templates.hasOwnProperty(template)) {
        Templates[template] = _.template(Templates[template]);
    }
}
   

function doResults(results){
    var $parent = $('#results-container').empty();
    
    for (var i=0; i < results.length; i++) {
        var result = results[i];
        var template = Templates.result({'resultNum':i+1});
        var $result = $(template).appendTo($parent);

        if (result.derivation) {
            var svg = drawTree(result.derivation, $result.find('.tree')[0]);
        }
        
        if (result.mrs) {
            //TODO
            //$result.append(mrs);
        }   
    }
}


$(document).ready(function(){

    // for development while API does not work cross-site
    $.getJSON("elephant.json", function(data) {
        doResults(data.results);
    });

    
    $('#send-input').click(function(event) {
        $.ajax({
            url: ERG_URL,
            dataType: 'json',
            type: 'GET',
            data: {
                'derivation': 'json',
                'input': $('#input-text').val(),
                'results': $('#input-results').val()
            },
            success: function(data){
                doResults(data.results);
            },
            error: function(){
                alert("Error");
            }
        });
    });
});
