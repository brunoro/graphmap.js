var map;
var graphmap;

function initialize()
{
    /* initialize map */
    var latlng = new google.maps.LatLng(-17, -55);
    var options = { zoom: 4,
                    center: latlng,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                  };
    map = new google.maps.Map(document.getElementById("map_canvas"), options);
    graphmap = new Graphmap();

    graphmap.setMaxWeight(20);
    
    edges = [ 
               { 'from': "Belo Horizonte",
                 'to': "Bruxelles",
                 'size': 7 },
               { 'from': "Belo Horizonte",
                 'to': "São Paulo",
                 'size': 15 },
               { 'from': "Bogotá",
                 'to': "São Paulo",
                 'size': 5 }
             ]
    graphmap.addAll(edges);
}
