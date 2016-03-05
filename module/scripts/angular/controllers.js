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
    this.predefinedFormats = ['dd-MM-yyyy', 'MM-dd-yyyy', 'dd/MM/yy', 'MM/dd/yy', 'dd/MM', 'dd.MM.yyyy hh:mm:ss', 'dd.MM.yyyy hh:mm'];
    this.inputFormatToAdd = null;

    this.init = function (dataModel, addInputFormat, scope) {
        this.originalColumn.dateTimeValues.forEach(function (item, index) {
            dataModel.resultColumn.dateTimeValues[index] = new DateTimeValue(null, null, true);
        });
        dataModel.predefinedFormats.forEach(function (item) {
            addInputFormat(dataModel, item, scope);
        });
        this.paginate();
    };

    this.findConflicts = function (reformatResultColumn) {
        var i;
        var valueCountList = [];
        for (i = 0; i < this.originalColumn.dateTimeValues.length; i++) {
            var valueCount = 0;
            this.formatColumns.forEach(function (item) {
                if (item.dateTimeValues[i].value) {
                    valueCount++;
                    if (item.applied) {
                        this.originalColumn.dateTimeValues[i].conflict = false;
                        this.resultColumn.dateTimeValues[i] = new DateTimeValue(item.dateTimeValues[i].value, item.dateTimeValues[i].timestamp, false);
                        this.formatColumns.forEach(function (item) {
                            item.dateTimeValues[i].conflict = false;
                        });
                    }
                }
            }.bind(this));
            valueCountList.push(valueCount);

            if (valueCount > 1) {
                this.formatColumns.forEach(function (item) {
                    if (item.dateTimeValues[i].value) {
                        item.dateTimeValues[i].conflict = true;
                    }
                }.bind(this));
            }

        }
        reformatResultColumn(this);
        this.paginate();
    };


    this.paginate = function () {
        this.formatColumns.forEach(function (item) {
            item.pagination.calculate();
        });
        this.originalColumn.pagination.calculate();
        this.resultColumn.pagination.calculate();
    };

    this.applyColumn = function (columnToApply, reformatResultColumn) {
        //if (!columnToApply.applied) {
        columnToApply.applied = true;
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
        reformatResultColumn(this);
    };
}

