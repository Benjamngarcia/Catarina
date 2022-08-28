var cryptojs = require("crypto-js");
const cifrar = {};

var keyo = '26Xh7SYjRdkHZmdp'; //LLAVE 16 BITS
var ivo = '26Xh7SYjRdkHZmdp'; //VECTOR INICIAL 


var key = cryptojs.enc.Utf8.parse(keyo);
var iv = cryptojs.enc.Utf8.parse(ivo);


cifrar.cifrar = async (textoplano) => {
    var encriptado1 = cryptojs.AES.encrypt(textoplano, key, {
        iv: iv,
        mode: cryptojs.mode.CBC,
        padding: cryptojs.pad.Pkcs7
    });
    return encriptado1;
}

cifrar.descifrartext = async (textocifrado) => {
    var descifrar1 = cryptojs.AES.decrypt(textocifrado, key, {
        iv: iv,
        mode: cryptojs.mode.CBC,
        padding: cryptojs.pad.Pkcs7
    });
    
    var descifrado1 = cryptojs.enc.Utf8.stringify(descifrar1);
    return descifrado1;
}


module.exports = cifrar;
