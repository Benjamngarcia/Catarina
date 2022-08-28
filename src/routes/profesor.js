const express = require('express');
const router = express.Router();
const pool = require('../database');
const formato = require('../lib/formatoFechas');
const cifrar = require('../lib/cifrados');
const { body, validationResult } = require('express-validator');




router.get('/inicioProfesor', async (req, res) => {
    if (req.session.loggedinProf) {
        // var buscaEscuela = await pool.query('SELECT * FROM usuarios WHERE escuela_id = ?', [req.session.data.escuela_id]);
        await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT alumno_id, MAX(id_enc) max_time FROM encuestas GROUP BY alumno_id) AS t ON c.id_enc=t.max_time AND c.alumno_id=t.alumno_id INNER JOIN alumnos a ON c.alumno_id = a.id_alum INNER JOIN usuarios u ON a.usuarios_id = u.id_user WHERE escuela_id = ?', [req.session.data.escuela_id], async (err, datosAlum) => {
            let riesgo = 'Alto riesgo';
            let sano = 'Bajo riesgo';
            for (var i = 0; i < datosAlum.length; i++) {
                if (datosAlum[i].enc_res === 0) {
                    datosAlum[i].enc_res = sano
                } else if (datosAlum[i].enc_res === 1) {
                    datosAlum[i].enc_res = riesgo
                } else {
                    datosAlum[i].enc_res = ''
                }
            }
            let result = datosAlum.map(resul => ({
                ...resul,
                enc_fecha: formato.actualDate(resul.enc_fecha)
            }));
            if (err) {
                res.json(err);
            }
            await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEsc) => {
                res.render('profesor/inicioProf', {
                    loginprof: true,
                    data: req.session.data,
                    escuelaExist: true,
                    dataEsc: datosEsc[0],
                    datosAlum: result
                });
                if (err) {
                    console.log(err)
                }
            });
        });
    } else {
        res.render('profesor/inicioProf', {
            loginprof: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.get('/editarInfoProfesor/:id_user', async (req, res) => {
    let sesion = req.session.data
    // console.log(sesion.id_user)
    console.log(req.params.id_user)
    try{
        if (sesion.id_user == req.params.id_user){
            const id = req.params;
            if (req.session.loggedinProf) {
                let buscaUsuario = await pool.query('SELECT * FROM usuarios WHERE ?', [id]);
                let infoAlum = buscaUsuario[0]
                let usuarioContra = await cifrar.descifrartext(buscaUsuario[0].user_contra)
                delete infoAlum.user_contra;
                let contraNormal = { user_contra: usuarioContra }
                let datosFinal = Object.assign(infoAlum, contraNormal);
                res.render('profesor/editarProf', {
                    loginprof: true,
                    data: req.session.data,
                    info: datosFinal
                });
            } else {
                res.render('profesor/editarProf', {
                    loginprof: false,
                    name: 'Debes iniciar sesión'
                });
            }
        } else{
            res.render('partials/error404')
        }
    } catch (error){
        res.render('partials/error404')
    }
});

router.post('/editarInfoProf/:id_user',
    [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)]
    , async (req, res) => {
        if (req.session.loggedinProf) {
            const id = req.params;
            let newInfo = req.body;
            let usuarioContra = await cifrar.cifrar(newInfo.user_contra)
            delete newInfo.user_contra;
            let contraCifrada = { user_contra: usuarioContra }
            let datosFinal = Object.assign(newInfo, contraCifrada);
            pool.query('UPDATE usuarios SET ? WHERE ?', [datosFinal, id]);
            res.redirect('/inicioProfesor');
        } else {
            res.render('profesor/editarProf', {
                loginprof: false,
                name: 'Debes iniciar sesión'
            });
        }
});

module.exports = router;