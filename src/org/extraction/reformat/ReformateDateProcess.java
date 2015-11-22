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
    private final long historyEntryId;
    private final DateFormatsOverlayModel model;


    protected ReformateDateProcess(Project project, DateFormatsOverlayModel model,
                                   AbstractOperation parentOperation, String description) {
        super(description);
        this.project = project;
        this.parentOperation = parentOperation;
        this.historyEntryId = HistoryEntry.allocateID();
        this.model = model;
    }

    @Override
    public void run() {
        if (!_canceled) {
            project.history.addEntry(new HistoryEntry(historyEntryId, project, _description, parentOperation, new DateFormatChange(model)));
            project.processManager.onDoneProcess(this);
        }
    }

    @Override
    protected Runnable getRunnable() {
        return this;
    }

}
