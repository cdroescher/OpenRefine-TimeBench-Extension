package org.extraction.reformat;

import com.google.refine.commands.Command;
import com.google.refine.commands.HttpUtilities;
import com.google.refine.model.Cell;
import com.google.refine.model.Project;
import com.google.refine.model.Row;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.json.JSONException;
import org.json.JSONWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.util.Scanner;

/**
 * Created by Christian on 25.10.15.
 */
public class ReformatColumnCommand extends Command {
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
            int cellIndex = Integer.parseInt(request.getParameter("columnIndex"));

            String[] splitFormats;
            String format = request.getParameter("format");

            if(format==null) {
                InputStream formatList = ReformatColumnCommand.class.getResourceAsStream("formatList");
                format = new Scanner(formatList).nextLine();
            }

            writer.array();
            splitFormats = format.split("@@");
            for(String splitFormat : splitFormats){
                writeReformatColumn(cellIndex, splitFormat, writer, project);
            }
            writer.endArray();
        } catch (JSONException e) {
            HttpUtilities.respondException(response, e);
        }
    }

    private void writeReformatColumn(int cellIndex, String format, JSONWriter writer, Project project) throws JSONException{
        int rowsTotal = project.rows.size();
        writer.object();
        writer.key("columnIndex");
        writer.value(cellIndex);
        writer.key("format");
        writer.value(format);
        writer.key("reformatedColumn");
        writer.array();
        for (int rowIndex = 0; rowIndex < rowsTotal; rowIndex++) {
            Row row = project.rows.get(rowIndex);
            Cell cell = row.getCell(cellIndex);
            DateTimeFormatter dateStringFormat = DateTimeFormat.forPattern(format);
            writer.object();
            writer.key("v");
            try {
                DateTime time = dateStringFormat.parseDateTime((String) cell.value);
                writer.value(dateStringFormat.print(time));
            } catch (IllegalArgumentException ex) {
                writer.value(null);
            }
            writer.endObject();
        }
        writer.endArray();
        writer.endObject();
    }
}
