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
import java.util.*;

public class ReformateDateProcess extends LongRunningProcess implements Runnable {
    private final static Logger LOGGER = Logger.getLogger(ReformateDateProcess.class);
    private final Project project;
    private final AbstractOperation parentOperation;
    private final JSONObject engineConfig;
    private final long historyEntryId;
    private final DateFormatsOverlayModel model;


    protected ReformateDateProcess(Project project, DateFormatsOverlayModel model,
                                   AbstractOperation parentOperation, String description,
                                   JSONObject engineConfig) {
        super(description);
        this.project = project;
        this.parentOperation = parentOperation;
        this.engineConfig = engineConfig;
        this.historyEntryId = HistoryEntry.allocateID();
        this.model = model;
    }

    @Override
    public void run() {
        performExtraction();
        if (!_canceled) {
            project.history.addEntry(new HistoryEntry(historyEntryId, project, _description, parentOperation, new DateFormatChange(model)));
            project.processManager.onDoneProcess(this);
        }
    }

    protected void performExtraction() {
        ReformatColumn reformatColumn = model.getCurrentColumnToProcess();
        Column column = reformatColumn.getOriginColumn();

        Map<Integer, String> origin = new HashMap<Integer, String>();
        // Count all rows
        int rowsTotal = project.rows.size();
        // Get the cell index of the column in which to perform entity extraction
        int cellIndex = column.getCellIndex();
        // Get the filtered rows
        Set<Integer> filteredRowIndices = getFilteredRowIndices();
        int rowsFiltered = filteredRowIndices.size();

        // Go through each row and extract entities if the row is part of the filter
        DateTime[] dateTimes = new DateTime[rowsTotal];
        int rowsProcessed = 0;
        for (int rowIndex = 0; rowIndex < rowsTotal; rowIndex++) {
            // Initialize to the empty result set, in case no entities are extracted

            // If the row is part of the filter, extract entities
            if (filteredRowIndices.contains(rowIndex)) {
                Row row = project.rows.get(rowIndex);
                // Determine the text value of the cell
                Cell cell = row.getCell(cellIndex);
                Serializable cellValue = cell == null ? null : cell.value;
                String text = cellValue == null ? "" : cellValue.toString().trim();
                origin.put(rowIndex, text);

                _progress = 100 * ++rowsProcessed / rowsFiltered;
            }

        }
        Reformator reformator = new Reformator();
        reformator.reformatDateTime(reformatColumn);
    }


    protected Set<Integer> getFilteredRowIndices() {
        // Load the faceted browsing engine and configuration (including row filters)
        Engine engine = new Engine(project);
        try {
            engine.initializeFromJSON(engineConfig);
        } catch (Exception e) {
        }

        // Collect indices of rows that belong to the filter
        final HashSet<Integer> filteredRowIndices = new HashSet<Integer>(project.rows.size());
        engine.getAllFilteredRows().accept(project, new RowVisitor() {
            @Override
            public boolean visit(Project project, int rowIndex, Row row) {
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
