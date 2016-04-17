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
    };

    this.addHeatMaps = function (dataModel, heatMapList) {
        heatMapList.length = 0;
        $(".dayHeatMap").empty();
        dataModel.formatColumns.forEach(function (e, i) {
            var heatMap = new HeatMap(e, i);
            heatMap.init();
            heatMapList.push(heatMap);
        });
    };
}

function HeatMap(formatColumn, id) {
    this.formatColumn = formatColumn;
    this.rect = null;
    this.svg = null;
    this.color = null;
    this.percent = d3.format(".1%");
    this.format = d3.time.format("%Y-%m-%d");
    this.dayFormat = d3.time.format("%j");
    this.hourFormat = d3.time.format("%H");
    this.width = 960;
    this.height = 136;
    this.cellSize = 17;
    this.heatmapData = [];
    this.yearRange = [];
    this.maxYear = null;
    this.minYear = null;
    this.maxDayCount = 0;
    this.id = id;

    this.init = function () {
        this.prepareDataForHeatmap();
        new HeatMapDay(this.id, null);
        this.color = d3.scale.quantize()
            .domain([0, 1])
            .range(d3.range(11).map(function (d) {
                return "q" + d + "-11";
            }));

        $("#heatmap"+this.id+" text").remove();
        d3.select("#heatmap" + this.id)
            .append("text")
            .attr("transform", "translate(45, 25)")
            .text(function (d) {
                return this.heatmapData.format;
            }.bind(this));

        this.svg = d3.select("#heatmap" + this.id).selectAll("g")
            .data(d3.range(this.minYear, this.maxYear + 1))
            .enter().append("g")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class", "RdYlGn")
            .attr("transform", function (d) {
                return "translate(" + ((this.width - this.cellSize * 53) / 2) + "," + (((this.height - this.cellSize * 7 - 1) + 30) + ((d - this.minYear) * 160)) + ")";
            }.bind(this));

        $("#heatmap" + this.id).height(190 * (this.maxYear - this.minYear + 1));
        $("#heatmapContainer" + this.id).height(190 * (this.maxYear - this.minYear + 1));

        d3.select("#heatmap" + this.id)
            .append("text")
            .attr("transform", "translate(-6," + this.cellSize * 3.5 + ")rotate(-90)")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d;
            }.bind(this));

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

        // delete empty heatmaps
        for (var i = this.minYear; i <= this.maxYear; i++) {
            var exists = false;
            this.heatmapData.forEach(function (e) {
                if (this.format.parse(e.day).getFullYear() === i) {
                    exists = true;
                }
            }.bind(this));
            if (!exists) {
                var svg = $("svg");
                for (var j = 0; j < svg.length; j++) {
                    if (svg[j].__data__ === i) {
                        svg[j].remove();
                    }
                }
            }
        }

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
            .on('click', function (d) {
                console.log("enter");
                $("#dayHeatMap" + this.id).html("");
                var dayOfYear = this.dayFormat(new Date(d));
                var maxHourCount = 0;
                for (var hour in this.heatmapData[dayOfYear].hourCount) {
                    if (this.heatmapData[dayOfYear].hourCount[hour] > maxHourCount) {
                        maxHourCount = this.heatmapData[dayOfYear].hourCount[hour];
                    }
                }
                var hourCountRatio = 1 / maxHourCount;
                var heatMapDayData = [];
                for (hour in this.heatmapData[dayOfYear].hourCount) {
                    heatMapDayData.push({
                        'hour': hour,
                        count: hourCountRatio * this.heatmapData[dayOfYear].hourCount[hour]
                    });
                }
                new HeatMapDay(this.id, heatMapDayData, d);
            }.bind(this))
            .attr("class", this.getColor.bind(this))
            .select("title");
    };

    this.prepareDataForHeatmap = function () {
        var years = [];
        var dayCount = {};
        var hourCount = {};
        this.heatmapData.format = this.formatColumn.format;
        this.formatColumn.dateTimeValues.forEach(function (element) {
            if (element.timestamp) {
                var date = new Date(Number(element.timestamp));
                years.push(date.getFullYear());
                var dayOfYear = this.dayFormat(date);
                if (dayOfYear < 100) {
                    dayOfYear = dayOfYear.substring(1);
                }
                var hourOfDay = this.hourFormat(date);
                if (dayCount[dayOfYear]) {
                    dayCount[dayOfYear] = dayCount[dayOfYear] + 1;
                } else {
                    dayCount[dayOfYear] = 1;
                }

                if (!hourCount[dayOfYear]) {
                    hourCount[dayOfYear] = [];
                }
                if (hourCount[dayOfYear][hourOfDay]) {
                    hourCount[dayOfYear][hourOfDay] = hourCount[dayOfYear][hourOfDay] + 1;
                } else {
                    hourCount[dayOfYear][hourOfDay] = 1;
                }
                this.heatmapData.push({
                    dayOfYear: dayOfYear,
                    day: this.format(date),
                    count: 0.01,
                    hourCount: hourCount[dayOfYear]
                });
            }
        }.bind(this));

        for (var property in dayCount) {
            if (dayCount.hasOwnProperty(property)) {
                console.log(property);
                if (dayCount[property] > this.maxDayCount) {
                    this.maxDayCount = dayCount[property];
                }
            }
        }
        var ratio = 1 / this.maxDayCount;
        this.heatmapData.forEach(function (e) {
            e.count = dayCount[e.dayOfYear] * ratio;

        });
        this.maxYear = Math.max.apply(Math, years);
        this.minYear = Math.min.apply(Math, years);

        var cleanedHeatMapData = [];
        this.heatmapData.forEach(function (e) {
            cleanedHeatMapData[e.dayOfYear] = {day: e.day, count: e.count, hourCount: e.hourCount}
        });
        cleanedHeatMapData.format = this.heatmapData.format;
        this.heatmapData = cleanedHeatMapData;
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

function HeatMapDay(id, data1, day) {
    this.data = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    this.data1 = data1;
    this.width = 20;
    this.height = 20;
    this.id = "#dayHeatMap" + id;
    this.day = day;

    this.color = d3.scale.quantize()
        .domain([0, 1])
        .range(d3.range(11).map(function (d) {
            return "q" + d + "-11";
        }));

    this.x = d3.scale.linear()
        .domain([0, 24])
        .range([0, 420]);

    this.chart = d3.select(this.id)
        .attr("width", this.data.length * 30)
        .attr("height", this.height + 60);

    this.bar = this.chart.selectAll("g")
        .data(this.data)
        .enter().append("g")
        .attr("transform", function (d, i) {
            return "translate(" + (i * (this.width + 2) + 25) + ",30)";
        }.bind(this));

    this.bar.append("rect")
        .attr("width", 20)
        .attr("height", this.height)
        .attr("fill", "rgb(255,255,255)")
        .attr("stroke", "#ccc");

    this.getColor = function (d) {
        var value = 0;
        this.data1.forEach(function (element) {
            if (element.hour == d) {
                value = element.count;
            }
        });
        return "day " + this.color(value);
    };

    if (this.data1) {
        this.bar.select("rect").filter(function (d) {
            return this.data1.filter(function (e) {
                    return e.hour == d
                }).length != 0
        }.bind(this))
            .attr("class", this.getColor.bind(this));
    }

    this.chart.append("text")
        .attr("transform", "translate(45, 20)")
        .text(this.day);
    for (var i = 0; i <= 8; i++) {
        var hour;
        if((i*3)<10){
            hour = "0" + (i * 3) + ":00";
        }else {
            hour = i * 3 + ":00";
        }

        var x = 8 + (i * 66);
        this.chart.append("text")
            .attr("transform", "translate(" + x + ", 70)")
            .text(hour);
    }
}

var timeBenchExtensionApp = angular.module('timebenchExtension', ['ui.bootstrap']);

timeBenchExtensionApp.controller('timebenchExtensionCtrl', function ($scope, $http) {
    var dataModel = new DataModel(theProject.id, theProject.cellIndex);
    var serviceMethods = new ServiceMethods($http);
    serviceMethods.getColumn(dataModel, $scope);
    $scope.dataModel = dataModel;
    $scope.serviceMethods = serviceMethods;
    $scope.heatMapList = [];
});




