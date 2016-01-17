DataTableColumnHeaderUI.extendMenu(function(column, columnHeaderUI, menu) {
  MenuSystem.appendTo(menu, "", [ { /* separator */}, {
    id : "timebench-extension/extraction",
    label : "reformat time values",
    click : function(){ window.location = '/extension/timebench-extension/index.html?project=' + theProject.id + '&cellIndex='+ column.cellIndex}
  } ]);
});




