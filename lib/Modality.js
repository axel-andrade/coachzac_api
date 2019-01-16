'use strict';
const utils = require('./Utils.js');
const conf = require('config');
const Define = require('./Define.js');
const Mail = require('./mailTemplate.js');
const Messages = require('./Messages.js');
const listFields = ["name", "description", "code"];
const listRequiredFields = [];
let mapmodalitysSending = {};

function Modality(request, response) {

    var _request = request;
    var _response = response;
    var _currentUser = request ? request.user : null;
    var _params = request ? request.params : null;

    var _super = {

        beforeSave: function () {
            console.log("BEFORE SAVE MODALITY");
            var object = _request.object;

            //verificando tamanho dos campos 
            var wrongFields = utils.verify(object.toJSON(), listFields);

            //console.log(wrongFields.length);

            if (wrongFields.length > 0) {
                _response.error("Field(s) '" + wrongFields + "' not supported.");
            }

            _response.success();

        },

        beforeDelete: function () {

            console.log('BEFORE DELETE MODALITY');

            let query = new Parse.Query('Club');
            query.equalTo('modalitys', _request.object);
            return query.find().then(function (clubs) {

                clubs.forEach(club => {

                    let modalitys = [];
                    let temp = club.toJSON();

                    temp.modalitys.forEach(modality => {
                        //retirando modalidade presente no object id
                        if (modality.objectId !== _request.object.id) {
                            let m = new Define.Modality();
                            m.id = modality.objectId;
                            modalitys.push(m);
                        }
                    });

                    console.log(modalitys);
                    //se existem modalidade a serem salvas
                    if (modalitys.length > 0)
                        club.set("modalitys", modalitys);
                    else
                        club.unset("modalitys");
                    
                    club.save();

                });

            }).then(function () {
                _response.success();
            }, function (error) {
                _response.error(error.code, erro.message);
            });

        },

        getModalityById: function (id) {
            let query = new Parse.Query('Modality');
            return query.get(id, { useMasterKey: true });
        },

        publicMethods: {

            createModality: function () {

                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let requiredFields = utils.verifyRequiredFields(_params, ["name", "description", "code"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "' are required.");
                    return;
                }

                let modality = new Define.Modality();
                modality.set("name", _params.name);
                modality.set("description", _params.description);
                modality.set("code", _params.code);

                return modality.save().then(function (modality) {
                    _response.success({ objectId: modality.id });
                }, function (error) {
                    _response.error(error.code, erro.message);
                });

            },

            editModality: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["modalityId", "name", "code", "description"]);

                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                return _super.getModalityById(_params.modalityId).then(function (modality) {

                    modality.set("name", _params.name);
                    modality.set("description", _params.description);
                    modality.set("code", _params.code);

                    return modality.save()

                }).then(function () {
                    _response.success("Os dados da modalidade foram atualizados!");
                }, function (error) {
                    response.error(error.code, error.message);
                });

            },

            deleteModality: function () {
                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }
                var requiredFields = utils.verifyRequiredFields(_params, ["modalityId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                return _super.getModalityById(_params.modalityId).then(function success(modality) {
                    modality.destroy()
                }).then(function () {
                    _response.success('Modalidade deletada  com sucesso!');
                }, function (error) {
                    _response.error(error.code, error.message);
                });
            },

            getModalitys: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                let query = new Parse.Query("Modality");
                return query.find().then(function (modalitys) {
                    let data = [];
                    for (let i = 0; i < modalitys.length; i++)
                        data.push(utils.formatObjectToJson(modalitys[i], ["name", "code", "description"]))
                    _response.success(data);
                }, function (error) {
                    _response.error(error.code, erro.message);
                });
            },

            getModalityById: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["modalityId"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                return _super.getModalityById(_params.modalityId).then(function success(modality) {
                    _response.success(utils.formatObjectToJson(modality, ["name", "description", "code"]));
                }, function (error) {
                    _response.error(error.code, error.message);
                });
            },

            getModalityByCode: function () {

                //Somente usuário logados 
                if (!_currentUser) {
                    _response.error(Messages.error.ERROR_UNAUTHORIZED);
                    return;
                }

                var requiredFields = utils.verifyRequiredFields(_params, ["code"]);
                if (requiredFields.length > 0) {
                    _response.error("Field(s) '" + requiredFields + "'are required.");
                    return;
                }

                let q = new Parse.Query("Modality");
                q.equalTo("code", _params.code);
                return q.first().then(function (modality) {
                    _response.success(utils.formatObjectToJson(modality, ["name", "description"]));
                }, function (error) {
                    _response.error(error.code, erro.message);
                });

            },

        }
    };

    return _super;
}


exports.instance = Modality;

Parse.Cloud.beforeSave("Modality", function (request, response) {
    Modality(request, response).beforeSave();
});

Parse.Cloud.beforeDelete("Modality", function (request, response) {
    Modality(request, response).beforeDelete();
});


for (var key in Modality().publicMethods) {
    Parse.Cloud.define(key, function (request, response) {
        utils.printLogAPI(request)
        Modality(request, response).publicMethods[request.functionName]();
    });
}