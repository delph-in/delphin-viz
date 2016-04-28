var MRSVALS = ['LTOP', 'INDEX', 'RELS', 'HCONS'];
var RELVALS = ['predicate', 'label', 'ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];


// Magic pixel numbers
var MAXWIDTH = 500;    // width before a line of elements is wrapped 
var xGap = 10;         // horizontal gap between elements
var yGap = 20;         // vertical gap between elements


function drawMrs(mrs, element) {
    var svg = SVG(element);
    var container = svg.group().transform({x:xGap});
    
    // STEP 1: render rels

    // Begin a new line of rels
    var relLine = container.group();
    var relLines = [];
    
    // for positioning rels
    var currX = xGap;
    var currY = yGap;
    
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
                            var value = 
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
        if (currX >= MAXWIDTH) {
            // Starting a new line of rels
            currX = xGap;
            currY += relLine.tbox().height + yGap;
            relLines.push(relLine);
            relLine = container.group();
        } else {
            // move along by last relGroup width
            currX += relGroup.tbox().width + 2*xGap;
        }
            
    }
    relLines.push(relLine);
    
    //vertically align the rels in each line
    for (var i=0; i < relLines.length; i++) {
        relLine = relLines[i];
        var tbox = relLine.tbox();
        var liney = tbox.y + tbox.height/2;
        var rels = relLine.children();

        for (var j=0; j < rels.length; j++) {
            var rel = rels[j];
            var tbox2 = rel.tbox();
            
            // align the rel vertically
            rel.cy(liney);

            // add comma after the
            var comma = rel.plain(',').transform({x:tbox2.width, y:tbox2.height/2});
        }

    }

    // remove trailing comma
    comma.remove();
    
    drawSquareBrackets(container, xGap, 5, 5);
    
    // SET 2: render constraints

    var finalBbox = container.tbox();
    svg.size(finalBbox.width + 2*xGap, finalBbox.height + 2*yGap);
    return svg.node;
}


function drawSquareBrackets(element, xpad, ypad, xwidth) {
    // ypad -- distance bracket extents above/below box
    // xpad -- distance bracket extends left/right of box
    // xwidth -- width of right-angle corner thing 

    // Draw left and right square brackets
    var bbox = element.bbox(); 
    
    // left vertical line; top right angle; bottom right angle
    element.line(bbox.x-xpad, bbox.y-ypad, bbox.x-xpad, bbox.y2+ypad).stroke({width:1});
    element.line(bbox.x-xpad, bbox.y-ypad, bbox.x-xpad+xwidth, bbox.y-ypad).stroke({width:1});
    element.line(bbox.x-xpad, bbox.y2+ypad, bbox.x-xpad+xwidth, bbox.y2+ypad).stroke({width:1});
    
    // left vertical line; top right angle; bottom right angle
    element.line(bbox.x2+xpad, bbox.y-ypad, bbox.x2+xpad, bbox.y2+ypad).stroke({width:1});
    element.line(bbox.x2+xpad-xwidth, bbox.y-ypad, bbox.x2+xpad, bbox.y-ypad).stroke({width:1});
    element.line(bbox.x2+xpad-xwidth, bbox.y2+ypad, bbox.x2+xpad, bbox.y2+ypad).stroke({width:1});
}
