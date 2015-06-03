package org.extraction.reformat;

import com.google.refine.browsing.Engine;
import com.google.refine.browsing.RowVisitor;
import com.google.refine.history.HistoryEntry;
import com.google.refine.model.*;
import com.google.refine.process.LongRunningProcess;
import org.apache.log4j.Logger;
import org.joda.time.DateTime;
import org.json.JSONObject;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

public class ReformateDateProcess extends LongRunningProcess implements Runnable {
    private final static Logger LOGGER = Logger.getLogger(ReformateDateProcess.class);
    private final ArrayList<String> dateFormatList;
    private final Project project;
    private final Column column;
    private final String operation;
    private final AbstractOperation parentOperation;
    private final JSONObject engineConfig;
    private final long historyEntryId;
    private String dateOutputFormat;


    protected ReformateDateProcess(final Project project, final Column column,
                                   final String operation, ArrayList<String> dateFormatList, String dateOutputFormat,
                                   final AbstractOperation parentOperation, final String description,
                                   final JSONObject engineConfig) {
        super(description);
        this.project = project;
        this.column = column;
        this.operation = operation;
        this.parentOperation = parentOperation;
        this.engineConfig = engineConfig;
        this.historyEntryId = HistoryEntry.allocateID();
        this.dateFormatList = dateFormatList;
        this.dateOutputFormat = dateOutputFormat;
    }

    @Override
    public void run() {
        final int columnIndex = project.columnModel.getColumnIndexByName(column.getName()) + 1;

        final DateTime[] dateTimeArray = performExtraction();

        if (!_canceled) {
            project.history.addEntry(new HistoryEntry(historyEntryId, project, _description, parentOperation, new ReformateDateChange(columnIndex, operation, dateFormatList, dateOutputFormat, dateTimeArray)));
            project.processManager.onDoneProcess(this);
        }
    }

    protected DateTime[] performExtraction() {
        // Count all rows
        final int rowsTotal = project.rows.size();
        // Get the cell index of the column in which to perform entity extraction
        final int cellIndex = column.getCellIndex();
        // Get the filtered rows
        final Set<Integer> filteredRowIndices = getFilteredRowIndices();
        final int rowsFiltered = filteredRowIndices.size();

        // Go through each row and extract entities if the row is part of the filter
        final DateTime[] dateTimes = new DateTime[rowsTotal];
        int rowsProcessed = 0;
        for (int rowIndex = 0; rowIndex < rowsTotal; rowIndex++) {
            // Initialize to the empty result set, in case no entities are extracted

            // If the row is part of the filter, extract entities
            if (filteredRowIndices.contains(rowIndex)) {
                final Row row = project.rows.get(rowIndex);
                // Determine the text value of the cell
                final Cell cell = row.getCell(cellIndex);
                final Serializable cellValue = cell == null ? null : cell.value;
                final String text = cellValue == null ? "" : cellValue.toString().trim();
                // Perform extraction if the text is not empty
                if (text.length() > 0) {
                  // TODO joda time reformat stuff
                }
                _progress = 100 * ++rowsProcessed / rowsFiltered;
            }
            // Exit directly if the process has been cancelled
            if (_canceled)
                return null;
        }
        return null;
    }


    protected Set<Integer> getFilteredRowIndices() {
        // Load the faceted browsing engine and configuration (including row filters)
        final Engine engine = new Engine(project);
        try {
            engine.initializeFromJSON(engineConfig);
        } catch (Exception e) {
        }

        // Collect indices of rows that belong to the filter
        final HashSet<Integer> filteredRowIndices = new HashSet<Integer>(project.rows.size());
        engine.getAllFilteredRows().accept(project, new RowVisitor() {
            @Override
            public boolean visit(final Project project, final int rowIndex, final Row row) {
                filteredRowIndices.add(rowIndex);
                return false;
            }

            @Override
            public void start(Project project) {
            }

            @Override
            public void end(Project project) {
            }
        });
        return filteredRowIndices;
    }

    @Override
    protected Runnable getRunnable() {
        return this;
    }

}