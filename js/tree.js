/* An SVG renderer for DELPH-IN derivation trees. Targets the ERG API that is
 * currently under development and is documented here:
 * http://moin.delph-in.net/ErgApi
 * 
 * This code is adapted from code found in Woodley Packard's full forest treebanker,
 * which can be found here: http://sweaglesw.org/svn/treebank/trunk/
 * 
 * Usage:
 *     drawTree(derivation, element)
 *    
 * Where 'derivation' is a derivation object as found in the ERG API, and
 * 'element' as an element for the resultant SVG element to be appended to the
 * end of its content.
 */


// Horizontal distance between nodes
var DAUGHTER_HSPACE = 20;

// Vertical distance between nodes
var DAUGHTER_VSPACE = 30;


function drawTree(derivation, element) {
    // need to add the SVG to the DOM before rendering, otherwise the height of
    // SVG elements won't be available during rendering.
    var svg = svgelement('svg');
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    svg.setAttributeNS(null, "version", "1.1");    
    element.appendChild(svg);

    var g = render_tree(svg, derivation);
    svg.appendChild(g);

    // Set dimensions on the SVG element from its top level g element
    var bbox = g.getBBox();
    svg.setAttributeNS(null, "height", bbox.height);    
    svg.setAttributeNS(null, "width", bbox.width);    

    return svg;
}


function render_tree(svg, tree) {
	var lexical;
	var	daughters = [];
	var wtot = -DAUGHTER_HSPACE;
	var dtr_label_mean = 0;

	for(var x in tree.daughters) {
		wtot += DAUGHTER_HSPACE;
		daughters[x] = render_tree(svg, tree.daughters[x]);
		dtr_label_mean += wtot + daughters[x].labelcenter;
		wtot += daughters[x].mywidth;
	}

	var g = svgelement("g");

	if(daughters.length) {
        var lexical = false;
		dtr_label_mean /= daughters.length;
	    var g = svgelement("g");
	    var n = text(svg, tree.entity);
        n.setAttributeNS(null, "title", tree.entity);

    } else {
        var lexical = true;
		var g = render_yield(svg, tree.form);
	    var n = text(svg, tree.form);
        n.setAttributeNS(null, "title", tree.form);
	    g.appendChild(n);
	    g.mywidth = n.bbx.width;

        wtot = n.bbx.width;
		dtr_label_mean = wtot / 2;
	}

	var daughters_wtot = wtot;
	var nw = n.bbx.width;
	var nh = n.bbx.height;
	var labelcenter = dtr_label_mean;

	if(labelcenter - nw/2 < 0)
        labelcenter = nw/2;

    if(labelcenter + nw/2 > wtot)
        labelcenter = wtot - nw/2;

    if(nw > wtot) {
        wtot = nw;
        labelcenter = wtot / 2;
    }

	n.setAttributeNS(null, "x", labelcenter - nw / 2);
	n.setAttributeNS(null, "y", nh * 2/3);
	g.appendChild(n);

	var	dtr_x = wtot / 2 - daughters_wtot / 2;
	var ytrans = nh + DAUGHTER_VSPACE;

	if(lexical) {
        var tvalue = "translate(" + dtr_x + "," + ytrans + ")";
        var yline = nh + DAUGHTER_VSPACE - 1;
		g.setAttributeNS(null, "transform", tvalue);
        g.setAttributeNS(null, "class", "leaf");
	} else {
	    for(var i=0; i < daughters.length; i++) {
            var daughter = daughters[i];
            var tvalue = "translate(" + dtr_x + "," + ytrans + ")";
            var yline = nh + DAUGHTER_VSPACE - 1;
		    daughter.setAttributeNS(null, "transform", tvalue);
		    g.appendChild(line(labelcenter, nh, dtr_x + daughter.labelcenter, yline));
		    g.appendChild(daughter);
		    dtr_x += daughter.mywidth + DAUGHTER_HSPACE;
	    }
    }

	g.mywidth = wtot;
	g.labelcenter = labelcenter;
	g.labelheight = nh;
	return g;
}


function render_yield(svg, str) {
	var y = text(svg, str);
	y.setAttributeNS(null, "y", y.bbx.height * 2/3);
	var g = svgelement("g");
	g.appendChild(y);
	g.mywidth = y.bbx.width;
	return g;
}


function svgelement(type) {
	return document.createElementNS("http://www.w3.org/2000/svg", type);
}


function line(x1, y1, x2, y2) {
	var l = svgelement("line");
	l.setAttributeNS(null, "x1", x1);
	l.setAttributeNS(null, "x2", x2);
	l.setAttributeNS(null, "y1", y1);
	l.setAttributeNS(null, "y2", y2);
	l.setAttributeNS(null, "style", "stroke: black;");
	return l;
}


function text(svg, str) {
	var text = svgelement("text");
	text.appendChild(document.createTextNode(str));
	svg.appendChild(text);
	var bbx = text.getBBox();
	svg.removeChild(text);
	text.bbx = bbx;
	return text;
}
