/* 

TODO:
    * why is hcons list off by a couple of pixels?
*/


function MRS(parentElement, mrsData){
    // Constant pixel sizes used
    const MAXWIDTH = 500;     // width before a list of elements is wrapped 
    const XGAP = 10;          // horizontal gap between elements
    const YGAP = 5;           // vertical gap between 1-line features 
    const YGAPSTRUCT = 10;    // vertical gap between full feature structures
    const BRACKETYPAD = 5;    // distance bracket extents above/below box
    const BRACKETXWIDTH = 5;  // width of right-angle corner thing 
    const ANGLEHEIGHT = 50;   // Height of angle brackets
    const ANGLEWIDTH = XGAP;  // Width of angle brackets
    const FEATNAMEXGAP = 80;

    // canonical ordering for MRS features
    const RELVALS = ['ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];
    const XVAR = ['PERS', 'NUM', 'IND'];
    const EVAR = ['SF', 'TENSE', 'MOOD', 'PROG', 'PERF'];    

    // Global offset for keeping track of where next thing needs to be drawn on the
    // Y axis.
    var CURRENTY = 0;

    function drawMrs(parent) {
        var svg = SVG(parent);
        var mrs = svg.group();
        var container = mrs.group();

        CURRENTY = 0;
        drawFeatStructType(container, 'mrs');
        drawFeatValPair(container, 'LTOP', mrsData.top);
        drawFeatValPair(container, 'INDEX', mrsData.index);    
        drawFeatValPair(container, 'RELS', mrsData.relations); 
        drawFeatValPair(container, 'HCONS', mrsData.constraints); 
        drawSquareBrackets(mrs, XGAP);
        
        // Left bracket is currently outside the viewport of the SVG canvas
        // possibly also the top bit of brackets. possibly can remove the y transform
        mrs.transform({x:XGAP, y:BRACKETYPAD});
        
        var finalBbox = container.tbox();

        // TODO: set these dimensions more intelligently
        svg.size(finalBbox.width + 10*XGAP, finalBbox.height + 20);

        addHandlers(svg.node, mrsData);
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
            // value is a variable
            var featText = group.plain(name).y(CURRENTY);
            var featVal = group.plain(value).move(FEATNAMEXGAP, CURRENTY).attr({
                class: 'variable',
                'data-var': value,
                title: value
            });
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
        for (var j=0; j < RELVALS.length; j++) {        
            var attr = RELVALS[j];
            if (rel[attr]) {
                drawFeatValPair(parent, attr, rel[attr]);
            }
        }
    }

    function hconsFeatStruct(parent, hcon) {
        drawFeatStructType(parent, hcon.relation);
        drawFeatValPair(parent, 'HARG', hcon.high);
        drawFeatValPair(parent, 'LARG', hcon.low);
    }

    function drawList(parent, itemsData, itemFunc) {
        var lines = [];   // The list may need to be broken up into multiple lines 
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
                var comma = item.plain(',').center(tbox.width, -BRACKETYPAD + tbox.height/2);
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

    function addHandlers(node){
        // Will need to do something different if we wan to highlight things in
        // different visualisations

        // Possibly set up some kind of interface whereby set of class names agreed
        // to be used by every viz for things that might want to be highlighted.
        $(node).find('.variable').hover(
            function (event){
                var dataQuery = "[data-var='" + $(this).data('var') + "']";
                $(node).find(dataQuery).css({fill: 'red'}); 
            }
            ,
            function (event){
                var dataQuery = "[data-var='" + $(this).data('var') + "']";
                $(node).find(dataQuery).css({fill: 'black'}); 
            }
        ).filter(function (){
            // only draw tooltip for variables of type e and x 
            var varname = $(this).data('var');
            var type = mrsData.variables[varname].type;
            return type == 'e' || type == 'x'; 
        }).tooltip({
            track: true,
            tooltipClass: 'mrs-variable-info',
            content: function(){
                var varname = $(this).data('var');
                var variable = mrsData.variables[varname];
                var features = variable.type == 'e' ? EVAR : XVAR;  
                var divs = [];

                for (var i=0; i < features.length; i++) {        
                    var attr = features[i];
                    if (variable[attr]) {
                        divs.push('<div><div class="variable-feat-name">'+attr+'</div><div class="variable-feat-val">'+variable[attr]+'</div></div>');
                    }
                }

                return divs.join('');
            }
        });
    }

    var self = {
        parent: parentElement,
        data: mrsData
    };

    self.element = drawMrs(parentElement);
    addHandlers(self.element);

    return self;
}