function ServiceMethods(http) {
    this.http = http;
    this.getColumn = function (dataModel, scope) {
        this.http.get('/command/timebench-extension/get-column?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex).success(function (dateTimeValues) {
            console.log('/command/timebench-extension/get-column?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex);
            var column = new Column(null);
            dateTimeValues.forEach(function (entry) {
                var dateTimeValue = new DateTimeValue(entry.v, null, false);
                column.dateTimeValues.push(dateTimeValue);
            });
            dataModel.originalColumn = column;
            dataModel.init(dataModel, this.addInputFormat.bind(this), scope);
            dataModel.paginate();
        }.bind(this))
    };

    this.addInputFormat = function (dataModel, format, scope) {
        var column;
        if (format) {
            column = new Column(format);
        } else {
            column = new Column(dataModel.inputFormatToAdd);
        }
        http.post('/command/timebench-extension/apply-input-format?cellIndex=' + dataModel.cellIndex + '&project=' + dataModel.projectId, column.format).success(function (dateTimeValueColumns) {
            console.log('/command/timebench-extension/apply-input-format?cellIndex=' + dataModel.cellIndex + '&project=' + dataModel.projectId);
            if (dateTimeValueColumns.length > 0) {
                dateTimeValueColumns[0].reformatedColumn.forEach(function (entry) {
                    column.dateTimeValues.push(new DateTimeValue(entry.v, entry.timestamp, false));
                });
                dataModel.formatColumns.push(column);
                dataModel.findConflicts(this.reformatResultColumn);
                this.reformatResultColumn(dataModel);
                dataModel.paginate();
            }
        }.bind(this));
        console.log(dataModel);
    };

    this.removeInputFormat = function (format, dataModel) {
        console.info('remove input format');
        dataModel.formatColumns.forEach(function (item, index, object) {
            if (item.format === format) {
                object.splice(index, 1);
            }
        });
        dataModel.findConflicts(this.reformatResultColumn);
        this.reformatResultColumn(dataModel);
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

    this.reformatResultColumn = function (dataModel) {
        http.post('/command/timebench-extension/apply-output-format', dataModel.resultColumn).success(function (resultColumn) {
            console.log('/command/timebench-extension/apply-output-format', dataModel.resultColumn);
            var column = new Column(resultColumn.format);
            resultColumn.dateTimeValues.forEach(function (item) {
                column.dateTimeValues.push(new DateTimeValue(item.value, item.timestamp, false));
            });
            dataModel.resultColumn = column;
            dataModel.paginate();
        });
    };

    this.applyToDataModel = function (dataModel) {
        http.post('/command/timebench-extension/apply-reformation-to-datamodel?project=' + dataModel.projectId + '&cellIndex=' + dataModel.cellIndex, dataModel.resultColumn).success(function (resultColumn) {
            console.log('/command/timebench-extension/apply-reformation-to-datamodel?project=' + dataModel.projectId);
            window.location = '/project?project=' + theProject.id;
        });
    }
}

function HeatMap(dataModel) {
    this.dataModel = dataModel;
    this.rect = null;
    this.svg = null;
    this.color = null;
    this.percent = d3.format(".1%");
    this.format = d3.time.format("%Y-%m-%d");
    this.width = 960;
    this.height = 136;
    this.cellSize = 17;
    this.heatmapData = [];
    this.yearRange = [];
    this.maxYear = null;
    this.minYear = null;

    this.init = function () {
        this.prepareDataForHeatmap();
        this.color = d3.scale.quantize()
            .domain([-.05, .05])
            .range(d3.range(11).map(function (d) {
                return "q" + d + "-11";
            }));

        this.svg = d3.select("#heatmap").selectAll("svg")
            // TODO get range
            .data(d3.range(this.minYear, this.maxYear+1))
            .enter().append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class", "RdYlGn")
            .append("g")
            .attr("transform", "translate(" + ((this.width - this.cellSize * 53) / 2) + "," + (this.height - this.cellSize * 7 - 1) + ")");

        this.svg.append("text")
            .attr("transform", "translate(-6," + this.cellSize * 3.5 + ")rotate(-90)")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d;
            });

        this.rect = this.svg.selectAll(".day")
            .data(function (d) {
                return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            })
            .enter().append("rect")
            .attr("class", "day")
            .attr("width", this.cellSize)
            .attr("height", this.cellSize)
            .attr("x", function (d) {
                return d3.time.weekOfYear(d) * this.cellSize;
            }.bind(this))
            .attr("y", function (d) {
                return d.getDay() * this.cellSize;
            }.bind(this))
            .datum(this.format);

        this.rect.append("title")
            .text(function (d) {
                return d;
            });

        this.svg.selectAll(".month")
            .data(function (d) {
                return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1));
            })
            .enter().append("path")
            .attr("class", "month")
            .attr("d", this.monthPath.bind(this));

        this.rect.filter(this.filterFunction.bind(this))
            .attr("class", this.getColor.bind(this))
            .select("title");
    };

    this.prepareDataForHeatmap = function () {
        var years = [];
        this.dataModel.formatColumns.forEach(function (d) {
            d.dateTimeValues.forEach(function (element) {
                if (element.timestamp) {
                    var date = new Date(Number(element.timestamp));
                    years.push(date.getFullYear());
                    this.heatmapData.push({day: this.format(date), count: 0.01});
                }
            }.bind(this));
        }.bind(this));
        this.maxYear = Math.max.apply( Math, years );
        this.minYear = Math.min.apply( Math, years );
    };


    this.getColor = function (d) {
        var value = 0;
        this.heatmapData.forEach(function (element) {
            if (element.day == d) {
                value = element.count;
            }
        });
        return "day " + this.color(value);
    };

    this.filterFunction = function (d) {
        var contains = false;
        this.heatmapData.forEach(function (element) {
            if (d == element.day) {
                contains = true;
            }
        });
        return contains;
    };

    this.monthPath = function (t0) {
        var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
            d0 = t0.getDay(), w0 = d3.time.weekOfYear(t0),
            d1 = t1.getDay(), w1 = d3.time.weekOfYear(t1);
        return "M" + (w0 + 1) * this.cellSize + "," + d0 * this.cellSize
            + "H" + w0 * this.cellSize + "V" + 7 * this.cellSize
            + "H" + w1 * this.cellSize + "V" + (d1 + 1) * this.cellSize
            + "H" + (w1 + 1) * this.cellSize + "V" + 0
            + "H" + (w0 + 1) * this.cellSize + "Z";
    }
}

var timeBenchExtensionApp = angular.module('timebenchExtension', ['ui.bootstrap']);

timeBenchExtensionApp.controller('timebenchExtensionCtrl', function ($scope, $http) {

    var dataModel = new DataModel(theProject.id, theProject.cellIndex);
    var serviceMethods = new ServiceMethods($http);
    serviceMethods.getColumn(dataModel, $scope);
    $scope.dataModel = dataModel;
    $scope.serviceMethods = serviceMethods;
    var heatMap = new HeatMap(dataModel)
    $scope.heatMap = heatMap;
});




