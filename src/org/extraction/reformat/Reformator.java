package org.extraction.reformat;

import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

/**
 * Created by droescher on 01.06.15.
 */
public class Reformator {

    public void reformatDateTime(ReformatColumn column) {
        for (ReformatEntity entity : column.getReformatEntityList()) {
            for (String inputFormat : column.getInputFormats()) {
                DateTimeFormatter dateStringFormat = DateTimeFormat.forPattern(inputFormat);
                try {
                    DateTime time;
                    if (entity.getCell() != null) {
                        time = dateStringFormat.parseDateTime((String) entity.getCell().value);
                        entity.addReformatetDateTime(inputFormat, time);
                    } else {
                        entity.addReformatetDateTime(inputFormat, null);
                    }
                } catch (IllegalArgumentException ex) {
                    // nothing to do
                }
            }
        }
    }
}
