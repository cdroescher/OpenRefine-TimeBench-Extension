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
    private int columnId;
    private HashMap<String, DateTime> dateTimeFormatMap;

    enum ReformatState{
        NOT,
        UNIQUE,
        AMBIGIOUS
    }

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
        // TODO
    }

    public void setColumnId(int columnId) {
        this.columnId = columnId;
    }

    public void setRowId(int rowId) {
        this.rowId = rowId;
    }

    public void setDateTimeFormatMap(HashMap<String, DateTime> dateTimeFormatMap) {
        this.dateTimeFormatMap = dateTimeFormatMap;
    }

    @Override
    public String toString(){
        return dateTimeFormatMap.toString();
    }
}
