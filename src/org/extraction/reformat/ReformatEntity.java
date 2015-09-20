package org.extraction.reformat;

import com.google.refine.model.Cell;
import org.joda.time.DateTime;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by droescher on 01.06.15.
 */
public class ReformatEntity {
    private int rowId;
    private HashMap<String, DateTime> dateTimeFormatMap = new HashMap<String, DateTime>();
    private Cell cell;

    public ReformatEntity(Cell cell, int rowId) {
        this.cell = cell;
        this.rowId = rowId;
    }

    enum ReformatState {
        NOT,
        UNIQUE,
        AMBIGIOUS
    }

    public ReformatState getState() {
        if (dateTimeFormatMap.size() == 0) {
            return ReformatState.NOT;
        }
        if (dateTimeFormatMap.size() == 1) {
            return ReformatState.UNIQUE;
        }
        return ReformatState.AMBIGIOUS;
    }

    public void addReformatetDateTime(String format, DateTime dateTime) {
        dateTimeFormatMap.put(format, dateTime);
    }

    public HashMap<String, DateTime> getDateTimeFormatMap() {
        return dateTimeFormatMap;
    }

    public void writeTo(final JSONWriter json) throws JSONException {
        //json.array();
        json.object();

        json.key("format");
        json.array();
        for (Map.Entry<String, DateTime> entry : dateTimeFormatMap.entrySet()) {
            json.value(entry.getKey());
        }
        json.endArray();

        json.key("dateTimeValue");
        json.array();
        for (Map.Entry<String, DateTime> entry : dateTimeFormatMap.entrySet()) {
            if(entry.getValue()!=null){
                json.value(entry.getValue().getMillis());
            }else{
                json.value(null);
            }

        }
        json.endArray();
        ////json.endObject();

        ////json.object();
        json.key("rowId");
        json.value(rowId);
        json.endObject();
        //json.endArray();
    }

    public static ReformatEntity reconstruct(JSONObject reformatEntity) throws Exception {
        int rowId = reformatEntity.getInt("rowId");
        ReformatEntity entity = new ReformatEntity(null, rowId);
        JSONArray formatJson = reformatEntity.getJSONArray("format");
        JSONArray dateTimeValueJson = reformatEntity.getJSONArray("dateTimeValue");
        for (int j = 0; j < formatJson.length(); j++) {
            String format = formatJson.getString(j);
            DateTime dateTime = new DateTime(dateTimeValueJson.getLong(j));
            entity.getDateTimeFormatMap().put(format, dateTime);
        }
        return entity;
    }

    public Cell getCell() {
        return cell;
    }

    @Override
    public String toString() {
        return dateTimeFormatMap.toString();
    }
}
