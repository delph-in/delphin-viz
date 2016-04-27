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
    
    // for positioning rels
    var currX = xGap;
    var currY = yGap;
    
    // draw all the rels
    for (var i=0; i < mrs.relations.length; i++) {       
        var rel = mrs.relations[i];
        var relGroup = relLine.group().transform({x:currX, y:currY}); 

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

        var bbox = relGroup.bbox();         
        //relGroup.transform({y:currY + bbox.height});

        // update rel positions 
        if (currX >= MAXWIDTH) {
            // Starting a new line of rels
            currX = xGap;
            currY += relLine.bbox().height + yGap;
            var relLine = container.group();
        } else {
            // move along by last relGroup width
            currX += bbox.width + yGap;
        }
    }

    drawSquareBrackets(container, xGap, 5, 5);
    
    // SET 2: render constraints

    var finalBbox = container.bbox();
    svg.size(finalBbox.width + xGap, finalBbox.height + yGap);
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
