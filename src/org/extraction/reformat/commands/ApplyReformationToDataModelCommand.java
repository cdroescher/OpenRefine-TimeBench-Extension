package org.extraction.reformat.commands;

import com.google.refine.ProjectManager;
import com.google.refine.commands.Command;
import com.google.refine.model.*;
import org.extraction.reformat.*;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Properties;


public class ApplyReformationToDataModelCommand extends Command {

    private Logger logger = LoggerFactory.getLogger(getClass().getSimpleName());


    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        try {
            internalRespond(request, response);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    protected void internalRespond(HttpServletRequest request, HttpServletResponse response) throws Exception {
        JSONObject obj = new JSONObject(request.getReader().readLine());
        long projectId = obj.getLong("project");
        int columnIndex = obj.getInt("column");
        String outputFormat = obj.getString("resultFormat");
        Project project = ProjectManager.singleton.getProject(projectId);

        DateFormatsOverlayModel overlayModel = (DateFormatsOverlayModel) project.overlayModels.get(DateFormatChange.OVERLAY_MODE_PROPERTY);

        final Column column = project.columnModel.getColumnByCellIndex(columnIndex);
        ReformatColumn reformatColumn = new ReformatColumn(outputFormat, column);

        int rowSize = project.rows.size();
        for (int i = 0; i < rowSize; i++) {
            reformatColumn.addReformatEntity(new ReformatEntity(i, null));
        }

        if (overlayModel != null) {
            overlayModel = new DateFormatsOverlayModel(overlayModel);
            overlayModel.addColumn(reformatColumn);
        } else {
            overlayModel = new DateFormatsOverlayModel(reformatColumn);
        }

        try {
            AbstractOperation op = new ReformatDateOperation(overlayModel, column.getName());
            com.google.refine.process.Process process = op.createProcess(project, new Properties());
            performProcessAndRespond(request, response, project, process);

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
