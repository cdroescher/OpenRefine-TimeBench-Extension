package org.extraction.reformat.commands;

import com.google.refine.commands.Command;
import com.google.refine.commands.HttpUtilities;
import com.google.refine.model.*;
import org.json.JSONException;
import org.json.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Created by Christian on 25.10.15.
 */
public class GetColumnCommand extends Command {

    private Logger logger = LoggerFactory.getLogger(getClass().getSimpleName());


    @Override
    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        internalRespond(request, response);
    }

    @Override
    public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        internalRespond(request, response);
    }

    protected void internalRespond(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {


        Project project = getProject(request);
        try {
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-cache");

            JSONWriter writer = new JSONWriter(response.getWriter());
            int cellIndex = Integer.parseInt(request.getParameter("cellIndex"));
            long projectId = Long.parseLong(request.getParameter("project"));
            int rowsTotal = project.rows.size();
            writer.array();
            for (int rowIndex = 0; rowIndex < rowsTotal; rowIndex++) {
                Row row = project.rows.get(rowIndex);
                Cell cell = row.getCell(cellIndex);
                cell.write(writer, null);
            }
            writer.endArray();
            logger.info("get column: " + cellIndex + " , from project: " + project);
        } catch (JSONException e) {
            HttpUtilities.respondException(response, e);
        }
    }
}
