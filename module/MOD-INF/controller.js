var logger = Packages.org.slf4j.LoggerFactory.getLogger("timebench-extension"),
    refineServlet = Packages.com.google.refine.RefineServlet


/* Initialize the extension. */
function init() {
  var RS = Packages.com.google.refine.RefineServlet;
  RS.cacheClass(Packages.org.extraction.reformat.DateFormatChange);
  logger.info("Initializing commands");
  register("date-reformation", new org.extraction.reformat.ReformatDateCommand());
  register("decode-date-time-values", new org.extraction.reformat.DecodeDateTimeValueCommand());
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

function register(path, command) {
  refineServlet.registerCommand(module, path, command);
}
