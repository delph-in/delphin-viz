function getCurrGramId() {
    return $('#input-grammar')[0].value;
}


function getCurrGrammar() {
    return RESOURCES[getCurrGramId()];
}


// Using underscore.js/lodash.js Templates
var Templates = {};

Templates.result = [
    '<div data-result="<%= resultNum - 1%>" class="result">',
        '<div class="result-inner">',
            '<div class="num"><%= resultNum %></div>',
        '</div>',
    '</div>'].join("\n");


Templates.viz = [
    '<div class="viz <%= vizType %>" data-viz="<%= vizType %>">',
        '<div class="tools hidden">',
            '<div title="Save as PNG" class="save" data-img="png"><div class="icon"></div><div>PNG</div></div>',
            '<div title="Save as SVG" class="save" data-img="svg"><div class="icon"></div><div>SVG</div></div>',
            '<div title="Save as LateX" class="save" data-img=latex><div class="icon"></div><div>LaTeX</div></div>',
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


function setInlineStyles(svg, emptySvgDeclarationComputed) {
    // Applies computed CSS styles for an SVG to the element as inline
    // styles. This allows SVG elements to be saved as SVG and PNG images that
    // display as viewed in the browser.
    // This function taken from the svg-crowbar tool:
    // https://github.com/NYTimes/svg-crowbar/blob/gh-pages/svg-crowbar-2.js
    
    function explicitlySetStyle (element) {
        var cSSStyleDeclarationComputed = getComputedStyle(element);
        var i, len, key, value;
        var computedStyleStr = "";
        for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
            key=cSSStyleDeclarationComputed[i];
            value=cSSStyleDeclarationComputed.getPropertyValue(key);
            if (value!==emptySvgDeclarationComputed.getPropertyValue(key)) {
                computedStyleStr+=key+":"+value+";";
            }
        }
        element.setAttribute('style', computedStyleStr);
    }
    function traverse(obj){
        var tree = [];
        tree.push(obj);
        visit(obj);
        function visit(node) {
            if (node && node.hasChildNodes()) {
                var child = node.firstChild;
                while (child) {
                    if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
                        tree.push(child);
                        visit(child);
                    }
                    child = child.nextSibling;
                }
            }
        }
        return tree;
    }
    // hardcode computed css styles inside svg
    var allElements = traverse(svg);
    var i = allElements.length;
    while (i--){
        explicitlySetStyle(allElements[i]);
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
        saveVizSvg : function(vizType) {
            var svg = self[vizType].element;
            setInlineStyles(svg, emptySvgDeclarationComputed);
            var svgData = self[vizType].element.outerHTML;
            var svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
            var DOMURL = window.URL || window.webkitURL || window;
            var url = DOMURL.createObjectURL(svgBlob);
            triggerDownload(url, vizType+'.svg');        
        },
        saveVizPng : function(vizType) {
            var svg = self[vizType].element;
            setInlineStyles(svg, emptySvgDeclarationComputed);
            var height = svg.getBoundingClientRect().height;
            
            // Save SVG to a canvas
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
                triggerDownload(imgURI, vizType+'.png');
            };
            img.src = url;
        },
        saveVizLatex : function(vizType, resultNum) {
            var data = {
                input: $('#input-text').val(),
                results: $('#input-results').val()
            };
            data[vizType] = 'latex';

            $.ajax({
                url: CURR_GRAMMAR.url,
                dataType: 'json',
                data: data,
                success: function(data){
                    var latex = data.results[resultNum][vizType];
                    var textBlob = new Blob([latex], {type: "text/plain;charset=utf-8"});
                    var DOMURL = window.URL || window.webkitURL || window;
                    var url = DOMURL.createObjectURL(textBlob);
                    triggerDownload(url, vizType+'.tex');
                },
                error: function(data){
                    // TODO: better error handling
                    alert("Sorry, something went wrong saving LaTex.");
                }
        });
        }
    };
    
    var $inner = $result.find('.result-inner');

    // Add data structures as per the available data
    if (self.data.derivation) {
        var $viz = $(Templates.viz({vizType:'tree'})).appendTo($inner);
        self.tree = {element: drawTree($viz[0], self.data.derivation)};
    }
    
    if (self.data.mrs) {
        var $viz = $(Templates.viz({vizType:'mrs'})).appendTo($inner);
        self.mrs = MRS($viz[0], self.data.mrs);
    }

    if (self.data.dmrs) {
        var $viz = $(Templates.viz({vizType:'dmrs'})).appendTo($inner);
        self.dmrs = DMRS($viz[0], self.data.dmrs);
    }

    // remove any save links that are unsupported
    $inner.find('.viz').each(function (){
        var vizType = this.dataset.viz;
        if (CAPABILITIES[CURR_GRAMMAR.server][vizType].indexOf('latex') == -1) {
            $(this).find('[data-img="latex"]').remove();
        }
    });
        
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
            if (this.dataset.img == 'svg') {
                self.saveVizSvg(vizType);
            } else if (this.dataset.img == 'png') {
                self.saveVizPng(vizType);
            } else if (this.dataset.img == 'latex') {
                var resultNum = $(this).closest('.result').data('result');
                self.saveVizLatex(vizType, resultNum);
            }
        });
    });

    // Return this object
    return self;
}


