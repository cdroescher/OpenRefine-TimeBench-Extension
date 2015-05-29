var logger = Packages.org.slf4j.LoggerFactory.getLogger("timebench-extension"),
    refineServlet = Packages.com.google.refine.RefineServlet


/* Initialize the extension. */
function init() {
  logger.info("Initializing commands");
  register("date-reformation", new org.extraction.reformat.ReformatDateCommand());

  logger.info("Initializing client resources");
  var resourceManager = Packages.com.google.refine.ClientSideResourceManager;
  resourceManager.addPaths(
    "project/scripts",
    module, [
      "scripts/config.js",
      "scripts/util.js",
      "dialogs/ReformatDate.js",
      "scripts/menus.js"
    ]
  );
  resourceManager.addPaths(
    "project/styles",
    module, [
      "styles/main.less",
      "dialogs/ReformatDate.less"
    ]
  );
}

function register(path, command) {
  refineServlet.registerCommand(module, path, command);
}
