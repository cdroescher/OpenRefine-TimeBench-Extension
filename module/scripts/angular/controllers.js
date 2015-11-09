'use strict';

/* Controllers */

function markValues(scope, element) {
    var fieldNames = ['value', 'reformatedValue1', 'dateValue'];
    fieldNames.forEach(function(fieldVar) {
        if (scope[fieldVar] != undefined) {
            if (scope[fieldVar].v != null) {
                if (!scope.result.resultValues[scope.$index]) {
                    $(element).attr('class','ambigiuosValue');//css('background-color', 'red');
                } else {
                    $(element).attr('class','uniqueValue');
                }
            }
        }
    });
}

var timeBenchExtensionApp = angular.module('timebenchExtension', [])
    .directive('myRepeatDirective', function () {
        return function (scope, element) {
            markValues(scope, element);
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


timeBenchExtensionApp.controller('timebenchExtensionCtrl', function ($scope, $http) {

    $http.get('/command/timebench-extension/get-column?columnIndex=0&project=' + theProject.id).success(function (column) {
        $http.get('/command/timebench-extension/reformat-column?columnIndex=0&project=' + theProject.id).success(function (openRefineModel) {
            $scope.reformatedValues = openRefineModel;
            $scope.result = findAmbigiouosFormats(openRefineModel);
            $scope.dateValues = column
            $scope.applyValue = function($event, ambigiuosFormatValue){
                $($event.target).attr('class','activatedFormat')
                $($event.target).siblings().each(function(){
                    if($(this).attr('class')=='activatedFormat'){
                        $(this).removeAttr('class');
                    }
                });

            }
        });
    });
});




