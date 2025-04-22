const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db/pool');
dotenv.config();

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    const check = await pool.query(`SELECT to_regclass('public.credentials') AS exists;`);
    if (!check.rows[0].exists) {
      const sql = fs.readFileSync(path.join(__dirname, "db", "init.sql"), "utf8");
      await pool.query(sql);
      console.log("✅ Tabla 'credentials' creada desde init.sql");
    }

    const app = express();

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    app.use(express.urlencoded({ extended: true }));

    app.use(session({
      store: new pgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing:true
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false, //No guardes ni envíes la cookie hasta que el usuario haya modificado su sesión
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
    }));

    app.get('/', (req, res) => {
      res.render('login');
    });

    app.post('/login', (req, res) => {
      const { password } = req.body;
      if (!password) return res.redirect('/');
      const crypto = require('./utils/crypto');
      req.session.key = crypto.deriveKey(password).toString('base64');
      res.redirect('/vault');
    });

    app.get('/logout', (req, res) => {
      req.session.destroy(err => {
        if (err) {
          console.error("❌ Error al cerrar sesión:", err);
          return res.status(500).send("Error al cerrar sesión");
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
      });
    });

    const vaultRoutes = require('./routes/vault');
    app.use('/vault', vaultRoutes);

    app.listen(PORT, () => {
      console.log(`✅ App corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error antes de iniciar servidor:", err);
    process.exit(1);
  }
})();
