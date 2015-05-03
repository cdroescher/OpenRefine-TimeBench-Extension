package org.extraction.operations;

import com.google.refine.model.Cell;
import org.json.JSONException;
import org.json.JSONWriter;

import java.util.ArrayList;


public class DateEntity {
    private ArrayList<String> foundDates = new ArrayList<String>();

    public ArrayList<String> getFoundDates() {
        return foundDates;
    }

    public boolean addOggettoTrovato(String oggetto) {
        foundDates.add(oggetto);
        return true;
    }

    public void writeTo(final JSONWriter json) throws JSONException {
        json.object();
        json.key("array");
        json.array();
        for (String oggetto : foundDates) {
            json.value(oggetto);
        }

        json.endArray();
        json.endObject();
    }

    public Cell toCell(int objectNumber) {
        return new Cell(getFoundDates().get(objectNumber), null);
    }
}
