'use strict';

/* Controllers */


var timeBenchExtensionApp = angular.module('timebenchExtension', ['ui.bootstrap'])
    .directive('myRepeatDirective', function () {
        return {
            link: function (scope, element) {
                var fieldNames = ['dateValue', 'resultValue', 'reformatedValue1'];
                fieldNames.forEach(function (fieldVar) {
                    if (scope[fieldVar]) {
                        if (scope[fieldVar].v) {
                            if (scope.filteredValues) {
                                if (!scope.filteredValues[scope.$index].v) {
                                    $(element).addClass('ambigiuosValue');
                                } else {
                                    $(element).addClass('uniqueValue');
                                }
                            }
                        }
                    }
                });
            }
        }
    });

function cleanArrayFromDoubleValues(ambigiuosFormats) {
    var last = [];
    var newValue = [];
    ambigiuosFormats.forEach(function (entry) {

        var doubleValue = true;
        if (last.length == 0) {
            doubleValue = false;
        }
        for (var ii = 0; ii < last.length; ii++) {
            if (last[ii] != entry[ii]) {
                doubleValue = false;
            }
        }
        if (doubleValue == false) {
            newValue.push(entry);
        }
        last = entry;
    });
    return newValue;
}

function findAmbigiouosFormats(openRefineModel) {
    var result = {};
    result.ambigiuosFormats = [];
    result.resultValues = [];
    for (var ii = 0; ii < openRefineModel[0].reformatedColumn.length; ++ii) {
        result.ambigiuosFormats[ii] = [];
        for (var i = 0; i < openRefineModel.length; ++i) {
            if (openRefineModel[i].reformatedColumn[ii].v != null) {
                result.ambigiuosFormats[ii].push(openRefineModel[i].format)
            }
        }
        result.resultValues[ii] = {v: null, timestamp: null};
        if (result.ambigiuosFormats[ii].length < 2) {
            for (var i = 0; i < openRefineModel.length; ++i) {
                if (openRefineModel[i].reformatedColumn[ii].v != null) {
                    result.resultValues[ii] = openRefineModel[i].reformatedColumn[ii];
                }
            }
            result.ambigiuosFormats.splice(ii, 1);
        }
    }
    result.ambigiuosFormats = cleanArrayFromDoubleValues(result.ambigiuosFormats);
    return result;
}


timeBenchExtensionApp.controller('timebenchExtensionCtrl', function ($scope, $http, $log) {
    $scope.pagination = {"maxSize": 5, "currentPage": 1, "numPerPage": 30};
    $scope.Math = window.Math;
    var test2 = function () {
        var begin = (($scope.pagination.currentPage - 1) * $scope.pagination.numPerPage);
        var end = begin + $scope.pagination.numPerPage;
        $scope.filteredDateValues = $scope.dateValues.slice(begin, end);
        if ($scope.result) {
            $scope.filteredValues = $scope.result.resultValues.slice(begin, end);
            for (var i = 0; i < $scope.reformatedValues.length; i++) {
                $scope.reformatedValues[i].filteredReformatedColumn = $scope.reformatedValues[i].reformatedColumn.slice(begin, end)
            }
        }
    };


    $scope.inputFormat = {'formats': []};
    $scope.removeInputFormat = function (index) {
        $scope.inputFormat.formats.splice(index, 1);
        applyInputFormat();
        test2();
    };

    $scope.addInputFormat = function () {
        $scope.inputFormat.formats.push($('#inputFormat').val());
        applyInputFormat();
        test2();
    };

    $scope.refresh = function () {
        applyOutputFormat();
    };

    function applyOutputFormat() {
        $scope.result.resultFormat = $('#outputFormat').val();
        $scope.result.column = 0;
        $scope.result.project = theProject.id;
        $http.post('/command/timebench-extension/apply-format', $scope.result).success(function (appliedResultFormat) {
            for (var i = 0; i < appliedResultFormat.resultValues.length; i++) {
                if (appliedResultFormat.resultValues[i] != undefined) {
                    $scope.result.resultValues[i] = {
                        v: appliedResultFormat.resultValues[i].v,
                        timestamp: appliedResultFormat.resultValues[i].timestamp
                    };
                }
            }
            test2();
        });
        test2();
    }

    function addSelectedInputFormatToResultColumn(selectedFormat) {
        for (var i = 0; i < $scope.reformatedValues.length; i++) {
            if ($scope.reformatedValues[i].format == selectedFormat.replace(/^\s+|\s+$/g, '').trim()) {
                for (var ii = 0; ii < $scope.reformatedValues[i].reformatedColumn.length; ii++) {
                    if ($scope.reformatedValues[i].reformatedColumn[ii].v != null) {
                        $scope.result.resultValues[ii] = {
                            v: $scope.reformatedValues[i].reformatedColumn[ii].v,
                            timestamp: $scope.reformatedValues[i].reformatedColumn[ii].timestamp
                        };
                    }
                }
            }
        }
    }

    function selectFormatFromBox($event) {
        $($event.target).addClass('activatedFormat');
        $($event.target).siblings().each(function () {
            if ($(this).hasClass('activatedFormat')) {
                $(this).removeClass('activatedFormat');
            }
        });
        var selectedFormat = $($event.target).text();
        return selectedFormat;
    }

    function applyValue($event) {
        var selectedFormat = selectFormatFromBox($event);
        addSelectedInputFormatToResultColumn(selectedFormat);
        applyOutputFormat();
    }

    function applyInputFormat() {
        $http.post('/command/timebench-extension/reformat-column?columnIndex=0&project=' + theProject.id, $scope.inputFormat).success(function (openRefineModel) {
            $scope.result = findAmbigiouosFormats(openRefineModel);
            $scope.reformatedValues = openRefineModel;
            $scope.applyValue = applyValue;
            if ($scope.result.ambigiuosFormats.length == 0) {
                applyOutputFormat()
            }
        });
    }

    $scope.applyToDataModel = function () {
        $http.post('/command/timebench-extension/apply-reformation', $scope.result).success(function () {
            document.location.href = "/project?project=" + theProject.id
        });
    };

    $http.get('/command/timebench-extension/get-column?columnIndex=0&project=' + theProject.id).success(function (column) {
        $scope.dateValues = column;
        test2();
    });

    $scope.pageChanged = function () {
        $log.log('Page changed to: ' + $scope.pagination.currentPage);
        test2();
    };
});




