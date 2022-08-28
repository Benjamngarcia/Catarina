const express = require('express');
const router = express.Router();
const pool = require('../database');


router.get('/listaProfesores', async (req, res) => {
    if (req.session.loggedinDirec) {
        await pool.query('SELECT * FROM usuarios WHERE escuela_id = ? AND tipo_user = "Profesor"', [req.session.data.escuela_id],async (err, datosProf) =>{
            if (err){
                res.json(err);
            }
            await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEsc) => {
                let protocol = req.get('X-Forwarded-Protocol');
                if (protocol === undefined) {
                    protocol = '';
                }
                const host = req.get('host');
                const linkProf = protocol + host + "/registro/profesores/" + datosEsc[0].escuela_contraProf;
                console.log(linkProf);
                res.render('director/profesoresMain', {
                    logindirec: true,
                    data: req.session.data,
                    escuelaExist: true,
                    dataEsc: datosEsc[0],
                    datosProf: datosProf,
                    linkInvitacion: linkProf
                });
                if (err) {
                    console.log(err)
                }
            });
        });
    } else {
        res.render('director/profesoresMain', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }
    
});


module.exports = router;