package org.extraction.reformat;

import com.google.refine.history.Change;
import com.google.refine.model.Cell;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import com.google.refine.model.Row;
import com.google.refine.model.changes.CellAtRow;
import com.google.refine.model.changes.ColumnAdditionChange;
import com.google.refine.model.changes.ColumnRemovalChange;
import com.google.refine.util.JSONUtilities;
import com.google.refine.util.Pool;
import org.joda.time.DateTime;
import org.json.*;

import java.io.IOException;
import java.io.LineNumberReader;
import java.io.Writer;
import java.util.*;


public class ReformateDateChange implements Change {
    private int columnIndex;
    private String operation = "reformatOperation";
    private ArrayList<ReformatEntity> reformatEntityList;
    private List<Integer> addedRowIds;
    private String outputDateFormat;

    public ReformateDateChange(int columnIndex, String operation, String outputDateFormat, ArrayList<ReformatEntity> reformatEntityList) {
        this.columnIndex = columnIndex;
        this.operation = operation;
        this.addedRowIds = new ArrayList<Integer>();
        this.reformatEntityList = reformatEntityList;
        this.outputDateFormat = outputDateFormat;
    }


    @Override
    public void apply(final Project project) {
        int cellIndexes = createColumn(project);
        insertValues(project, cellIndexes, outputDateFormat);
        project.update();
    }

    @Override
    public void revert(Project project) {
        synchronized (project) {
            deleteRows(project);
            deleteColumns(project);
            project.update();
        }
    }

    /**
     * Delete the columns where the named entities have been stored
     *
     * @param project The project
     */
    protected void deleteColumns(final Project project) {

        new ColumnRemovalChange(columnIndex).apply(project);
    }


    /**
     * Insert the extracted named entities into rows with the specified cell indexes
     *  @param project     The project
     * @param cellIndexes The cell indexes of the rows that will contain the named entities
     * @param outputDateFormat
     */
    protected void insertValues(final Project project, final int cellIndexes, String outputDateFormat) {
        final List<Row> rows = project.rows;
        // Make sure there are rows
        if (rows.isEmpty())
            return;
        addedRowIds.clear();

        for (int i = 0; i < rows.size(); i++) {
            Row row = rows.get(i);
            HashMap<String, DateTime> dateTimeFormatMap = reformatEntityList.get(i).getDateTimeFormatMap();
            if (!dateTimeFormatMap.isEmpty()) {

                Iterator<DateTime> it = dateTimeFormatMap.values().iterator();
                String out = it.next().toString(outputDateFormat);

                if (reformatEntityList.get(i).getState() == ReformatEntity.ReformatState.AMBIGIOUS) {
                    out = out + " ?";
                }
                row.cells.set(cellIndexes, new Cell(out, null));
            }


        }

    }


    protected void deleteRows(final Project project) {
        final List<Row> rows = project.rows;
        // Traverse rows IDs in reverse, from high to low,
        // to avoid index shifts as rows get deleted.
        for (int i = addedRowIds.size() - 1; i >= 0; i--) {
            final int addedRowId = addedRowIds.get(i);
            if (addedRowId >= rows.size())
                throw new IndexOutOfBoundsException(String.format("Needed to remove row %d, "
                        + "but only %d rows were available.", addedRowId, rows.size()));
            rows.remove(addedRowId);
        }
        addedRowIds.clear();
    }


    protected int createColumn(final Project project) {
        // Create empty cells that will populate each row
        final int rowCount = project.rows.size();
        final ArrayList<CellAtRow> emptyCells = new ArrayList<CellAtRow>(rowCount);
        for (int r = 0; r < rowCount; r++)
            emptyCells.add(new CellAtRow(r, null));

        // Create rows
        final int cellIndexes;
        final ColumnAdditionChange change;
        String nomeColonna = "reformatet date";
        change = new ColumnAdditionChange(nomeColonna, columnIndex, emptyCells);
        change.apply(project);

        Column newColumn = project.columnModel.getColumnByName(nomeColonna);
        cellIndexes = newColumn.getCellIndex();

        // Return cell indexes of created rows
        return cellIndexes;
    }


    @Override
    public void save(final Writer writer, final Properties options) throws IOException {
//        final JSONWriter json = new JSONWriter(writer);
//
//        try {
//
//            json.object();
//            json.key("column");
//            json.value(this.columnIndex);
//            json.key("operation");
//            json.value(operation);
//            json.key("reformatEntityList");
//
//
//            for (ReformatEntity reformatEntity : reformatEntityList) {
//                reformatEntity.writeTo(json);
//            }
//
//
//
//            json.endObject();
//        } catch (JSONException error) {
//            throw new IOException(error);
//        }
    }

    static public Change load(LineNumberReader reader, Pool pool) throws Exception {
        /* Parse JSON line */
        final JSONTokener tokener = new JSONTokener(reader.readLine());
        final JSONObject changeJson = (JSONObject) tokener.nextValue();

        /* Simple properties */
        final int columnIndex = changeJson.getInt("column");
        final String operation = changeJson.getString("operation");


        //final String country = changeJson.getString("reformatEntityList");
        // TODO load JSON array because multiple input formats

        /* Objects array */
        final JSONArray dateTimeListJsonArray = changeJson.getJSONArray("reformatEntityList");
        final ReformatEntity[] reformatEntityArray = new ReformatEntity[dateTimeListJsonArray.length()];


        for (int i = 0; i < reformatEntityArray.length; i++) {

            JSONObject rowResults = dateTimeListJsonArray.getJSONObject(i);
            JSONArray jsonArray = rowResults.getJSONArray("array");
            reformatEntityArray[i] = new ReformatEntity();
            for (int j = 0; j < jsonArray.length(); j++) {
                reformatEntityArray[i].addReformatEntity(null, new DateTime(jsonArray.getString(j)));

            }
        }


    /* Reconstruct change object */
        final ReformateDateChange change = new ReformateDateChange(columnIndex, operation, null, new ArrayList<ReformatEntity>(Arrays.asList(reformatEntityArray)));

        for (final int addedRowId : JSONUtilities.getIntArray(changeJson, "addedRows"))
            change.addedRowIds.add(addedRowId);
        return change;
    }


}
