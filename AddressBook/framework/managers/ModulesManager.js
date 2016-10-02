//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   Modules manger
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/Deferred',
    "dojo/promise/all",

    './AddressesManager',
    "framework/helpers/DataLoader",

    'dojo/domReady!'
], function (declare, lang, Deferred, all, AddressesManager, DataLoader) {
    var instance = null,
     ModulesManager = declare([], {

         constructor: function (map, appConfig) {
             this._map = map;
             this._appConfig = appConfig;
             this._dataLoader = DataLoader.getInstance(map, appConfig);
         },

         load: function () {
             var addressesManager = new AddressesManager(this._map, this._appConfig);
             addressesManager.startup();
             //load data and process it
             this._dataLoader.load().then(lang.hitch(this, function (promises) {
                 all(promises).then(function (data) {
                     for (var i = 0; i < data.length; i++) {
                         addressesManager.addData(data[i]);
                         addressesManager.addGraphic(data[i], enums.status.active);
                     }
                     //hide loading
                     $("#loading").hide();
                 });
                 
             }), lang.hitch(this, function(error) {
                 //alert message
             }));

         },
     });
    ModulesManager.getInstance = function (map, config) {
        if (instance === null) {
            instance = new ModulesManager(map, config);
        }
        return instance;
    };
    return ModulesManager;
})