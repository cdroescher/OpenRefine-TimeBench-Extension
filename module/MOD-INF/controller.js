var logger = Packages.org.slf4j.LoggerFactory.getLogger("timebench-extension"),
    refineServlet = Packages.com.google.refine.RefineServlet,
    estra = Packages.org.extraction,
    services = estra.services,
    commands = estra.commands;

/* Initialize the extension. */
function init() {
  logger.info("Initializing commands");
  register("date-reformation", new commands.DateReformateCommand());

  logger.info("Initializing client resources");
  var resourceManager = Packages.com.google.refine.ClientSideResourceManager;
  resourceManager.addPaths(
    "project/scripts",
    module, [
      "scripts/config.js",
      "scripts/util.js",
      "dialogs/convert.js",
      "dialogs/dateReformate.js",
      "scripts/menus.js"
    ]
  );
  resourceManager.addPaths(
    "project/styles",
    module, [
      "styles/main.less",
      "dialogs/dialogs.less",
      "dialogs/convert.less",
      "dialogs/dateReformat.less"
    ]
  );
}

function register(path, command) {
  refineServlet.registerCommand(module, path, command);
}
