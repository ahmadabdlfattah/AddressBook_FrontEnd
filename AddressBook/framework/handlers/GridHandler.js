//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   Grid handler
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

define([
        "dojo/topic",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/on",
        "dojo/store/Memory",
        "dojo/data/ObjectStore",

        "dojox/grid/DataGrid",

        "dijit/form/Button"

], function (topic, declare, lang, on, Memory, ObjectStore,
    DataGrid,
    Button) {

    var kendoGridHandler = declare([], {

        //*****************************************************************************************************************************************************
        //  ATTRIBUTES
        //*****************************************************************************************************************************************************

        gridActions: null,     //needed actions [extra columns with buttons]
        structure: [],         //grid layout definition

        grid: null,            //grid object

        _self: null,           //copy of this [copy main scope to be used in callbacks that run in different scope]

        //*****************************************************************************************************************************************************
        //  CLASS FUNCTIONALITIES
        //*****************************************************************************************************************************************************

        //**Initializations ***********************************************************************************************************************************

        /*
        class constructor, here we define default values and initialize variables, may listen to events
        */
        constructor: function () {
            _self = this;   //copy of this [copy main scope to be used in callbacks that run in different scope]
        },

        //**Grid Handling **************************************************************************************************************************************

        /*
        append feature layer to map
        **Parameters :
        ** gridActions : needed actions [extra columns with buttons]
           example:         var gridActions = {
                                Action1: {
                                    callback: "callback_name"
                                },
                                Action2: {
                                    callback: "callback_name"
                                },
                            };

        ** placeHolderId  : id of grid dom element container.
        */
        buildGrid: function (gridColumns, gridActions, dataSource, placeHolderId) {

            //validate structure first , if not valid : break function
            if (this.structure == null || this.structure == undefined) {
                alert("Build grid structure first");
                return;
            }

            this.structure = this.structure.concat(gridColumns)
            //keep actions to access callbacks later
            this.gridActions = gridActions;

            //append actions to structure
            if (this.gridActions) {

                for (var key in this.gridActions) {
                    var command = {
                        command: [
                            {
                                className: this.gridActions[key].className,
                                name: this.gridActions[key].name,
                                text: this.gridActions[key].alias,
                                click: lang.partial(lang.hitch(this, function (clickCallback,e) {
                                    e.preventDefault();
                                    var dataItem = this.grid.dataItem($(e.currentTarget).closest("tr"));

                                    clickCallback(dataItem);
                                }), this.gridActions[key].onClickHandler)
                            }
                        ],
                        width: this.gridActions[key].actionColumnWidth,
                        attributes: {
                            title: this.gridActions[key].toolTip ? this.gridActions[key].toolTip : ""
                        },
                        hidden: typeof (this.gridActions[key].hidden) === 'boolean' ? this.gridActions[key].hidden : undefined
                    };
                    this.structure.push(command)
                }
            }

            var gridDefinition = {
                dataSource: {
                    data: dataSource                //empty data source
                },

                columns: this.structure,    //set layout

                scrollable: true,           //enable scrolling
                sortable: true,             //enable sorting [per column]
                groupable: true,            //enable grouping
                resizable: true,            //enable column width resizing
                reorderable: true,          //enable moving columns to change order
                columnMenu: true            //show menu to hide/show layout columns
            };

            try {

                var gridContainer = $('#' + placeHolderId).kendoGrid(gridDefinition);

                //get created grid
                this.grid = $(gridContainer).data('kendoGrid')
            }
            catch (err) {
                alert("Faild to create grid");
            }
        },

        /*
        display provided data in grid
        **Parameters :
        ** data : to be displayed in grid
        */
        displayData: function (data) {

            if (data != null && data != undefined && this.grid) {

                this.grid.dataSource.data(data);
            }
        },

        /*
        clear grid data
        */
        remove: function (item) {
            if (this.grid) {
                var data = this.grid.dataSource.data();
                for (var i = 0; i < data.length; i++) {
                    if (data[i].guid == item.guid) {
                        this.grid.dataSource.remove(data[i]);
                    }
                }
               
            }
        },

        /*
        clear grid data
        */
        add: function (item) {
            if (this.grid) {
                this.grid.dataSource.add(item);
            }
        },

        setDataSource: function(data) {
            var dataSource = new kendo.data.DataSource({
                data: data
            });

            this.grid.setDataSource(dataSource);
        },

        update: function(dataItem) {
            var data = this.grid.dataSource.data();
            for (var i = 0; i < data.length; i++) {
                if (data[i].guid == dataItem.guid) {
                    data[i] = dataItem;
                }
            }
            this.grid.dataSource.data(data);
        },

        /*
        to build grid layout step by step
        call before buildGrid
        **Parameters :
        ** fieldName : fieldName, used in binding
        ** alias : to be used in desplay
        */
        appendToGridStructure: function (fieldName, alias) {

            if (this.structure) {

                //create column definition
                var columnDefinition = {
                    title: alias,
                    field: fieldName
                };

                //add to layout definition
                this.structure.push(columnDefinition);
            }
        }

    });

    return kendoGridHandler;
});