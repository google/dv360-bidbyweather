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

var STATUS_ACTIVE = 'ENTITY_STATUS_ACTIVE';
var STATUS_PAUSED = 'ENTITY_STATUS_PAUSED';


function updateLineItems() {
  var weatherContent = weatherSheet.getDataRange().getValues();
  var formattedDate = getFormattedDate_();
  for (row in weatherContent) {
    var advertiserId = weatherContent[row][COL_ADVERTISER_ID].toString();
    var lineItemId = weatherContent[row][COL_LINEITEM_ID].toString();
    var newStatus = weatherContent[row][COL_LINEITEM_NEW_STATUS].toString();
    if (row == 0) {
      continue;
    } else if (advertiserId.length < 4 || lineItemId.length < 4 || newStatus.length < 4) {
      weatherSheet.getRange(+row + 1, COL_LOG + 1)
          .setValue('LI update failed: ID or new status missing!');
      continue;
    }
    if (newStatus.toUpperCase().indexOf('ACTIVE') >= 0) {
      newStatus = STATUS_ACTIVE;
    } else if (newStatus.toUpperCase().indexOf('PAUSE') >= 0) {
      newStatus = STATUS_PAUSED;
    }
    Logger.log('Updating status ' + newStatus + ' for Advertiser ID ' + advertiserId +
        ', LI ' + lineItemId);
    var url = 'https://displayvideo.googleapis.com/v1/advertisers/' +
        advertiserId + '/lineItems/' + lineItemId + '?updateMask=entityStatus';
    var body = {
      'entityStatus': newStatus
    }
    var result = JSON.parse(callApi_(url, 'PATCH', body, null));
    if (result['entityStatus']) {
      var status = result['entityStatus'].replace('ENTITY_STATUS_', '') +
          ' (' + formattedDate + ')';
      weatherSheet.getRange(+row + 1, COL_LINEITEM_STATUS +1).setValue(status);
      weatherSheet.getRange(+row + 1, COL_LOG +1).setValue('Status updated to ' + status);
    } else {
      Logger.log(result);
      weatherSheet.getRange(+row + 1, COL_LOG +1)
          .setValue('Error while sending update request! (' + formattedDate + ')');
    }
  }
}

function readLineItems() {
  var weatherContent = weatherSheet.getDataRange().getValues();
  var results = {};
  var logArray = [];
  var formattedDate = getFormattedDate_();
  for (row in weatherContent) {
    var advertiserId = weatherContent[row][COL_ADVERTISER_ID].toString();
    var lineItemId = weatherContent[row][COL_LINEITEM_ID].toString();
    if (row == 0) {
      continue;
    } else if (advertiserId.length < 4 || lineItemId.length < 4) {
      logArray.push(['N/A', 'Status read failed: ID missing!']);
      continue;
    }
    Logger.log('Querying LIs for Advertiser ID ' + advertiserId +
        ', LI ' + lineItemId);
    if (advertiserId in results) {
      Logger.log('using previous results');
    } else {
      var url = 'https://displayvideo.googleapis.com/v1/advertisers/' +
          advertiserId + '/lineItems';
      var result = JSON.parse(callApi_(url, 'GET', null, null));
      if (result['lineItems']) {
        results[advertiserId] = {};
        // Add array of LIs for this advertiserId to the total object.
        for (entry in result['lineItems']) {
          var li = result['lineItems'][entry]['lineItemId'];
          var liObject = {
            'displayName': result['lineItems'][entry]['displayName'],
            'entityStatus': result['lineItems'][entry]['entityStatus'],
          }
          results[advertiserId][li] =liObject;
          Logger.log('New entry for LI ' + li + ': ' + results[advertiserId][li]);
        }
      } else {
        throw('Some error occurred while calling the API for Advertiser ' + advertiserId);
      }
    }
    if (!results[advertiserId][lineItemId]) {
      // Sometimes the "list" method for LineItems doesn't show all the Advertiser line item.
      // Querying the single Line Item instead.
      Logger.log('Need to query LI ' + lineItemId + ' individually..');
      var url = 'https://displayvideo.googleapis.com/v1/advertisers/' +
          advertiserId + '/lineItems/' + lineItemId;
      var result = JSON.parse(callApi_(url, 'GET', null, null));
      var liObject = {
        'displayName': result['displayName'],
        'entityStatus': result['entityStatus'],
      }
      results[advertiserId][lineItemId] =liObject;
    }
    var status = results[advertiserId][lineItemId]['entityStatus']
        .replace('ENTITY_STATUS_', '') + ' (' + formattedDate + ')';
    var logMessage = 'Read status for LI "' +
        results[advertiserId][lineItemId]['displayName'] +
        '": ' + status;
    logArray.push([status, logMessage]);
  }
  weatherSheet.getRange(2, COL_LINEITEM_STATUS + 1, logArray.length, logArray[0].length)
      .setValues(logArray);
}
