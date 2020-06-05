/***********************************************************************
Copyright 2019 Google LLC

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
var LOG_SHEET_NAME = 'Log';
var COL_ADVERTISER_ID = 0;
var COL_LINEITEM_ID = 1;
var COL_LOCATION_NAME = 2;
var COL_WEATHER_CONDITION = 3;
var COL_WEATHER_DESCRIPTION = 4;
var COL_WEATHER_TEMPERATURE = 5;
var COL_WEATHER_HUMIDITY = 6;
var COL_TIMEOFDAY = 7; 
var COL_LINEITEM_NEW_STATUS = 8;
var COL_LINEITEM_STATUS = 10;
var COL_LOG = 11;
var weatherSheet = doc.getSheetByName(WEATHER_SHEET_NAME);
var logSheet = doc.getSheetByName(LOG_SHEET_NAME);
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
  if (!weatherSheet || !logSheet) {
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
  // TODO
}

/**
 * Menu function combining weather and Line Item updates.
 */
function updateWeatherAndSendToDV360() {
  updateWeatherData();
  updateLineItems();
}
