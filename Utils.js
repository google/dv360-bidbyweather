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
 * @fileoverview Functions to handle various utils tasks.
 */


/**
 * Calls an API via http/UrlFetchApp requests and return the response.
 * @param {string} url The URL of the REST API call to make.
 * @param {string} methodType Value for the "method" option (GET/POST/...).
 * @param {!Object} requestBody The object containing the request parameters.
 * @param {?string} contentType The content type of the request.
 * @return {!Object} The API call response.
 * @private
 */
function callApi_(url, methodType, requestBody, contentType) {
  var type = contentType || 'application/json';
  var headers = {
      'Content-Type': type,
      'Accept' :'application/json',
      'Authorization': 'Bearer ' + ScriptApp.getOAuthToken()
  };
  var options = {
      method: methodType,
      headers : headers,
      muteHttpExceptions: true
  };
  if (requestBody) {
    options.payload = type == 'application/json' ?
        JSON.stringify(requestBody) : requestBody;
  }
  return UrlFetchApp.fetch(url, options);
}

/**
 * Returns a formatted current date.
 * @private
 */
function getFormattedDate_() {
  var tz = getUserConfiguration_('Timezone');
  return Utilities.formatDate(new Date(),
      tz, "yyyy-MM-dd' 'HH:mm:ss' '");
}

/**
 * Clears the content of the Log sheet and sets it up for logging purposes.
 * @private
 */
function clearLog_() {
  logSheet.clearContents();
  logSheet.appendRow(['Timestamp', 'Message']);
}
