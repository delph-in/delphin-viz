var RELVALS = ['predicate', 'label', 'ARG0', 'ARG1', 'ARG2', 'ARG3', 'RESTR', 'BODY'];

MAXWIDTH = 500;

function drawMrs(mrs, element) {
    var svg = SVG(element);

    // STEP 1: render rels

    var relLine = svg.group();
    
    // for positioning rels
    var currX = 10;
    var currY = 0;
    
    // draw all the rels
    for (var i=0; i < mrs.relations.length; i++) {       
        var rel = mrs.relations[i];
        var relGroup = relLine.group().transform({x:currX, y:currY}); 

        // all the text tows for a rel
        var text = relGroup.text(function (add) {
            for (var j=0; j < RELVALS.length; j++) {        
                var attr = RELVALS[j];
                if (rel[attr]) {
                    add.tspan(function (addMore){
                        if (attr == 'predicate') {
                            var pred = rel[attr] + '⟨' + rel.lnk.from + ':' + rel.lnk.to + '⟩';
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

        var bbox = relGroup.bbox(); 
        //left hand line
        relGroup.line(bbox.x-5, bbox.y-5, bbox.x-5, bbox.y2+5).stroke({width:1});

        //right hand line
        relGroup.line(bbox.x2+5, bbox.y-5, bbox.x2+5, bbox.y2+5).stroke({width:1});


        //update rel positions 
        if (currX >= MAXWIDTH) {
            // Starting a new line of rels
            currX = 10;
            currY += relLine.bbox().height + 20;
            var relLine = svg.group();
        } else {
            currX += bbox.width + 20;
        }
    }

    // SET 2: render constraints

    var finalBbox = svg.bbox();
    svg.size(finalBbox.width+10, finalBbox.height+10);
    return svg.node;
}
