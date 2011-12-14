/* marker images */
var selectedMarker = new google.maps.MarkerImage('img/selected.png',
                                                 new google.maps.Size(49, 40),
                                                 new google.maps.Point(0, 0),
                                                 new google.maps.Point(20, 20));
var notSelectedMarker = new google.maps.MarkerImage('img/notselected.png',
                                                    new google.maps.Size(40, 40),
                                                    new google.maps.Point(0, 0),
                                                    new google.maps.Point(20, 20));
var markerShape =  { coords: [20, 20, 20],
                     type: 'circle' };

/* colors */
var strokeColor = "#8eb765";
var selectedStrokeColor = "#c96653";

/* z-values */
var edgeZIndex = 0;
var nodeZIndex = 1;
var selectedEdgeZIndex = 2;
var selectedNodeZIndex = 3;

/* edge adjustment */
var maxEdge = 20.0;
var maxWeight = 20;
var edgeRatio = maxEdge / maxWeight;

/* geocoder object */ 
var geocoder = new google.maps.Geocoder();

function Graphmap() {
    /* store objects */
    this.nodes = new Object();

    this.clear = function() {
        var sup = this;

        for(node in sup.nodes) {
            sup.nodes[node].clear();
            delete sup.nodes[node];
        }
    }

    /* add a edge between two nodes */
    this.add = function(from, to, weight, callback) {
        var sup = this;

        /* put actions as functions */
        drawEdge = function() { 
            if(sup.nodes[from] && sup.nodes[to]) {
                new Edge(sup.nodes[from], sup.nodes[to], weight) 
            }
            if (callback != undefined)
                callback();
        };
        getToNode = function() { sup.getNode(to, drawEdge) };
        getFromNode = function() { sup.getNode(from, getToNode) };

        /* call the chain */
        getFromNode();
    }

    this.addAll = function(data) {
        var sup = this;

        var func = function() {
            if(data.length != 0) {
                var elem = data.pop();
                sup.add(elem.from, elem.to, elem.size, func);
            }
        }
        if(data.length != 0) {
            var elem = data.pop();
            sup.add(elem.from, elem.to, elem.size, func);
        }
    }

    this.setMaxWeight = function(max) {
        var sup = this;

        sup.maxWeight = max;
        sup.edgeRatio = sup.maxEdge / sup.maxWeight;
    }

    /* read a JSON file and draw nodes */
    this.readJSON = function(json) {
        var sup = this;

        /* clear screen */
        sup.clear();

        /* update max */
        sup.setMaxEdge(json.highest);

        /* call the recursive function */
        sup.addAll(json.data);
    }

    /* create a node by its name */
    this.getNode = function(name, callback) {
        var sup = this;

        /* check if node is defined */
        if(this.nodes[name] != undefined)
            callback();
        else {
            geocoder.geocode({'address': name},
                             function(results, status) {
                                 if (status == google.maps.GeocoderStatus.OK) {
                                     /* create node */
                                     sup.nodes[name] = new Node(name, results[0].geometry.location);

                                     callback();
                                 }
                                 else {
                                     console.log(name + " - request result: " + status);
                                     callback();
                                }
                             });
        }
    }

}

/* node class */
function Node(name, coord) {
    this.name = name;
    this.coord = coord;
    this.edges = new Array();

    this.markerOptions = { map: map,
                           flat: true,
                           position: coord,
                           zIndex: nodeZIndex,
                           icon: notSelectedMarker,
                           shape: markerShape
                         };

    this.marker = new google.maps.Marker(this.markerOptions);
    
    google.maps.event.addListener(this.marker,"mouseover",function(){ tooltip.show(name) });
    google.maps.event.addListener(this.marker,"mouseout",function(){ tooltip.hide() });

    this.selected = false;

    /* lat & lng */
    this.lat = function() {
        return this.coord.lat();
    }

    this.lng = function() {
        return this.coord.lng();
    }

    this.latLng = function() {
        return this.coord;
    }

    /* add edges */
    this.addEdge = function(_edge) {
        this.edges.push(_edge);
    }

    /* node status control */
    this.setSelected = function() {
        this.selected = true;
        this.mark();

        /* select all edgesOut */
        for(var i = 0; i < this.edges.length; i++)
            this.edges[i].setSelected();
        
    }

    this.setNotSelected = function() {
        this.selected = false;
        this.unmark();

        /* deselect all edges */
        for(var i = 0; i < this.edges.length; i++)
            this.edges[i].setNotSelected();
        
        this.options.zIndex = nodeZIndex;
    }

    this.mark = function() {
        this.markerOptions.icon = selectedMarker;
        this.markerOptions.zIndex = selectedNodeZIndex;
        this.marker.setOptions(this.markerOptions);
    }

    this.unmark = function() {
        this.markerOptions.icon = notSelectedMarker;
        this.markerOptions.zIndex = nodeZIndex;
        this.marker.setOptions(this.markerOptions);
    }

    /* interface to clear  */
    this.clear = function() {
        this.marker.setMap(null);

        for(var i = 0; i < this.edges.length; i++) {
            this.edges[i].clear();
            delete this.edges[i];
        }
    }

    /* treat events */
    this.selectSwitch = function() {
        if(this.selected)
            this.setNotSelected();
        else
            this.setSelected();
    }

    var sup = this;
    google.maps.event.addListener(this.marker, 'click', function() { sup.selectSwitch() } );
}

/* edge class */
function Edge(from, to, weight) {
    this.from = from;
    this.to = to;
    this.weight = weight;

    from.addEdge(this);
    to.addEdge(this);

    this.selected = false;

    /* draw line */
    this.lineOptions = { strokeColor: strokeColor,
                         strokeOpacity: 1.0,
                         strokeWeight: weight * edgeRatio,
                         map: map,
                         path: [from.latLng(), to.latLng()],
                         zIndex: edgeZIndex
                        };

    this.path = new google.maps.Polyline(this.lineOptions);

    google.maps.event.addListener(this.path,"mouseover",function(){ tooltip.show(from.name + " - " + to.name + ": " + weight) });
    google.maps.event.addListener(this.path,"mouseout",function(){ tooltip.hide() });

    /* node status control */
    this.setSelected = function() {
        this.lineOptions.strokeColor = selectedStrokeColor;
        this.lineOptions.zIndex = selectedEdgeZIndex;
        this.path.setOptions(this.lineOptions);
        this.selected = true;
    }

    this.setNotSelected = function() {
        this.lineOptions.strokeColor = strokeColor;
        this.lineOptions.zIndex = edgeZIndex;
        this.path.setOptions(this.lineOptions);
        this.selected = false;
    }

    this.clear = function() {
        this.path.setMap(null);
    }
}
