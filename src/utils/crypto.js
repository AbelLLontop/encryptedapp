const crypto = require('crypto');

function deriveKey(password){
    //generar clave para cifrar y decifrar
    return crypto.createHash("sha256").update(password).digest()
}

//key: clave cifrada en derivekey
function encrypt(text,key,optionalIV){
    const iv = optionalIV? Buffer.from(optionalIV,'base64') : crypto.randomBytes(16);
    //creamos cipher con la password hasheada y un vectos existente o aleatorio
    const cipher = crypto.createCipheriv('aes-256-cbc',key,iv);
    //encriptamos el texto utilizando el cipher
    let encrypted = cipher.update(text,'utf-8','base64');
    encrypted+=cipher.final('base64');
    return {
        iv:iv.toString('base64'),
        data:encrypted
    }
}

function decrypt(encrypted,ivBase64,key){
    const iv = Buffer.from(ivBase64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

module.exports = { deriveKey, encrypt, decrypt };