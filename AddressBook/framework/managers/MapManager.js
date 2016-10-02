//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   This class is the startup of map
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/Deferred',

    "esri/map",
    "esri/arcgis/utils",
    "esri/dijit/HomeButton",
    "esri/dijit/Search",
    "esri/geometry/Extent",

    'dojo/domReady!'
], function (declare, lang, Deferred, Map, arcgisUtils, HomeButton, Search, Extent) {
    var instance = null,
    MapManager = declare([], {

         mapParams: null,

         constructor: function (options) {
             this.mapParams = options;
         },

         initMap: function () {
             var def = new Deferred();

             if (!this.mapParams.webmap) {
                 var map = new Map(this.mapParams.divId, this.mapParams.options);
                 map.on('load', lang.hitch(this, function (evt) {
                     map.disableDoubleClickZoom();
                     var extent = new Extent(this.mapParams.extent);
                     extent.setSpatialReference(map.spatialReference);
                     //create home btn
                     var home = new HomeButton({
                         map: map,
                         extent: extent
                     }, "homeButton");
                     home.startup();
                     //create worl search 
                     var s = new Search({
                         map: map
                     }, "search");

                     def.resolve(map);
                 }));

             } else {
                 if (this.mapParams.webmap.portalUrl && this.mapParams.webmap.portalUrl != '') {
                     arcgisUtils.arcgisUrl = this.mapParams.webmap.portalUrl;
                 }
                 arcgisUtils.createMap(this.mapParams.webmap, this.mapParams.divId).then(function(response) {
                     def.resolve(response.map);
                 });
             }

             return def.promise;
         }

     });
    MapManager.getInstance = function (options) {
        if (instance === null) {
            instance = new MapManager(options);
        }
        return instance;
    };
    return MapManager;
})