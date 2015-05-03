package org.extraction.operations;

import com.google.refine.browsing.Engine;
import com.google.refine.browsing.RowVisitor;
import com.google.refine.history.HistoryEntry;
import com.google.refine.model.*;
import com.google.refine.process.LongRunningProcess;
import org.apache.log4j.Logger;
import org.json.JSONObject;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

public class DateReformateProcess extends LongRunningProcess implements Runnable {
    private final static Logger LOGGER = Logger.getLogger(DateReformateProcess.class);
    private final static DateEntity EMPTY_RESULT_SET = new DateEntity();
    private final String datePattern;
    private final Project project;
    private final Column column;
    private final String operation;
    private final AbstractOperation parentOperation;
    private final JSONObject engineConfig;
    private final long historyEntryId;


    protected DateReformateProcess(final Project project, final Column column,
                                   final String operation, final String datePattern,
                                   final AbstractOperation parentOperation, final String description,
                                   final JSONObject engineConfig) {
        super(description);
        this.project = project;
        this.column = column;
        this.operation = operation;
        this.parentOperation = parentOperation;
        this.engineConfig = engineConfig;
        this.historyEntryId = HistoryEntry.allocateID();
        this.datePattern = datePattern;
    }

    @Override
    public void run() {
        final int columnIndex = project.columnModel.getColumnIndexByName(column.getName()) + 1;

        final DateEntity[] namedEntities = performExtraction();

        if (!_canceled) {
            project.history.addEntry(new HistoryEntry(historyEntryId, project, _description, parentOperation, new DateReformateChange(columnIndex, operation, datePattern, namedEntities)));
            project.processManager.onDoneProcess(this);
        }
    }

    protected DateEntity[] performExtraction() {
        // Count all rows
        final int rowsTotal = project.rows.size();
        // Get the cell index of the column in which to perform entity extraction
        final int cellIndex = column.getCellIndex();
        // Get the filtered rows
        final Set<Integer> filteredRowIndices = getFilteredRowIndices();
        final int rowsFiltered = filteredRowIndices.size();

        // Go through each row and extract entities if the row is part of the filter
        final DateEntity[] namedEntities = new DateEntity[rowsTotal];
        int rowsProcessed = 0;
        for (int rowIndex = 0; rowIndex < rowsTotal; rowIndex++) {
            // Initialize to the empty result set, in case no entities are extracted
            namedEntities[rowIndex] = EMPTY_RESULT_SET;
            // If the row is part of the filter, extract entities
            if (filteredRowIndices.contains(rowIndex)) {
                final Row row = project.rows.get(rowIndex);
                // Determine the text value of the cell
                final Cell cell = row.getCell(cellIndex);
                final Serializable cellValue = cell == null ? null : cell.value;
                final String text = cellValue == null ? "" : cellValue.toString().trim();
                // Perform extraction if the text is not empty
                if (text.length() > 0) {
                    final Extractor extractore = new Extractor(text, operation, datePattern);
                    namedEntities[rowIndex] = extractore.extract();
                }
                _progress = 100 * ++rowsProcessed / rowsFiltered;
            }
            // Exit directly if the process has been cancelled
            if (_canceled)
                return null;
        }
        return namedEntities;
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

    protected static class Extractor {
        private final static DateEntity EMPTY_ENTITY_SET = new DateEntity();

        private final String text;
        private final String operation;
        private final String datePattern;
        private DateEntity entity;

        public Extractor(final String text, final String operation, String datePattern) {
            this.text = text;
            this.operation = operation;
            this.entity = EMPTY_ENTITY_SET;
            this.datePattern = datePattern;
        }

        public DateEntity extract() {
            DateEntity risultati = new DateEntity();
            if (text == null) {
                return risultati;
            }
            risultati.addOggettoTrovato("testValue");
            return risultati;
        }
    }
}
