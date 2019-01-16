'use strict';
const utils = require("./Utils.js");
const conf = require('config');
const Define = require('./Define.js');
const Mail = require('./mailTemplate.js');
const Messages = require('./Messages.js');
const listFields = ["name", "url", "adress", "phone", "location", "logo", "modalitys"];
const listRequiredFields = [];
let mapplayersSending = {};


function Club(request, response) {

    var _request = request;
    var _response = response;
    var _currentUser = request ? request.user : null;
    var _params = request ? request.params : null;

    var _super = {

        beforeSave: function () {
            console.log("BEFORE SAVE CLUB");
            var object = _request.object;
            console.log(object);
            //verificando tamanho dos campos 
            var wrongFields = utils.verify(object.toJSON(), listFields);

            if (wrongFields.length > 0) {
                _response.error("Field(s) '" + wrongFields + "' not supported.");
            }

            _response.success();

        },

        getClubById: function (id) {
            let query = new Parse.Query("Club");
            return query.get(id, { useMasterKey: true });
        },

        publicMethods: {

            createClub: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let requiredFields = utils.verifyRequiredFields(_params, ["name", "url", "adress", "phone", "ranking", "latitude", "longitude", "logo", "modalitys"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                let q = new Parse.Query("Modality");

                q.containedIn("objectId", _params.modalitys);
                return q.find().then(function (modalitys) {

                    let club = new Define.Club();
                    club.set("name", _params.name);
                    club.set("url", _params.url);
                    club.set("adress", _params.adress);
                    club.set("phone", _params.phone);
                    club.set("ranking", _params.ranking);
                    club.set("logo", _params.logo);
                    club.set("location", new Parse.GeoPoint({
                        latitude: _params.latitude,
                        longitude: _params.longitude
                    }));

                    if (modalitys.length > 0) {

                        //1° forma - criando um vetor de ponteiros 
                        club.set("modalitys", modalitys);

                        /*//2° forma - usando relations 
                        var relation = club.relation("modalitys");

                        modalitys.forEach(modality => {
                            relation.add(modality);
                        }); */
                    }

                    return club.save()
                }).then(function (club) {
                    _response.success({ objectId: club.id });
                }, function (error) {
                    _response.error(error.code, erro.message);
                });

            },

            editClub: function () {
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let requiredFields = utils.verifyRequiredFields(_params, ["clubId", "name", "url", "adress", "phone", "ranking", "latitude", "longitude", "logo", "modalitys"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                let _club;
                return _super.getClubById(_params.clubId).then(function (club) {

                    _club = club;
                    let q = new Parse.Query("Modality");
                    q.containedIn("objectId", _params.modalitys);

                    return q.find()

                }).then(function (modalitys) {

                    _club.set("name", _params.name);
                    _club.set("url", _params.url);
                    _club.set("adress", _params.adress);
                    _club.set("phone", _params.phone);
                    _club.set("ranking", _params.ranking);
                    _club.set("logo", _params.logo);
                    _club.set("location", new Parse.GeoPoint({
                        latitude: _params.latitude,
                        longitude: _params.longitude
                    }));

                    if (modalitys.length > 0)
                        _club.set("modalitys", modalitys);
                    else
                        _club.unset("modalitys");

                    return _club.save()
                }).then(function () {
                    _response.success("Clube alterado com sucesso!");
                }, function (error) {
                    _response.error(error.code, erro.message);
                });


            },

            deleteClub: function () {
                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }
                var requiredFields = utils.verifyRequiredFields(_params, ["clubId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                return _super.getClubById(_params.clubId).then(function success(club) {
                    club.destroy()
                }).then(function () {
                    _response.success('Clube deletado com sucesso!');
                }, function (error) {
                    _response.error(error.code, error.message);
                });
            },

            getClubs: function () {
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let query = new Parse.Query("Club");
                query.include('modalitys');
                return query.find(function (clubs) {
                    let data = [];

                    clubs.forEach(club => {

                        let temp = club.toJSON();
                        let modalitys = [];
                        temp.modalitys.forEach(modality => {
                            modalitys.push({
                                name: modality.name,
                                objectId: modality.objectId
                            });
                        });

                        data.push({
                            name: temp.name,
                            url: temp.url,
                            adress: temp.adress,
                            phone: temp.phone,
                            ranking: temp.ranking,
                            location: temp.location,
                            logo: temp.logo,
                            objectId: temp.objectId,
                            modalitys: modalitys
                        });

                    });


                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });

            },
            
            getClubGreaterDistancePoint: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let requiredFields = utils.verifyRequiredFields(_params, ["latitude", "longitude"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                //criando o ponto 
                let point = new Parse.GeoPoint({
                    latitude: _params.latitude,
                    longitude: _params.longitude
                });

                console.log(point);
                let query = new Parse.Query("Club");
                query.near("location", point);
                query.limit(3);
                return query.find().then(function (results) {
                    let data = [];
                    for (let i = 0; i < results.length; i++) {
                        let temp = results[i].toJSON();
                        let distance = results[i].get("location").kilometersTo(point);
                        data.push({ name: temp.name, distance: distance.toFixed(2) + "  km" });
                    }

                    _response.success(data);

                }, function (error) {
                    _response.error(error.code, error.message);
                });


            },

            getDistancePointBestRanking: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let requiredFields = utils.verifyRequiredFields(_params, ["latitude", "longitude"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                //criando o ponto 
                let point = new Parse.GeoPoint({
                    latitude: _params.latitude,
                    longitude: _params.longitude
                });

                let q1 = new Parse.Query("Club");
                q1.near("location", point);
                q1.limit(3);
                q1.descending('ranking');
                return q1.find().then(function (clubs) {

                    let data = [];
                    for (let i = 0; i < clubs.length; i++) {
                        var distance = clubs[i].get("location").kilometersTo(point);
                        console.log(clubs[i].get("name") + " distance " + distance + " km");
                        data.push({
                            name: clubs[i].get("name"),
                            distance: distance.toFixed(2) + " km",
                            ranking: clubs[i].get("ranking")
                        });
                    }

                    _response.success(data);
                }, function (error) {
                    _response.error(error.code, erro.message);
                });

            },

            getClubsWithinRadius: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let requiredFields = utils.verifyRequiredFields(_params, ["latitude", "longitude", "radius"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                //criando o ponto 
                let point = new Parse.GeoPoint({
                    latitude: _params.latitude,
                    longitude: _params.longitude
                });

                var q = new Parse.Query("Club");
                q.withinKilometers("location", point, _params.radius);
                q.find().then(function (clubs) {

                    let data = [];
                    for (var i = 0; i < clubs.length; i++) {
                        var distance = clubs[i].get("location").kilometersTo(point);
                        console.log(clubs[i].get("name") + " distance " + distance + " km");
                        data.push({
                            name: clubs[i].get("name"),
                            distance: distance.toFixed(2) + " km"
                        });
                    }

                    _response.success(data);
                });

            },

        }
    };

    return _super;
}

exports.instance = Club;

Parse.Cloud.beforeSave("Club", function (request, response) {
    Club(request, response).beforeSave();
});

for (var key in Club().publicMethods) {
    Parse.Cloud.define(key, function (request, response) {
        utils.printLogAPI(request)
        Club(request, response).publicMethods[request.functionName]();
    });
}

/*
3) Devolva toda a coffeeshop na caixa delimitadora definida pela caixa delimitadora com canto
inferior esquerdo com latitude de 37.761536 e longitude -122.444258 e canto superior direito com latitude de 37.786841 e longitude de -122.400398


// 3
var southwest = new Parse.GeoPoint({latitude: 37.761536, longitude: -122.444258});
var northeast = new Parse.GeoPoint({latitude: 37.786841, longitude: -122.400398});

var q = new Parse.Query("PizzaPlace");
q.withinGeoBox("location", southwest, northeast);
q.find().then(function(places) {
		for (var i = 0; i < places.length; i++) {
			var place = places[i];
			var distance = place.get("location").kilometersTo(sf);
			console.log(place.get("name") + " distance " + distance + " km");
		}
});
*/

