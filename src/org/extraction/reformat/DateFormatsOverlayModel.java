package org.extraction.reformat;

import com.google.refine.model.Column;
import com.google.refine.model.OverlayModel;
import com.google.refine.model.Project;
import org.json.JSONException;
import org.json.JSONWriter;

import java.util.ArrayList;
import java.util.Properties;

/**
 * Created by Christian on 16.08.15.
 */
public class DateFormatsOverlayModel implements OverlayModel {

    ArrayList<ReformatEntity> reformatEntityArrayList;

    public DateFormatsOverlayModel(Column column, String[] dateFormatList, String dateOutputFormat, ArrayList<ReformatEntity> reformatEntityArrayList) {

        this.reformatEntityArrayList = reformatEntityArrayList;
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
        // TODO
    }
}
