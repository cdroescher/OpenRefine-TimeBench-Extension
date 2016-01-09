package org.extraction.reformat.commands;

import com.google.refine.commands.Command;
import com.google.refine.commands.HttpUtilities;
import com.google.refine.model.Cell;
import com.google.refine.model.Project;
import com.google.refine.model.Row;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    final static Logger logger = LoggerFactory.getLogger("ReformatColumnCommand");

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

            // TODO use same pattern for writer as in ApplyFormatCommand
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-cache");

            JSONWriter writer = new JSONWriter(response.getWriter());
            int cellIndex = Integer.parseInt(request.getParameter("columnIndex"));

            JSONObject jsonObject = new JSONObject(request.getReader().readLine());
            JSONArray formatArray = ((JSONArray) jsonObject.get("formats"));
            String[] splitFormats = new String[formatArray.length()];
            for(int i=0; i < formatArray.length(); i++){
                splitFormats[i] = formatArray.getString(i);
            }
            String format=null;
//            if(splitFormats.length==0) {
//                InputStream formatList = ReformatColumnCommand.class.getResourceAsStream("formatList");
//                format = new Scanner(formatList).nextLine();
//                splitFormats = format.split("@@");
//            }

            writer.array();
            for(String splitFormat : splitFormats){
                writeReformatColumn(cellIndex, splitFormat, writer, project);
            }
            writer.endArray();
            response.flushBuffer();
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
                writer.key("timestamp");
                writer.value(time.getMillis());
            } catch (IllegalArgumentException ex) {
                writer.value(null);
            }
            writer.endObject();
        }
        writer.endArray();
        writer.endObject();
    }
}
