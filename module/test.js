var data = {  };
var inputFormatArray=[];
inputFormatArray.push("dd-MM-yyyy");
data["inputFormats"] = inputFormatArray;
data["outputFormat"] = "MM";
data["column"] = "Column 1";
//Refine.postProcess('timebench-extension', 'date-reformation', data, {},
//    { rowsChanged: true, modelsChanged: true , includeEngine: false});

$.getJSON(
    "/command/core/get-models?" + $.param({ project: theProject.id }), null,
    function(data) {
        for (var n in data) {
            if (data.hasOwnProperty(n)) {
                theProject[n] = data[n];
            }
        }
    },
    'json'
);