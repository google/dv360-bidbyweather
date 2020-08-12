/***********************************************************************
Copyright 2020 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Note that these code samples being shared are not official Google
products and are not formally supported.
************************************************************************/


var doc = SpreadsheetApp.getActive();
var WEATHER_SHEET_NAME = 'Weather';
var CITIES_SHEET_NAME = 'Cities';

var COL_ADVERTISER_ID = 0;
var COL_LINEITEM_ID = 1;
var COL_LOCATION_NAME = 2;
var COL_DAYS_LOOKUP = 3;
var COL_WEATHER_CONDITION = 4;
var COL_WEATHER_DESCRIPTION = 5;
var COL_WEATHER_TEMPERATURE = 6;
var COL_WEATHER_HUMIDITY = 7;
var COL_TIMEOFDAY = 8;
var COL_LINEITEM_NEW_STATUS = 9;
var COL_LINEITEM_STATUS = 11;
var COL_LOG = 12;

var COL_CITY_NAME = 0;
var COL_CITY_LATITUDE = 1;
var COL_CITY_LONGITUDE = 2;
var weatherSheet = doc.getSheetByName(WEATHER_SHEET_NAME);
var citiesSheet = doc.getSheetByName(CITIES_SHEET_NAME);
var userProperties = PropertiesService.getUserProperties();


/**
 * Adds a custom menu to the spreadsheet.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('DV360 BidByWeather')
    .addItem('Update Weather and Update Line Items', 'updateWeatherAndSendToDV360')
    .addItem('Update Weather only', 'updateWeatherData')
    .addItem('Update Line Items only', 'updateLineItems')
    .addItem('Read current LI status', 'readLineItems')
    .addSeparator()
    .addItem('Clear current user config', 'clearUserConfig')
    .addToUi();
  init_();
}


/**
 * Initialization function to structure the spreadsheet, if needed.
 * @private
 */
function init_() {
  if (!weatherSheet || !citiesSheet) {
    // We need setup and format the spreadsheet
    initSpreadsheet_();
  }
  doc.setActiveSheet(weatherSheet);
}


/**
 * Sets up and formats the needed sheets in the Spreadsheet.
 * @private
 */
function initSpreadsheet_() {
  if (!citiesSheet) {
    doc.insertSheet(CITIES_SHEET_NAME, 2);
    citiesSheet = doc.getSheetByName(CITIES_SHEET_NAME);
    citiesSheet.setTabColor('green');
    citiesSheet.getRange(1, COL_CITY_NAME + 1)
        .setValue('City name');
    citiesSheet.getRange(1, COL_CITY_LATITUDE + 1)
        .setValue('Latitude');
    citiesSheet.getRange(1, COL_CITY_LONGITUDE + 1)
        .setValue('Longitude');
    citiesSheet.getRange(1, 1, 1, 3).setBackground('#EFEFEF');
    citiesSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    citiesSheet.setFrozenRows(1);
  }

  if (!weatherSheet) {
    doc.insertSheet(WEATHER_SHEET_NAME, 1);
    weatherSheet = doc.getSheetByName(WEATHER_SHEET_NAME);
    weatherSheet.setTabColor('blue');
    weatherSheet.getRange(1, COL_ADVERTISER_ID + 1)
        .setValue('DV360 Advertiser ID');
    weatherSheet.getRange(1, COL_LINEITEM_ID + 1)
        .setValue('DV360\nLine Item ID');
    weatherSheet.getRange(1, COL_LOCATION_NAME + 1)
        .setValue('API Location name');
    weatherSheet.getRange(1, COL_DAYS_LOOKUP + 1)
        .setValue('Days from today');
    weatherSheet.getRange(1, COL_WEATHER_CONDITION + 1)
        .setValue('Weather condition');
    weatherSheet.getRange(1, COL_WEATHER_DESCRIPTION + 1)
        .setValue('Weather description');
    weatherSheet.getRange(1, COL_WEATHER_TEMPERATURE + 1)
        .setValue('Weather temperature');
    weatherSheet.getRange(1, COL_WEATHER_HUMIDITY + 1)
        .setValue('Humidity');
    weatherSheet.getRange(1, COL_TIMEOFDAY + 1)
        .setValue('Local hour of day');
    weatherSheet.getRange(1, COL_LINEITEM_NEW_STATUS + 1)
        .setValue('Line Item Status to apply');
    weatherSheet.getRange(1, COL_LINEITEM_NEW_STATUS + 2)
        .setValue('<- Human-readable criteria ' +
            '(for readability only, not used by the tool)');
    weatherSheet.getRange(1, COL_LINEITEM_STATUS + 1)
        .setValue('Line Item Status');
    weatherSheet.getRange(1, COL_LOG + 1)
        .setValue('Log (latest)');

    weatherSheet.getRange(1, 1, 1, 13)
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
        .setFontWeight('bold');
    weatherSheet.getRange('K2:K')
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    weatherSheet.getRange('M2:M')
        .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

    weatherSheet.getRange(1, 1, 1, 4).setBackground('#ADD6AD');
    weatherSheet.getRange(1, 5, 1, 9).setBackground('#FFF2CC');
    weatherSheet.getRange(1, 10, 1, 11).setBackground('#ADD6AD');
    weatherSheet.getRange(1, 12, 1, 13).setBackground('#FFF2CC');
    weatherSheet.getRange('E2:I').setBackground('#EFEFEF');
    weatherSheet.getRange('L2:M').setBackground('#EFEFEF');

    weatherSheet.setFrozenRows(1);
    weatherSheet.setColumnWidths(1, 2, 90);
    weatherSheet.setColumnWidth(3, 130);
    weatherSheet.setColumnWidth(4, 75);
    weatherSheet.setColumnWidth(5, 85);
    weatherSheet.setColumnWidth(6, 120);
    weatherSheet.setColumnWidth(7, 90);
    weatherSheet.setColumnWidths(8, 2, 75);
    weatherSheet.setColumnWidth(10, 130);
    weatherSheet.setColumnWidths(11, 3, 250);
    weatherSheet.setColumnWidth(12, 200);

    var daysRule = SpreadsheetApp
        .newDataValidation()
        .requireValueInList(['Current', '0', '1', '2', '3', '4', '5', '6', '7'])
        .build();
    var locationsRule = SpreadsheetApp
        .newDataValidation()
        .requireValueInRange(citiesSheet.getRange('A2:A'))
        .build();
    weatherSheet.getRange('C2:C').setDataValidation(locationsRule);
    weatherSheet.getRange('D2:D').setDataValidation(daysRule);

    weatherSheet.deleteRows(11, 988);
    weatherSheet.deleteColumns(14, 13);
  }
}

/**
 * Menu function combining weather and Line Item updates.
 */
function updateWeatherAndSendToDV360() {
  updateWeatherData();
  updateLineItems();
}
