/**
 * Created by Patrick on 03/05/2017.
 */
var Messages = {
    success: {
        CREATED_SUCCESS: "O objeto foi criado com sucesso",
        DOWNLOAD_SUCCESS: "Download realizado com sucesso",
        DELETED_SUCCESS: "O objeto foi removido com sucesso",
        EDITED_SUCCESS: "O objeto foi atualizado com sucesso",
        RECOVER_EMAIL_SUCCESS: "Siga os passos enviados ao seu e-mail para redefinir sua senha",
    },
    push: {
    },
    error: {
        ERROR_UNAUTHORIZED: "Voce não esta logado.",
        INVALID_USERNAME: "Nome de usuário ou senha incorretos, tente novamente.",
        ERROR_ACCESS_REQUIRED:  "Voce não possui privilégio para realizar esta ação.",
        INVALID_EMAIL: "Email inválido",


    }
};

module.exports = Messages;