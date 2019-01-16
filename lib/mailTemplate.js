var mailgun = require('mailgun-js')({
    apiKey: "key-30ec51f26eb12b97f1c2756a82ab0642",
    domain: 'mail.usemobile.com.br',
    fromAddress: "contato@usemobile.com.br"
});
var fs = require('fs');
var Mail = {
    sendEmail: function (toAdress, subject, body) {
        var promise = new Parse.Promise();
        body = "<html>" + body + "<br>" +
            "</html>";
        var data = {
            from: "Contato <web@app.com.br>",
            to: toAdress,
            subject: subject,
            html: body
        };
        mailgun.messages().send(data, function (error, body) {
            if (error) {
                console.log("got an error in sendEmail: " + error);
                promise.reject(error);
            } else {
                console.log("email utils sent to " + toAdress + " from " + data.to + new Date());
                promise.resolve();
            }
        });
        return promise;
    },
    sendMime: function (file, toAddress, title, data) {
        console.log("->>sendMime")
        var filepath = './mails/' + file + ".html";
        var promise = new Parse.Promise();
        fs.readFile(filepath, "utf8", function (err, htmlBody) {
            console.log("err", err)
            for (var key in data) {
                htmlBody = htmlBody.replace("{{" + key + "}}", data[key]);
            }
            console.log("->>send")
            return Mail.sendEmail(toAddress, "[Helpy] " + title, htmlBody).always(function () {
                promise.resolve();
            });
        });
        return promise;
    },
    welcomeEmail: function (name, email) {
        console.log("->>welcomeEmail")
        return Mail.sendMime("welcome", email, "Seja bem vindo", {name: name});
    },
    recoverPassword: function (name, email, url) {
        console.log("->>recoverPassword");
        console.log(url);
        return Mail.sendMime("recover-password", email, "Recuperar Senha", {name: name, url: url});
    }

};

module.exports = Mail;