package org.extraction.reformat;

import com.google.refine.history.Change;
import com.google.refine.model.*;
import com.google.refine.model.changes.CellAtRow;
import com.google.refine.model.changes.ColumnAdditionChange;
import com.google.refine.model.changes.ColumnRemovalChange;
import com.google.refine.operations.EngineDependentOperation;
import com.google.refine.operations.OperationRegistry;
import com.google.refine.process.Process;
import com.google.refine.util.Pool;
import org.joda.time.DateTime;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

import java.io.IOException;
import java.io.LineNumberReader;
import java.io.Writer;
import java.util.*;

public class ReformatDateOperation extends EngineDependentOperation {


    private final DateFormatsOverlayModel model;
    private final String column;


    public ReformatDateOperation(DateFormatsOverlayModel model, String column, final JSONObject engineConfig) {
        super(engineConfig);
        this.model = model;
        this.column = column;
    }

    @Override
    public void write(final JSONWriter writer, final Properties options) throws JSONException {
        writer.object();
        writer.key("op"); writer.value(OperationRegistry.s_opClassToName.get(this.getClass()));
        writer.key("description"); writer.value(getBriefDescription(null));
        writer.key("dateFormat"); model.write(writer, options);
        writer.endObject();
    }

    @Override
    protected String getBriefDescription(final Project project) {
        return String.format("Reformat date in column %s", column);
    }

    @Override
    public Process createProcess(final Project project, final Properties options) throws Exception {
        return new ReformateDateProcess(project, model, this, getBriefDescription(project), getEngineConfig());
    }


}