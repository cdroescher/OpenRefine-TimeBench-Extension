package org.extraction.reformat.commands;

import com.google.refine.commands.Command;
import com.google.refine.commands.HttpUtilities;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;


/**
 * Created by Christian on 15.11.15.
 */
public class ApplyOutputFormatCommand extends Command {

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


        try {
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Type", "application/json");
            response.setHeader("Cache-Control", "no-cache");

            JSONObject obj = new JSONObject(request.getReader().readLine());
            JSONArray resultValues = obj.getJSONArray("dateTimeValues");
            String resultFormat = obj.getString("format");
            for (int i = 0; i < resultValues.length(); i++) {
                if (!(((JSONObject) resultValues.get(i)).get("timestamp").getClass() == JSONObject.NULL.getClass())) {
                    long timestamp = ((JSONObject) resultValues.get(i)).getLong("timestamp");
                    DateTime dateTime = new DateTime(timestamp);

                    DateTimeFormatter dateStringFormat;
                    if(!resultFormat.isEmpty()){
                        dateStringFormat = DateTimeFormat.forPattern(resultFormat);
                        ((JSONObject) resultValues.get(i)).put("value", dateTime.toString(dateStringFormat));
                        logger.info("input date: "+ dateTime.toString()+", result format: " + resultFormat + ", result: " + dateTime.toString(dateStringFormat));
                    } else {
                        ((JSONObject) resultValues.get(i)).put("value", "");
                    }

                }
            }

            PrintWriter writer = response.getWriter();
            obj.write(writer);
            writer.flush();

        } catch (JSONException e) {
            HttpUtilities.respondException(response, e);
        }
    }
}
