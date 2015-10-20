/* Add menu to extension bar */
ExtensionBar.addExtensionMenu({
	id : "timebench-extension",
	label : "date operations",
    "submenu" : [
        {
            "id" : "timebench-extension/ReformatDate",
            label: "reformat date",
            click: dialogHandler(ReformatDate)
        },

        {
            "id" : "timebench-extension/FilterInterval",
            label: "filter interval",
            click: forwardTimeBench(FilterInterval)
        }

    ]
});

function dialogHandler(dialogConstructor) {
	var dialogArguments = Array.prototype.slice.call(arguments, 1);
	function Dialog() {
		return dialogConstructor.apply(this, dialogArguments);
	}
	Dialog.prototype = dialogConstructor.prototype;
	return function() {
		new Dialog().show();
	};
}

function forwardTimeBench(dialogConstructor){
    var dialogArguments = Array.prototype.slice.call(arguments, 1);
    function Dialog() {
        return dialogConstructor.apply(this, dialogArguments);
    }
    Dialog.prototype = dialogConstructor.prototype;
    return function() {
        window.location = '/extension/timebench-extension/index.html?project=' + theProject.id;
    };
}




