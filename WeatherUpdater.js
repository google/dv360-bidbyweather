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


/**
 * @fileoverview Calls OpenWeatherMap API for a list of locations in a
 * spreadsheet and pastes the results in the corresponding columns.
 */
var MAX_RETRIES = 10;
var SLEEP_BETWEEN_LOCATIONS = 1000; // in milliseconds.
var SLEEP_BETWEEN_RETRIES = 3000; // in milliseconds.
var retries = 0;


/**
 * Calls OpenWeatherMap API for each location in the "weather" sheet, and pastes
 * the resulting parameters in the corresponding columns. Also updates the
 * log column accordingly.
 * @public
 */
function updateWeatherData() {
  var values = weatherSheet.getDataRange().getValues();
  for (row in values) {
    if (row == 0) {
      continue;
    }
    var locationString = values[row][COL_LOCATION_NAME].toString();
    if (locationString.length < 3) {
      weatherSheet.getRange(+row + 1, COL_LOG + 1)
          .setValue('Weather update failed: location name missing!');
      continue;
    }
    retries = 0;
    var apiData = getWeatherFromApi_(locationString);
    if (!apiData) {
      weatherSheet.getRange(+row + 1, COL_LOG + 1)
          .setValue('Weather update failed: error with API call, despite ' +
          MAX_RETRIES + ' retries');
      continue;
    }
    var weather = apiData.weather[0].main;
    var weatherDetails = apiData.weather[0].description;
    var temp = apiData.main.temp;
    var humidity = apiData.main.humidity;
    var timestamp = apiData.dt;
    var timezone = apiData.timezone;
    var adjustedTs = timestamp + timezone;
    var d = new Date(adjustedTs * 1000);
    var localHour = d.getUTCHours(); 
    var formattedDate = getFormattedDate_();    
    weatherSheet.getRange(+row + 1, COL_WEATHER_CONDITION + 1).setValue(weather);
    weatherSheet.getRange(+row + 1, COL_WEATHER_DESCRIPTION + 1).setValue(weatherDetails);
    weatherSheet.getRange(+row + 1, COL_WEATHER_TEMPERATURE + 1).setValue(temp);
    weatherSheet.getRange(+row + 1, COL_WEATHER_HUMIDITY + 1).setValue(humidity);
    weatherSheet.getRange(+row + 1, COL_TIMEOFDAY + 1).setValue(localHour);
    weatherSheet.getRange(+row + 1, COL_LOG + 1)
        .setValue('Weather condition updated at ' + formattedDate);
    Utilities.sleep(SLEEP_BETWEEN_LOCATIONS);
  }
}

/**
 * Calls OpenWeatherMap API and retrieves the current weather data for the
 * location specified as input.
 * @param {string} location Location to query the weather API for.
 * @return {?Object} The weather API data for the location (null if error).
 * @private
 */
function getWeatherFromApi_(location) {
  var url = 'http://api.openweathermap.org/data/2.5/weather?q='
      + location + '&appid=' + getUserConfiguration_('ApiKey') +
      '&units=' + getUserConfiguration_('Unit');
  retries++;
  try {
    var response = UrlFetchApp.fetch(url);
    return JSON.parse(response.getContentText());
  } catch (e) {
    if (retries < MAX_RETRIES) {
      Utilities.sleep(SLEEP_BETWEEN_RETRIES);
      return getWeatherFromApi_(location);
    } else {
      return null;
    }
  }
}
