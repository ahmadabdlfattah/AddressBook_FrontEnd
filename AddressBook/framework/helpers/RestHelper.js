//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   This class is to function CRUD Ajax PUT, GET, POST, DELETE
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
define([
    'dojo/_base/declare',
    "dojo/request",
    "dojo/domReady!"
], function (declare, request) {
    var instance = null,
    clazz = declare([], {

        _appConfig: {},
        sessionId: "",

        constructor: function(config) {
            this._appConfig = config;
        },

        //LOAD data from REST
        getData: function (url, onSuccess, onFailure) {
            request.get(this._getFullURL(url),
                {
                    preventCache: true,
                    headers: {
                        "X-Requested-With": null,
                        "Content-Type": "application/json"
                    },
                    handleAs: "json"

                }).then(function (response) {
                    if (onSuccess && typeof (onSuccess) == 'function') {
                        onSuccess(response);
                    }
                }, function (error) {
                    if (onFailure && typeof (onFailure) == 'function') {
                        onFailure(error);
                    }
                });
        },

        //ADD data from REST
        postData: function (url, data, onSuccess, onFailure, isJson) {
            //Create Header
            var headers = {
                "X-Requested-With": null
            };

            //AppendHeader if json param
            if (isJson !== undefined && isJson) {
                headers["Content-Type"] = "application/json";
                headers["Accept"] = "application/json";
            }
            //Post
            request.post(this._getFullURL(url), {
                preventCache: true,
                data: data,
                headers: headers
            }).then(function (response) {
                if (onSuccess && typeof (onSuccess) == 'function') {
                    onSuccess(response);
                }
            }, function (error) {
                if (onFailure && typeof (onFailure) == 'function') {
                    onFailure(error);
                }
            });
        },

        //UPDATE data from REST
        putData: function (url, dataObj, onSuccess, onFailure) {

            //calling the webservice to put data
            request.put(this._getFullURL(url), {
                preventCache: true,
                data: dataObj,
                handleAs: "json",
                headers: {
                    "X-Requested-With": null,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
            }).then(function (response) {
                //on success
                onSuccess(response);

            }, function (error) {
                //on fail
                if (onFailure && typeof (onFailure) == 'function') {
                    onFailure(error);
                }
            });
        },

        //DELETE data from REST
        deleteData: function (url, onSucess, onFailure) {

            //calling the webservice to perform delete by id
            request.del(this._getFullURL(url), {
                preventCache: true,
                handleAs: "json",
                headers: {
                    "X-Requested-With": null,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
            }).then(function (response) {
                //on success
                onSucess(response);
            }, function (error) {
                if (onFailure && typeof (onFailure) == 'function') {
                    onFailure(error);
                }
            });
        },

        //Get URL host name and protocol from config file
        _getFullURL: function (path) {
            var fullURL = path;
            if (this._appConfig.restServiceDomainURL) {
                 fullURL = this._appConfig.restServiceDomainURL.protocol + "://"
                    + this._appConfig.restServiceDomainURL.host + '/' + path;
            }

            return fullURL;
        }
    });

    clazz.getInstance = function (config) {
        if (instance === null) {
            instance = new clazz(config);
        }
        return instance;
    };
    return clazz;
});