package org.extraction.operations;

import com.google.refine.history.Change;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import com.google.refine.model.Row;
import com.google.refine.model.changes.CellAtRow;
import com.google.refine.model.changes.ColumnAdditionChange;
import com.google.refine.model.changes.ColumnRemovalChange;
import com.google.refine.util.JSONUtilities;
import com.google.refine.util.Pool;
import org.json.*;

import java.io.IOException;
import java.io.LineNumberReader;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;


public class DateReformateChange implements Change {
    private final int columnIndex;
    private final DateEntity[] objects;
    private final String operation;
    private final String datePattern;
    private final List<Integer> addedRowIds;

    public DateReformateChange(final int columnIndex, final String operation, final String datePattern, final DateEntity[] objects) {
        this.columnIndex = columnIndex;
        this.operation = operation;
        this.objects = objects;
        this.addedRowIds = new ArrayList<Integer>();
        this.datePattern = datePattern;
    }


    @Override
    public void apply(final Project project) {
        final int cellIndexes = createColumn(project);
        insertValues(project, cellIndexes);
        project.update();
    }

    @Override
    public void revert(final Project project) {
        synchronized (project) {
            deleteRows(project);
            deleteColumns(project);
            project.update();
        }
    }

    public void save(final Writer writer, final Properties options) throws IOException {
        final JSONWriter json = new JSONWriter(writer);
        try {
            json.object();
            json.key("column");
            json.value(this.columnIndex);
            json.key("operation");
            json.value(this.operation);
            json.key("country");
            json.value(this.datePattern);

            json.key("objects");

            /* Objects array */
            {
                json.array();
                /* Rows array */
                for (final DateEntity ogg : objects) {
                    /* Objects finded */
                    ogg.writeTo(json);
                }
                json.endArray();
            }
            json.key("addedRows");

            /* Added row numbers array */
            {
                json.array();
                for (Integer addedRowId : addedRowIds)
                    json.value(addedRowId.intValue());
                json.endArray();
            }

            json.endObject();
        } catch (JSONException error) {
            throw new IOException(error);
        }
    }

    static public Change load(LineNumberReader reader, Pool pool) throws Exception {
        /* Parse JSON line */
        final JSONTokener tokener = new JSONTokener(reader.readLine());
        final JSONObject changeJson = (JSONObject) tokener.nextValue();
        
        /* Simple properties */
        final int columnIndex = changeJson.getInt("column");
        final String operation = changeJson.getString("operation");
        final String country = changeJson.getString("country");


        /* Objects array */
        final JSONArray EntitiesJson = changeJson.getJSONArray("objects");
        final DateEntity[] Entities = new DateEntity[EntitiesJson.length()];
        /* Rows array */
        for (int i = 0; i < Entities.length; i++) {

            JSONObject rowResults = EntitiesJson.getJSONObject(i);
            JSONArray Results = rowResults.getJSONArray("array");
            Entities[i] = new DateEntity();
            for (int j = 0; j < Results.length(); j++) {
                Entities[i].addOggettoTrovato(Results.getString(j));

            }
        }

        /* Reconstruct change object */
        final DateReformateChange change = new DateReformateChange(columnIndex, operation, country, Entities);
        for (final int addedRowId : JSONUtilities.getIntArray(changeJson, "addedRows"))
            change.addedRowIds.add(addedRowId);
        return change;
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
     *
     * @param project     The project
     * @param cellIndexes The cell indexes of the rows that will contain the named entities
     */
    protected void insertValues(final Project project, final int cellIndexes) {
        final List<Row> rows = project.rows;
        // Make sure there are rows
        if (rows.isEmpty())
            return;

        // Make sure all rows have enough cells, creating new one as necessary
        final int minRowSize = cellIndexes + 1;

        int rowNumber = 0;
        addedRowIds.clear();

        for (final DateEntity row : objects) {
            // Create new blank rows if objects don't fit on a single line
            int maxobject = 1;

            if (row.getFoundDates() != null)
                maxobject = Math.max(maxobject, row.getFoundDates().size());

            for (int i = 1; i < maxobject; i++) {
                final Row entityRow = new Row(minRowSize);
                final int entityRowId = rowNumber + i;
                for (int j = 0; j < minRowSize; j++)
                    entityRow.cells.add(null);
                rows.add(entityRowId, entityRow);
                addedRowIds.add(entityRowId);
            }

            // Place all objects
            final ArrayList<String> oggetti = row.getFoundDates();
            for (int r = 0; r < oggetti.size(); r++) {
                Row riga = rows.get(rowNumber + r);
                riga.cells.set(cellIndexes, row.toCell(r));
            }


            // Advance to the next original row
            rowNumber += maxobject;

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


}
