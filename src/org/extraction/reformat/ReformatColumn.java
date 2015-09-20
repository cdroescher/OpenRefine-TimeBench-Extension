package org.extraction.reformat;

import com.google.refine.model.Column;
import org.json.JSONException;
import org.json.JSONWriter;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by Christian on 23.08.15.
 */
public class ReformatColumn {
    private String[] inputFormats;
    private String outputFormat;
    private List<ReformatEntity> reformatEntityList = new ArrayList<ReformatEntity>();
    private Column originColumn;
    private Column newColumn;
    private boolean isProcessed;

    public ReformatColumn(String[] inputFormats, String outputFormat, Column originColumn) {
        this.inputFormats = inputFormats;
        this.outputFormat = outputFormat;
        this.originColumn = originColumn;
        this.isProcessed = false;
    }

    public boolean isProcessed() {
        return isProcessed;
    }

    public Column getOriginColumn() {
        return originColumn;
    }

    public String[] getInputFormats() {
        return inputFormats;
    }

    public String getOutputFormat() {
        return outputFormat;
    }

    public void addReformatEntity(ReformatEntity reformatEntity){
        this.reformatEntityList.add(reformatEntity);
    }

    public List<ReformatEntity> getReformatEntityList() {
        return reformatEntityList;
    }


    public void setNewColumn(Column newColumn) {
        this.newColumn = newColumn;
    }

    public Column getNewColumn() {
        return newColumn;
    }

    public void setProcessed() {
        this.isProcessed = true;
    }

    public void write(JSONWriter writer) throws JSONException {
        writer.object();
        writer.key("newColumn");
        newColumn.write(writer, null);

        writer.key("originColumn");
        writer.object();
        writer.key("cellIndex"); writer.value(originColumn.getCellIndex());
        writer.key("originalName"); writer.value(originColumn.getOriginalHeaderLabel());
        writer.key("name"); writer.value(originColumn.getName());
        writer.endObject();


        writer.key("formats");
        writer.object();
        writer.key("inputFormats");
        writer.array();
        for(String inputFormat : inputFormats){
            writer.value(inputFormat);
        }
        writer.endArray();
        writer.key("outputFormat");
        writer.value(outputFormat);
        writer.endObject();

        writer.key("reformatValues");
        //writer.object();
        //writer.key("reformatEntity");
        writer.array();
        for(ReformatEntity entity : reformatEntityList){
            entity.writeTo(writer);
        }
        writer.endArray();
        // tODO
        //writer.endObject();

        writer.endObject();
    }
}
