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
public class ApplyFormatCommand extends Command {

    final static Logger logger = LoggerFactory.getLogger("ApplyFormatCommand");

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
            String resultFormat = obj.getString("resultFormat");
            for (int i = 0; i < ((JSONArray) obj.get("resultValues")).length(); i++) {
                JSONArray resultValues = (JSONArray) obj.get("resultValues");
                if (!(((JSONObject) resultValues.get(i)).get("timestamp").getClass() == JSONObject.NULL.getClass())) {
                    long timestamp = ((JSONObject) resultValues.get(i)).getLong("timestamp");
                    DateTime dateTime = new DateTime(timestamp);
                    logger.info("input date: "+ dateTime.toString()+", result format: " + resultFormat);
                    DateTimeFormatter dateStringFormat = DateTimeFormat.forPattern(resultFormat);
                    ((JSONObject) resultValues.get(i)).put("v", dateTime.toString(dateStringFormat));
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
