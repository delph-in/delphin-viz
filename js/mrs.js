var RELVALS = ['ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];


// Magic pixel numbers
var MAXWIDTH = 500;     // width before a list of elements is wrapped 
var xGap = 10;          // horizontal gap between elements
var yGap = 5;           // vertical gap between 1-line features 
var yGapStruct = 10;    // vertical gap between full feature structures
var bracketYPad = 5;    // distance bracket extents above/below box
var bracketXWidth = 5;  // width of right-angle corner thing 
var angleHeight = 50;   // Height of angle brackets
var angleWidth = xGap;  // Width of angle brackets
var featNameXGap = 80;


// Global offset for keeping track of where next thing needs to be drawn on the
// Y axis.
var CURRY;

/* 

TODO:
    * why is hcons list off by a couple of pixels
    * variable properties
    * make all globals uppercase

*/


function drawMrs(mrsData, element) {
    var svg = SVG(element);
    var mrs = svg.group();
    var container = mrs.group();

    CURRY = 0;
    drawFeatStructType(container, 'mrs');
    drawFeatValPair(container, 'LTOP', mrsData.top);
    drawFeatValPair(container, 'INDEX', mrsData.index);    
    drawFeatValPair(container, 'RELS', mrsData.relations); 
    drawFeatValPair(container, 'HCONS', mrsData.constraints); 
    drawSquareBrackets(mrs, xGap);
    
    // Left bracket is currently outside the viewport of the SVG canvas
    // possibly also the top bit of brackets. possibly can remove the y transform
    mrs.transform({x:xGap, y:bracketYPad});
    
    var finalBbox = container.tbox();

    // TODO: set these dimensions more intelligently
    svg.size(finalBbox.width + 10*xGap, finalBbox.height + 20);

    return svg.node;
}


function drawFeatStructType(parent, name) {
    var text = parent.plain(name).y(CURRY).attr({'font-style':'italic'});    
    CURRY += text.tbox().height;
    return text;
}


function drawFeatValPair(parent, name, value) {
    var group = parent.group();

    if (typeof value === 'string' || value instanceof String) {
        // value is a variable
        var featText = group.plain(name).y(CURRY);
        var featVal = group.plain(value).move(featNameXGap, CURRY).attr({class:'variable'});
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
            group.transform({y:diff + yGapStruct});
    }

    CURRY += group.tbox().height;
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
    var startX = featNameXGap + bracketXWidth;
    var currX = startX;
    var currY = 0;
    
    var list = parent.group();     
    var leftAngle = list.polyline();
    var line = list.group();

    // draw all the items. note that x and y coordinates for item drawing are
    // relative to the parent group containing the whole list
    for (var i=0; i < itemsData.length; i++) {       
        CURRY = 0;  // new item should start at the local current Y
        var itemGroup = line.group();
        itemFunc(itemGroup, itemsData[i]);
        drawSquareBrackets(itemGroup, 5);
        itemGroup.transform({x:currX, y:currY}); 

        // update item offsets
        if (i == itemsData.length - 1) {
            // we're done with items
            break;
        } else if (currX >= MAXWIDTH) {
            // Starting a new line of rels
            currX = startX;
            currY += line.tbox().height + yGapStruct;
            lines.push(line);
            line = list.group();
        } else {
            // move along by last itemGroup width
            currX += itemGroup.tbox().width + 2*xGap;
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
            // need to account for negative y values using bracketYPad
            var item = items[j];          
            item.cy(thisLine.cy + bracketYPad);
            var tbox = item.tbox();
            var comma = item.plain(',').center(tbox.width, -bracketYPad + tbox.height/2);
        }
    }

    // remove trailing comma
    comma.remove();

    var firstLine = lines[0];

    //update left angle dimensions, now we know where the midpoint is
    var firstRelTbox = firstLine.children()[0].tbox();
    leftAngle.plot([
        [firstRelTbox.x - bracketXWidth, firstLine.cy + angleHeight/2],
        [firstRelTbox.x - bracketXWidth - angleWidth, firstLine.cy],
        [firstRelTbox.x - bracketXWidth, firstLine.cy - angleHeight/2]]).fill('none').stroke('black');

    //Add right angle bracket
    var lastLine = lines[lines.length - 1];
    var lastLineTbox = lastLine.tbox();
    var rightAngle = line.polyline([
        [lastLineTbox.x2 + bracketXWidth, lastLine.cy + angleHeight/2],
        [lastLineTbox.x2 + bracketXWidth + angleWidth, lastLine.cy],
        [lastLineTbox.x2 + bracketXWidth, lastLine.cy - angleHeight/2]]).fill('none').stroke('black');

    return list;
}


function drawSquareBrackets(element, xpad) {
    // xpad -- distance bracket extends left/right of box

    // Draw left and right square brackets
    var tbox = element.tbox(); 
    
    // left vertical line; top right angle; bottom right angle
    element.line(tbox.x-xpad, tbox.y-bracketYPad, tbox.x-xpad, tbox.y2+bracketYPad).stroke({width:1});
    element.line(tbox.x-xpad, tbox.y-bracketYPad, tbox.x-xpad+bracketXWidth, tbox.y-bracketYPad).stroke({width:1});
    element.line(tbox.x-xpad, tbox.y2+bracketYPad, tbox.x-xpad+bracketXWidth, tbox.y2+bracketYPad).stroke({width:1});
    
    // left vertical line; top right angle; bottom right angle
    element.line(tbox.x2+xpad, tbox.y-bracketYPad, tbox.x2+xpad, tbox.y2+bracketYPad).stroke({width:1});
    element.line(tbox.x2+xpad-bracketXWidth, tbox.y-bracketYPad, tbox.x2+xpad, tbox.y-bracketYPad).stroke({width:1});
    element.line(tbox.x2+xpad-bracketXWidth, tbox.y2+bracketYPad, tbox.x2+xpad, tbox.y2+bracketYPad).stroke({width:1});
}
