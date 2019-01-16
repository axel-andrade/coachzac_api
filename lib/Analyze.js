'use strict';
const utils = require("./Utils.js");
const conf = require('config');
const Define = require('./Define.js');
const Mail = require('./mailTemplate.js');
const Messages = require('./Messages.js');
const listFields = ["playerId", "commentText", "commentAudio", "points"];

function Analyze(request, response) {

    var _request = request;
    var _response = response;
    var _currentUser = request ? request.user : null;
    var _params = request ? request.params : null;

    var _super = {

        beforeSave: function () {
            console.log("BEFORE SAVE ANALYZE");
            var object = _request.object;
            console.log("Objeto novo: " + _request.object.isNew());
            //console.log(object.get("name").length);

            //verificando tamanho dos campos 
            var wrongFields = utils.verify(object.toJSON(), listFields);

            //console.log(wrongFields.length);

            if (wrongFields.length > 0) {
                _response.error("Field(s) '" + wrongFields + "' not supported.");
            }

            _response.success();

        },

        afterSave: function () {

            return _super.recalculatePlayer(_request.object.toJSON()).then(function () {
                _response.success();
            }, function (error) {
                _response.error(error.code, error.message);
            });

        },

        afterDelete: function () {

            return _super.recalculatePlayer(_request.object.toJSON()).then(function () {
                _response.success();
            }, function (error) {
                _response.error(error.code, error.message);
            });

        },

        recalculatePlayer: function (object) {

            //let analyze = _request.object.toJSON();
            let analyze = object;
            let player = new Define.Player();
            player.id = analyze.player.objectId;

            //procurandos avaliações desse player
            let query = new Parse.Query("Analyze");
            query.equalTo("player", player);
            query.descending("createdAt");
            return query.find().then(function (results) {


                //se o jogador so possuia a avaliaçao que foi deletada, reiniciar seus pontos 
                if (results.length == 0) {

                    player.set("level", 0);
                    player.set("points", []);
                    player.set("badFundaments", []);
                    player.set("mediumFundaments", []);
                    player.set("goodFundaments", []);
                    player.set("countAnalyze", 0);
                    player.unset("lastAnalyze");

                }
                else {
                    console.log(results.length);
                    let points = [];
                    let newPoints = [0, 0, 0, 0, 0, 0, 0, 0];
                    let bad = [];
                    let medium = [];
                    let good = [];
                    let lastAnalyze = "";

                    //recuperando os pontos 
                    for (let i = 0; i < results.length; i++) {

                        let data = results[i].toJSON();
                        //pegando ultima data de avaliação para atualizar o resultado
                        if (i == 0)
                            lastAnalyze = data.createdAt;

                        console.log(data);
                        points.push(data.points);
                    }

                    let sum = 0;
                    for (let i = 0; i < points.length; i++) {
                        sum += _super.calculateLevelPlayer(points[i]);
                        let data = points[i];
                        for (let j = 0; j < data.length; j++) {
                            newPoints[j] += data[j];
                        }
                    }

                    //dividindo pelo numeros de results
                    for (let i = 0; i < newPoints.length; i++) {
                        newPoints[i] = newPoints[i] / results.length;
                    }

                    console.log(sum);
                    console.log(results.length);
                    console.log(newPoints);

                    //identificando os bons, médios e ruins fundamentos
                    for (let i = 0; i < newPoints.length; i++) {
                        //se o fundamento for >= 7
                        if (newPoints[i] >= 7)
                            good.push(i);
                        if (newPoints[i] < 5)
                            bad.push(i);
                        if (newPoints[i] >= 5 && newPoints[i] < 7)
                            medium.push(i);
                    }

                    let level = sum / results.length;
                    console.log(level);
                    player.set("level", level);
                    player.set("points", newPoints);
                    player.set("badFundaments", bad);
                    player.set("mediumFundaments", medium);
                    player.set("goodFundaments", good);
                    player.set("lastAnalyze", lastAnalyze);
                    player.set("countAnalyze", results.length);

                }


                return player.save()
            })
        },

        calculateStatisticPlayer: function (results) {

            console.log(results);

            let points = [];
            let newPoints = [0, 0, 0, 0, 0, 0, 0, 0];
            let bad = [];
            let medium = [];
            let good = [];
            let lastAnalyze = "";


            //recuperando os pontos 
            for (let i = 0; i < results.length; i++) {

                let data = results[i].toJSON();
                //pegando ultima data de avaliação para atualizar o resultado
                if (i == 0)
                    lastAnalyze = data.createdAt;
                //console.log(data);
                points.push(data.points);
            }

            let sum = 0;
            for (let i = 0; i < points.length; i++) {
                sum += _super.calculateLevelPlayer(points[i]);
                let data = points[i];
                for (let j = 0; j < data.length; j++) {
                    newPoints[j] += data[j];
                }
            }

            //dividindo pelo numeros de results
            for (let i = 0; i < newPoints.length; i++) {
                newPoints[i] = newPoints[i] / results.length;
            }


            //identificando os bons, médios e ruins fundamentos
            for (let i = 0; i < newPoints.length; i++) {
                //se o fundamento for >= 7
                if (newPoints[i] >= 7)
                    good.push(i);
                if (newPoints[i] < 5)
                    bad.push(i);
                if (newPoints[i] >= 5 && newPoints[i] < 7)
                    medium.push(i);
            }

            let level = sum / results.length;

            let temp = {
                level: level,
                points: newPoints,
                badFundaments: bad,
                mediumFundaments: medium,
                goodFundaments: good,
                countAnalyze: results.length,
                lastAnalyze: lastAnalyze
            }

            return temp;

        },

        calculateLevelPlayer: function (p) {

            /* valor do peso 16 */
            let sum = p[0] * 1 + p[1] * 1 + p[2] * 2 + p[3] * 3 + p[4] * 1 + p[5] * 3 + p[6] * 3 + p[7] * 2;
            return sum / 16;
        },

        getAnalyzeById: function (id) {
            var query = new Parse.Query("Analyze");
            return query.get(id, { useMasterKey: true });
        },

        getPlayerById: function (id) {
            var query = new Parse.Query("Player");
            return query.get(id, { useMasterKey: true });
        },

        getAnalyzesByPlayerAndDate: function (player, begin, end) {

            let query = new Parse.Query("Analyze");
            query.equalTo("player", player);
            query.greaterThanOrEqualTo('createdAt', begin);
            query.lessThanOrEqualTo('createdAt', end);
            return query.find()
        },

        publicMethods: {

            createAnalyze: function () {

                //Verificando se o usuário esta logado
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId", "points"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                let query = new Parse.Query(Define.Player);
                return query.get(_params.playerId).then(function (player) {

                    let analyze = new Define.Analyze();
                    analyze.set("player", player);
                    analyze.set("coach", _currentUser);
                    analyze.set("commentText", "Teste");
                    analyze.set("commentAudio", _params.commentAudio);
                    analyze.set("points", _params.points);

                    return analyze.save()
                }).then(function (analyze) {
                    _response.success({ objectId: analyze.id });
                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },

            editAnalyze: function () {
                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["analyzeId", "playerId"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //utilizando metódo privado (_super.getplayerById)
                let _analyse;
                return _super.getAnalyzeById(_params.analyzeId).then(function (analyze) {
                    _analyse = analyze;
                    console.log("analyse", analyze)
                    let query = new Parse.Query("Player");
                    return query.get(_params.playerId)

                }).then(function (player) {

                    _analyse.set("player", player);
                    _analyse.set("coach", _currentUser);
                    _analyse.set("commentText", _params.commentText);
                    _analyse.set("commentAudio", _params.commentAudio);
                    _analyse.set("points", _params.points);

                    return _analyse.save();

                }).then(function (response) {
                    _response.success("Os dados da avaliação foram atualizados!");

                }, function (error) {
                    _response.error(error.code, error.message);
                });


            },

            deleteAnalyze: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }
                var requiredFields = utils.verifyRequiredFields(_params, ["analyzeId"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                return _super.getAnalyzeById(_params.analyzeId).then(function success(analyze) {
                    //deletando Coach
                    return analyze.destroy()
                }).then(function (response) {
                    _response.success('Avaliação deletada com sucesso!');
                }, function (error) {
                    _response.error(error.code, error.message)
                });


            },

            getAnalyzeById: function () {

                //Verificando se o usuário esta logado
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["analyzeId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                return _super.getAnalyzeById(_params.analyzeId).then(function (analyze) {
                    var data = analyze.toJSON();

                    _response.success({
                        playerId: data.player.objectId,
                        commentText: data.commentText,
                        commentAudio: data.commentAudio,
                        points: data.points,
                        date: data.createAt
                    });
                }, function (error) {
                    _response.error(error.code, error.message);
                });
            },

            getAnalyzesByPlayer: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required.");
                    return;
                }


                return _super.getPlayerById(_params.playerId).then(function (player) {

                    //Criando a query
                    var query = new Parse.Query("Analyze");
                    query.equalTo('player', player);
                    return query.find()

                }).then(function (result) {

                    var data = [];

                    for (var i = 0; i < result.length; i++) {
                        data.push(utils.formatObjectToJson(result[i], ["commentText", "commentAudio", "points"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });


            },

            getAnalyzesByMonthAndYear: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["month", "year"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required.");
                    return;
                }

                //criando data 
                let now = new Date(_params.year, _params.month - 1);
                let begin = new Date(now.setDate(1));
                let end = new Date(new Date(_params.year, _params.month, 0));

                //ultimo dia do mes corrente (new Date(date.getFullYear(), date.getMonth() + 1, 0))

                //criando a query
                let query = new Parse.Query("Analyze");
                //maior ou igual 
                query.greaterThanOrEqualTo('createdAt', begin);
                //menor ou igual
                query.lessThanOrEqualTo('createdAt', end);

                query.find().then(function (result) {

                    var data = [];

                    for (var i = 0; i < result.length; i++) {
                        data.push(utils.formatObjectToJson(result[i], ["commentText", "commentAudio", "points", "player"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },

            getAnalyzesByYear: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["year"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required.");
                    return;
                }

                //criando data 
                let begin = new Date("01/01/" + _params.year);
                let end = new Date("12/31/" + _params.year);

                //criando a query
                let query = new Parse.Query("Analyze");
                //maior ou igual 
                query.greaterThanOrEqualTo('createdAt', begin);
                //menor ou igual
                query.lessThanOrEqualTo('createdAt', end);

                query.find().then(function (result) {

                    var data = [];

                    for (var i = 0; i < result.length; i++) {
                        data.push(utils.formatObjectToJson(result[i], ["commentText", "commentAudio", "points", "player"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },

            getAnalyzesByDate: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["date"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required.");
                    return;
                }

                //criando data 
                let begin = new Date(_params.date + "T00:00:00");
                let end = new Date(_params.date + "T23:59:59");

                //criando a query
                let query = new Parse.Query("Analyze");
                query.greaterThanOrEqualTo('createdAt', begin);
                query.lessThanOrEqualTo('createdAt', end);
                query.find().then(function (result) {

                    var data = [];

                    for (var i = 0; i < result.length; i++) {
                        data.push(utils.formatObjectToJson(result[i], ["commentText", "commentAudio", "points", "player"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },

            getAnalyzesBetweenDates: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["begin", "end"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required.");
                    return;
                }

                //criando data 
                let begin = new Date(_params.begin + "T00:00:00");
                let end = new Date(_params.end + "T23:59:59");

                //criando a query
                let query = new Parse.Query("Analyze");
                query.greaterThanOrEqualTo('createdAt', begin);
                query.lessThanOrEqualTo('createdAt', end);
                query.find().then(function (result) {

                    var data = [];

                    for (var i = 0; i < result.length; i++) {
                        data.push(utils.formatObjectToJson(result[i], ["commentText", "commentAudio", "points", "player"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });


            },

            getAnalyzesMostRecent: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                //criando a query
                let query = new Parse.Query("Analyze");
                query.descending('createdAt');
                query.find().then(function (result) {

                    var data = [];

                    for (var i = 0; i < result.length; i++) {
                        data.push(utils.formatObjectToJson(result[i], ["commentText", "commentAudio", "points", "player"]));
                    }
                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },

            getStatisticPlayerByYear: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId", "year"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //criando data 
                let begin = new Date("01/01/" + _params.year);
                let end = new Date("12/31/" + _params.year);

                return _super.getPlayerById(_params.playerId).then(function (player) {
                    return _super.getAnalyzesByPlayerAndDate(player, begin, end)
                }).then(function (results) {

                    if (results.length > 0) {
                        _response.success(_super.calculateStatisticPlayer(results));
                    }
                    _response.success();
                }, function () {
                    _response.error(error.code, error.message);
                });

            },

            getStatisticPlayerByMonthAndYear: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId", "year", "month"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                //criando data 
                let now = new Date(_params.year, _params.month - 1);
                let begin = new Date(now.setDate(1));
                let end = new Date(new Date(_params.year, _params.month, 0));

                return _super.getPlayerById(_params.playerId).then(function (player) {
                    return _super.getAnalyzesByPlayerAndDate(player, begin, end)
                }).then(function (results) {

                    if (results.length > 0) {
                        _response.success(_super.calculateStatisticPlayer(results));
                    }
                    _response.success();
                }, function () {
                    _response.error(error.code, error.message);
                });
            },

            getStatisticPlayerBetweenDates: function () {
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["playerId", "begin", "end"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) " + requiredFields + " are required.");
                    return;
                }

                //criando data 
                let begin = new Date(_params.begin + "T00:00:00");
                let end = new Date(_params.end + "T23:59:59");

                return _super.getPlayerById(_params.playerId).then(function (player) {
                    return _super.getAnalyzesByPlayerAndDate(player, begin, end)
                }).then(function (results) {

                    if (results.length > 0) {
                        _response.success(_super.calculateStatisticPlayer(results));
                    }
                    _response.success();
                }, function () {
                    _response.error(error.code, error.message);
                });

            },

            getStatisticPlayerMostRecents: function () {
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

                let query = new Parse.Query("Player");
                query.get(_params.playerId).then(function (player) {

                    let query = new Parse.Query("Analyze");
                    query.equalTo("player", player);
                    query.descending("createdAt");
                    query.limit(3);
                    return query.find()

                }).then(function (results) {

                    console.log(results);
                    if (results.length > 0) {
                        _response.success(_super.calculateStatisticPlayer(results));
                    }

                    _response.success();

                }, function () {
                    _response.error(error.code, error.message);
                });
            }



        }
    };

    return _super;
}

exports.instance = Analyze;

Parse.Cloud.beforeSave("Analyze", function (request, response) {
    Analyze(request, response).beforeSave();
});

Parse.Cloud.afterSave("Analyze", function (request) {
    Analyze(request).afterSave();
});

Parse.Cloud.afterDelete("Analyze", function (request) {
    Analyze(request).afterDelete();
});

for (var key in Analyze().publicMethods) {
    Parse.Cloud.define(key, function (request, response) {
        utils.printLogAPI(request)
        Analyze(request, response).publicMethods[request.functionName]();
    });
}
