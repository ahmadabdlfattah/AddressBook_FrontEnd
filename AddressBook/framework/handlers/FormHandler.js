//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   Form handler
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

define([
        "dojo/topic",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/on",
        "dojo/Evented"

], function (topic, declare, lang, on, Evented) {

    var FormHandler = declare([Evented], {

        constructor: function () {
            this.hide();
        },

        initForm: function () {

            var validator = $("#addressForm").kendoValidator().data("kendoValidator");
            var status = $(".status");

            $("#submit").click(lang.hitch(this, function (event) {
                event.preventDefault();
                if (validator.validate()) {
                    var serializedData = $("form").serializeArray();

                    var data = {};
                    if (this.historyData) {
                        data = lang.clone(this.historyData);
                    }

                    $.each(serializedData, function (i, field) {
                        data[field.name] = field.value;
                    });

                    this.save(data);

                    status.text("Data Saved!")
                        .removeClass("invalid")
                        .addClass("valid");
                } else {
                    status.text("Oops! There is invalid data in the form.")
                        .removeClass("valid")
                        .addClass("invalid");
                }
            }));
            $("#cancel").click(lang.hitch(this, function (event) {
                event.preventDefault();
                this.cancel(this.historyData);
            }));
            $("#close").click(lang.hitch(this, function (event) {
                event.preventDefault();
                this.close();
            }));
        },

        show: function (data) {
            $("#addressFormContainer").show();
            if (data) {
                this.historyData = data;
                $("#name").val(data.name);
                $("#email").val(data.email);
                $("#address").val(data.address);
                $("#tel").val(data.phoneNumber);
                $("#jobPosition").val(data.jobPosition);
                $("#institution").val(data.institution);
            }
        },

        hide: function() {
            $("#addressFormContainer").hide();
        },

        save: function (data) {
            if (data && data.id) {
                this.emit('updateData', data);
            } else {
                this.emit('saveData', data);
            }

            this.hide();
        },

        cancel: function(data) {
            $("#name").val('');
            $("#email").val('');
            $("#address").val('');
            $("#tel").val('');
            $("#jobPosition").val('');
            $("#institution").val('');
            this.hide();
            this.emit('cancel', data);
        },

        close: function() {
            this.hide();
        }

    });

    return FormHandler;
});