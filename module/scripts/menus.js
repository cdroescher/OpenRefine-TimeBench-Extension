/* Add menu to extension bar */
ExtensionBar.addExtensionMenu({
	id : "timebench-extension",
	label : "convert to TimeBench",
	submenu : [
	{
		id : "timebench-extension/about",
		label : "convert ...",
		click : dialogHandler(AboutDialog)
	} ]
});

/* Add submenu to column header menu */
DataTableColumnHeaderUI.extendMenu(function(column, columnHeaderUI, menu) {
	MenuSystem.appendTo(menu, "", [ { /* separator */}, {
		id : "timebench-extension/extraction",
		label : "extract date",
		click : dialogHandler(DateReformateDialog,column)
	} ]);
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




