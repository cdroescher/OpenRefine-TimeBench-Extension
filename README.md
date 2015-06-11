OpenRefine extension for operations on time oriented data
=================================================================

This extension is at the begin of development.

##Installation
0. Compile the source code using ant build in the extension/plugin folder
0. Follow the steps at https://github.com/OpenRefine/OpenRefine/wiki/Installing-Extensions

## Usage
0. Open „exampleInputDates.txt“ or create a project
0. Click on the button „date operations“ on the right upper corner
  0. select „reformat date“ from the drop down list
  	0. add several expected input formats
  	0. add one output format
	0. click on „reformat date“ for trigger the operation

For date formats you should use the abbreviations as are used for joda-time (http://www.joda.org/joda-time/):
d - day
M - month
m - minute
h - hour
…

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
