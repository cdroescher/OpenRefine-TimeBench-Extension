package org.extraction.reformat;

import com.google.common.base.Joiner;
import com.google.refine.expr.EvalError;
import com.google.refine.expr.ExpressionUtils;
import com.google.refine.model.Cell;
import com.google.refine.model.Recon;
import com.google.refine.util.Pool;
import org.joda.time.DateTime;
import org.json.JSONException;
import org.json.JSONWriter;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Created by Christian on 11.08.15.
 */
public class DateCell extends Cell {

    private Map<String, DateTime> dateTimeFormatMap;

    public DateCell(String value, Map<String, DateTime> dateTimeFormatMap, Recon recon) {
        super(value, recon);
        this.dateTimeFormatMap = dateTimeFormatMap;
    }

    public Map<String, DateTime> getDateTimeFormatMap() {
        return dateTimeFormatMap;
    }

    @Override
    public void write(JSONWriter writer, Properties options) throws JSONException {
        writer.object();
        if (ExpressionUtils.isError(value)) {
            writer.key("e");
            writer.value(((EvalError) value).message);
        } else {
            writer.key("v");
            if (value != null) {
                Joiner innerJoiner = Joiner.on("@@");
                Joiner outerJoiner = Joiner.on("@@@@");
                writer.value(outerJoiner.join(innerJoiner.join(dateTimeFormatMap.keySet()), innerJoiner.join(dateTimeFormatMap.values())));
            } else {
                writer.value(null);
            }
        }

        if (recon != null) {
            writer.key("r");
            writer.value(Long.toString(recon.id));
            Pool pool = (Pool) options.get("pool");
            pool.pool(recon);
        }
        writer.endObject();
    }
}
