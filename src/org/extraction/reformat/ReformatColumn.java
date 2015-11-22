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
    private String outputFormat;
    private List<ReformatEntity> reformatEntityList = new ArrayList<ReformatEntity>();
    private Column originColumn;
    private Column newColumn;


    public ReformatColumn( String outputFormat, Column originColumn) {
        this.outputFormat = outputFormat;
        this.originColumn = originColumn;
    }

    public Column getOriginColumn() {
        return originColumn;
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

    public void write(JSONWriter writer) throws JSONException {
        writer.object();
        writer.key("newColumn"); newColumn.write(writer, null);
        writer.key("originColumn"); originColumn.write(writer, null);
        writer.key("outputFormat"); writer.value(outputFormat);
        writer.endObject();
    }
}
