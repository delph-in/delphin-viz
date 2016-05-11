# delphin-viz

A library of JavaScript micro-tools for in-browser rendering of DELPH-IN data
structure visualizations. Targets the developmental
[ERG API](http://moin.delph-in.net/ErgApi). Currently contains visualizations
for derivation trees and vanilla MRS.

## Visualizations

All visualisations currently target SVG. 

### tree.js

Renders DELPH-IN derivation trees. Currently only contains long node
labels. Awaiting the inclusion of short node labels in the API.

Dependencies: None

### mrs.js

Renders vanilla MRS.

Dependencies: 
* [svg.js]
* [jQuery]
* [jQuery UI]


## Demo

delphin-viz also includes a demo interface which is modelled on the LOGON
demo. A live version can be found [here][demo].


Dependencies (not including tree.js and mrs.js dependencies):
* [jQuery]


[svg.js]: http://svgjs.com/
[jQuery]: https://jquery.com/
[jQuery UI]: https://jqueryui.com/
[demo]: http://ned2.github.io/delphin-viz/demo/