function triggerDownload (uri, filename) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: false,
        cancelable: true
    });

    var a = document.createElement('a');
    a.setAttribute('download', filename);
    a.setAttribute('href', uri);
    a.setAttribute('target', '_blank');
    a.dispatchEvent(evt);
}


function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");

    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable)
            return pair[1];
    }
    
    return false;
}


function doResults(data) {
    // Update the status 
    $(Templates.successStatus({
        'input': data.input,
        'readings': data.readings,
        'numResults': data.results.length}))
        .appendTo($('#results-info').empty());
    
    //Create and add the results
    var parent = $('#results-container').empty()[0];
    
    RESULTLIST = [];

    for (var i=0; i < data.results.length; i++) {
        var result = Result(data.results[i], parent);
        RESULTLIST.push(result);
    }
}


function updateUrl() {
    var makeParam = function(param, value) {return param + '=' + value;};
    var params = [];

    params.push(makeParam('input', $('#input-text').val()));
    params.push(makeParam('count', $('#input-results').val()));
    params.push(makeParam('grammar', $('#input-grammar').val()));
    
    if ($('#input-tree').prop('checked'))
        params.push(makeParam('tree', 'true'));
    if ($('#input-mrs').prop('checked'))
        params.push(makeParam('mrs', 'true'));
    if ($('#input-dmrs').prop('checked'))
        params.push(makeParam('dmrs', 'true'));

    window.location.hash = encodeURI(params.join('&'));
}


function loadUrlParams() {
    var hash = decodeURI(window.location.hash);
    var params = hash.replace(/^#/, '').split('&');

    if (params.length === 0 || params[0] === "")
        return false;

    for (var i=0; i < params.length; i++) {
        var p = params[i];

        if (p == '')
            continue;

        var fields = p.split('=');
        var param = fields[0];
        var value = fields[1];

        if (param === '' || value === '')
            continue;

        if (param == 'input')
            $('#input-text').val(value);
        else if (param == 'grammar')
            $('#input-grammar').val(value);
        else if (param == 'count')
            $('#input-results').val(value);
        else if (param == 'tree')
            $('#input-tree').prop('checked', true);
        else if (param == 'mrs')
            $('#input-mrs').prop('checked', true);
        else if (param == 'dmrs')
            $('#input-dmrs').prop('checked', true);
    }
    return true;
}

$(document).ready(function(){

    // Populate grammar selection with available grammars from resources.js
    for (var i=0; i<GRAMMARS.length; i++) {
        var gramId = GRAMMARS[i];
        var grammar = RESOURCES[gramId];
        $('#input-grammar').append($('<option>', {
            value: gramId,
            text : grammar.grammar + ' (' + grammar.location + ')'
        }));
    }

    $('#input-submit').click(function(event) {
        var currGrammar = getCurrGrammar();
        $.ajax({
            url: currGrammar.url,
            dataType: 'json',
            data: {
                'derivation': $('#input-tree').prop('checked') ? 'json' : "null",
                'mrs': $('#input-mrs').prop('checked') ? 'json' : "null",
                'dmrs': $('#input-dmrs').prop('checked') ? 'json' : "null",
                'input': $('#input-text').val(),
                'results': $('#input-results').val()
            },
            dataFilter: function(data) {
                // Fix buggy JSON from LKB server
                return data.replace(/([^,]) "pedges"/, '$1, "pedges"');
            },
            success: function(data){
                CURR_GRAMMAR = getCurrGrammar();
                doResults(data);
                updateUrl();
            },
            error: function(data){
                // TODO: improve error handling and reporting
                alert("Sorry, something went wrong.");
            }
        });
    });

    // Don't think this is still used
    $('#input-grammar').on('focusin', function(){
        $(this).data('prev', $(this).val());
    });

    $('#input-grammar').change(function(event){
        // Change the sample text
        $('#input-text').val(getCurrGrammar().inputs[0]);
    });

    if (loadUrlParams())
        // Execute query stored in URL
        $('#input-submit').trigger('click');
    else
        // No URL params, default to checking derivation tree
        $('#input-tree').prop('checked', true);
    
    if (getQueryVariable('dev') == 'true') {
        $.getJSON("elephant.json", function(data) {
            doResults(data);
        });
    }

    // add empty svg element for use in saving SVGs as SVGs and PNGs
    var emptySvg = window.document.createElementNS("http://www.w3.org/2000/svg", 'svg');
    window.document.body.appendChild(emptySvg);
    emptySvgDeclarationComputed = getComputedStyle(emptySvg);

});
