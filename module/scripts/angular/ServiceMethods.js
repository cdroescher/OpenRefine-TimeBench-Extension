var serviceModule = (function (module) {
    var _http;
    module.init = function (http) {
        _http = http;
    };

    module.getColumn = function (dataModel, scope) {
        _http.get('/command/timebench-extension/get-column?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex).success(function (dateTimeValues) {
            console.log('/command/timebench-extension/get-column?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex);
            var column = new Column(null);
            dateTimeValues.forEach(function (entry) {
                var dateTimeValue = new DateTimeValue(entry.v, null, false);
                column.dateTimeValues.push(dateTimeValue);
            });
            dataModel.originalColumn = column;
            dataModel.init(dataModel, module.addInputFormat.bind(this), scope);
            dataModel.paginate();
        }.bind(this))
    };

    module.addInputFormat = function (dataModel, format) {
        var column;
        if (format) {
            column = new Column(format);
        } else {
            column = new Column(dataModel.inputFormatToAdd);
        }
        _http.post('/command/timebench-extension/apply-input-format?cellIndex=' + dataModel.cellIndex + '&project=' + dataModel.projectId, column.format).success(function (dateTimeValueColumns) {
            console.log('/command/timebench-extension/apply-input-format?cellIndex=' + dataModel.cellIndex + '&project=' + dataModel.projectId);
            if (dateTimeValueColumns.length > 0) {
                dateTimeValueColumns[0].reformatedColumn.forEach(function (entry) {
                    column.dateTimeValues.push(new DateTimeValue(entry.v, entry.timestamp, false));
                });
                dataModel.formatColumns.push(column);
                dataModel.findConflicts(module.reformatResultColumn);
                module.reformatResultColumn(dataModel);
                dataModel.paginate();
            }
        }.bind(this));
        console.log(dataModel);
    };

    module.removeInputFormat = function (format, dataModel) {
        console.info('remove input format');
        dataModel.formatColumns.forEach(function (item, index, object) {
            if (item.format === format) {
                object.splice(index, 1);
            }
        });
        dataModel.findConflicts(this.reformatResultColumn);
        module.reformatResultColumn(dataModel);
        for (var i = 0; i < dataModel.resultColumn.dateTimeValues.length; i++) {
            var valueCount = 0;
            dataModel.formatColumns.forEach(function (item) {
                if (item.dateTimeValues[i].value) {
                    valueCount++;
                }
            });
            if (valueCount < 1) {
                dataModel.resultColumn.dateTimeValues[i] = new DateTimeValue(null, null, false);
            }
        }
        dataModel.paginate();
    };

    module.reformatResultColumn = function (dataModel) {
        _http.post('/command/timebench-extension/apply-output-format', dataModel.resultColumn).success(function (resultColumn) {
            console.log('/command/timebench-extension/apply-output-format', dataModel.resultColumn);
            var column = new Column(resultColumn.format);
            resultColumn.dateTimeValues.forEach(function (item) {
                column.dateTimeValues.push(new DateTimeValue(item.value, item.timestamp, false));
            });
            dataModel.resultColumn = column;
            dataModel.paginate();
        });
    };

    module.applyToDataModel = function (dataModel) {
        _http.post('/command/timebench-extension/apply-reformation-to-datamodel?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex, dataModel.resultColumn).success(function (resultColumn) {
            console.log('/command/timebench-extension/apply-reformation-to-datamodel?project=' + dataModel.projectId);
            window.location = '/project?project=' + theProject.id;
        });
    };

    module.addHeatMaps = function (dataModel, heatMapList) {
        heatMapList.length = 0;
        $(".dayHeatMap").empty();
        var heatMapData = HeatMapDataPrepareModule.prepareDataForHeatMap(dataModel.formatColumns);
        heatMapData.column.forEach(function (column, i) {
            var heatMap = new HeatMapYear(column, i, heatMapData.dayCount);
            heatMap.init();
            heatMapList.push(heatMap);
        });
    };

    return module;
}(serviceModule  || {}));