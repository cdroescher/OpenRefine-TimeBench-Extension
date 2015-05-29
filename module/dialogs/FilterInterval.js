function FilterInterval() {
}

var columnsReformat = [];
var inputFormatArray = [];
FilterInterval.prototype = {
    init: function () {
        this.dialogElement = $(DOM.loadHTML("timebench-extension", "dialogs/FilterInterval.html"));
        var controls = DOM.bind(this.dialogElement);
        controls.close.click(this.extraBound("hide"));
        controls.filterInterval.click(function () {
            operation = "reformatDates";
            self.reformat(operation);
        });

        $(".column-header").each(function () {
            columnsReformat.push($(this).attr("title"));
        });
    },
    show: function () {
        this.init();
        this.dialogLevel = DialogSystem.showDialog(this.dialogElement);


    },

    hide: function () {
        DialogSystem.dismissUntil(this.dialogLevel - 1);
    },

    reformat: function () {
        var data = {  };
        data["test"] = "test" ;
        Refine.postProcess('timebench-extension', 'filter-interval', data, {},
            { rowsChanged: true, modelsChanged: true });
        this.hide();
    }
};
