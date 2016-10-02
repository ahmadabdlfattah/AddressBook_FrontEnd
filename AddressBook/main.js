//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Address Book Application.
// Description:   This class is the main class which startup the application framework
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

require(
    [
        "dojo/parser",
        'dojo/text!framework/configs/AppConfig.json',
        "framework/ApplicationManager",       
        'framework/enums',
        "dojo/domReady!"
    ],
    function (parser, appConfig, ApplicationManager) {

        parser.parse();

        //Startup the application
        var applicationManager = ApplicationManager.getInstance(JSON.parse(appConfig));
        applicationManager.initApp();
    }
);