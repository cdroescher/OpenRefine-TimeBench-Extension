package org.extraction.commands;

import com.google.refine.commands.EngineDependentCommand;
import com.google.refine.model.AbstractOperation;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import org.extraction.operations.DateReformateOperation;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;

public class DateReformateCommand extends EngineDependentCommand {


    @Override
    protected AbstractOperation createOperation(Project project, HttpServletRequest request, JSONObject engineConfig) throws Exception {
        final String columnName = request.getParameter("column");
        final String parameters = request.getParameter("services");
        final String dateFormat = request.getParameter("dateFormat");
        final Column column = project.columnModel.getColumnByName(columnName);

        try {
            return new DateReformateOperation(column, parameters, dateFormat, getEngineConfig(request));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }
}
