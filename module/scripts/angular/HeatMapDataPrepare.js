var HeatMapDataPrepareModule = (function (module) {
    module.prepareDataForHeatMap = function (data) {
        var result = {column:[], dayCount: 0};
        prepareDataForDayHeatMap(data, result);
        return result;
    };

    var prepareDataForDayHeatMap = function (data, result) {
        data.forEach(function (column, index) {
            var dayFormat = d3.time.format("%j");
            var yearFormat = d3.time.format("%Y");
            result.column[index] = {format: column.format, year: {}};
            column.dateTimeValues.forEach(function (element) {
                if (element.timestamp) {
                    var date = new Date(Number(element.timestamp));
                    var yeart = yearFormat(date);
                    var dayOfYear = dayFormat(date);
                    if(!result.column[index].year[yeart]){
                        result.column[index].year[yeart] = {
                            day: {},
                            count: 1
                        }
                    }else{
                        result.column[index].year[yeart].count += 1;
                        result.dayCount += 1;
                    }
                    if (!result.column[index].year[yeart].day[dayOfYear]) {
                        result.column[index].year[yeart].day[dayOfYear] = {
                            hour: {},
                            count: 1
                        };
                    }else{
                        result.column[index].year[yeart].day[dayOfYear].count += 1;
                    }
                    prepareDataForHourHeatMap(date, result.column[index].year[yeart].day[dayOfYear]);
                }
            });
        });
    };

    var prepareDataForHourHeatMap = function (date, day) {
        var hourFormat = d3.time.format("%H");
        var hourOfDay = hourFormat(date);
        if (!day.hour[hourOfDay]) {
            day.hour[hourOfDay] = {count: 1, minute: {}};
        } else {
            day.hour[hourOfDay].count += 1;
        }
        prepareDataForMinuteHeatMap(date, day.hour[hourOfDay])

    };

    var prepareDataForMinuteHeatMap = function (date, hour) {
        var minuteFormat = d3.time.format("%M");
        var minuteOfHour = minuteFormat(date);
        if (!hour.minute[minuteOfHour]) {
            hour.minute[minuteOfHour] = {count: 1, second: {}};
        } else {
            hour.minute[minuteOfHour].count += 1;
        }
        prepareDataForSecondHeatMap(date, hour.minute[minuteOfHour]);
    };

    var prepareDataForSecondHeatMap = function (date, minute) {
        var secondFormat = d3.time.format("%S");
        var secondOfMinute = secondFormat(date);
        if (!minute.second[secondOfMinute]) {
            minute.second[secondOfMinute] = 1;
        } else {
            minute.second[secondOfMinute] += 1;
        }
    };

    return module;
}(HeatMapDataPrepareModule || {}));

