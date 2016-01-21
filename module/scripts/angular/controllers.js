'use strict';

var paginationVars = {
    'currentPage': 1,
    'numberPerPage': 30
};

function Pagination(dateTimeValues, paginationVars) {
    this.paginationVars = paginationVars;
    this.dateTimeValues = dateTimeValues;
    this.result = [];
    this.begin = null;
    this.end = null;
    this.numPages = null;
    this.calculate = function () {
        this.numPages = Math.ceil(this.dateTimeValues.length / paginationVars.numberPerPage);
        this.begin = ((this.paginationVars.currentPage - 1) * this.paginationVars.numberPerPage);
        this.end = this.begin + this.paginationVars.numberPerPage;
        this.result = this.dateTimeValues.slice(this.begin, this.end);
    }
}

function Column(format) {
    this.format = format;
    this.dateTimeValues = [];
    this.pagination = new Pagination(this.dateTimeValues, paginationVars);
    this.applied = false;
}

function DateTimeValue(value, timestamp, conflict) {
    this.value = value;
    this.timestamp = timestamp;
    this.conflict = conflict;
}

function DataModel(projectId, cellIndex) {
    this.projectId = projectId;
    this.cellIndex = cellIndex;
    this.originalColumn = null;
    this.resultColumn = new Column(null);
    this.formatColumns = [];
    this.predefinedFormats = ['dd-MM-yyyy', 'MM-dd-yyyy', 'dd/MM/yy', 'MM/dd/yy', 'dd/MM'];
    this.inputFormatToAdd = null;

    this.init = function (dataModel, addInputFormat) {
        //this.originalColumn.dateTimeValues.forEach(function (item, index) {
        //dataModel.resultColumn.dateTimeValues[index] = new DateTimeValue(item.value, item.timestamp, false);
        dataModel.predefinedFormats.forEach(function (item) {
            addInputFormat(dataModel, item);
        });
        this.paginate();
        //});
    };

    this.findConflicts = function () {
        var i;
        var valueCount;
        for (i = 0; i < this.originalColumn.dateTimeValues.length; i++) {
            valueCount = 0;
            this.formatColumns.forEach(function (item) {
                if (item.dateTimeValues[i].value) {
                    valueCount++;
                }
            });
            if (valueCount != 1) {
                this.originalColumn.dateTimeValues[i].conflict = true;
                this.resultColumn.dateTimeValues[i] = new DateTimeValue(null, null, true);
                this.formatColumns.forEach(function (item) {
                    item.dateTimeValues[i].conflict = true;
                });
            } else {
                this.originalColumn.dateTimeValues[i].conflict = false;
                this.resultColumn.dateTimeValues[i] = new DateTimeValue(this.originalColumn.dateTimeValues[i].value, this.originalColumn.dateTimeValues[i].timestamp, false);
                this.formatColumns.forEach(function (item) {
                    item.dateTimeValues[i].conflict = false;
                });
            }
        }
    };

    this.paginate = function () {
        this.formatColumns.forEach(function (item) {
            item.pagination.calculate();
        });
        this.originalColumn.pagination.calculate();
        this.resultColumn.pagination.calculate();
    };

    this.applyColumn = function (columnToApply, reformatResultColumn) {
        if (!columnToApply.applied) {
            columnToApply.applied = !columnToApply.applied;
            var conflictColumns = [];
            this.formatColumns.forEach(function (columnItem, index) {
                var conflict = false;
                if (columnItem != columnToApply) {
                    columnItem.dateTimeValues.forEach(function (item, index) {
                        if (columnToApply.dateTimeValues[index].value && item.value) {
                            conflict = true;
                        }
                    });
                }
                if (conflict) {
                    conflictColumns.push(columnItem);
                    //conflictColumns.push(columnToApply);
                }
            });
            conflictColumns.forEach(function (conflictItem) {
                conflictItem.applied = false;
            });
            columnToApply.dateTimeValues.forEach(function (item, index) {
                if (item.value) {
                    this.resultColumn.dateTimeValues[index] = new DateTimeValue(item.value, item.timestamp, false);
                }
            }.bind(this));
            this.paginate();
            reformatResultColumn(this);
        }

    };
}


function ServiceMethods(http) {
    this.http = http;
    this.getColumn = function (dataModel) {
        this.http.get('/command/timebench-extension/get-column?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex).success(function (dateTimeValues) {
            var column = new Column(null);
            dateTimeValues.forEach(function (entry) {
                var dateTimeValue = new DateTimeValue(entry.v, null, false);
                column.dateTimeValues.push(dateTimeValue);
            });
            dataModel.originalColumn = column;
            dataModel.init(dataModel, this.addInputFormat);
            dataModel.paginate();
        }.bind(this))
    };

    this.addInputFormat = function (dataModel, format) {
        var column;
        if (format) {
            column = new Column(format);
        } else {
            column = new Column(dataModel.inputFormatToAdd);
        }

        http.post('/command/timebench-extension/apply-input-format?cellIndex=' + dataModel.cellIndex + '&project=' + dataModel.projectId, column.format).success(function (dateTimeValueColumns) {
            console.log(column);
            if (dateTimeValueColumns.length > 0) {
                dateTimeValueColumns[0].reformatedColumn.forEach(function (entry) {
                    column.dateTimeValues.push(new DateTimeValue(entry.v, entry.timestamp, false));
                });
                dataModel.formatColumns.push(column);
                dataModel.findConflicts();
                dataModel.paginate();
            }
        });
        console.log(dataModel);

    };

    this.removeInputFormat = function (format, dataModel) {
        console.info('remove input format');
        dataModel.formatColumns.forEach(function (item, index, object) {
            if (item.format === format) {
                object.splice(index, 1);
            }
        });
        dataModel.findConflicts();
    };

    this.reformatResultColumn = function (dataModel) {
        http.post('/command/timebench-extension/apply-output-format', dataModel.resultColumn).success(function (resultColumn) {
            var column = new Column(resultColumn.format);
            resultColumn.dateTimeValues.forEach(function (item) {
                column.dateTimeValues.push(new DateTimeValue(item.value, item.timestamp, false));
            });
            column.pagination.calculate();
            dataModel.resultColumn = column;
        });
    }
}

var timeBenchExtensionApp = angular.module('timebenchExtension', ['ui.bootstrap']);

timeBenchExtensionApp.controller('timebenchExtensionCtrl', function ($scope, $http) {
    var dataModel = new DataModel(theProject.id, theProject.cellIndex);
    var serviceMethods = new ServiceMethods($http);
    serviceMethods.getColumn(dataModel);
    $scope.dataModel = dataModel;
    $scope.serviceMethods = serviceMethods;
});




