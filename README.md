# DV360 Bid By Weather

Disclaimer: This is not an official Google product.

## OVERVIEW

This tool enables Google Display & Video 360 advertisers to automatically adjust
the activation of their DV360 campaigns (Line Items) depending on the weather
conditions for each location target specified.

The tool functionality is orchestrated by a Google Spreadsheet powered by custom
Apps Script code, which is mainly taking care of:

*   reading the current status of the selected DV360 Line Items (optional)
*   retrieving the weather information through [OpenWeatherMap
    API](http://openweathermap.org/api) for each location assigned to the
    selected DV360 Line Items;
*   calculating the "new" Line Item status to be applied, according to the
    desired logic based on the weather conditions;
*   updating the status of the Line Items in the platform through the [DV360
    APIs](https://developers.google.com/display-video/api/reference/rest).

The tool, as is, covers a fairly simple use case, but can also be seen as a
starting point for other scenarios in which you're looking to use an external
data source to influence the configuration of your DV360 campaigns, as long as
the corresponding parameters are supported via the DV360 APIs (this kind of
customization requires basic scripting skills).

## REQUIREMENTS AND LIMITATIONS

#### 1. DV360 Authorizations

Each individual user needs to “install” the tool and to authorize access to the
DV360 API through their Google Account.

Users of the tool need to have read/write access to the DV360 Line Items they
want to edit.

#### 2. Google Cloud Platform project

The tool requires a Google Cloud Project to be associated with it in order to be
able to use the DV360 APIs. No billing account is required.

#### 3. OpenWeatherMap API

A valid key for the OpenWeatherMap API is required ([process](https://openweathermap.org/guide#how)).
Depending on the frequency of the updates you're expecting to apply and the
weather parameters you want to leverage, the free tier might be sufficient.

#### 4. Data size

Apps Script limitations apply. For more information on quotas and limitations,
please check out [this
page](https://developers.google.com/apps-script/guides/services/quotas).
Also, Google Sheets limitations apply (e.g. max 2M cells).

Consider choosing a different approach if you’re planning to use the tool for
thousands of campaigns.

## INITIAL SETUP

#### 1. Configure Google Cloud Platform: project, API and application

-   Enable the _**Display & Video 360 APIs**_.
    -   Access the Google Cloud Platform API console and look for the Display &
        Video 360 API ([link](https://console.developers.google.com/apis/library?organizationId=0&q=display%20video)).
    -   You will need to create a new project or select an existing one.
    -   Select the DV360 API and click on "Enable".
-   Create the OAuth Consent screen for your application.
    -   From the left menu, select [APIs & Services > OAuth consent
        screen](https://console.developers.google.com/apis/credentials/consent).
    -   Fill out the required fields, selecting user type as "INTERNAL" if
        available.
    -   Take note of your Project Number which can be found at the top of the
        consent screen page (should be 12 digits long); you will need it later.

#### 2. Create a new Spreadsheet and import the custom code

-   Create a new [Google Spreadsheet](http://sheets.new/) and open its
    script editor (from _Tools > Script Editor_).
-   Copy all the **.js files** from this project into corresponding .gs files in
    your Apps Script project (e.g. Code.js into Code.gs).
-   Click on _View > Show manifest file_ to get access to the
    **appsscript.json** file, and copy copy contents of appsscript.json from
    this project (or even just the _oauthScopes_ object) into that file.
-   Click on _Resources > Cloud Platform Project_. In the following pop-up
    window, in the section _Change Project_, put the Cloud Project Number you
    retrieved earlier.
-   You can now close this tab and the Script Editor tab, and
    go back to the Google Sheet you've created.
-   Refresh the Google Sheet to activate the code. The Google Sheet will be
    automatically configurated by the tool.

The first time users will use the tool, they will be prompted to grant the
necessary authorizations to the application - such as accessing/editing DV360
entities via the API. This authorization process only needs to be completed
once.

## USAGE

This is the typical workflow when using the tool:

1.  Fill out the _Weather_ sheet, adding a new row for each DV360 Line Item you
    want to control through the tool.
    -   You will only need to fill out the WHITE cells.
    -   In the first two columns, insert the Advertiser ID and the Line Item ID.
    -   In the third column, select the Location Name from the drop-down list.
        You should have prefilled your chosen locations in the _Cities_ sheet
        with the location's name, its latitude and longitude.
    -   In the next column, _Days from today_, please select the number of days
        from today you wish to forecast for, up to 7. If you need the current
        weather, select "Current". If you need the current day's forecast,
        choose 0, for the next day choose 1, etc.
        "Today" will always refer to the day the script is run. By default, the
        tool checks  the weather for midday, but it can be changed in the code.
        To see all the available options, please refer to the [OpenWeatherMap
        documentation](https://openweathermap.org/api/one-call-api).
    -   The _Line Item status to apply_ column is the one containing the actual
        logic you want to apply to determine the updated Line Item status,
        possibly leveraging the weather conditions available in the GRAY cells
        on the left (condition, temperature, humidity, ...). You can see the
        possible values reading the [OpenWeatherMap
        documentation](https://openweathermap.org/api/one-call-api). You can
        treat this as a regular spreadsheet formula, as long as it results in
        an acceptable value (i.e. _ACTIVE_ or _PAUSED_). For instance, if you
        want a line item to be "ACTIVE" only when the temperature is above 25
        degrees use
        ```=IF(F2>25, "ACTIVE", "PAUSED")```
    -   The following column is just a free text cell where you can note down
        the logic used on this row / LI in a readable way, so that others can
        quickly and easily interpret your cell formula from the previous column.
        This cell is not read/used by the tool.
    -   The other columns (GRAY cells) will be populated by the tool: they
        include weather information which will be collected via the
        OpenWeatherMap API and Line Item information collected via the DV360
        API.

2.  From the toolbar, select _DV360 BidByWeather > **Read current LI status**_.
    -   This is an optional step, but a good way to check you have correct DV360
        API access.
    -   The current status of the DV360 Line Items you've entered in the
        _Weather_ sheet will be retrieved and shown in the _Line Item Status_
        column.
    -   As with any other activity done with the tool, the result of the latest
        operation for each LI is shown in the _Log (latest)_ column.

3.  From the toolbar, select _DV360 BidByWeather > **Update Weather only**_.
    -   The first time you run this function, you will be asked to enter the
        OpenWeatherMap API Key to be used by the tool, together with the
        timezone and the temperature unit (metric or imperial).
    -   The tool will go through the list of Line Items and their corresponding
        geographical locations and query the OpenWeatherMap API.
    -   The main resulting parameters (which can be easily customized by editing
        the code) - Condition, Description, Temperature, Humidity - will be
        inserted in the corresponding cells for each row.
    -   The _Line Item status to apply_ cell will also automatically update its
        value depending on the weather parameters and your cell formula.
        Note: the actual line item status will not be impacted unless you run
        the corresponding command (see below).
    -   The tool will wait 1s after each call to the OpenWeatherMap API to make
        sure that 60 calls per minute free-tier API limit is not exceeded. You
        can remove this limitation customizing the code.

4. From the toolbar, select _DV360 BidByWeather > **Update Line Items only**_.
    -   The tool will go through the list of Line Items and make calls to the
        DV360 API to update their status depending on the value (_ACTIVE_ or
        _PAUSED_) of the _Line Item status to apply_ column.

5. If you want to retrieve the weather data _and_ update the DV360 Line Items
    status accordingly, i.e. if you want to run the previous two methods
    in sequence, select _DV360 BidByWeather > **Update Weather and Update Line
    Items**_ from the toolbar.

6. If you want to have the tool running automatically on a schedule, you can use
   Apps Script "triggers":
    -   Select _Tools > Script Editor_ from the toolbar.
    -   Click on the "clock" icon to enter the Triggers configuration screen.
    -   Create a new time-driven trigger, selecting the
        _UpdateWeatherAndSendToDv360_ function.
    -   Please note that the tool needs to be used successfully at least once
        manually in order for you to be able to run it on a scheduled basis
        (i.e. first, manual launch grants correct permissions which are reused
        later on).

7. If you wish to cancel or modify user configuration data, select
   _DV360 BidByWeather > Clear current user config_ from the
    toolbar. When launching the tool again, you will be asked to re-enter the
    configuration data.
