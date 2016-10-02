//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   Load data and process it also geocode data which has physical address
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define([
    './RestHelper',
    './GisHelper',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/Deferred',
    "dojo/request",
    "dojo/domReady!"
], function (RestHelper, GisHelper, declare, lang, Deferred, request) {
    var instance = null,
    clazz = declare([], {

        udsConfigs: {},
        _gisHelper: null,
        _restHelper: null,


        constructor: function(map, config) {
            this._gisHelper = GisHelper.getInstance(map, config);
            this._restHelper = RestHelper.getInstance(config);
            this._appConfig = config;
        },

        //LOAD data from REST
        load: function () {
            var def = new Deferred();
            //Load from BE
            this._restHelper.getData(this._appConfig.restServices.getAllAddresses,
                 lang.hitch(this, function (addresses) {
                     var list = [];
                     for (var i = 0; i < addresses.length; i++) {
                         list.push(this._process(addresses[i]));
                     }
                     def.resolve(list);
                 }), lang.hitch(this, function (error) {
                 }));
            return def.promise;
            //process data
            //return processed data
        },

        _process: function (address) {
            var def = new Deferred();
            this.processData(address).then(lang.hitch(this, function (data) {
                def.resolve(data);
            }), lang.hitch(this, function (error) {
                def.reject(error);
            }));
            return def.promise;
        },

        processData: function (serverData) {
            var def = new Deferred();
            var data = this.wrapData(serverData);
            if (data && data.address) {
                //append Graphic object to each data item
                var params = {
                    address: { "SingleLine": data.address },
                    countryCode: "AT"
                };
                //GeoCode data
                this._gisHelper.geocode(params).then(lang.hitch(this, function (point) {
                    //var graphic = this._gisHelper.createGraphic({ point: point, data: data });
                    data['point'] = point;
                    def.resolve(data);

                }), lang.hitch(this, function(error) {
                    def.reject(error);
                }));
                //geoCode each address if available and append geometry column
            } else {
                def.resolve(data);
            }
            return def.promise;
        },

        wrapData: function(data) {
            var item = {
                id: data.Id,
                guid: data.GUId,
                name: data.Name,
                email: data.Email,
                address: data.PhysicalAddress,
                phoneNumber: data.PhoneNumber,
                jobPosition: data.JobPosition,
                institution: data.Institution
            }
            return item;
        },

        wrapServerData: function (data) {
            var item = {
                GUID: data.guid,
                Name: data.name,
                Email: data.email,
                PhysicalAddress: data.address,
                PhoneNumber: data.phoneNumber,
                JobPosition: data.jobPosition,
                Institution: data.institution
            }
            if (data.id) {
                item['Id'] = data.id;
            }

            return item;
        },

        generateGUID: function() {
            return '_' + Math.random().toString(36).substr(2, 9);
        }        

    });

    clazz.getInstance = function (map, appConfig) {
        if (instance === null) {
            instance = new clazz(map, appConfig);
        }
        return instance;
    };
    return clazz;
});