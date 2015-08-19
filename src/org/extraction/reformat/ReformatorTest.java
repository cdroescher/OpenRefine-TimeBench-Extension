package org.extraction.reformat;

import org.joda.time.DateTime;
import org.junit.Test;

import java.util.ArrayList;

/**
 * Created by droescher on 01.06.15.
 */
public class ReformatorTest {

    @Test
    public void test(){
        ArrayList<String> inputDateFormatList = new ArrayList<String>();
        inputDateFormatList.add("dd-MM");
        inputDateFormatList.add("MM-dd");
        inputDateFormatList.add("yyyy-MM-dd");
        inputDateFormatList.add("hh:mm-dd:MM");

        ArrayList<String> originDateTimes = new ArrayList<String>();
        originDateTimes.add("12-31");
        originDateTimes.add("05-06");
        originDateTimes.add("31-12");
        originDateTimes.add("05-06-2003");
        originDateTimes.add("2003-06-07");

       /* Reformator reformator = new Reformator();
        ArrayList<ReformatEntity> dateTimes = reformator.reformatDateTime(inputDateFormatList, originDateTimes);
        System.out.print(dateTimes);*/
    }
}
