package org.extraction.reformat;

import org.joda.time.DateTime;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

/**
 * Created by droescher on 01.06.15.
 */
public class ReformatEntity {
    private int rowId;
    private DateTime dateTime;

    public ReformatEntity(int rowId, DateTime dateTime) {
        this.rowId = rowId;
        this.dateTime = dateTime;
    }

    public void writeTo(final JSONWriter json) throws JSONException {
        json.object();
        json.key("rowId");
        json.value(rowId);
        json.key("timestamp");
        json.value(dateTime.getMillis());
        json.endObject();
    }

    public static ReformatEntity reconstruct(JSONObject reformatEntity) throws Exception {
        int rowId = reformatEntity.getInt("rowId");
        long timestamp = reformatEntity.getInt("timestamp");
        ReformatEntity entity = new ReformatEntity(rowId, new DateTime(timestamp));
        return entity;
    }

    public DateTime getDateTime() {
        return dateTime;
    }

    @Override
    public String toString() {
        return dateTime.toString();
    }
}
