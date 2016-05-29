QUnit.test( "HeatMap data preperation test", function( assert ) {
    var result = HeatMapDataPrepareModule.prepareDataForHeatMap(testData);
    assert.ok(result.column.length == 2, "Passed!");
    assert.ok( 1 == "1", "Passed!" );
});

