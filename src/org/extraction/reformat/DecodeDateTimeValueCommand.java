package org.extraction.reformat;

import com.google.common.base.Joiner;
import com.google.refine.commands.EngineDependentCommand;
import com.google.refine.model.AbstractOperation;
import com.google.refine.model.Project;
import com.google.refine.model.Row;
import org.joda.time.DateTime;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by Christian on 11.08.15.
 */
public class DecodeDateTimeValueCommand extends EngineDependentCommand {

    @Override
    protected AbstractOperation createOperation(Project project, HttpServletRequest request, JSONObject engineConfig) throws Exception {
        for (Row row : project.rows) {
            for (int i = 0; i < row.cells.size(); i++) {
                Object cellValue = row.getCellValue(i);
                if (isDateCode(cellValue)) {
                    Map<String, DateTime> stringDateTimeMap = decodeDateTimeValue((String) cellValue);
                    Joiner joiner = Joiner.on("; ");
                    String dates = joiner.join(stringDateTimeMap.values());
                    row.setCell(i, new DateCell(dates, stringDateTimeMap, null));
                }
            }
        }
        return null;
    }

    private boolean isDateCode(Object cellValue) {
        if (cellValue instanceof String) {
            String value = (String) cellValue;
            if (value.contains("@@") || value.contains("@@@@")) {
                return true;
            }
        }
        return false;
    }

    private Map<String, DateTime> decodeDateTimeValue(String value) {
        String[] outerSplit = value.split("@@@@");
        String[] dateTimeFormats = outerSplit[0].split("@@");
        String[] dateTimeValues = outerSplit[1].split("@@");

        Map<String, DateTime> stringDateTimeHashMap = new HashMap<String, DateTime>();
        if (dateTimeFormats.length != dateTimeValues.length) {
            throw new RuntimeException("Wrong data model status.");
        }
        for (int i = 0; i < dateTimeFormats.length; i++) {
            stringDateTimeHashMap.put(dateTimeFormats[i], new DateTime(Long.valueOf(dateTimeValues[i])));
        }
        return stringDateTimeHashMap;
    }
}
