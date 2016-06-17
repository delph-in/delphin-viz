
function DMRS(parentElement, dmrs) {
    var dmrsData = JSON.parse(JSON.stringify(dmrs));  // make a copy
    var maxWidth = 600,
        height = 300;

    var level_dy = 25,  // vertical separation between edges
        edge_radius = 15, // rounded corner radius,
        edge_xoffset = 10, // outgoing edges aren't centered
        node_dx = 20;  // horizontal separation between nodes

    var color = d3.scale.category20();

    function prepareGraph() {
        var nodeIdx = {}, levelIdx = {};
        dmrs.nodes.forEach(function(d, i) {
            nodeIdx[d.nodeid] = i;
            levelIdx[[i,i+1].join()] = {}; // eg levelIdx["1,2"] = {}
        });
        dmrs.links.forEach(function(d) {
            d.target = nodeIdx[d.to];
            // start of 0 is TOP link
            if (d.from == 0) {
                d.dir = 1;  // always on top
                return;
            }
            // the rest only apply to non-TOP links
            d.source = nodeIdx[d.from];
            d.distance = Math.abs(d.source - d.target);
            // Quantifiers and undirected EQ links below preds
            d.dir = (d.rargname == "" || d.post.toUpperCase() == "H") ? -1 : 1
        });
        dmrs.maxTopLevel = 0;
        dmrs.maxBottomLevel = 0;
        for (dist=0; dist<dmrs.nodes.length; dist++) {
            dmrs.links.forEach(function(d) {
                if (d.from == 0) return;
                if (dist != d.distance) return;
                d.level = nextAvailableLevel(d.source, d.target, d.dir, levelIdx);
                if (d.dir == 1 && dmrs.maxTopLevel < d.level) {
                    dmrs.maxTopLevel = d.level;
                } else if (d.dir == -1 && dmrs.maxBottomLevel > d.level) {
                    dmrs.maxBottomLevel = d.level;
                }
            });
        }
        dmrs.sticky = false;
    }

    function nextAvailableLevel(source, target, dir, lvlIdx) {
        var level, curLevel, success;
        if (source > target)
            return nextAvailableLevel(target, source, dir, lvlIdx);
        level = 0;
        curLevel = dir;
        while (level == 0) {
            success = true;
            for (var i = source; i < target; i++) {
                if (curLevel in lvlIdx[[i, i+1].join()]) {
                    success = false;
                    break;
                }
            }
            if (success) {
                level = curLevel;
                for (var i = source; i < target; i++) {
                    lvlIdx[[i, i+1].join()][level] = true;
                }
            } else {
                curLevel += dir;
            }
        }
        return level;
    }

    function getPathSpec(link, dmrs) {
        var x1, x2, y1, y2;
        // get these first, they apply for all links
        x2 = dmrs.nodes[link.target].x;
        y1 = dmrs.nodes[link.target].bbox.height;
        if (link.from == 0) {
            y2 = y1 + (((link.dir == 1 ? dmrs.maxTopLevel : dmrs.maxBottomLevel) + 1) * level_dy);
            link.midpoint = {"x": x2,
                             "y": (y1 + y2) / 2};
            return ["M", x2, y2, "L", x2, y1].join(' ');
        }
        // the following is only for non-TOP links
        x1 = dmrs.nodes[link.source].x;
        y2 = y1 + (Math.abs(link.level) * level_dy - 5);
        // side-effect! calculate this while we know it
        link.midpoint = {"x": (x1 + x2) / 2,
                         "y": y2};
        if (x1 < x2) {
            x1 += edge_xoffset;
            return ["M", x1, y1 - 5,
                    "L", x1, (y2 - edge_radius),
                    "Q", x1, y2, (x1 + edge_radius), y2,
                    "L", (x2 - edge_radius), y2,
                    "Q", x2, y2, x2, y2 - edge_radius,
                    "L", x2, y1].join(' ');
        } else {
            x1 -= edge_xoffset;
            return ["M", x1, y1 - 5,
                    "L", x1, (y2 - edge_radius),
                    "Q", x1, y2, (x1 - edge_radius), y2,
                    "L", (x2 + edge_radius), y2,
                    "Q", x2, y2, x2, y2 - edge_radius,
                    "L", x2, y1].join(' ');
        }
    }

    function updateHighlights(id) {
        clearHighlights(id);
        d3.select(id).selectAll(".node.selected").each(function(d){
            var labelset = d3.set(),
                outs = d3.set(),
                ins = d3.set(),
                scopes = d3.set();
            d3.select(id).selectAll(".link")
                .classed({
                    "out": function(_d) {
                        if (_d.rargname && d.nodeid == _d.from) {
                            outs.add(_d.to);
                            return true;
                        }
                        return false;
                    },
                    "in": function(_d) {
                        if (_d.rargname && d.nodeid == _d.to) {
                            ins.add(_d.from);
                            return true;
                        }
                        return false;
                    },
                    "labelset": function(_d) {
                        if (_d.post == "EQ" && (_d.from == d.nodeid || _d.to == d.nodeid)) {
                            labelset.add(_d.from);
                            labelset.add(_d.to);
                            return true;
                        }
                        return false
                    },
                    "scope": function(_d) {
                        if (_d.from == d.nodeid && (_d.post == "H" || _d.post == "HEQ")) {
                            scopes.add(_d.to);
                            return true;
                        } else if (_d.to == d.nodeid && (_d.post == "H" || _d.post == "HEQ")) {
                            return true;
                        }
                        return false;
                    }
                });
            var labelAdded = true;
            while (labelAdded) {
                labelAdded = false;
                d3.select(id).selectAll(".link").each(function(_d) {
                    if (_d.post == "EQ") {
                        if (labelset.has(_d.from) && !labelset.has(_d.to)) {
                            labelset.add(_d.to);
                            labelAdded = true;
                        } else if (labelset.has(_d.to) && !labelset.has(_d.from)) {
                            labelset.add(_d.from);
                            labelAdded = true;
                        }
                    }
                });
            }
            d3.select(id).selectAll(".node")
                .classed({
                    "out": function(_d) { return outs.has(_d.nodeid); },
                    "in": function(_d) { return ins.has(_d.nodeid); },
                    "labelset": function(_d) { return labelset.has(_d.nodeid); },
                    "scope": function(_d) { return scopes.has(_d.nodeid); }
                });

        });
    }

    function clearHighlights(id) {
        d3.select(id).selectAll(".node").classed(
            {"in": false, "out": false, "labelset": false, "scope": false}
        );
        d3.select(id).selectAll(".link").classed(
            {"in": false, "out": false, "labelset": false, "scope": false}
        );
    }

    function toggleSticky(id, node, d) {
        if (d.sticky) {
            d.sticky = false;
            d3.select(node).classed("selected", false);
        } else {
            d3.select(id).selectAll(".node.selected").each(function(_d) {
                _d.sticky = false;
                d3.select(this).classed("selected", false);
            });
            d.sticky = true;
            d3.select(node).classed("selected", true);
        }
        return d.sticky;
    }


    function drawDmrs() {
    //  d3.json(url, function(error, dmrs) {
          // calculate source and target for links
          prepareGraph();

          var tip = d3.select("#tooltip")
              .style("opacity", 0);

          var id = parentElement;
          var svg = d3.select(parentElement)
            .classed("dmrs", true)
            .append('svg')
            .attr("height", ((dmrs.maxTopLevel - dmrs.maxBottomLevel + 3) * level_dy));
          var g = svg.append("svg:g")
              .attr("transform", "translate(0," + ((dmrs.maxTopLevel + 2) * level_dy) + ")");

          g.append("defs").append("marker")
              .attr("class", "linkend")
              .attr("id", "arrowhead")
              .attr("refX", 1) /*must be smarter way to calculate shift*/
              .attr("refY", 2)
              .attr("markerWidth", 5)
              .attr("markerHeight", 4)
              .attr("orient", "auto")
              .append("path")
                  .attr("d", "M0,0 L1,2 L0,4 L5,2 Z"); //this is actual shape for arrowhead

          var x_pos = 10;
          var nodes = g.selectAll(".node").order()
              .data(dmrs.nodes)
            .enter().append("svg:g")
              .attr("class", "node")
              .each(function(d) {
                var vps = [];
                for (var key in d.sortinfo) {
                  vps.push("<td>" + key + "</td><td>=</td><td>" + d.sortinfo[key] + "</td>");
                }
                d.tooltipText = "<table><tr>" + vps.join("</tr><tr>") + "</tr></table>";
              });
          nodes.append("svg:text")
              .attr("class", "nodeText")
              .text(function(d) {
                if (d.carg) {
                  return d.predicate + "(" + d.carg + ")";
                } else {
                  return d.predicate;
                }
              })
              .attr("x", function(d, i) {
                  d.bbox = this.getBBox();
                  halfLen = d.bbox.width / 2;
                  x = x_pos + halfLen;
                  x_pos = x + halfLen + node_dx;
                  d.x = x;
                  return x;
              })
              .attr("y", function(d) { return 0; })
              .attr("dy", function(d) { return d.bbox.height/5; });
          nodes.insert("svg:rect", "text")
              .attr("class", "nodeBox")
              .attr("x", function(d) { return d.x - (d.bbox.width / 2) - 2; })
              .attr("y", function(d) { return - (d.bbox.height / 2) - 2; })
              .attr("width", function(d) { return d.bbox.width + 4; })
              .attr("height", function(d) { return d.bbox.height + 4; })
              .attr("rx", 4)
              .attr("ry", 4);
          nodes.on("mouseover", function(d) {
                  if (!dmrs.sticky) { d3.select(this).classed("selected", true) };
                  updateHighlights(id);
                  tip.html(d.tooltipText)
                    .style("opacity", 0.8);
              })
              .on("mousemove", function(d) {
                  tip.style("left", (d3.event.pageX - 10) + "px")
                    .style("top", (d3.event.pageY + 15) + "px");
              })
              .on("mouseout", function(d) {
                  if (!d.sticky) { d3.select(this).classed("selected", false); }
                  updateHighlights(id);
                  tip.style("opacity", 0);
              })
              .on("click", function(d) {
                  stickyState = toggleSticky(id, this, d);
                  dmrs.sticky = stickyState;
                  updateHighlights(id);
              });

          // not working...
          svg.attr("width", d3.sum(nodes.data(), function(d) { return d.bbox.width + node_dx; }));

          var links = g.selectAll(".link").order()
              .data(dmrs.links)
            .enter().append("svg:g")
              .attr("class", function(d) {
                  var classes = "link";
                  if (d.from == 0) {
                      classes += " top";
                  } else if (d.rargname == "" && d.post == "EQ") {
                      classes += " eq";
                  } else if (d.post == "H") {
                      classes += " scopal";
                  } else {
                      classes += " var";
                  }
                  return classes;
              });   
          links.append("svg:path")
              .attr("d", function(d) {
                  return getPathSpec(d, dmrs);
              })
              .attr("transform", function(d) {
                  return "scale(1," + (d.dir * -1) + ")";
              })
              .style("marker-end", function(d) {
                  return (d.rargname == "" && d.post == "EQ") ? "none" : "url(#arrowhead)";
              });
          links.append("svg:text")
              .attr("class", "rargname")
              .attr("x", function(d) { return d.midpoint.x; })
              .attr("y", function(d) { return d.midpoint.y * (-1 * d.dir) - 3; })
              .text(function(d) { return d.rargname + "/" + d.post; } );
    //  });
        return svg[0][0];
    }

    var self = {
        parent: parentElement,
        data: dmrsData,
        element: drawDmrs()
    };


    return self;
}
