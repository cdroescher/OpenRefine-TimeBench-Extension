package org.extraction.operations;

import com.google.refine.model.AbstractOperation;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import com.google.refine.operations.EngineDependentOperation;
import com.google.refine.operations.OperationRegistry;
import com.google.refine.process.Process;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

import java.util.Properties;

public class DateReformateOperation extends EngineDependentOperation {

    private final Column column;
    private final String tipOp;
    private final String dateFormat;

    public DateReformateOperation(final Column column, final String tipOp, final String dateFormat, final JSONObject engineConfig) {
        super(engineConfig);
        this.column = column;
        this.tipOp = tipOp;
        this.dateFormat = dateFormat;

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
        writer.key("tipOp");
        writer.value(tipOp);

        writer.endObject();
    }

    @Override
    protected String getBriefDescription(final Project project) {
        return String.format("Extracting " + tipOp + " in column %s", column.getName());
    }

    @Override
    public Process createProcess(final Project project, final Properties options) throws Exception {
        return new DateReformateProcess(project, column, tipOp, dateFormat, this, getBriefDescription(project), getEngineConfig());
    }
}