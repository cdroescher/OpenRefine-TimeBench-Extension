function ReformatDate() {
}

var columnsReformat = [];
var inputFormatArray = [];
ReformatDate.prototype = {
    init: function () {
        this.dialogElement = $(DOM.loadHTML("timebench-extension", "dialogs/ReformatDate.html"));
        var controls = DOM.bind(this.dialogElement);
        controls.close.click(this.extraBound("hide"));
        controls.reformatDates.click(function () {
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
        columnsReformat.forEach(function (entry) {
            $("#reformatDateSelect").append("<option value='" + entry + "'>" + entry + "</option>");
        });
        $('#addInputDateFormat').click(function(){
            var inputDateFormat = $('#inputDateFormat').val();
            inputFormatArray.push(inputDateFormat);
            $('#inputDateFormatList').append('<li>' + inputDateFormat + '</li>');
        });

    },

    hide: function () {
        DialogSystem.dismissUntil(this.dialogLevel - 1);
    },

    reformat: function () {
        var data = {  };
        data["test"] = "test" ;
        Refine.postProcess('timebench-extension', 'date-reformation', data, {},
            { rowsChanged: true, modelsChanged: true });
        this.hide();
    }
};
