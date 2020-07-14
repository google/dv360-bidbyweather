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
 * @fileoverview Functions to manage user-level configuration parameters.
 */


/**
 * Deletes the stored config data for the user.
 * @public
 */
function clearUserConfig() {
  userProperties.deleteAllProperties();
  var ui = SpreadsheetApp.getUi();
  ui.alert('User properties correcty deleted. Launch other functions to set them again.');
}

function test() {
  var tz = getUserConfiguration_('Timezone');
  Logger.log(tz);
}


/**
 * Retrieves configuration data for the current user for a specified field.
 * If not already available, prompts the user to insert it
 * @param {string} key The key of the value to retrieve from the stored config.
 * @return {!string} The config value for the requested key.
 * @private
 */
function getUserConfiguration_(key) {
  if (!userProperties.getProperty(key)) {
    var question = 'Error - wrong key requested';
    switch(key) {
      case 'ApiKey': question = 'Insert your OpenWeatherMap API key:'; break;
      case 'Timezone': question = 'Your timezone, in format GMT+XX:00 (leave empty for GMT):'; break;
      case 'Unit': question = 'Unit (metric or imperial):'; break;
    }
    var userResponse = getUserInput_(question);
    if (!userResponse || userResponse.toString().length < 2) {
      switch(key) {
        case 'Timezone': userResponse = 'GMT+00:00';
        case 'Unit': userResponse = 'metric';
      }
    }
    userProperties.setProperty(key, userResponse);
  }
  return userProperties.getProperty(key);
}


/**
 * The method is displaying a UI prompt for inserting the required config data.
 * @param {string} question The question the user should answer to.
 * @return {string} The config data if provided, null otherwise.
 * @private
 */
function getUserInput_(question) {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
      'One-off configuration needed for the current user',
      question,
      ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() == ui.Button.OK) {
    return response.getResponseText();
  }
  return;
}
