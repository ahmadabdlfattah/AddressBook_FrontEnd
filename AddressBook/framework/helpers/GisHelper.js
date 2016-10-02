//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:  Manage all gis functions e.g zoom, draw, geocode, reverse geocode, ..
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    'dojo/Evented',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/Deferred',
    'dojo/topic',


    "esri/urlUtils",
    'esri/geometry/webMercatorUtils',
    'esri/geometry/geometryEngine',
    "esri/geometry/Point",
    'esri/tasks/GeometryService',
    "esri/layers/FeatureLayer",
    'esri/layers/GraphicsLayer',

    'esri/tasks/RouteTask',
    'esri/tasks/RouteParameters',
    'esri/tasks/FeatureSet',
    'esri/graphic',
    "esri/InfoTemplate",

    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/PictureMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleFillSymbol',
    'esri/symbols/TextSymbol',
    'esri/symbols/Font',
    'esri/Color',
    "esri/dijit/Search",
    "esri/tasks/locator",
    'dojo/domReady!'
], function (
    declare, Evented, lang, array, Deferred, topic,
    urlUtils, webMercatorUtils, geometryEngine, Point, GeometryService, FeatureLayer, GraphicsLayer,
    RouteTask, RouteParameters, FeatureSet, Graphic, InfoTemplate,
    SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol,
    SimpleFillSymbol, TextSymbol, Font, Color, Search, Locator) {
    var instance = null,
    GISHelper = declare([Evented], {
            _map: null,
            _geometryService: null,
            _ZOOM_SCALE: 5000,
            _EXPAND_FACTOR: 2,
            appConfig: null,
            _graphicsLayers: [],
            locator: null,

            constructor: function (map, config) {
                this._map = map;
                this.appConfig = config;
                this._geometryService = new GeometryService(this.appConfig.arcgisServices.geometryServiceUrl);
                this._DEFAULT_SYMBOL_POINT = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQAURE, 10, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 128, 0]), 1), new Color([0, 255, 0, 0.25]));
                this._DEFAULT_SYMBOL_POLYLINE = new SimpleLineSymbol(SimpleLineSymbol.STYLE_Solid, new Color([255, 0, 0]), 1);
                this._DEFAULT_SYMBOL_POLYGON = SimpleFillSymbol(SimpleFillSymbol.STYLE_NONE, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]));
                this._graphicsLayers = new Array();

                this.locator = new Locator(this.appConfig.arcgisServices.geocodingServiceUrl);
            },

            clearAllGraphics: function (parameters) {
                for (var i = 0; i < this._graphicsLayers.length; i++) {
                    if (this._graphicsLayers[i].clearable) {
                        this._graphicsLayers[i].graphicsLayer.clear();
                    }
                }
            },

            addLayer: function (id, type, options) {
                var layer = null;
                switch (type) {
                    case enums.layerType.FEATURE_LAYER:
                        layer = this._createFeatureLayer(id, options);
                        break;

                    case enums.layerType.GRAPHICS_LAYER:
                    default:
                        layer = this._createGraphicsLayer(id, options);
                        break;
                }
                return layer;
            },

            _createFeatureLayer: function (id, options) {
                var defaultOutFields = options.outFields ? options.outFields : ["*"],
                featureLayer = new FeatureLayer(options.url, {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    outFields: defaultOutFields,
                    id: id
                });

                this._map.addLayer(featureLayer);
                return featureLayer;
            },

            _createGraphicsLayer: function (id, options) {

                var graphicLayer = new GraphicsLayer({ id: id });
                graphicLayer.setInfoTemplate(options.infoTemplate);
                this._map.addLayer(graphicLayer);
                this._graphicsLayers.push({
                    graphicsLayer: graphicLayer,
                    clearable: (typeof (options.clearable) !== 'undefined' ? options.clearable : true)
                });
                return graphicLayer;
            },

            zoomTo: function (geometries) {
                var def = new Deferred();
                var pointGeomteries = [];

                if (geometries) {

                    if (geometries && geometries.length == 1 && geometries[0].type == "point") {

                        this.zoomToPoint(geometries[0], null);
                    } else {

                        this.project(geometries, null).then(
                            lang.hitch(this, function (shapes) {
                                var extent = null, ext = null;

                                for (var i = 0; i < shapes.length; i++) {
                                    if (shapes[i].type === 'point') {
                                        ext = new esri.geometry.Extent(shapes[i].x - 1, shapes[i].y - 1,
                                            shapes[i].x + 1, shapes[i].y + 1, shapes[i].spatialReference);

                                        pointGeomteries.push(shapes[i]);
                                    } else if (shapes[i].type == 'extent') {
                                        ext = shapes[i];
                                    } else {
                                        ext = shapes[i].getExtent();
                                    }
                                    if (extent) {
                                        extent = extent.union(ext);
                                    } else {
                                        extent = new esri.geometry.Extent(ext);
                                    }
                                }


                                if (extent) {
                                    this._map.setExtent(extent.expand(this._EXPAND_FACTOR)).then(lang.hitch(this, function (extent) {
                                        def.resolve(extent);
                                    }),
                                        lang.hitch(this, function (error) {
                                            def.reject(error);
                                        }));;
                                }
                            }),
                            lang.hitch(this, function (error) {
                                var argumentExp = { type: GSSEnums.errorType.GIS_PROJECTION_ERROR, message: GSSEnums.errorType.GIS_PROJECTION_ERROR };
                                throw argumentExp;
                            })
                        );
                    }
                }

                return def.promise;
            },

            zoomToPoint: function (geometry, zoomScale) {
                var def = new Deferred();
                if (geometry) {

                    if (geometry.type === 'point') {
                        this.project([geometry], null).then(
                            lang.hitch(this, function (points) {
                                var targetZoomScale = zoomScale ? zoomScale : this._ZOOM_SCALE;

                                var targetZoomLevel = this.getZoomScale(targetZoomScale);

                                this._map.centerAndZoom(points[0], targetZoomLevel);
                            }),
                            lang.hitch(this, function (error) {
                                throw 'error while project point';
                            })
                        );

                    }
                    else {
                        throw "the type of this geometry is not point.";
                    }
                }

                return def.promise;
            },

            getZoomScale: function (scale) {

                //if unable to map , return -1
                var zoomLevel = -1;

                //scales of all tiled map levels
                var zoomLevels = [500000000, 250000000, 150000000, 70000000, 35000000, 15000000, 10000000, 4000000, 2000000, 1000000, 500000, 250000, 150000, 70000, 35000, 15000, 8000, 4000, 2000, 1000];
                //check level for scale
                for (var i = 1; i < zoomLevels.length; i++) {
                    if (scale >= zoomLevels[i] && scale <= zoomLevels[i - 1]) {
                        zoomLevel = i;
                        break;
                    }
                }
                return zoomLevel;
            },

            project: function (geometries, outSRWkid) {
                var def = new Deferred();
                if (geometries && this._geometryService) {
                    outSRWkid = outSRWkid ? outSRWkid : this._map.spatialReference.wkid;
                    /* Create Map Points List */
                    var mapPointsList = geometries;

                    /* create out spatial reference */
                    var outSpatialReference = new esri.SpatialReference(outSRWkid);
                    if (mapPointsList && mapPointsList.length > 0) {
                        /* Check if web mercator can project points or not */
                        if (!webMercatorUtils.canProject(mapPointsList[0], outSpatialReference)) {
                            /* Check returned map points list */
                            if (mapPointsList) {
                                /* Project via geometry service */
                                this._geometryService.project(mapPointsList, outSpatialReference).then(lang.hitch(this, function (projectedPoints) {
                                    /*success*/
                                    if (projectedPoints && projectedPoints.length == 1 && points.length == 1)
                                        projectedPoints[0].zoomScale = points[0].zoomScale ? points[0].zoomScale : this._ZOOM_SCALE;

                                    def.resolve(projectedPoints);

                                }), function (error) {
                                    /*failure*/
                                    def.reject(error);
                                });
                            }
                        }
                        else {
                            /* Initializations */
                            var projectedMapPoints = [];

                            if (mapPointsList.length == 1 && mapPointsList[0].spatialReference.equals(outSpatialReference))
                                projectedMapPoints = mapPointsList;
                            else
                                /* Project via web mercator */
                                projectedMapPoints = this._projectViaWebMercator(mapPointsList, outSpatialReference);

                            if (projectedMapPoints && projectedMapPoints.length > 0) {
                                /* Success */
                                setTimeout(function (parameters) {
                                    def.resolve(projectedMapPoints);
                                }, 50);
                            }
                            else {
                                /*failure when the projection is failing*/
                                setTimeout(function () {
                                    def.reject("It can't Project points list");
                                }, 50);
                            }
                        }
                    } else {
                        /*failure in case of no locaiton or undefined locations*/
                        setTimeout(function () {
                            def.reject("There is no locations for these points");
                        }, 50);
                    }

                } else {
                    /*failure when there are missing paramters*/
                    setTimeout(function () {
                        def.reject('missing ar undefined parameters');
                    }, 50);
                }
                return def.promise;
            },

            _projectViaWebMercator: function (geometries, outSpatialReference) {
                /* Initializations */
                var projectedMapPoints = [];

                if (geometries && geometries.length > 0) {
                    /* Loop on map points list */
                    for (var i = 0; i < geometries.length; i++) {

                        var pnt = webMercatorUtils.project(geometries[i], outSpatialReference);

                        if (geometries[i].zoomScale)
                            pnt.zoomScale = geometries[i].zoomScale;

                        projectedMapPoints.push(pnt);
                    }
                }
                /* Return mapPoints list */
                return projectedMapPoints;
            },

            draw: function (graphics, graphicsLayer) {
                var drawnGraphics = [];
                if (graphics && graphics.length > 0) {
                    if (graphicsLayer) {
                        /*loop on the graphics objects to create and add to graphics layer assigned */
                        for (var i = 0; i < graphics.length; i++) {
                            var symbol = null;
                            /* check for assigned symbol for each graphic if not found assign Default */
                            if (!graphics[i].symbol) {
                                switch (graphics[i].geometry.type) {
                                    case 'point':
                                    case 'multipoint':
                                        symbol = this._DEFAULT_SYMBOL_POINT;
                                        break;
                                    case 'polyline':
                                        symbol = this._DEFAULT_SYMBOL_POLYLINE;
                                        break;
                                    case 'polygon':
                                    case 'extent':
                                        symbol = this._DEFAULT_SYMBOL_POLYGON;
                                        break;
                                }
                            } else {
                                symbol = graphics[i].symbol;
                            }
                            var graphic = new Graphic(graphics[i].geometry, symbol);
                            if (graphics[i].attributes) {
                                graphic.attributes = graphics[i].attributes;
                            }
                            /* every grpahic assigned with id if id not found generate id */
                            graphic['gid'] = graphics[i].id ? graphics[i].id : (graphicsLayer.id + '_' + new Date().getTime() + '_' + (Math.floor((Math.random() * 1000) + 1)));
                            graphicsLayer.add(graphic);
                            drawnGraphics.push(graphic);
                        }
                    } else {
                        var argumentExp = { type: GSSEnums.errorType.ARGUMENT_ERROR, message: 'missing graphic layer parameter.' };
                        throw argumentExp;
                    }
                } else {
                    var argumentExp = { type: GSSEnums.errorType.ARGUMENT_ERROR, message: 'empty graphics array.' };
                    throw argumentExp;
                }

                return drawnGraphics;
            },

            createGraphic: function(params) {
                var graphic = null;
                if (params) {
                    var point = params.point;
                    var symbol = params.symbol;
                    var attr = params.data;
                    var infoTemplate = new InfoTemplate("Attributes", "${*}");
                    graphic = new Graphic(point, symbol, attr, infoTemplate);
                }
                return graphic;
            },

            getGraphic: function (id, graphicsLayer) {

                if (id && graphicsLayer) {
                    for (var i = 0; i < graphicsLayer.graphics.length; i++) {
                        if (graphicsLayer.graphics[i].attributes["guid"] == id) {
                            return graphicsLayer.graphics[i];
                        }
                    }
                }
                return null;
            },

            removeGraphic: function (graphic, graphicsLayer) {

                if (graphic && graphicsLayer) {
                    graphicsLayer.remove(graphic);
                } 
            },

            geocode: function (params) {
                var def = new Deferred();
                if (params && this.locator) {
                                
                    this.locator.outSpatialReference = this._map.spatialReference;
                    this.locator.addressToLocations(params, lang.hitch(this, function (addressCandidates) {
                        for (var i = 0; i < addressCandidates.length; i++) {
                            if (addressCandidates[i].score == 100) {
                                def.resolve(addressCandidates[i].location);
                                break;
                            }
                        }
                        
                    }), lang.hitch(this, function(error) {
                        def.reject(error);
                    }));
                }
                return def.promise;
            },

            reverseGeocode: function(params) {
                var def = new Deferred();
                if (params && params.point && params.distance && this.locator) {
                    var mapPoint = new Point(params.point.x, params.point.y, params.point.spatialReference);
                    this.project([mapPoint], this._map.spatialReference).then(lang.hitch(this, function(projectedPoints) {
                        if (projectedPoints && projectedPoints[0]) {
                            this.locator.locationToAddress(projectedPoints[0], params.distance).then(lang.hitch(this, function(addressCandidate) {
                                if (addressCandidate) {
                                    def.resolve({
                                        address: addressCandidate.address.Match_addr,
                                        point: addressCandidate.location
                                });
                                }
                            }), lang.hitch(this, function(error) {
                                def.reject(error);
                            }));
                        }
                    }), lang.hitch(this, function(error) {

                    }));

                }
                return def.promise;
            }

        });
    GISHelper.getInstance = function (map, config) {
        if (instance === null) {
            instance = new GISHelper(map, config);
        }

        return instance;
    };
    return GISHelper;
})