package org.extraction.reformat;

import com.google.refine.freebase.protograph.Protograph;
import com.google.refine.history.Change;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import com.google.refine.operations.EngineDependentOperation;
import com.google.refine.operations.OperationRegistry;
import com.google.refine.process.Process;
import com.google.refine.util.ParsingUtilities;
import com.google.refine.util.Pool;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;

import java.io.IOException;
import java.io.LineNumberReader;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Properties;

public class ReformatDateOperation extends EngineDependentOperation {

    private Column column;
    private String[] dateFormatList;
    private String dateOutputFormat;

    public ReformatDateOperation(Column column, String[] dateFormatList, String dateOutputFormat, final JSONObject engineConfig) {
        super(engineConfig);
        this.column = column;
        this.dateFormatList = dateFormatList;
        this.dateOutputFormat = dateOutputFormat;
    }

    @Override
    public void write(final JSONWriter writer, final Properties options) throws JSONException {
        writer.object();
        writer.key("op"); writer.value(OperationRegistry.s_opClassToName.get(this.getClass()));
        writer.key("description"); writer.value(getBriefDescription(null));
        // TODO writer.key("dateFormat"); dateFormatsOverlayModel.write(writer, options);
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

    static public class DateFormatChange implements Change {

        public static final String OVERLAY_MODE_PROPERTY = "dateTimeFormatModel";
        public static final String OLD_DATE_TIME_FORMATS= "oldDateTime";
        public static final String NEW_DATE_TIME_FORMATS = "newDateTime";
        protected DateFormatsOverlayModel oldDateFormatsOverlayModel;
        protected DateFormatsOverlayModel newDateFormatsOverlayModel;

        public DateFormatChange(DateFormatsOverlayModel dateFormatsOverlayModel) {
            this.newDateFormatsOverlayModel = dateFormatsOverlayModel;
        }

        @Override
        public void apply(Project project) {
            synchronized (project) {
                this.oldDateFormatsOverlayModel = (DateFormatsOverlayModel) project.overlayModels.get(OVERLAY_MODE_PROPERTY);
                project.overlayModels.put(OVERLAY_MODE_PROPERTY, newDateFormatsOverlayModel);
            }
        }

        @Override
        public void revert(Project project) {
            synchronized (project) {
                if (oldDateFormatsOverlayModel == null) {
                    project.overlayModels.remove(OVERLAY_MODE_PROPERTY);
                } else {
                    project.overlayModels.put(OVERLAY_MODE_PROPERTY, oldDateFormatsOverlayModel);
                }
            }
        }

        @Override
        public void save(Writer writer, Properties options) throws IOException {
            writer.write(NEW_DATE_TIME_FORMATS); writeOverlayModel(newDateFormatsOverlayModel, writer); writer.write('\n');
            writer.write(OLD_DATE_TIME_FORMATS); writeOverlayModel(oldDateFormatsOverlayModel, writer); writer.write('\n');
            writer.write("/ec/\n"); // end of change marker
        }

        static public Change load(LineNumberReader reader, Pool pool) throws Exception {
            DateFormatsOverlayModel oldDateFormatsOverlayModel = null;
            DateFormatsOverlayModel newDateFormatsOverlayModel = null;

            String line;
            while ((line = reader.readLine()) != null && !"/ec/".equals(line)) {
                int equal = line.indexOf('=');
                CharSequence field = line.subSequence(0, equal);
                String value = line.substring(equal + 1);

                if (OLD_DATE_TIME_FORMATS.equals(field) && value.length() > 0) {
                    oldDateFormatsOverlayModel = null; //TODO DateFormatsOverlayModel.reconstruct(ParsingUtilities.evaluateJsonStringToObject(value));
                } else if (NEW_DATE_TIME_FORMATS.equals(field) && value.length() > 0) {
                    newDateFormatsOverlayModel = null; //TODO DateFormatsOverlayModel.reconstruct(ParsingUtilities.evaluateJsonStringToObject(value));
                }
            }

            DateFormatChange change = new DateFormatChange(newDateFormatsOverlayModel);
            change.oldDateFormatsOverlayModel = oldDateFormatsOverlayModel;

            return change;
        }

        static protected void writeOverlayModel(DateFormatsOverlayModel p, Writer writer) throws IOException {
            if (p != null) {
                JSONWriter jsonWriter = new JSONWriter(writer);
                try {
                    p.write(jsonWriter, new Properties());
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}