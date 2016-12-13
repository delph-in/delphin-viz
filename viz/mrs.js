function MRS(parentElement, mrsData){
    // Constant pixel sizes used
    const MAXWIDTH = 600;     // width before a list of elements is wrapped 
    const XGAP = 5;           // horizontal gap between elements
    const YGAP = 5;           // vertical gap between 1-line features 
    const YGAPSTRUCT = 10;    // vertical gap between full feature structures
    const BRACKETYPAD = 5;    // distance bracket extents above/below box
    const BRACKETXWIDTH = 5;  // width of right-angle corner thing 
    const ANGLEHEIGHT = 50;   // Height of angle brackets
    const ANGLEWIDTH = XGAP;  // Width of angle brackets
    const FEATNAMEXGAP = 80;

    // Global offset for keeping track of where next thing needs to be drawn on
    // the Y axis.
    var CURRENTY = 0;

    function drawMrs() {
        var svg = SVG(parentElement);
        var mrs = svg.group();
        var container = mrs.group();

        CURRENTY = 0;
        drawFeatStructType(container, '');
        drawFeatValPair(container, 'TOP', mrsData.top);
        drawFeatValPair(container, 'INDEX', mrsData.index);    
        drawFeatValPair(container, 'RELS', mrsData.relations); 
        drawFeatValPair(container, 'HCONS', mrsData.constraints); 
        drawSquareBrackets(mrs, XGAP);
        
        // transform the MRS to take into account the square brackets drawn at
        // negative coordinates
        mrs.transform({x:XGAP+10, y:BRACKETYPAD});
        
        // update the dimensions of the final SVG to match those of the now
        // rendered MRS
        var finalBbox = mrs.tbox();
        svg.size(finalBbox.width+10, finalBbox.height+5);
        return svg.node;
    }

    function drawFeatStructType(parent, name) {
        var text = parent.plain(name).y(CURRENTY).attr({'font-style':'italic'});    
        CURRENTY += text.tbox().height;
        return text;
    }

    function drawFeatValPair(parent, name, value) {
        var group = parent.group();

        if (typeof value === 'string' || value instanceof String) {
            // value is a string 
            var featText = group.plain(name).y(CURRENTY);
            var attrs = {'title': value,
                         'font-style': 'italic'};

            if (name != 'CARG'){
                // If it's not 'CARG' then it's a variable
                attrs['class'] = 'variable';
                attrs['data-var'] = value;
            }

            var featVal = group.plain(value).move(FEATNAMEXGAP, CURRENTY).attr(attrs);
        } else if (Object.prototype.toString.call(value) === '[object Array]'){
            // value is a list
            if (name == 'RELS')
                var itemFunc = relFeatStruct;
            else if (name == 'HCONS')
                var itemFunc = hconsFeatStruct;

            var featText = group.plain(name);
            var list = drawList(group, value, itemFunc);
            var firstLine = list.select('g').first();
            featText.cy(firstLine.tbox().cy);

            // transform the group to make space 
            var diff = group.previous().tbox().y2 - list.tbox().y;
            if (diff > 0)
                group.transform({y:diff + YGAPSTRUCT});
        }

        CURRENTY += group.tbox().height;
        return group;
    }

    function relFeatStruct(parent, rel) {
        var pred = rel['predicate'] +'⟨'+rel.lnk.from+':'+rel.lnk.to+'⟩';
        drawFeatStructType(parent, pred);
        drawFeatValPair(parent, 'LBL', rel['label']);

        var args = Object.keys(rel.arguments).sort(rargcompare);
        
        for (var j=0; j < args.length; j++) {        
            var arg = args[j];
            drawFeatValPair(parent, arg, rel.arguments[arg]);
        }
    }

    function hconsFeatStruct(parent, hcon) {
        drawFeatStructType(parent, hcon.relation);
        drawFeatValPair(parent, 'HARG', hcon.high);
        drawFeatValPair(parent, 'LARG', hcon.low);
    }

    function drawList(parent, itemsData, itemFunc) {
        // The list may need to be broken up into multiple lines 
        var lines = [];
        var startX = FEATNAMEXGAP + BRACKETXWIDTH;
        var currX = startX;
        var currY = 0;
        
        var list = parent.group();     
        var leftAngle = list.polyline();
        var line = list.group();

        // draw all the items. note that x and y coordinates for item drawing are
        // relative to the parent group containing the whole list
        for (var i=0; i < itemsData.length; i++) {       
            CURRENTY = 0;  
            var itemGroup = line.group();

            itemFunc(itemGroup, itemsData[i]);
            drawSquareBrackets(itemGroup, 5);
            itemGroup.transform({x:currX, y:currY}); 

            // update item offsets
            if (i == itemsData.length - 1) {
                // we're done with items
                break;
            } else if (currX >= MAXWIDTH) {
                // Starting a new line of items
                currX = startX;
                currY += line.tbox().height + YGAPSTRUCT;
                lines.push(line);
                line = list.group();
            } else {
                // move along by last itemGroup width
                currX += itemGroup.tbox().width + 2*XGAP;
            }
            
        }
        lines.push(line);
        
        //vertically align the items in each line
        for (var i=0; i < lines.length; i++) {
            var thisLine = lines[i];
            thisLine.cy = thisLine.tbox().cy;
            var items = thisLine.children();

            for (var j=0; j < items.length; j++) {
                // align each item vertically and add vertically aligned comma.
                // need to account for negative y values using BRACKETYPAD
                var item = items[j];          
                item.cy(thisLine.cy + BRACKETYPAD);
                var tbox = item.tbox();
                var comma = item.plain(',').center(tbox.width-1, -BRACKETYPAD + tbox.height/2);
            }
        }

        // remove trailing comma
        comma.remove();

        var firstLine = lines[0];

        //update left angle dimensions, now we know where the midpoint is
        var firstRelTbox = firstLine.children()[0].tbox();
        leftAngle.plot([
            [firstRelTbox.x - BRACKETXWIDTH, firstLine.cy + ANGLEHEIGHT/2],
            [firstRelTbox.x - BRACKETXWIDTH - ANGLEWIDTH, firstLine.cy],
            [firstRelTbox.x - BRACKETXWIDTH, firstLine.cy - ANGLEHEIGHT/2]]).fill('none').stroke('black');

        //Add right angle bracket
        var lastLine = lines[lines.length - 1];
        var lastLineTbox = lastLine.tbox();
        var rightAngle = line.polyline([
            [lastLineTbox.x2 + BRACKETXWIDTH, lastLine.cy + ANGLEHEIGHT/2],
            [lastLineTbox.x2 + BRACKETXWIDTH + ANGLEWIDTH, lastLine.cy],
            [lastLineTbox.x2 + BRACKETXWIDTH, lastLine.cy - ANGLEHEIGHT/2]]).fill('none').stroke('black');

        return list;
    }

    function drawSquareBrackets(element, xpad) {
        // xpad -- distance bracket extends left/right of box

        // Draw left and right square brackets
        var tbox = element.tbox(); 
        
        // left vertical line; top right angle; bottom right angle
        element.line(tbox.x-xpad, tbox.y-BRACKETYPAD, tbox.x-xpad,
                     tbox.y2+BRACKETYPAD).stroke({width:1});
        element.line(tbox.x-xpad, tbox.y-BRACKETYPAD, tbox.x-xpad+BRACKETXWIDTH,
                     tbox.y-BRACKETYPAD).stroke({width:1});
        element.line(tbox.x-xpad, tbox.y2+BRACKETYPAD, tbox.x-xpad+BRACKETXWIDTH,
                     tbox.y2+BRACKETYPAD).stroke({width:1});
        
        // left vertical line; top right angle; bottom right angle
        element.line(tbox.x2+xpad, tbox.y-BRACKETYPAD, tbox.x2+xpad,
                     tbox.y2+BRACKETYPAD).stroke({width:1});
        element.line(tbox.x2+xpad-BRACKETXWIDTH, tbox.y-BRACKETYPAD, tbox.x2+xpad,
                     tbox.y-BRACKETYPAD).stroke({width:1});
        element.line(tbox.x2+xpad-BRACKETXWIDTH, tbox.y2+BRACKETYPAD, tbox.x2+xpad,
                     tbox.y2+BRACKETYPAD).stroke({width:1});
    }

    function rargcompare(a, b) {
        // Compare function for sorting rel arguments 
        var a = a.toUpperCase();
        var b = b.toUpperCase();
        if (a === 'BODY' || a === 'CARG' || a.substr(-4) === 'HNDL') {
            return 1;
        } else if (b === 'BODY' || b === 'CARG' || b.substr(-4) === 'HNDL') {
            return -1;
        } else {
            return a > b;
        }
    }

    function xArgKey(arg) {
        // Key function for x variable properties
        var arg = arg.toUpperCase();
        var xvar = ['PERS', 'NUM', 'PT', 'IND'];
        var index = xvar.indexOf(arg);
        return index > 0 ? index: 9999; 
    }
    
    function eArgKey(arg) {
        // Key function for event variable properties
        var arg = arg.toUpperCase();
        var evar = ['SF', 'TENSE', 'MOOD', 'PROG', 'PERF'];
        var index = evar.indexOf(arg);
        return index > 0 ? index: 9999; 
    }

    function keySort(array, func){
        // Returns a copy of 'array' sorted based on first applying 'func' to
        // each element
        var mapped = array.map(function(el, i){
            return {index: i, value: func(el)};
        });

        mapped.sort(function(a, b) {
            return +(a.value < b.value) || +(a.value === b.value) - 1;
        });
        
        return mapped.map(function(el){
            return array[el.index];
        });
    }

    function addHandlers(node){
        $(node).find('.variable').hover(
            function (event){
                event.stopPropagation();
                var $this = $(this);

                // highlight variables
                var dataQuery = "[data-var='" + $this.data('var') + "']";
                $(node).find(dataQuery).css({fill: 'red'}); 

                // highlight input text span if variable has lnk data
                var lnks = argZeroes[this.innerHTML];
                if (lnks == undefined)
                    // no lnks for this variable
                    return;

                var $inputElem = $('#text-input');
                var inputText = $inputElem.html();
                
                // create an arrary of binary values indicating which characters
                // should be highlighted
                var chars = Array.apply(null, Array(inputText.length)).map(function(){return 0});
                for (var i=0; i < lnks.length; i++) {
                    for (var j=lnks[i].from; j < lnks[i].to; j++)
                        chars[j] = 1;
                }

                // create a list of highlighted or not highlighted tokens
                // to be joined together and then used to replace the text
                var tokens = [];
                var inside = false;
                var start = 0;
                for (var c=0; c < chars.length; c++){
                    var status = chars[c];
                    var atEnd = (c == chars.length - 1);
                    var end = atEnd ? c+1 : c;
                    if (inside && (!status || atEnd)) {
                        tokens.push('<span class="highlighted">' + inputText.slice(start, end) + '</span>');
                        inside = false;
                        start = c;
                    } else if (!inside && (status || atEnd)) {
                        tokens.push(inputText.slice(start, end));
                        inside = true;
                        start = c;
                    } 
                }
                $inputElem.html(tokens.join(''));                
            }
            ,
            function (event){
                // remove highlighted variables 
                var dataQuery = "[data-var='" + $(this).data('var') + "']";
                $(node).find(dataQuery).css({fill: 'black'}); 
                
                // reset highlighted input string
                var $inputElem = $('#text-input');
                $inputElem.html($inputElem.html().replace(/<\/?span[^>]*>/g,""));
            }
        ).filter(function (){
            // only draw tooltip for variables of type e and x probably should
            // be doing the test against whether corresponding mrs variable
            // object has "properties" field or not.
            var varName = $(this).data('var');
            return mrsData.variables[varName].hasOwnProperty("properties");
        }).tooltip({
            track: true,
            tooltipClass: 'mrs-variable-info',
            content: function(){
                var varName = $(this).data('var');
                var variable = mrsData.variables[varName];
                var func = variable.type == 'e' ? eArgKey : xArgKey;
                var features = keySort(Object.keys(variable.properties), func);

                var rows = [];
                for (var i=0; i < features.length; i++) {        
                    var attr = features[i];
                    rows.push('<tr><td class="variable-feat-name">'+attr+'</td><td class="variable-feat-val">'+variable.properties[attr]+'</td></tr>');
                }
                return '<table>' + rows.join('') + '</table>';
            }
        });
    }

    function getArgZeroLinks(){
        argZeroLinks = {};
        
        for (var i=0; i < mrsData.relations.length; i++) {        
            var rel = mrsData.relations[i];
            if (argZeroLinks.hasOwnProperty(rel.arguments.ARG0))
                argZeroLinks[rel.arguments.ARG0].push(rel.lnk);
            else
                argZeroLinks[rel.arguments.ARG0] = [rel.lnk];
        }
        return argZeroLinks;
    }

    var argZeroes = getArgZeroLinks();
    
    var self = {
        parent: parentElement,
        data: mrsData,
        element: drawMrs()
    };

    addHandlers(self.element);
    return self;
}
