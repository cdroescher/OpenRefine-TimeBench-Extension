package org.extraction.reformat;

import org.joda.time.DateTime;
import org.json.JSONException;
import org.json.JSONWriter;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by droescher on 01.06.15.
 */
public class ReformatEntity {
    private int rowId;

    public void setRowId(int rowId) {
        this.rowId = rowId;
    }

    public int getRowId() {
        return rowId;
    }

    enum ReformatState{
        NOT,
        UNIQUE,
        AMBIGIOUS
    }

    private HashMap<String, DateTime> dateTimeFormatMap = new HashMap<String, DateTime>();

    public ReformatState getState(){
        if(dateTimeFormatMap.size()==0){
            return ReformatState.NOT;
        }
        if(dateTimeFormatMap.size()==1){
            return ReformatState.UNIQUE;
        }
        return ReformatState.AMBIGIOUS;
    }

    public void addReformatEntity(String format, DateTime dateTime){
        dateTimeFormatMap.put(format, dateTime);
    }

    public HashMap<String, DateTime> getDateTimeFormatMap(){
        return dateTimeFormatMap;
    }

    public void writeTo(final JSONWriter json) throws JSONException {
        json.object();
        json.key("array");
        json.array();

        for(Map.Entry<String, DateTime> entry : dateTimeFormatMap.entrySet()){
            json.value(entry.getValue());
        }

        json.endArray();
        json.endObject();
    }

    @Override
    public String toString(){
        return dateTimeFormatMap.toString();
    }
}
