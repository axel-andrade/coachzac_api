require("./User.js");
require("./PushNotification.js");
require("./Player.js");
require("./Analyze.js");
require("./Training.js");
require("./Fundament.js");
require("./Club.js");
require("./Modality.js");


Parse.Cloud.define('hello', function (req, res) {
    res.success('Hi');
});
