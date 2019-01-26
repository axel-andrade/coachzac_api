'use strict';
const utils = require("./Utils.js");
const conf = require('config');
const Define = require('./Define.js');
const Mail = require('./mailTemplate.js');
const Messages = require('./Messages.js');
const listFields = ["name", "email", "dateOfBirth", "weight", "height", "adress", "phone", "profileImage", "level", "points", "countAnalyze", "badFundaments", "mediumFundaments", "goodFundaments", "lastAnalyze", "favorited",];
const listRequiredFields = ["name", "email", "dateOfBirth", "genre", "weight", "height", "adress", "phone"];
let mapplayersSending = {};

function Player(request, response) {

    var _request = request;
    var _response = response;
    var _currentUser = request ? request.user : null;
    var _params = request ? request.params : null;

    var _super = {

        beforeSave: function () {
            console.log("BEFORE SAVE PLAYER");
            var object = _request.object;
            //console.log(object.get("name").length);

            //verificando tamanho dos campos 
            var wrongFields = utils.verify(object.toJSON(), listFields);

            //console.log(wrongFields.length);

            if (wrongFields.length > 0) {
                _response.error("Field(s) '" + wrongFields + "' not supported.");
            }

            //verificando email
            if (!utils.validateEmail(object.get('email'))) {
                _response.error(Messages.error.INVALID_EMAIL);
            }


            //verificando se o email ja existe
            var query = new Parse.Query('Player');
            query.equalTo('email', object.get('email'));
            query.first().then(function (result) {
                console.log(result);
                console.log(object.id);
                console.log(result !== null);
                console.log(object.isNew());
                if (result && (object.isNew() || result.id !== object.id)) {
                    console.log('Saida 1');
                    _response.error('E-mail: ' + object.get('email') + ' already registered');
                }
                else {
                    console.log('saida2');
                    _response.success();
                }

            });


            //_response.success();

        },

        getPlayerById: function (id) {

            var query = new Parse.Query("Player");
            return query.get(id, { useMasterKey: true });

        },

        afterDelete: function () {

            let data = _request.object.toJSON();
            let player = new Define.Player();
            player.id = data.objectId;

            let q1 = new Parse.Query("Analyze");
            q1.equalTo("player", player);
            q1.find().then(function (results) {
                  Parse.Object.destroyAll(results);
            });

            let q2 = new Parse.Query("Training");
            q2.equalTo("player", player);
            q2.find().then(function (results) {
                  Parse.Object.destroyAll(results);
            });

        },

        publicMethods: {

            createPlayer: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                //verificando campos 
                var requiredFields = utils.verifyRequiredFields(_params, ["name", "email", "dateOfBirth", "weight", "height", "adress", "phone"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                var player = new Define.Player();
                _params.email = _params.email.toLowerCase().trim();
                player.set("name", _params.name);
                player.set("email", _params.email);
                player.set("dateOfBirth", _params.dateOfBirth);
                player.set("weight", _params.weight);
                player.set("height", _params.height);
                player.set("adress", _params.adress);
                player.set("phone", _params.phone);
                player.set("genre", _params.genre)
                player.set("profileImage", _params.profileImage);
                player.set("level", 0);
                player.set("points", undefined);
                player.set("lastAnalyze", undefined);
                player.set("badFundaments", undefined);
                player.set("countAnalyze", 0);
                player.set("goodFundaments", undefined);
                player.set("coach", _currentUser);
                player.set("favorited", false);

                player.save().then(function (player) {
                    _response.success({ objectId: player.id });
                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },

            editPlayer: function () {
                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId", "name", "email", "dateOfBirth", "weight", "height", "adress", "phone"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //utilizando metódo privado (_super.getplayerById)
                return _super.getPlayerById(_params.playerId).then(function (player) {
                    console.log(player);
                    //_response.success(response);
                    _params.email = _params.email.toLowerCase().trim();
                    player.set("name", _params.name);
                    player.set("email", _params.email);
                    player.set("dateOfBirth", _params.dateOfBirth);
                    player.set("weight", _params.weight);
                    player.set("height", _params.height);
                    player.set("adress", _params.adress);
                    player.set("phone", _params.phone);
                    return player.save()

                }).then(function () {
                    _response.success("Os dados do atleta foram atualizados!");
                }, function (error) {
                    response.error(error.code, error.message);
                });

            },

            deletePlayer: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }
                var requiredFields = utils.verifyRequiredFields(_params, ["playerId"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                return _super.getPlayerById(_params.playerId).then(function success(player) {
                    //deletando Coach
                    player.destroy()
                }).then(function (response) {
                    _response.success('Atleta deletado com sucesso!');
                }, function (error) {
                    _response.error(error.code, error.message);
                });


            },

            getPlayerById: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //utilizando metódo privado (_super.getPlayerById)
                return _super.getPlayerById(_params.playerId).then(function (response) {
                   
                    _response.success(utils.formatObjectToJson(response, ["name", "email", "dateOfBirth", "weight", "height", "adress", "phone", "profileImage", "level","points","badFundaments","mediumFundaments","goodFundaments","lastAnalyze"]));
                }, function (response, error) {
                    response.error(error.message);
                });
            },

            getPlayers: function () {


                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                //buscando atletas 
                var query = new Parse.Query("Player");
                return query.find().then(function (results) {
                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                       
                        data.push(utils.formatObjectToJson(results[i],["name", "email", "dateOfBirth", "weight", "height", "adress", "phone", "profileImage", "level","points","badFundaments","mediumFundaments","goodFundaments","lastAnalyze"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.message);
                });

            },

            getFavoritePlayers: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                //buscando atletas 
                var query = new Parse.Query("Player");
                query.equalTo("favorited", true);
                return query.find().then(function (result) {
                    var data = [];

                    for (var i = 0; i < result.length; i++) {

                        data.push(utils.formatObjectToJson(result[i], ["name", "email", "dateOfBirth", "weight", "height", "adress", "phone", "profileImage", "level","points","badFundaments","mediumFundaments","goodFundaments","lastAnalyze"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.message);
                });

            },
            
            getPlayersByName: function () {


                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["nameSearch"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //procurando atletas com 
                var query = new Parse.Query("Player");
                query.matches("name", _params.nameSearch, "i");
                return query.find().then(function (results) {
                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                       
                        data.push(utils.formatObjectToJson(results[i],["name", "email", "dateOfBirth", "weight", "height", "adress", "phone", "profileImage", "level","points","badFundaments","mediumFundaments","goodFundaments","lastAnalyze"]));

                    }
                    // data.push(utils.formatPFObjectInJson(result[i],["commentText","commentAudio","points","createdAt"]));
                    _response.success(data);

                }, function () {
                    _response.error(error.message);
                });

            },

            getPlayersForAnalyze: function () {


                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                //buscando atletas 
                var query = new Parse.Query("Player");
                return query.find().then(function (results) {
                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                        data.push(utils.formatObjectToJson(results[i],["name","profileImage"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.message);
                });

            },

            getPlayersForAnalyzeByName: function () {


                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["nameSearch"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //procurando atletas com 
                var query = new Parse.Query("Player");
                query.matches("name", _params.nameSearch);
                return query.find().then(function (results) {
                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                        data.push(utils.formatObjectToJson(results[i],["name","profileImage"]));
                    }
                    _response.success(data);

                }, function () {
                    _response.error(error.message);
                });

            },

            getPlayersByAlphabeticalOrder: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                //buscando atletas 
                var query = new Parse.Query("Player");
                query.ascending('name');
                return query.find().then(function (results) {
                    var data = [];

                    for (var i = 0; i < results.length; i++) {
                        data.push(utils.formatObjectToJson(results[i],["name", "email", "dateOfBirth", "weight", "height","adress", "phone", "profileImage", "level","points","badFundaments","mediumFundaments","goodFundaments","lastAnalyze"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.message);
                });

            },

            makeFavorite: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required");
                    return;
                }

                return _super.getPlayerById(_params.playerId).then(function (player) {
                    //se o atleta já for favorito
                    if (player.get("favorited")) {
                        _response.error("O atleta já pertence a lista de favoritos")
                    }
                    player.set("favorited", true);
                    return player.save()
                }).then(function () {
                    _response.success("Atleta adicionado na lista de atletas favoritos");
                }, function (error) {
                    _response.error(error.code, error.code);
                });

            },

            unmakeFavorite: function () {
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required");
                    return;
                }

                return _super.getPlayerById(_params.playerId).then(function (player) {

                    //se o atleta já for favorito
                    if (!player.get("favorited")) {
                        _response.error("O atleta não pertence a lista de favoritos")
                    }

                    player.set("favorited", false);

                    return player.save()
                }).then(function () {
                    _response.success("Atleta retirado da lista de atletas favoritos");
                }, function (error) {
                    _response.error(error.code, error.code);
                });
            },

        }
    };

    return _super;
}

exports.instance = Player;

/* CALLBACKS */
Parse.Cloud.beforeSave("Player", function (request, response) {
    Player(request, response).beforeSave();
});

Parse.Cloud.afterDelete("Player", function (request) {
    Player(request).afterDelete();
});

for (var key in Player().publicMethods) {
    Parse.Cloud.define(key, function (request, response) {
        utils.printLogAPI(request)
        Player(request, response).publicMethods[request.functionName]();
    });
}



        // emailExists: async email =>{

        //     var Player = new Define.Player();
        //     var query = new Parse.Query(Player);
        //     var result = await query.find();

        //     if(result.length === 0)
        //         return false;
        //     else    
        //         return true;

        // },
