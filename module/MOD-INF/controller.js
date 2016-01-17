var logger = Packages.org.slf4j.LoggerFactory.getLogger("timebench-extension"),
    refineServlet = Packages.com.google.refine.RefineServlet;


/* Initialize the extension. */
function init() {
  var RS = Packages.com.google.refine.RefineServlet;
  RS.cacheClass(Packages.org.extraction.reformat.DateFormatChange);
  logger.info("Initializing commands");
  register("apply-reformation-to-datamodel", new org.extraction.reformat.commands.ApplyReformationToDataModelCommand());
  register("get-column", new org.extraction.reformat.commands.GetColumnCommand());
  register("apply-input-format",new org.extraction.reformat.commands.ApplyInputFormatCommand());
  register("apply-output-format",new org.extraction.reformat.commands.ApplyOutputFormatCommand());
  Packages.com.google.refine.model.Project.registerOverlayModel("dateTimeFormatOverlayModel", Packages.org.extraction.reformat.DateFormatsOverlayModel);

  logger.info("Initializing client resources");
  var resourceManager = Packages.com.google.refine.ClientSideResourceManager;
  resourceManager.addPaths(
    "project/scripts",
    module, [
      "scripts/config.js",
      "scripts/util.js",
      "dialogs/ReformatDate.js",
      "dialogs/FilterInterval.js",
      "scripts/menus.js"
    ]
  );
  resourceManager.addPaths(
    "project/styles",
    module, [
      "styles/main.less",
      "dialogs/FilterInterval.less",
      "dialogs/ReformatDate.less"
    ]
  );
}


//function goToExtension(column) {
//  console.log("clicked "+column);
//}
//
//DataTableColumnHeaderUI.extendMenu(function(column, columnHeaderUI, menu) {
//  MenuSystem.appendTo(menu, "", [ { /* separator */}, {
//    id : "timebench-extension/extraction",
//    label : "reformat time values",
//    click : goToExtension(column)
//  } ]);
//});

function register(path, command) {
  refineServlet.registerCommand(module, path, command);
}
