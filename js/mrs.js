var MRSVALS = ['LTOP', 'INDEX', 'RELS', 'HCONS'];
var RELVALS = ['predicate', 'label', 'ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];


// Magic pixel numbers
var MAXWIDTH = 500;    // width before a line of elements is wrapped 
var xGap = 10;         // horizontal gap between elements
var yGap = 20;         // vertical gap between elements
var angleHeight = 50;
var angleWidth = xGap;


//function drawFeatureStructure(name, )


function drawMrs(mrs, element) {
    var svg = SVG(element);
    var container = svg.group();
    
    // STEP 1: render rels

    // Begin a new line of rels
    var relLines = [];
    var relList = container.group();
    
    // for positioning rels
    var startX = 100;

    var currX = startX;
    var currY = yGap;
    
    //Add left angle bracket
    var leftAngle = relList.polyline();

    var relLine = relList.group();


    // draw all the rels
    for (var i=0; i < mrs.relations.length; i++) {       
        var rel = mrs.relations[i];
        var relGroup = relLine.group();
        
        // all the text rows for a rel
        var text = relGroup.text(function (add) {
            for (var j=0; j < RELVALS.length; j++) {        
                var attr = RELVALS[j];
                if (rel[attr]) {
                    add.tspan(function (addMore){
                        if (attr == 'predicate') {
                            var pred = rel[attr] +'⟨'+rel.lnk.from+':'+rel.lnk.to+'⟩';
                            addMore.tspan(pred).attr({'font-style': 'italic'});
                        } else {
                            if (attr == 'label') 
                                addMore.tspan('LBL');
                            else
                                addMore.tspan(attr);
                            addMore.tspan(rel[attr]).attr({x: 70, class:'variable'});
                        }
                    }).newLine();
                }
            }
        }).leading();

        drawSquareBrackets(relGroup, 5, 5, 5);
        relGroup.transform({x:currX, y:currY}); 


        // update rel positions 
        if ( i == mrs.relations.length -1) {
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
            var comma = rel.plain(',').transform({x:tbox2.width, y:tbox2.height/2});
        }
    }
    // remove trailing comma
    comma.remove();

    //update left angle dimensions, now we know where the midpoint is
    var firstLine = relLines[0];
    var firstRelTbox = firstLine.children()[0].tbox();
    leftAngle.plot([[firstRelTbox.x - 5, firstLine.cy + angleHeight/2],
                    [firstRelTbox.x - 5 - angleWidth, firstLine.cy],
                    [firstRelTbox.x - 5, firstLine.cy - angleHeight/2]]).fill('none').stroke('black');

    //Add right angle bracket
    var lastLine = relLines[relLines.length - 1];
    var lastLineTbox = lastLine.tbox();
    var rightAngle = relList.polyline([[lastLineTbox.x2 + 5, lastLine.cy + angleHeight/2],
                                       [lastLineTbox.x2 + 5 + angleWidth, lastLine.cy],
                                       [lastLineTbox.x2 + 5, lastLine.cy - angleHeight/2]]).fill('none').stroke('black');
    drawSquareBrackets(container, xGap, 5, 5);
    
    // SET 2: render constraints

    var finalBbox = container.tbox();
    svg.size(finalBbox.width + 10*xGap, finalBbox.height + 2*yGap);

    return svg.node;
}


function drawSquareBrackets(element, xpad, ypad, xwidth) {
    // ypad -- distance bracket extents above/below box
    // xpad -- distance bracket extends left/right of box
    // xwidth -- width of right-angle corner thing 

    // Draw left and right square brackets
    var tbox = element.tbox(); 
    
    // left vertical line; top right angle; bottom right angle
    element.line(tbox.x-xpad, tbox.y-ypad, tbox.x-xpad, tbox.y2+ypad).stroke({width:1});
    element.line(tbox.x-xpad, tbox.y-ypad, tbox.x-xpad+xwidth, tbox.y-ypad).stroke({width:1});
    element.line(tbox.x-xpad, tbox.y2+ypad, tbox.x-xpad+xwidth, tbox.y2+ypad).stroke({width:1});
    
    // left vertical line; top right angle; bottom right angle
    element.line(tbox.x2+xpad, tbox.y-ypad, tbox.x2+xpad, tbox.y2+ypad).stroke({width:1});
    element.line(tbox.x2+xpad-xwidth, tbox.y-ypad, tbox.x2+xpad, tbox.y-ypad).stroke({width:1});
    element.line(tbox.x2+xpad-xwidth, tbox.y2+ypad, tbox.x2+xpad, tbox.y2+ypad).stroke({width:1});
}
