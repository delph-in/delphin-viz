var MRSVALS = ['LTOP', 'INDEX', 'RELS', 'HCONS'];
var RELVALS = ['label', 'ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];
var HCONSVALS = ['HARG', 'LARG'];


// Magic pixel numbers
var MAXWIDTH = 500;     // width before a list of elements is wrapped 
var xGap = 10;          // horizontal gap between elements
var yGap = 20;          // vertical gap between elements
var bracketYPad = 5;    // distance bracket extents above/below box
var bracketXWidth = 5;  // width of right-angle corner thing 
var angleHeight = 50;   // Height of angle brackets
var angleWidth = xGap;  // Width of angle brackets

/* Functions to create for better abstraction: 

function drawFeatureStructure(name, SVGobject)
-- takes an SVG object and draws brackets around it and applies name of FT


function drawList(name, items, parent, itemFunc)
-- takes a list of feature structures eg relations or hcons
-- draws the key,value pair attaching to parent by
-- using itemFunc to call drawFeatureStructure appropriately for each item

// need to use a closure to wrap up SVGobject?
function drawHon(hcon) {
 drawFeatureStructure(name, SVGobject)
}


drawFeatureValue(name, value)

Should handle:
value being type -- string (unexpanded variable or atomic val)
                 -- list of elements
                 -- variable that should be expanded to full feature structure
*/


function drawFeatureValue(name, value, parent) {
    var text = parent.plain(name);

}

function drawMrs(mrsData, element) {
    var svg = SVG(element);
    var mrs = svg.group();
    var container = mrs.group();
    
    // TODO: parameterise the way the yoffset is threaded through
    // then apply this mode of layout to the individual feature structures
    
    // also, the first offset is just guessing the size of the label?
    // I think this means that the label creation should be pushed
    // back to being done inline, ie move out of drawfeaturesturctute
    var label = container.plain('mrs').move(0, bracketYPad).attr({'font-style':'italic'});    
    var ltopText = container.plain('LTOP').move(0, bracketYPad + 30);
    var indexText = container.plain('INDEX').move(0, bracketYPad + 50);
    var relsText = container.plain('RELS');

    // Start rendering rels
    var relLines = [];

    var relList = container.group();
    
    // for positioning rels
    var startX = 100;

    var currX = startX;
    var currY = 70;

    // currY is a but fuzzy; should be caluclated
    // using largest value of rels from the first list
    // perhaps I could change the way the center y is determined later on
    // 
    
    
    //Add left angle bracket
    var leftAngle = relList.polyline();

    var relLine = relList.group();

    // draw all the rels
    for (var i=0; i < mrsData.relations.length; i++) {       
        var rel = mrsData.relations[i];
        var relGroup = relLine.group();
        
        // all the text rows for a rel
        var pred = rel['predicate'] +'⟨'+rel.lnk.from+':'+rel.lnk.to+'⟩';
        var predText = relGroup.plain(pred).y(bracketYPad);
        var relY = 25;
        for (var j=0; j < RELVALS.length; j++) {        
            var attr = RELVALS[j];
            if (rel[attr]) {
                if (attr == 'label') 
                    var featName = 'LBL';
                else
                    var featName = attr;

                var text = relGroup.plain(featName).y(relY);
                var val = relGroup.plain(rel[attr]).move(70, relY).attr({class:'variable'});
            relY += 20;
            }
        }


        drawSquareBrackets(relGroup, 5);
        relGroup.transform({x:currX, y:currY}); 


        // update rel positions 
        if ( i == mrsData.relations.length -1) {
            // we're done with rels
            break;
        } else if (currX >= MAXWIDTH) {
            // Starting a new line of rels
            currX = startX;
            currY += relLine.tbox().height + yGap;
            relLines.push(relLine);
            relLine = relList.group();
        } else {
            // move along by last relGroup width
            currX += relGroup.tbox().width + 2*xGap;
        }
            
    }
    relLines.push(relLine);
    
    //vertically align the rels in each line
    for (var i=0; i < relLines.length; i++) {
        var thisLine = relLines[i];
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

    var firstLine = relLines[0];

    // Vertically align feature name with list
    relsText.cy(firstLine.cy);

    //update left angle dimensions, now we know where the midpoint is
    var firstRelTbox = firstLine.children()[0].tbox();
    leftAngle.plot([
        [firstRelTbox.x - bracketXWidth, firstLine.cy + angleHeight/2],
        [firstRelTbox.x - bracketXWidth - angleWidth, firstLine.cy],
        [firstRelTbox.x - bracketXWidth, firstLine.cy - angleHeight/2]]).fill('none').stroke('black');

    //Add right angle bracket
    var lastLine = relLines[relLines.length - 1];
    var lastLineTbox = lastLine.tbox();
    var rightAngle = relList.polyline([
        [lastLineTbox.x2 + bracketXWidth, lastLine.cy + angleHeight/2],
        [lastLineTbox.x2 + bracketXWidth + angleWidth, lastLine.cy],
        [lastLineTbox.x2 + bracketXWidth, lastLine.cy - angleHeight/2]]).fill('none').stroke('black');

    drawSquareBrackets(mrs, xGap);
    
    // Left bracket is currently outside the viewport of the SVG canvas
    mrs.transform({x:xGap, y:bracketYPad});
    
    var finalBbox = container.tbox();
    // TODO: set these dimensions more intelligently
    svg.size(finalBbox.width + 10*xGap, finalBbox.height + 2*yGap);

    return svg.node;
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
