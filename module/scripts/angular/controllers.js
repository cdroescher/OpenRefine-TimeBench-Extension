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

    this.findMaxDayCount = function () {
        var dayCount = [];
        var years = [];
        var dayFormat = d3.time.format("%j");
        var maxDayCount = 0;
        this.formatColumns.forEach(function (formatColumn) {
            dayCount.length = 0;
            formatColumn.dateTimeValues.forEach(function (element) {
                if (element.timestamp) {
                    var date = new Date(Number(element.timestamp));
                    years.push(date.getFullYear());
                    var dayOfYear = Number(dayFormat(date));
                    if (dayCount[dayOfYear]) {
                        dayCount[dayOfYear] = dayCount[dayOfYear] + 1;
                    } else {
                        dayCount[dayOfYear] = 1;
                    }
                }
            });
            for (var property in dayCount) {
                if (dayCount.hasOwnProperty(property)) {
                    if (dayCount[property] > maxDayCount) {
                        maxDayCount = dayCount[property];
                    }
                }
            }
        });


        return maxDayCount;
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



function HeatMap(column, id, dayCount) {
    this.rect = null;
    this.svg = null;
    this.color = null;
    this.percent = d3.format(".1%");
    this.format = d3.time.format("%Y-%m-%d");
    this.width = 960;
    this.height = 136;
    this.cellSize = 17;
    this.id = id;

    this.init = function () {
        // remove count key with shift()
        var minYear = Math.min(Object.keys(column.year).shift());
        var maxYear = Math.max(Object.keys(column.year).shift());

        this.color = d3.scale.quantize()
            .domain([0, 1])
            .range(d3.range(11).map(function (d) {
                return "q" + d + "-11";
            }));

        //$("#heatmap"+this.id+" text").remove();


        this.svg = d3.select("#heatmap" + this.id).selectAll("g")
            .data(d3.range(minYear, maxYear + 1))
            .enter().append("g")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("class", "RdYlGn")
            .attr("transform", function (d) {
                return "translate(" + ((this.width - this.cellSize * 53) / 2) + "," + (((this.height - this.cellSize * 7 - 1) + 30) + ((d - minYear) * 160)) + ")";
            }.bind(this));

        $("#heatmap" + this.id).height(190 * (this.maxYear - this.minYear + 1));
        $("#heatmapContainer" + this.id).height(190 * (this.maxYear - this.minYear + 1));

        this.svg.append("text")
            .attr("transform", "translate(-6," + this.cellSize * 3.5 + ")rotate(-90)")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d;
            }.bind(this));

        this.svg.append("text")
            .attr("transform", "translate(80, -20)")
            .style("text-anchor", "middle")
            .text(function (d) {
                return column.format;
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
            }.bind(this));
        //.datum(this.format);


        // delete empty heatmaps
        for (var i = minYear; i <= maxYear; i++) {
            if (!i in column.year) {
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

        this.getColor = function (d) {
            var ratio = 1 / dayCount;
            var formatDay = d3.time.format("%j");
            for (var day in column.year[d.getFullYear()].day) {
                if (formatDay(d) == day) {
                    return "day " + this.color(column.year[d.getFullYear()].day[day].count * ratio);
                }
            }
        };

        this.rect.filter(this.filterFunction.bind(this))
            .on('click', function (selectedDay) {
                $("#dayHeatMap" + this.id).html("");
                new HeatMapHours(this.id, column, selectedDay);
            }.bind(this))
            .attr("class", this.getColor.bind(this))
            .select("title");


    };

    this.filterFunction = function (d) {
        var contains = false;
        var formatDay = d3.time.format("%j");
        for (var day in column.year[d.getFullYear()].day) {
            if (formatDay(d) == day) {
                contains = true;
            }
        }
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

function HeatMapHours(id, column, selectedDay) {
    this.data = [];
    for (var i = 0; i < 24; i++) {
        this.data.push(i);
    }
    this.width = 17;
    this.height = 17;
    this.id = "#dayHeatMap" + id;

    this.color = d3.scale.quantize()
        .domain([0, 1])
        .range(d3.range(11).map(function (d) {
            return "q" + d + "-11";
        }));

    this.x = d3.scale.linear()
        .domain([0, 24])
        .range([0, 420]);

    this.chart = d3.select(this.id)
        .attr("width", 100)
        .attr("height", 200);

    this.bar = this.chart.selectAll("g")
        .data(this.data)
        .enter().append("g")
        .attr("transform", function (d, i) {
            var x = Math.ceil((i + 1) / 6) * this.width;
            var y = (i % 6 * this.height) + 57;
            return "translate(" + x + "," + y + ")";
        }.bind(this));

    this.getColor = function (hourElement) {
        var day = d3.time.format("%j")(selectedDay);
        for (var hour in column.year[selectedDay.getFullYear()].day[day].hour) {
            if (hourElement == hour) {
                return this.color(column.year[selectedDay.getFullYear()].day[day].hour[hour].count);
            }
        }
    };

    this.bar.append("rect")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("fill", "rgb(255,255,255)")
        .attr("stroke", "#ccc")
        .attr("class", this.getColor.bind(this));

    this.filterFunction = function (hourElement) {
        var contains = false;
        var day = d3.time.format("%j")(selectedDay);
        for (var hour in column.year[selectedDay.getFullYear()].day[day].hour) {
            if (hourElement == hour) {
                contains = true;
            }
        }
        return contains;
    };

    this.bar.filter(this.filterFunction)
        .on('click', function (d) {
            $("#dayHeatMapHour" + id).html("");
            //TODO
            new HeatMapMinutes("#dayHeatMapHour" + id, day, d);
        }.bind(this))
        .select("title");


    this.chart.append("text")
        .attr("transform", "translate(45, 20)")
        .text(selectedDay);
}

function HeatMapMinutes(id, data1, selectedRect) {
    this.data = [];
    this.width = 17;
    this.height = 17;
    for (var i = 0; i < 60; i++) {
        this.data.push(i);
    }

    this.color = d3.scale.quantize()
        .domain([0, 1])
        .range(d3.range(11).map(function (d) {
            return "q" + d + "-11";
        }));

    this.x = d3.scale.linear()
        .domain([0, 24])
        .range([0, 420]);

    this.chart = d3.select(id)
        .attr("width", 200)
        .attr("height", 200);

    this.bar = this.chart.selectAll("g")
        .data(this.data)
        .enter().append("g")
        .attr("transform", function (d, i) {
            var x = Math.ceil((i + 1) / 6) * this.width;
            var y = (i % 6 * this.height) + 57;
            return "translate(" + x + "," + y + ")";
        }.bind(this));

    this.bar.append("rect")
        .attr("width", this.width)
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

    this.chart.append("text")
        .attr("transform", "translate(45, 20)")
        .text(selectedRect);
}


var timeBenchExtensionApp = angular.module('timebenchExtension', ['ui.bootstrap']);

timeBenchExtensionApp.controller('timebenchExtensionCtrl', function ($scope, $http) {
    var dataModel = new DataModel(theProject.id, theProject.cellIndex);
    serviceModule.init($http);
    serviceModule.getColumn(dataModel, $scope);
    $scope.dataModel = dataModel;
    $scope.serviceModule = serviceModule;
    $scope.heatMapList = [];
});




