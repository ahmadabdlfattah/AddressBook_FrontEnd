//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   Manage Application Framework
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

define(
    [
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/topic',

        "framework/managers/MapManager",
        "framework/managers/ModulesManager",
        "framework/helpers/GISHelper",

        "esri/geometry/Extent",
        "dojo/domReady!"
    ],
    function (declare, lang, topic, MapManager, ModulesManager, GISHelper, Extent) {

        var instance = null,

        ApplicationManager = declare([], {

            _map: null,
            _appConfig: null,
            _gisHelper: null,

            constructor: function (appConfig) {
                this._appConfig = appConfig;
            },
          
            initApp: function () {
                //Startup map manager
                this.mapManager = MapManager.getInstance({
                        divId: this._appConfig.map.divId,
                        options: this._appConfig.map.options,
                        extent: this._appConfig.map.extent,
                        webmap: null /* {itemId: ID, portalUrl: PURL}*/
                }, this._appConfig),
                //show loading
                $("#loading").show();
                //Init map object
                this.mapManager.initMap().then(lang.hitch(this, function (map) {

                    this._map = map;
                    //Set initial map extent
                    var extent = new Extent(this._appConfig.map.extent);
                    extent.setSpatialReference(this._map.spatialReference);
                    this._map.setExtent(extent);
                    //Empower gis helper and modules manager with map and config object
                    this.gisHelper = GISHelper.getInstance(this._map, this._appConfig);
                    this.modulesManager = new ModulesManager(this._map, this._appConfig);
                    //Load
                    this.modulesManager.load();

                }), function (error) {
                    console.log(error);
                });
            }

        });
            
        ApplicationManager.getInstance = function (appConfig) {
            if (instance === null) {
                instance = new ApplicationManager(appConfig);
            }
            return instance;
        }
        return ApplicationManager;
    }
);