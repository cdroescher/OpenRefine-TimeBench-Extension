package org.extraction.reformat;

import com.google.refine.history.Change;
import com.google.refine.model.Cell;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import com.google.refine.model.Row;
import com.google.refine.model.changes.CellAtRow;
import com.google.refine.model.changes.ColumnAdditionChange;
import com.google.refine.model.changes.ColumnRemovalChange;
import com.google.refine.util.ParsingUtilities;
import com.google.refine.util.Pool;
import org.joda.time.DateTime;
import org.json.JSONException;
import org.json.JSONWriter;

import java.io.IOException;
import java.io.LineNumberReader;
import java.io.Writer;
import java.util.*;

public class DateFormatChange implements Change {

    public static final String OVERLAY_MODE_PROPERTY = "dateTimeFormatOverlayModel";
    public static final String OLD_DATE_TIME_FORMATS= "oldDateTime";
    public static final String NEW_DATE_TIME_FORMATS = "newDateTime";
    protected DateFormatsOverlayModel oldDateFormatsOverlayModel;
    protected DateFormatsOverlayModel newDateFormatsOverlayModel;
    private int newColumnIndex;

    public DateFormatChange(DateFormatsOverlayModel dateFormatsOverlayModel) {
        this.newDateFormatsOverlayModel = dateFormatsOverlayModel;
    }

    @Override
    public void apply(Project project) {
        synchronized (project) {
            this.oldDateFormatsOverlayModel = (DateFormatsOverlayModel) project.overlayModels.get(OVERLAY_MODE_PROPERTY);


            project.overlayModels.put(OVERLAY_MODE_PROPERTY, newDateFormatsOverlayModel);
            this.newColumnIndex = createColumn(project, newDateFormatsOverlayModel.getCurrentColumnToProcess());

            insertValues(project, this.newColumnIndex, newDateFormatsOverlayModel.getCurrentColumnToProcess());
            project.update();
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
            deleteColumns(project);
            project.update();
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

            if(line.contains(OLD_DATE_TIME_FORMATS)){
                String strippedString = line.substring(OLD_DATE_TIME_FORMATS.length(), line.length());
                if(strippedString.length()>0){
                    oldDateFormatsOverlayModel = DateFormatsOverlayModel.reconstruct(ParsingUtilities.evaluateJsonStringToObject(strippedString));
                }
            } else if(line.contains(NEW_DATE_TIME_FORMATS)){
                String strippedString = line.substring(NEW_DATE_TIME_FORMATS.length(), line.length());
                if(strippedString.length()>0){
                    newDateFormatsOverlayModel = DateFormatsOverlayModel.reconstruct(ParsingUtilities.evaluateJsonStringToObject(strippedString));
                }
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

    protected int createColumn(final Project project, ReformatColumn reformatColumn) {
        // Create empty cells that will populate each row
        final int rowCount = project.rows.size();
        final ArrayList<CellAtRow> emptyCells = new ArrayList<CellAtRow>(rowCount);
        for (int r = 0; r < rowCount; r++)
            emptyCells.add(new CellAtRow(r, null));

        // Create rows
        final int cellIndexes;
        final ColumnAdditionChange change;
        String nomeColonna = "[" + reformatColumn.getOriginColumn().getName() + "] " + newDateFormatsOverlayModel.getCurrentColumnIndex();
        change = new ColumnAdditionChange(nomeColonna, reformatColumn.getOriginColumn().getCellIndex()+1, emptyCells);
        change.apply(project);

        Column newColumn = project.columnModel.getColumnByName(nomeColonna);
        cellIndexes = newColumn.getCellIndex();
        reformatColumn.setNewColumn(newColumn);

        // Return cell indexes of created rows
        return cellIndexes;
    }

    protected void insertValues(final Project project, final int cellIndexes, ReformatColumn reformatColumn) {
        final List<Row> rows = project.rows;
        // Make sure there are rows
        if (rows.isEmpty())
            return;
        for (int i = 0; i < rows.size(); i++) {
            Row row = rows.get(i);
            HashMap<String, DateTime> dateTimeFormatMap = reformatColumn.getReformatEntityList().get(i).getDateTimeFormatMap();
            if (!dateTimeFormatMap.isEmpty()) {
                Iterator<DateTime> it = dateTimeFormatMap.values().iterator();
                DateTime dateTime = it.next();
                String out = null;
                if(dateTime!=null){
                    out = dateTime.toString(reformatColumn.getOutputFormat());
                }
                if (reformatColumn.getReformatEntityList().get(i).getState() == ReformatEntity.ReformatState.AMBIGIOUS) {
                    out = out + " ?";
                }
                row.cells.set(cellIndexes, new Cell(out, null));
            }
        }
        reformatColumn.setProcessed();
    }

    /**
     * Delete the columns where the named entities have been stored
     *
     * @param project The project
     */
    protected void deleteColumns(final Project project) {
        if(oldDateFormatsOverlayModel!=null){
            ArrayList<ReformatColumn> reformatOldColumnList = oldDateFormatsOverlayModel.getReformatColumnList();
            ArrayList<ReformatColumn> reformatNewColumnList = newDateFormatsOverlayModel.getReformatColumnList();
            ReformatColumn column = null;

            for(ReformatColumn reformatNewColumn : reformatNewColumnList){
                boolean exist = false;
                for(ReformatColumn reformatOldColumn : reformatOldColumnList){
                    if(reformatNewColumn == reformatOldColumn){
                        exist = true;
                        break;
                    }
                }
                if(!exist){
                    column = reformatNewColumn;
                    break;
                }
            }
            int columnIndex = project.columnModel.getColumnIndexByName(column.getNewColumn().getName());
            new ColumnRemovalChange(columnIndex).apply(project);
        }else{
            int columnIndex = project.columnModel.getColumnIndexByName(newDateFormatsOverlayModel.getCurrentColumnToProcess().getNewColumn().getName());
            new ColumnRemovalChange(columnIndex).apply(project);
        }
    }
}