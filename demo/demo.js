/* TODO
   tree.js
   -- switch to using svg.js -- will generate more compliant SVGs
   -- short labels when available
   -- incorporate types when available
   -- node tooltips with identifiers/types; need to resolve strategy 
   
   mrs.js
   -- finish basic representation
   -- add variable highlighting
   -- add span highlighting
   -- variable information 
 
   Workout strategy for tooltips. Options:
   JavaScript (element used will be appended to the DOM)
   -- jQuery UI 
      CDN available
      Use 'track' option in order follow mouse
   -- opentip
      https://github.com/enyo/opentip/blob/master/downloads/opentip-native.min.js
      Has mouse tracking

   CSS  (won't be able to follow mouse like in logon demo)
   
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
        '</div>',
    '</div>'].join("\n");


Templates.viz = [
    '<div class="viz <%= vizType %>" data-viz="<%= vizType %>">',
        '<div class="tools hidden">',
            '<div title="Save as PNG" class="save" data-img="png"><div class="icon"></div><div>PNG</div></div>',
            '<div title="Save as SVG" class="save" data-img="svg"><div class="icon"></div><div>SVG</div></div>',
        '</div>',
    '</div>'
].join("\n");


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
    var resultNum = result['result-id'] + 1;

    // Create and attach the DOM element that will contain the Result
    var $result = $(Templates.result({'resultNum': resultNum})).appendTo(parent);
    
    // Create this object
    var self = {
        data : result,
        num : resultNum,
        element: $result[0],
        drawTree : drawTree,
        drawMrs : drawMrs,
        saveViz : function(){},
        saveVizSvg : function(vizType) {
            var svgData = self[vizType].outerHTML;
            var svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            var DOMURL = window.URL || window.webkitURL || window;
            var url = DOMURL.createObjectURL(svgBlob);
            triggerDownload(url, 'delphin.svg');        
        },
        saveVizPng : function(vizType) {
            // Save SVG to a canvas
            var svg = self[vizType];
            var canvas = $('<canvas>')[0];
            var ctx = canvas.getContext('2d');
            var bbox = svg.getBBox();
            ctx.canvas.height = bbox.height;
            ctx.canvas.width = bbox.width;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            
            // convert SVG to dataUrl
            var data = (new XMLSerializer()).serializeToString(svg);
            var svgBlob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
            var DOMURL = window.URL || window.webkitURL || window;
            var url = DOMURL.createObjectURL(svgBlob);

            var img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0);
                DOMURL.revokeObjectURL(url);

                var imgURI = canvas
                        .toDataURL('image/png')
                        .replace('image/png', 'image/octet-stream');

                // on the image load, actually download it
                triggerDownload(imgURI, 'delphin.png');
            };
            img.src = url;
        }
    };
    
    var $inner = $result.find('.result-inner');

    // Add data structures as per the available data
    if (self.data.derivation) {
        var $viz = $(Templates.viz({vizType:'tree'})).appendTo($inner);
        self.tree = self.drawTree(self.data.derivation, $viz[0]);
    }
    
    if (self.data.mrs) {
        var $viz = $(Templates.viz({vizType:'mrs'})).appendTo($inner);
        self.mrs = self.drawMrs(self.data.mrs, $viz[0]);
    }

    //Add various event bindings to things in the visualisations
    $result.find('.viz').hover(
        function(event) {
            $(this).find('.tools').removeClass('hidden');
        },
        function(event) {
            $(this).find('.tools').addClass('hidden');
        }
    ).each(function(index) {
        var vizType = this.dataset.viz;
        $(this).find('.save').click(function(event){
            if (this.dataset.img == 'svg')
                self.saveVizSvg(vizType);
            else if (this.dataset.img == 'png')
                self.saveVizPng(vizType);
        });
    });

    // Return this object
    return self;
}


function triggerDownload (imgURI, filename) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
    });

    var a = document.createElement('a');
    a.setAttribute('download', filename);
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
