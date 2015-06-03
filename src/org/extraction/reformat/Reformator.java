package org.extraction.reformat;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

import java.util.ArrayList;
import java.util.Map;

/**
 * Created by droescher on 01.06.15.
 */
public class Reformator {


    public ArrayList<ReformatEntity> reformatDateTime(ArrayList<String> inputFormats, Map<Integer, String> originDateTimes) {
        ArrayList<ReformatEntity> resultList = new ArrayList<ReformatEntity>();

        for (Map.Entry<Integer, String> originDateTime : originDateTimes.entrySet()) {
            ReformatEntity reformatEntity = new ReformatEntity();
            reformatEntity.setRowId(originDateTime.getKey());
            for (String inputFormat : inputFormats) {
                DateTimeFormatter dateStringFormat = DateTimeFormat.forPattern(inputFormat);
                try {
                    DateTime time = dateStringFormat.parseDateTime(originDateTime.getValue());
                    reformatEntity.addReformatEntity(inputFormat, time);
                } catch (IllegalArgumentException ex) {
                    // nothing to do
                }
            }
            resultList.add(reformatEntity);

        }

        return resultList;
    }
}
