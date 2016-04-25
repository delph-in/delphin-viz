/* TODO
   -- short labels when available
   -- incorporate types when available
   -- MRS 
 */

var ERG_URL = 'http://erg.delph-in.net/rest/0.9/parse';

// Makes a few things easier for development
var DEV_MODE = true;


// Using underscore.js/lodash.js  Templates
var Templates = {};

Templates.result = [
    '<div class="result">',
        '<div class="result-inner">',
            '<div class="num"><%= resultNum %></div>',
            '<div class="tree viz"><div class="tools hidden"><div class="save"></div></div></div>',
            '<div class="mrs viz"><div class="tools hidden"><div class="save"></div></div></div>',
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


function Result(result, parent) {
    // Create this object
    var self = {
        data : result,
        num : result['result-id'] + 1,
        drawTree : drawTree,
        drawMrs : drawMrs
    };

    // Create and attach the DOM element that will contain the Result
    var $result = $(Templates.result({'resultNum': self.num})).appendTo(parent);

    // Add data structures as per the available data
    if (self.data.derivation)
        var treeSvg = self.drawTree(self.data.derivation, $result.find('.tree')[0]);
    if (self.data.mrs)
        var mrsSvg = self.drawMrs(self.data.mrs, $result.find('.mrs')[0]);

    // Add hover listeners for trees and MRS
    $result.find('.tree, .mrs').hover(
        function(event) {
            $(this).find('.tools').removeClass('hidden');
        },
        function(event) {
            $(this).find('.tools').addClass('hidden');
        }
    );

    // TODO: move the callback to named function
    $result.find('.save').click(function (event){
        // Save SVG to a canvas
        var $canvas = $('<canvas>');
        var canvas = $canvas[0];
        var ctx = canvas.getContext('2d');
        var $svg = $(this).closest('.viz').find('svg');
        ctx.canvas.height = $svg.height();
        ctx.canvas.width = $svg.width();
        ctx.fillStyle = 'white';
        ctx.fillRect(0 ,0, ctx.canvas.width, ctx.canvas.height);
        
        // convert SVG to dataUrl
        var data = (new XMLSerializer()).serializeToString($svg[0]);
        var DOMURL = window.URL || window.webkitURL || window;

        var img = new Image();
        var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
        var url = DOMURL.createObjectURL(svgBlob);

        img.onload = function () {
            ctx.drawImage(img, 0, 0);
            DOMURL.revokeObjectURL(url);

            var imgURI = canvas
                    .toDataURL('image/png')
                    .replace('image/png', 'image/octet-stream');

            // on the image load, actually download it
            triggerDownload(imgURI);
        };
        img.src = url;
    });

    return self;
}


function triggerDownload (imgURI) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
    });

    var a = document.createElement('a');
    a.setAttribute('download', 'delphin.png');
    a.setAttribute('href', imgURI);
    a.setAttribute('target', '_blank');
    a.dispatchEvent(evt);
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
    var parent = $('#results-container').empty()[0];
    
    for (var i=0; i < results.length; i++) {
        var result = Result(results[i], parent);
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
