package org.extraction.reformat;

import com.google.refine.commands.EngineDependentCommand;
import com.google.refine.model.*;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Map;

public class ReformatDateCommand extends EngineDependentCommand {


    @Override
    protected AbstractOperation createOperation(Project project, HttpServletRequest request, JSONObject engineConfig) throws Exception {
        final String columnName = request.getParameter("column");
        final String dateOutputFormat = request.getParameter("outputFormat");
        Map parameterMap = request.getParameterMap();
        String[] dateInputFormatStringArray = (String[]) parameterMap.get("inputFormats[]");
        DateFormatsOverlayModel overlayModel = (DateFormatsOverlayModel) project.overlayModels.get(DateFormatChange.OVERLAY_MODE_PROPERTY);

        final Column column = project.columnModel.getColumnByName(columnName);
        ReformatColumn reformatColumn = new ReformatColumn(dateInputFormatStringArray, dateOutputFormat, column);

        int rowSize = project.rows.size();
        for(int i=0; i<rowSize; i++){
            Row row = project.rows.get(i);
            Cell cell = row.getCell(column.getCellIndex());
            reformatColumn.addReformatEntity(new ReformatEntity(cell, i));
        }

        if(overlayModel!=null){
            overlayModel = new DateFormatsOverlayModel(overlayModel);
            overlayModel.addColumn(reformatColumn);
        } else {
            overlayModel = new DateFormatsOverlayModel(reformatColumn);
            //project.overlayModels.put(DateFormatChange.OVERLAY_MODE_PROPERTY, overlayModel);
        }

        try {
            return new ReformatDateOperation(overlayModel, columnName, getEngineConfig(request));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }
}
