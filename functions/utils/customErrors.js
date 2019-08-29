function InternalServerError(message){
    this.name = "[InternalServerError]";
    this.message = message;
}

function AccountAlreadyExistsError(message) {
    this.name = "[AccountAlreadyExistsError]";
    this.message = message;
}

AccountAlreadyExistsError.prototype = new Error();
InternalServerError.prototype = new Error();

module.exports = {
    AccountAlreadyExistsError,
    InternalServerError
};