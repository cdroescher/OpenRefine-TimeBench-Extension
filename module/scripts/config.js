var EstrazExtension = {};
EstrazExtension.commandPath = "/command/timebench-extension/";
EstrazExtension.servicesPath = EstrazExtension.commandPath + "services";

// Register a dummy reconciliation service that will be used to display
ReconciliationManager.registerService({
  name: "timebench-extension",
  url: "timebench-extension",
  // By setting the URL to "{{id}}",
  // this whole string will be replaced with the actual URL
  view: { url: "{{id}}" }
});
