'use strict';

/* Controllers */

var timeBenchExtensionApp = angular.module('timebenchExtension', []);

timeBenchExtensionApp.controller('timebenchExtensionCtrl', function($scope, $http) {
    $http.get('model/model.json').success(function(openRefineModel) {
                // $scope.dateValues = openRefineModel.overlayModels.dateTimeFormatOverlayModel.reformatetColumns[0].reformatValues;
        $scope.dateValues = openRefineModel;
    });
});


