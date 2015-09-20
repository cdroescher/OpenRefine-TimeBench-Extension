package org.extraction.reformat;

import com.google.refine.model.Column;
import com.google.refine.model.OverlayModel;
import com.google.refine.model.Project;
import com.google.refine.util.ParsingUtilities;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

import java.util.ArrayList;
import java.util.Properties;

/**
 * Created by Christian on 16.08.15.
 */
public class DateFormatsOverlayModel implements OverlayModel {

    private ArrayList<ReformatColumn> reformatColumnList;

    public DateFormatsOverlayModel(ReformatColumn reformatColumn) {
        this.reformatColumnList = new ArrayList<ReformatColumn>();
        this.reformatColumnList.add(reformatColumn);
    }

    public DateFormatsOverlayModel(DateFormatsOverlayModel model) {
        this.reformatColumnList = new ArrayList<ReformatColumn>(model.reformatColumnList);
    }

    public void addColumn(ReformatColumn column) {
        this.reformatColumnList.add(column);
    }

    public ReformatColumn getCurrentColumnToProcess() {
        return reformatColumnList.get(reformatColumnList.size() - 1);
    }

    public int getCurrentColumnIndex(){
        return reformatColumnList.size();
    }

    public ArrayList<ReformatColumn> getReformatColumnList() {
        return reformatColumnList;
    }

    @Override
    public void onBeforeSave(Project project) {
        // TODO
    }

    @Override
    public void onAfterSave(Project project) {
        // TODO
    }

    @Override
    public void dispose(Project project) {
        // TODO
    }

    @Override
    public void write(JSONWriter writer, Properties options) throws JSONException {
        writer.object();
        writer.key("reformatetColumns");
        writer.array();
        for (ReformatColumn reformatColumn : reformatColumnList) {
            reformatColumn.write(writer);
        }
        writer.endArray();
        writer.endObject();
    }

    public static DateFormatsOverlayModel reconstruct(JSONObject jsonObject) throws Exception {

        JSONObject reformatetColumns = jsonObject.getJSONArray("reformatetColumns").getJSONObject(0);

        Column originColumn = Column.load(reformatetColumns.getJSONObject("originColumn").toString());
        Column newColumn = Column.load(reformatetColumns.getJSONObject("newColumn").toString());

        JSONObject formats = reformatetColumns.getJSONObject("formats");
        JSONArray inputFormats1 = formats.getJSONArray("inputFormats");
        String[] inputFormats = new String[inputFormats1.length()];
        for (int i = 0; i < inputFormats.length; i++) {
            inputFormats[i] = inputFormats1.getString(i);
        }
        String outputFormat = formats.getString("outputFormat");

        ReformatColumn reformatColumn = new ReformatColumn(inputFormats, outputFormat, originColumn);
        reformatColumn.setNewColumn(newColumn);
        JSONArray reformatValues = reformatetColumns.getJSONArray("reformatValues");
        for(int i=0; i<reformatValues.length(); i++){
            reformatColumn.addReformatEntity(ReformatEntity.reconstruct(reformatValues.getJSONObject(i)));
        }
        return new DateFormatsOverlayModel(reformatColumn);
    }

}
