const express = require('express');
const router = express.Router();
const pool = require('../database');


router.get('/listaAlumnos', async (req, res) => {
    try{
        if (req.session.loggedinDirec) {
            await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT alumno_id, MAX(id_enc) max_time FROM encuestas GROUP BY alumno_id) AS t ON c.id_enc=t.max_time AND c.alumno_id=t.alumno_id INNER JOIN alumnos a ON c.alumno_id = a.id_alum RIGHT JOIN usuarios u ON a.usuarios_id = u.id_user WHERE escuela_id = ? AND tipo_user = "Alumno"', [req.session.data.escuela_id], async (err, datosAlum) =>{
                let riesgo = 'Alto riesgo';
                let sano = 'Bajo riesgo';
                for( var i = 0; i < datosAlum.length; i++){
                    if(datosAlum[i].enc_res === 0){
                        datosAlum[i].enc_res = sano
                    } else if (datosAlum[i].enc_res === 1){
                        datosAlum[i].enc_res = riesgo
                    } else {
                        datosAlum[i].enc_res = ''
                    }
                }
                if (err){
                    res.json(err);
                }
                await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEsc) => {
                    let protocol = req.get('X-Forwarded-Protocol');
                    if (protocol === undefined) {
                        protocol = '';
                    }
                    const host = req.get('host');
                    const linkAlum = protocol + host + "/registro/alumnos/" + datosEsc[0].escuela_contraAlum;
                    console.log(linkAlum);
                    res.render('director/alumnosMain', {
                        logindirec: true,
                        data: req.session.data,
                        escuelaExist: true,
                        dataEsc: datosEsc[0],
                        datosAlum: datosAlum,
                        linkInvitacion: linkAlum
                    });
                    if (err) {
                        console.log(err)
                    }
                });
            });
        } else {
            res.render('director/alumnosMain', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    } catch (error){
        res.render('partials/error404')
    }
});


module.exports = router;