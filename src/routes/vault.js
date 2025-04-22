const express = require('express');
const router = express.Router();
const pool = require('../db/pool')
const crypto = require('../utils/crypto')

router.get('/', async (req, res) => {
    if (!req.session.key) return res.redirect('/');
    const key = Buffer.from(req.session.key, 'base64');

    try {
        const result = await pool.query("SELECT * FROM credentials");

        const credentials = result.rows.map(row => {
            return {
                id: row.id,
                name: crypto.decrypt(row.name, row.iv, key),
                username: crypto.decrypt(row.username, row.iv, key),
                password: crypto.decrypt(row.password, row.iv, key),
            }
        })

        res.render('vault', { credentials })
    } catch (err) {
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.status(403).render('error', {
                title: "Contraseña incorrecta",
                message: "Tu sesión fue cerrada por seguridad. Intenta ingresar nuevamente."
              });
        });
    }
})

router.post('/add', async (req, res) => {
    const { name, username, password } = req.body;
    const key = Buffer.from(req.session.key, 'base64');
    if (!key) return res.redirect('/');

    //encrypt nos ayudara a generar un iv aleatorio, pero como queremos reutilizarlo, 
    // lo utilizaremos desde aqui
    const iv = crypto.encrypt("dummy", key).iv;

    const encryptedName = crypto.encrypt(name, key, iv).data
    const encryptedUsername = crypto.encrypt(username, key, iv).data
    const encryptedPassword = crypto.encrypt(password, key, iv).data

    await pool.query(
        "INSERT INTO credentials (name, username, password, iv) VALUES ($1,$2,$3,$4)",
        [encryptedName, encryptedUsername, encryptedPassword, iv]
    )

    res.redirect('/vault');
})

router.post('/delete/:id', async (req, res) => {
    const { id } = req.params;
    await pool.query("DELETE FROM credentials where id = $1", [id]);
    res.redirect('/vault');
})

module.exports = router;