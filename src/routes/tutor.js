const express = require('express');
const router = express.Router();
const pool = require('../database');
const { body, validationResult } = require('express-validator');
const cifrar = require('../lib/cifrados');
const formato = require('../lib/formatoFechas');

router.get('/inicioTutor', async (req, res) => {
    if (req.session.loggedinTutor) {
        let buscaTutor = await pool.query('SELECT * FROM tutores WHERE usuarios_id =  ?', [req.session.data.id_user])
        var buscaHijo = await pool.query('SELECT * FROM usuarios u INNER JOIN (SELECT * FROM tutores) AS t ON u.id_user = t.usuarios_id INNER JOIN (SELECT * FROM alumnos) AS a ON a.id_alum = t.alumnos_id INNER JOIN (SELECT * FROM usuarios) AS u1 ON a.usuarios_id = u1.id_user WHERE id_tutor = ?', [buscaTutor[0].id_tutor]);
        await pool.query('SELECT * FROM encuestas WHERE alumno_id = ?', [buscaHijo[0].id_alum], (err, historialEnc) => {
            let riesgo = 'Alto riesgo';
            let sano = 'Bajo riesgo';
            for (var i = 0; i < historialEnc.length; i++) {
                if (historialEnc[i].enc_res === 0) {
                    historialEnc[i].enc_res = sano
                } else if (historialEnc[i].enc_res === 1) {
                    historialEnc[i].enc_res = riesgo
                } else {
                    historialEnc[i].enc_res = ''
                }
            }
            let resultEnc = historialEnc.map(resul => ({
                ...resul,
                enc_fecha: formato.actualDate(resul.enc_fecha)
            }));
            res.render('tutor/inicioTutor', {
                logintutor: true,
                data: req.session.data,
                historial: resultEnc,
                datosAlum: buscaHijo[0]
            });
        });
    } else {
        res.render('tutor/inicioTutor', {
            logintutor: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.get('/resultadosCuestionario/:id_enc', async (req, res) => {
    try{
        if (req.session.loggedinTutor) {
            const id = req.params;
            await pool.query('SELECT contacto, dolor_cabeza, tos, dificultad_respirar, perdida_sentidos, moco, diarrea, fiebre FROM respuestas WHERE encuesta_id = ?', [id.id_enc], (err, detallesEnc) => {
                let afirmativo = 'Sí';
                let negativo = 'No';
                for (var i = 0; i < detallesEnc.length; i++) {
                    if (detallesEnc[i].contacto === 0) {
                        detallesEnc[i].contacto = negativo
                    } else {
                        detallesEnc[i].contacto = afirmativo
                    }
                    if (detallesEnc[i].dolor_cabeza === 0) {
                        detallesEnc[i].dolor_cabeza = negativo
                    } else {
                        detallesEnc[i].dolor_cabeza = afirmativo
                    }
                    if (detallesEnc[i].tos === 0) {
                        detallesEnc[i].tos = negativo
                    } else {
                        detallesEnc[i].tos = afirmativo
                    }
                    if (detallesEnc[i].dificultad_respirar === 0) {
                        detallesEnc[i].dificultad_respirar = negativo
                    } else {
                        detallesEnc[i].dificultad_respirar = afirmativo
                    }
                    if (detallesEnc[i].perdida_sentidos === 0) {
                        detallesEnc[i].perdida_sentidos = negativo
                    } else {
                        detallesEnc[i].perdida_sentidos = afirmativo
                    }
                    if (detallesEnc[i].moco === 0) {
                        detallesEnc[i].moco = negativo
                    } else {
                        detallesEnc[i].moco = afirmativo
                    }
                    if (detallesEnc[i].diarrea === 0) {
                        detallesEnc[i].diarrea = negativo
                    } else {
                        detallesEnc[i].diarrea = afirmativo
                    }
                    if (detallesEnc[i].fiebre === 0) {
                        detallesEnc[i].fiebre = negativo
                    } else {
                        detallesEnc[i].fiebre = afirmativo
                    }
                }
                res.render('tutor/infoEncuesta', {
                    logintutor: true,
                    data: req.session.data,
                    historial: detallesEnc[0]
                });
            });
        } else {
            res.render('tutor/infoEncuesta', {
                logintutor: false,
                name: 'Debes iniciar sesión'
            });
        }
    } catch(error){
        res.render('partials/error404')
    }
});

router.get('/editarInfoTutor/:id_user', async (req, res) => {
    let sesion = req.session.data
    // console.log(sesion.id_user)
    console.log(req.params.id_user)
    try{
        if (sesion.id_user == req.params.id_user){
            const id = req.params;
            if (req.session.loggedinTutor) {
                let buscaUsuario = await pool.query('SELECT * FROM usuarios WHERE ?', [id]);
                let infoAlum = buscaUsuario[0]
                let usuarioContra = await cifrar.descifrartext(buscaUsuario[0].user_contra)
                delete infoAlum.user_contra;
                let contraNormal = { user_contra: usuarioContra }
                let datosFinal = Object.assign(infoAlum, contraNormal);
                res.render('tutor/editarTutor', {
                    logintutor: true,
                    data: req.session.data,
                    info: datosFinal
                });
            } else {
                res.render('tutor/editarTutor', {
                    logintutor: false,
                    name: 'Debes iniciar sesión'
                });
            }
        } else{
            res.render('partials/error404')
        }
    } catch {
        res.render('partials/error404')
    }
});

router.post('/editarInfoTutor/:id_user',
    [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)]
    , async (req, res) => {
        if (req.session.loggedinTutor) {
            const id = req.params;
            let newInfo = req.body;
            let usuarioContra = await cifrar.cifrar(newInfo.user_contra)
            delete newInfo.user_contra;
            let contraCifrada = { user_contra: usuarioContra }
            let datosFinal = Object.assign(newInfo, contraCifrada);
            pool.query('UPDATE usuarios SET ? WHERE ?', [datosFinal, id]);
            res.redirect('/inicioTutor');
        } else {
            res.render('tutor/editarTutor', {
                loginalum: false,
                name: 'Debes iniciar sesión'
            });
        }
    });

module.exports = router;
