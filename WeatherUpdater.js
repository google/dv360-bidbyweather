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


/**
 * @fileoverview Calls OpenWeatherMap API for a list of locations in a
 * spreadsheet and pastes the results in the corresponding columns.
 */
var MAX_RETRIES = 10;
var SLEEP_BETWEEN_LOCATIONS = 1000; // in milliseconds.
var SLEEP_BETWEEN_RETRIES = 3000; // in milliseconds.
var CURRENT = 'Current';
var retries = 0;
var locationsSearched = {};
var locationsCoordinates = {};


/**
 * Calls OpenWeatherMap API for each location in the "weather" sheet, and pastes
 * the resulting parameters in the corresponding columns. Also updates the
 * log column accordingly.
 * @public
 */
function updateWeatherData() {
  getLocationsCoordinates_();
  locationsSearched = {};
  var values = weatherSheet.getDataRange().getValues();
  for (var v = 1; v < values.length; v++) {
    var row = v + 1;
    var locationString = values[v][COL_LOCATION_NAME].toString();
    if (locationString.length < 3) {
      weatherSheet.getRange(row, COL_LOG + 1)
          .setValue('Weather update failed: location name missing!');
      continue;
    }

    retries = 0;
    var apiData = null;
    apiData = locationsSearched[locationString] ||
        getWeatherFromApi_(locationString);
    if (!apiData) {
      weatherSheet.getRange(row, COL_LOG + 1)
          .setValue('Weather update failed: error with API call, despite ' +
          MAX_RETRIES + ' retries');
      continue;
    }

    var days = weatherSheet.getRange(row, COL_DAYS_LOOKUP + 1)
        .getValue()
        .toString();
    var weatherData = days == CURRENT ? apiData.current :
        apiData.daily[parseInt(days)];
    var weather = weatherData.weather[0].main;
    var details = weatherData.weather[0].description;
    var temp = days == CURRENT ? weatherData.temp : weatherData.temp.day;
    var humidity = weatherData.humidity;
    var timestamp = weatherData.dt;
    var timezone = apiData.timezone_offset;
    var adjustedTs = timestamp + timezone;
    var d = new Date(adjustedTs * 1000);
    var localHour = d.getUTCHours();
    var formattedDate = getFormattedDate_();


    weatherSheet.getRange(row, COL_WEATHER_CONDITION + 1).setValue(weather);
    weatherSheet.getRange(row, COL_WEATHER_DESCRIPTION + 1).setValue(details);
    weatherSheet.getRange(row, COL_WEATHER_TEMPERATURE + 1).setValue(temp);
    weatherSheet.getRange(row, COL_WEATHER_HUMIDITY + 1).setValue(humidity);
    weatherSheet.getRange(row, COL_TIMEOFDAY + 1).setValue(localHour);
    weatherSheet.getRange(row, COL_LOG + 1)
        .setValue('Weather condition updated at ' + formattedDate);

    locationsSearched[locationString] = apiData;
    Utilities.sleep(SLEEP_BETWEEN_LOCATIONS);
  }
}

/**
 * Builds map of location names and their geographical coordinates.
 * @private
 */
function getLocationsCoordinates_() {
  cities = citiesSheet.getDataRange().getValues();

  for (var row = 0; row < cities.length; row++) {
    locationsCoordinates[
      citiesSheet.getRange(row + 1, COL_CITY_NAME + 1)
      .getValue()
      .toString()
    ] = {
      'latitude': citiesSheet.getRange(row + 1, COL_CITY_LATITUDE + 1)
          .getValue()
          .toString(),
      'longitude': citiesSheet.getRange(row + 1, COL_CITY_LONGITUDE + 1)
          .getValue()
          .toString()
    };
  }
}

/**
 * Calls OpenWeatherMap API and retrieves the weather data for the week for the
 * location specified as input.
 * @param {string} location Location to query the weather API for.
 * @return {?Object} The weather API data for the location (null if error).
 * @private
 */
function getWeatherFromApi_(location) {
  var locationData = locationsCoordinates[location];
  if (!locationData) {
    return null;
  }

  var latitude = locationData.latitude;
  var longitude = locationData.longitude;

  var url = 'http://api.openweathermap.org/data/2.5/onecall?lat=' +
      latitude + '&lon=' + longitude + '&exclude=minutely,hourly' +
      '&appid=' + getUserConfiguration_('ApiKey') +
      '&units=' + getUserConfiguration_('Unit');
  retries++;
  try {
    var response = UrlFetchApp.fetch(url);
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log(e);
    if (retries < MAX_RETRIES) {
      Utilities.sleep(SLEEP_BETWEEN_RETRIES);
      return getWeatherFromApi_(location);
    } else {
      return null;
    }
  }
}
