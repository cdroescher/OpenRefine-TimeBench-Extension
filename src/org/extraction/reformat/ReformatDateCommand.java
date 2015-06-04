package org.extraction.reformat;

import com.google.refine.commands.EngineDependentCommand;
import com.google.refine.model.AbstractOperation;
import com.google.refine.model.Column;
import com.google.refine.model.Project;
import org.json.JSONException;
import org.json.JSONObject;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Map;

public class ReformatDateCommand extends EngineDependentCommand {


    @Override
    protected AbstractOperation createOperation(Project project, HttpServletRequest request, JSONObject engineConfig) throws Exception {
        final String columnName = request.getParameter("column");
        final String dateInputFormatStringList = request.getParameter("inputFormats[]");
        final String dateOutputFormat = request.getParameter("outputFormat");
        Map parameterMap = request.getParameterMap();
        String[] dateInputFormatStringArray = (String[]) parameterMap.get("inputFormats[]");

        final Column column = project.columnModel.getColumnByName(columnName);

        try {
            return new ReformatDateOperation(column, dateInputFormatStringArray, dateOutputFormat, getEngineConfig(request));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }
}
