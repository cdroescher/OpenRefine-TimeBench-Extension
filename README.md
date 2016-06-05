OpenRefine extension for operations on time oriented data
=================================================================

This extension is at the begin of development.

## Usage
### column handling
0. To open the OpenRefine extension click on the column context menu and select "reformat time values"
![Image](https://github.com/cdroescher/OpenRefine-TimeBench-Extension/raw/master/docu/screenshots/1.png)

1. Default formats 'dd-MM-yyyy', 'MM-dd-yyyy', 'dd/MM/yy', 'MM/dd/yy', 'dd/MM', 'dd.MM.yyyy hh:mm:ss', 'dd.MM.yyyy hh:mm' are used out of the box
![Image](https://github.com/cdroescher/OpenRefine-TimeBench-Extension/raw/master/docu/screenshots/3.png)
Here you can see that only the formats 'dd.MM.yyyy hh:mm:ss' and 'dd.MM.yyyy hh:mm' are fitting to the input data.
At the end you want a result column with normalized time-oriented data. For that please click at the column header to get the selected columns into the results.

2. Please add a result format in the input field i.e.: 'dd.MM.yyyy hh:mm:ss', 'E dd.MM.yyyy hh:mm:ss' or 'dd.MM.yy hh:mm' and click on refresh.
![Image](https://github.com/cdroescher/OpenRefine-TimeBench-Extension/raw/master/docu/screenshots/2.png)

3. If the default formats are not fitting to your data you can add a custom input format
![Image](https://github.com/cdroescher/OpenRefine-TimeBench-Extension/raw/master/docu/screenshots/4.png)
please be aware of that if you add a input format which is not valid or doesn't fit to any value, then nothing will happen.

4. If you want apply the result column to your OpenRefine data model then click on 'apply to data model'

### visualization - heat map

For each column a heat map bundle can be shown by clicking on the colored rectangles. The more color opacity more values are existing for the corresponding time value.
![Image](https://github.com/cdroescher/OpenRefine-TimeBench-Extension/raw/master/docu/screenshots/5.png)


##Installation
0. Compile the source code using ant build in the extension/plugin folder
0. Follow the steps at https://github.com/OpenRefine/OpenRefine/wiki/Installing-Extensions

## for developing with IntelliJ IDEA (testet with version 13):
0. import project from existing sources
0. accept all suggestions

for following steps use the „project structure“ dialog window

0. set language level in „Project structure“ to „7.0 - Diamonds, ARM, Multi-catch, etc.“
0. add following libraries to „appengine“ module:
	0. com.google.appengine:appengine-api-1.0-sdk:1.9.12
	0. javax.jdo:jdo2-api:2.3-20090302111651

0. add joda-time:joda-time:2.8 as dependency to this openRefine extension
0. add module dependency „core“ to module „appengine“
0. add module dependency „core“ to module „server“
0. add module dependency „main“ to module „server“
0. add module dependency „core“ to module „server1“
0. add module dependency „main“ to module „server1“
0. start main class „com.google.refine.Refine“

please feel free to rename and rearrange the modules accordingly, because the suggestions of IntelliJ are unsightly in this case.
