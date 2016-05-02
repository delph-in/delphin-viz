var MRSVALS = ['LTOP', 'INDEX', 'RELS', 'HCONS'];
var RELVALS = ['ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];
var HCONSVALS = ['HARG', 'LARG'];


// Magic pixel numbers
var MAXWIDTH = 500;     // width before a list of elements is wrapped 
var xGap = 10;          // horizontal gap between elements
var yGap = 5;          // vertical gap between elements
var bracketYPad = 5;    // distance bracket extents above/below box
var bracketXWidth = 5;  // width of right-angle corner thing 
var angleHeight = 50;   // Height of angle brackets
var angleWidth = xGap;  // Width of angle brackets
var featNameXGap = 80;



// maybe refactor to use some kind of function factory that
// produces feature structure objects with localised CURRYs?
// or do I really not need to worry about this?



var CURRY;

function drawMrs(mrsData, element) {
    var svg = SVG(element);
    var mrs = svg.group();
    var container = mrs.group();
    var thisFeatVal;
    CURRY = bracketYPad;
    // TODO: parameterise the way the yoffset is threaded through
    // then apply this mode of layout to the individual feature structures
    

    drawFeatStructType(container, 'mrs');
    drawFeatValPair(container, 'LTOP', mrsData.top);
    drawFeatValPair(container, 'INDEX', mrsData.index);    
    drawFeatValPair(container, 'RELS', mrsData.relations); 

    //TODO need to update CURRY to the appropriate result after a list
    // actually, possibly all it needs done is an extra yGap

    // nope; discrepency is because I transform by the height of the line
    // for intermediate list lines. need to resolve how I do this. choose one!

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
    CURRY += text.tbox().height + yGap;
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
        var lines = drawList(group, value, itemFunc);
        featText.cy(lines[0].cy);
    }
    CURRY += group.tbox().height + yGap;
    return group;
}


function relFeatStruct(parent, rel) {
    var pred = rel['predicate'] +'⟨'+rel.lnk.from+':'+rel.lnk.to+'⟩';
    drawFeatStructType(parent, pred);
    drawFeatValPair(parent, 'LBL', rel['label']);
    for (var j=0; j < RELVALS.length; j++) {        
        var attr = RELVALS[j];
        if (rel[attr]) {
            console.log(CURRY);
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
    var list = parent.group();
    
    // for positioning rels
    var startX = featNameXGap + bracketXWidth;
    var startY = CURRY + 20;  // magic offset

    var currX = startX;
    var currY = startY;
    
    // currY is a but fuzzy; should be caluclated
    // using largest value of rels from the first list
    // perhaps I could change the way the center y is determined later on
    
    
    //Add left angle bracket
    var leftAngle = list.polyline();

    var line = list.group();

    // TODO some variable names to change in here

    // TODO pass an anonymous function to apply to each element of list
    // rather than combine logic for all different elements in the one place

    // draw all the rels
    for (var i=0; i < itemsData.length; i++) {       
        CURRY = 0;  // new rell should start at the local current Y
        var rel = itemsData[i];
        var relGroup = line.group();
        itemFunc(relGroup, rel);
        drawSquareBrackets(relGroup, 5);
        relGroup.transform({x:currX, y:currY}); 

        // update rel positions 
        if (i == itemsData.length - 1) {
            // we're done with rels
            break;
        } else if (currX >= MAXWIDTH) {
            // Starting a new line of rels
            currX = startX;
            currY += line.tbox().height + yGap;
            lines.push(line);
            line = list.group();
        } else {
            // move along by last relGroup width
            currX += relGroup.tbox().width + 2*xGap;
        }
            
    }
    lines.push(line);
    
    //vertically align the rels in each line
    for (var i=0; i < lines.length; i++) {
        var thisLine = lines[i];
        thisLine.cy = thisLine.tbox().cy;
        
        var rels = thisLine.children();

        for (var j=0; j < rels.length; j++) {
            var rel = rels[j];
            
            // align the rel vertically
            rel.cy(thisLine.cy);
            // add comma after the
            var tbox2 = rel.tbox();
            var comma = rel.plain(',').center(tbox2.width, tbox2.height/2);
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

    CURRY += yGap;
    return lines;
}


function drawFeatureStructure(name, svgObject, xpad){
    //Adds the feature structure name to top
    var label = svgObject.plain(name).move(0,bracketYPad).attr({'font-style':'italic'});


    // Shift contents down to make space for label 
    //debugger
    //svgObject.first().transform({y:label.tbox().height + bracketYPad});

    // Draw brackets around it
    drawSquareBrackets(svgObject, xpad);
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
