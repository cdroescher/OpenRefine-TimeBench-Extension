/* Add menu to extension bar */
ExtensionBar.addExtensionMenu({
	id : "timebench-extension",
	label : "date operations",
    "submenu" : [
        {
            "id" : "timebench-extension/ReformatDate",
            label: "reformat date",
            click: dialogHandler(ReformatDate)
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




