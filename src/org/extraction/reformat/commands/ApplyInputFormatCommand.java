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
import java.util.*;

/**
 * Created by Christian on 25.10.15.
 */
public class ApplyInputFormatCommand extends Command {

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

            // TODO use same pattern for writer as in ApplyOutputFormatCommand
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-cache");

            JSONWriter writer = new JSONWriter(response.getWriter());
            int cellIndex = Integer.parseInt(request.getParameter("cellIndex"));

            String format = request.getReader().readLine();

            List<String> column = extractProjectColumnToList(project, cellIndex);
//            if (splitFormats.length == 0) {
//                InputStream formatList = ApplyInputFormatCommand.class.getResourceAsStream("formatList");
//                String format = new Scanner(formatList).nextLine();
//                splitFormats = format.split("@@");
//            }

            Map<String, List<DateTime>> tableFormats = createMapWithFormats(column, format);
            writeReformatColumn(tableFormats, writer);
            response.flushBuffer();
        } catch (JSONException e) {
            HttpUtilities.respondException(response, e);
        }
    }

    private void writeReformatColumn(Map<String, List<DateTime>> tableFormats, JSONWriter writer) throws JSONException {
        writer.array();
        for (String format : tableFormats.keySet()) {
            writer.object();
            writer.key("format");
            writer.value(format);
            writer.key("reformatedColumn");
            writer.array();
            DateTimeFormatter dateStringFormat = DateTimeFormat.forPattern(format);
            for (DateTime dateTime : tableFormats.get(format)) {
                writer.object();
                writer.key("v");
                if (dateTime != null) {
                    writer.value(dateStringFormat.print(dateTime));
                    writer.key("timestamp");
                    writer.value(String.valueOf(dateTime.getMillis()));
                } else {
                    writer.value(null);
                    writer.key("timestamp");
                    writer.value(null);
                }
                writer.endObject();
            }
            writer.endArray();
            writer.endObject();
        }
        writer.endArray();
    }

    private Map<String, List<DateTime>> createMapWithFormats(List<String> column, String format) {
        Map<String, List<DateTime>> dateTimeMap = new HashMap<String, List<DateTime>>();
        ArrayList<DateTime> dateTimes = new ArrayList<DateTime>();
        DateTimeFormatter dateStringFormat = DateTimeFormat.forPattern(format);
        boolean allNull = true;
        for (String field : column) {
            try {
                DateTime dateTime = dateStringFormat.parseDateTime(field);
                dateTimes.add(dateTime);
                allNull = false;
            } catch (IllegalArgumentException ex) {
                dateTimes.add(null);
            }
        }
        if (!allNull) {
            dateTimeMap.put(format, dateTimes);
        }
        return dateTimeMap;
    }

    private List<String> extractProjectColumnToList(Project openRefineProject, int cellIndex) {
        List<String> column = new ArrayList<String>();
        int rowsTotal = openRefineProject.rows.size();
        for (int rowIndex = 0; rowIndex < rowsTotal; rowIndex++) {
            Row row = openRefineProject.rows.get(rowIndex);
            Cell cell = row.getCell(cellIndex);
            column.add((String) cell.value);
        }
        return column;
    }
}
