function DateReformateDialog(column) {
    this.column = column;
}

DateReformateDialog.prototype = {
    init: function (callback) {
        var self = this,
            selectedServices = {},
            dialogElement = this.dialogElement = $(DOM.loadHTML("timebench-extension", "dialogs/dateReformate.html"));
        var operation = new String();

        /* Set labels */
        $('.column-name', dialogElement).text(this.column.name);

        /* Bind controls to actions */
        var controls = DOM.bind(this.dialogElement);
        controls.cancel.click(this.extraBound("hide"));
        controls.reformatDates.click(function () {
            operation = "reformatDates";
            self.extract(operation);
        });

        if (callback)
            callback.apply(self);

    },

    show: function () {
        this.init(function () {
            this.dialogLevel = DialogSystem.showDialog(this.dialogElement);
        });

    },

    hide: function () {
        DialogSystem.dismissUntil(this.dialogLevel - 1);
    },

    extract: function (services) {
        var value;
        var data = {  };
        data["column"] = this.column.name;
        data["services"] = services;
        data["dateFormat"] = document.getElementById("dateFormat").value;
        Refine.postProcess('timebench-extension', 'date-reformation', data, {},
            { rowsChanged: true, modelsChanged: true });
        this.hide();
    }
};