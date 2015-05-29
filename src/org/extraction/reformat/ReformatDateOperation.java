package org.extraction.reformat;

import com.google.refine.model.Column;
import com.google.refine.model.Project;
import com.google.refine.operations.EngineDependentOperation;
import com.google.refine.operations.OperationRegistry;
import com.google.refine.process.Process;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

import java.util.ArrayList;
import java.util.Properties;

public class ReformatDateOperation extends EngineDependentOperation {

    private final Column column;
    private final ArrayList<String> dateFormatList;
    private String dateOutputFormat;

    public ReformatDateOperation(final Column column, final ArrayList<String> dateFormatList, String dateOutputFormat, final JSONObject engineConfig) {
        super(engineConfig);
        this.column = column;
        this.dateFormatList = dateFormatList;
        this.dateOutputFormat = dateOutputFormat;
    }

    @Override
    public void write(final JSONWriter writer, final Properties options) throws JSONException {
        writer.object();
        writer.key("op");
        writer.value(OperationRegistry.s_opClassToName.get(getClass()));
        writer.key("description");
        writer.value(getBriefDescription(null));
        writer.key("engineConfig");
        writer.value(getEngineConfig());
        writer.key("column");
        writer.value(column.getName());

        writer.endObject();
    }

    @Override
    protected String getBriefDescription(final Project project) {
        return String.format("Reformat date in column %s", column.getName());
    }

    @Override
    public Process createProcess(final Project project, final Properties options) throws Exception {
        return new ReformateDateProcess(project, column, "reformatdate", dateFormatList, dateOutputFormat, this, getBriefDescription(project), getEngineConfig());
    }
}