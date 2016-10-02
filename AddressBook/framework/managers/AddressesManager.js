//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   Manage Addresses and manipulate CRUD Functions
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/Deferred',
    'dojo/on',
    "dojo/Evented",

    'framework/handlers/GridHandler',
    'framework/handlers/FormHandler',
    "framework/helpers/GISHelper",
    "framework/helpers/RestHelper",
    "framework/helpers/DataLoader",

    "esri/symbols/PictureMarkerSymbol",
    "esri/InfoTemplate",
    'dojo/domReady!'
], function (declare, lang, Deferred, on, Evented, GridHandler, FormHandler,
    GISHelper, RestHelper, DataLoader, PictureMarkerSymbol, InfoTemplate) {
    var instance = null,
    AddressesManager = declare([Evented], {

        /*****************************************************************************************************************************************************
           CLASS CREATION
        /*****************************************************************************************************************************************************/

        constructor: function (map, appConfig) {
            //Initializations
            this._map = map;
            this.appConfig = appConfig;
            this.data = {
                name: "",
                email: "",
                address: "",
                phoneNumber: "",
                jobPosition: "",
                institution: ""
            };
            this._restHelper = RestHelper.getInstance(this.appConfig);
            this.gisHelper = GISHelper.getInstance(this._map);
            this.dataLoader = DataLoader.getInstance(this._map, this.appConfig);
            var infoTemplate = this._createInfoTemplate();
            //Create graphic layer of markers
            this._graphicLayer = this.gisHelper.addLayer("addressMarker", enums.layerType.GRAPHICS_LAYER, { infoTemplate: infoTemplate });
            //Subscribe on map events
            this._subscribeMapEvents();
        },

        startup: function () {
            this.initiateGrid();
            this._createForm();
        },

        /*****************************************************************************************************************************************************
           GRAPHIC MANIPULATION
        /*****************************************************************************************************************************************************/
        addGraphic: function (item, status) {
            //add new item to gisHelper
            if (item && item.point) {
                var symbol = new PictureMarkerSymbol(status, 40, 45);
                symbol.setOffset(0, 13);
                var graphic = this.gisHelper.createGraphic({ point: item.point, data: item, symbol: symbol });
                this.gisHelper.draw([graphic], this._graphicLayer);
            }
        },

        removeGraphic: function (data) {
            var selectedGraphic = this.gisHelper.getGraphic(data.guid, this._graphicLayer);
            if (selectedGraphic && selectedGraphic.attributes["id"]) {
                this.setGraphicSymbol(selectedGraphic, enums.status.active);
            } else {
                this.gisHelper.removeGraphic(selectedGraphic, this._graphicLayer);
            }

        },

        setGraphicSymbol: function (graphic, status) {
            var symbol = new PictureMarkerSymbol(status, 40, 45);
            symbol.setOffset(0, 13);
            graphic.setSymbol(symbol);
        },

        /*****************************************************************************************************************************************************
           GRID MANIPULATION
        /*****************************************************************************************************************************************************/
        //add data to grid
        addData: function (item) {
            //add new item to GridHandler datasource
            this._gridHandler.add(item);
        },

        //update data in grid
        updateData: function (item) {
            this._gridHandler.update(item);
        },

        //remove data from grid
        removeData: function (data) {
            //remove item from GridHandler datasource
            this._gridHandler.remove(data);
            //remove item from gisHelper
            var selectedGraphic = this.gisHelper.getGraphic(data.guid, this._graphicLayer);
            this.gisHelper.removeGraphic(selectedGraphic, this._graphicLayer);
        },

        setDataSource: function (data) {
            this._gridHandler.setDataSource(data);
        },

        /*****************************************************************************************************************************************************
           CRUD FUNCTIONS
        /*****************************************************************************************************************************************************/
        //Update Back end
        update: function (data) {
            var serverData = JSON.stringify(this.dataLoader.wrapServerData(data));
            var url = this.appConfig.restServices.putAddress.replace("{id}", data.id);
            this._restHelper.putData(url, serverData,
                lang.hitch(this, function (address) {
                    var data = this.dataLoader.wrapData(address);
                    var selectedGraphic = this.gisHelper.getGraphic(data.guid, this._graphicLayer);
                    this.setGraphicSymbol(selectedGraphic, enums.status.active);
                    selectedGraphic.setAttributes(data);
                    this.updateData(data);

                }), lang.hitch(this, function (error) {
                }));
        },

        //Add Back end
        save: function (data) {
            var serverData = this.dataLoader.wrapServerData(data);
            this._restHelper.postData(this.appConfig.restServices.postAddress, serverData,
                lang.hitch(this, function (address) {
                    var data = this.dataLoader.wrapData(JSON.parse(address));
                    var selectedGraphic = this.gisHelper.getGraphic(data.guid, this._graphicLayer);
                    this.setGraphicSymbol(selectedGraphic, enums.status.active);
                    data["point"] = selectedGraphic.geometry;
                    selectedGraphic.setAttributes(data);
                    this.addData(data);

                }), lang.hitch(this, function (error) {
                }));
        },

        //Delete Back end
        delete: function (data) {
            var url = this.appConfig.restServices.deleteAddress.replace("{id}", data.id);
            this._restHelper.deleteData(url,
               lang.hitch(this, function (address) {
                   var data = this.dataLoader.wrapData(address);
                   this.removeData(data);
                   this._map.infoWindow.hide();
                   if (this._formHandler.historyData.guid == data.guid) {
                       this._formHandler.hide();
                   }

               }), lang.hitch(this, function (error) {
               }));
        },

        /*****************************************************************************************************************************************************
           HELPERS
        /*****************************************************************************************************************************************************/
        initiateGrid: function () {
            this.dataSource = [];
            this._createGrid('unitsGridContainer');
        },

        _createGrid: function (placeholderId) {

            var gridActions = this._getGridActions();
            var gridColumns = this._getGridColumns(this.data);

            this._gridHandler = new GridHandler();
            this._gridHandler.buildGrid(gridColumns, gridActions, this.dataSource, placeholderId);
            this._gridHandler.displayData(this.dataSource);


        },

        _createForm: function () {
            this._formHandler = new FormHandler();
            this._formHandler.initForm();
            this._formHandler.on("saveData", lang.hitch(this, function (data) {
                this.save(data);
            }));
            this._formHandler.on("updateData", lang.hitch(this, function (data) {
                this.update(data);
                this._map.infoWindow.hide();
            }));
            this._formHandler.on("cancel", lang.hitch(this, function (data) {
                this.removeGraphic(data);
                this._map.infoWindow.hide();
            }));
        },

        _getGridColumns: function (data) {
            var columns = [];
            var entity = data;
            for (var key in entity) {
                if (key == 'geometry') {
                    continue;
                }
                columns.push({
                    title: key,
                    field: key,
                    nullable: true,
                    attributes: {
                        "class": "table-cell", style: 'white-space: nowrap'
                    },
                });
            }
            return columns;
        },

        _getGridActions: function () {
            return [this._getZoomAction(), this._getDeleteAction()];
        },

        _getZoomAction: function () {
            return {
                className: "zoomBtn",
                name: "zoom",
                alias: "",
                onClickHandler: lang.hitch(this, function (dataItem) {
                    this.gisHelper.zoomTo([dataItem.point]);
                }),
                actionColumnWidth: "50px",
                toolTip: "Zoom in",
                hidden: false
            }
        },

        _getDeleteAction: function () {
            return {
                className: "removeBtn",
                name: "delete",
                alias: " ",
                onClickHandler: lang.hitch(this, function (dataItem) {
                    this.delete(dataItem);
                }),
                actionColumnWidth: "50px",
                toolTip: "delete",
                hidden: false
            }
        },

        _subscribeMapEvents: function () {
            if (this._map) {
                this._map.on('dbl-click', lang.hitch(this, function (args) {
                    var params = {
                        point: args.mapPoint,
                        distance: 100
                    };
                    var data = {};
                    this.gisHelper.reverseGeocode(params).then(lang.hitch(this, function (addressCandidate) {

                        data["address"] = addressCandidate.address;
                        data["guid"] = this.dataLoader.generateGUID();
                        data["point"] = addressCandidate.point;
                        this.addGraphic(data, enums.status.inactive);
                        this._formHandler.show(data);

                    }), lang.hitch(this, function (error) {

                    }));


                }));
                this._graphicLayer.on("mouse-over", lang.hitch(this, function () {
                    this._map.setMapCursor("pointer");
                }));
                this._graphicLayer.on("mouse-out", function () {
                    this._map.setMapCursor("default");
                });
            }
        },

        _createInfoTemplate: function () {
            //Info window template html
            var template = "<span class='infoTemplateField'>Name:</span> ${name}" +
                "<br><span class='infoTemplateField'>Email:</span> ${email}" +
                "<br><span class='infoTemplateField'>Address:</span> ${address}" +
                "<br><span class='infoTemplateField'>Phone Number:</span> ${phoneNumber}" +
                "<br><span class='infoTemplateField'>Job Position:</span> ${jobPosition}" +
                "<br><span class='infoTemplateField'>Institution:</span> ${institution}<br>";

            var actionsTemplate = "<button  id='editBtn' class='k-button k-primary editBtn' type='button'>Edit</button>" +
                "<button class='k-button k-primary removeBtn-info'>Remove</button>";
            //Edit btn click handler
            on(document.getElementById('map'), '.editBtn:click', lang.hitch(this, function (args) {
                var feature = this._map.infoWindow.getSelectedFeature();
                this.setGraphicSymbol(feature, enums.status.inactive);
                this._formHandler.show(feature.attributes);
            }));
            //Remove btn clink handler
            on(document.getElementById('map'), '.removeBtn-info:click', lang.hitch(this, function (args) {
                var feature = this._map.infoWindow.getSelectedFeature();
                this.delete(feature.attributes);
            }));

            var infoTemplate = new InfoTemplate("Address", template + actionsTemplate);
            return infoTemplate;
        }

     });
    AddressesManager.getInstance = function (map, config) {
        if (instance === null) {
            instance = new UnitsManager(map, config);
        }
        return instance;
    };
    return AddressesManager;
})