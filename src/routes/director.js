const express = require('express');
const router = express.Router();
const pool = require('../database');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
var lodash = require('lodash');
const cifrar = require('../lib/cifrados');
const formato = require('../lib/formatoFechas');
const { google } = require('../keys');


function generarId(largo) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < largo; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

router.get('/inicioDirec', async (req, res) => {
    if (req.session.loggedinDirec) {
        var buscaEscuela = await pool.query('SELECT * FROM usuarios WHERE escuela_id = ?', [req.session.data.escuela_id]);
        if (buscaEscuela.length > 0) {
            await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEnc) => {
                res.render('director/inicioDirec', {
                    logindirec: true,
                    data: req.session.data,
                    escuelaExist: true,
                    dataEsc: datosEnc[0]
                });
                if (err) {
                    console.log(err)
                }
            });
        } else {
            res.render('director/inicioDirec', {
                logindirec: true,
                data: req.session.data,
                escuelaExist: false
            });
        }
    } else {
        res.render('director/inicioDirec', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.post('/crearEscuela',
    [body('escuela_nom', 'Ingrese el nombre de la escuela').exists().matches(/^[0-9a-zA-ZÀ-ÿ\s]{1,44}$/)],
    async (req, res) => {
        if (req.session.loggedinDirec) {
            var valores = req.body
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.render('director/inicioDirec', {
                    alert: true,
                    alertTitle: "Error al registrar.",
                    alertMessage: "No se pudo registrar correctamente, favor de llenar correctamente el formulario.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 3000,
                    ruta: 'inicioDirec'
                });
            } else { //SI NO HAY ERROR AL LLENAR EL FORMULARIO
                //SI DESDE UN PRINCIPIO NO EXITSE ID IGUAL
                let passACifrada = await generarId(9);
                let passPCifrada = await generarId(9);

                await pool.query('INSERT INTO escuelas SET ?',
                    { escuela_nom: valores.escuela_nom, escuela_contraAlum: passACifrada, escuela_contraProf: passPCifrada, usuario_creador: req.session.data.id_user, cct: valores.cct, nivel_educativo: valores.nivel_educativo, turno: valores.turno, sostenimiento: valores.sostenimiento, estado: valores.estado, municipio: valores.municipio, calle: valores.calle },
                    async (error, results) => {
                        if (error) {
                            console.log(error);
                        } else {
                            infoEscuela = await pool.query('SELECT * FROM escuelas WHERE usuario_creador = ?', [req.session.data.id_user]);
                            //CONSULTA PARA TOMAR EL ID DE LA ESCUELA QUE SE ACABA DE GUARDAR
                            datosEncuela = infoEscuela[0];
                            await pool.query('UPDATE usuarios SET ? WHERE ?', [{ escuela_id: datosEncuela.id_escuela }, { id_user: req.session.data.id_user }], async (err, resul) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    await pool.query('SELECT * FROM escuelas WHERE usuario_creador = ?', [req.session.data.id_user], (err, datosEnc) => {
                                        res.render('director/inicioDirec', {
                                            logindirec: true,
                                            data: req.session.data,
                                            escuelaExist: true,
                                            dataEsc: datosEnc[0]
                                        });
                                        if (err) {
                                            console.log(err)
                                        }
                                    });
                                }
                            });
                        }
                    });
            }
        } else {
            res.render('director/inicioDirec', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    });


router.get('/editarInfo/:id_user', async (req, res) => {
    try {
        if (req.session.data.id_user == req.params.id_user){
            const id = req.params;
            if (req.session.loggedinDirec) {
                let buscaEscuela = await pool.query('SELECT * FROM usuarios WHERE escuela_id = ?', [req.session.data.escuela_id]);
                let buscaUsuario = await pool.query('SELECT * FROM usuarios WHERE ?', [id]);
                let infoAlum = buscaUsuario[0]
                let usuarioContra = await cifrar.descifrartext(buscaUsuario[0].user_contra)
                delete infoAlum.user_contra;
                let contraNormal = { user_contra: usuarioContra }
                let datosFinal = Object.assign(infoAlum, contraNormal);
                if (buscaEscuela.length > 0) {
                    res.render('director/editarDir', {
                        logindirec: true,
                        data: req.session.data,
                        info: datosFinal,
                        escuelaExist: true
                    });
                } else {
                    res.render('director/editarDir', {
                        logindirec: true,
                        data: req.session.data,
                        info: buscaUsuario[0],
                        escuelaExist: false
                    });
                }
            } else {
                res.render('director/editarDir', {
                    logindirec: false,
                    name: 'Debes iniciar sesión'
                });
            }
        } else {
            res.render('partials/error404')
        }
    } catch (error) {
        res.render('partials/error404')
    }
});

router.post('/editarInfo/:id_user',
    [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)]
    , async (req, res) => {
        if (req.session.loggedinDirec) {
            const id = req.params;
            let newInfo = req.body;
            let usuarioContra = await cifrar.cifrar(newInfo.user_contra)
            delete newInfo.user_contra;

            let contraCifrada = { user_contra: usuarioContra }
            let datosFinal = Object.assign(newInfo, contraCifrada);
            pool.query('UPDATE usuarios SET ? WHERE ?', [datosFinal, id]);
            res.redirect('/inicioDirec');
        } else {
            res.render('director/editarDir', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    });

router.get('/eliminarAlum/:id_user', async (req, res) => {
    if (req.session.loggedinDirec) {
        const id = req.params;
        await pool.query('DELETE FROM alumnos WHERE usuarios_id = ?', [id.id_user], async (err, result) => {
            await pool.query('DELETE FROM usuarios WHERE id_user = ?', [id.id_user]);
            res.redirect('/alumnos/listaAlumnos');
        });

    } else {
        res.render('director/inicioDirec', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.get('/eliminarProf/:id_user', async (req, res) => {
    if (req.session.loggedinDirec) {
        const id = req.params;
        await pool.query('DELETE FROM usuarios WHERE id_user = ?', [id.id_user]);
        res.redirect('/profesores/listaProfesores');
    } else {
        res.render('director/inicioDirec', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.get('/infoAlum/:id_alum', async (req, res) => {
    try{
        if (req.session.loggedinDirec) {
            const id = req.params;
            await pool.query('SELECT * FROM alumnos a INNER JOIN (SELECT * FROM usuarios) AS b ON a.usuarios_id = b.id_user WHERE id_alum = ?', [id.id_alum], async (error, datosAlum) => {
                if (error) {
                    console.log(error)
                }
                let result = datosAlum.map(resul => ({
                    ...resul,
                    user_edad: formato.actualDate(resul.user_edad)
                }));
                await pool.query('SELECT * FROM encuestas WHERE alumno_id = ?', [id.id_alum], (err, historialEnc) => {
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
                    res.render('director/infoAlum', {
                        logindirec: true,
                        data: req.session.data,
                        escuelaExist: true,
                        historial: resultEnc,
                        datosAlum: result[0]
                    });
                });
            })
        } else {
            res.render('director/infoAlum', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    } catch(error){
        res.render('partials/error404')
    }
});

router.get('/infoEncuesta/:id_enc', async (req, res) => {
    try{
        if (req.session.loggedinDirec) {
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
                res.render('director/infoEncuesta', {
                    logindirec: true,
                    data: req.session.data,
                    escuelaExist: true,
                    historial: detallesEnc[0]
                });
                console.log(detallesEnc)
            });
        } else {
            res.render('director/infoEncuesta', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    } catch(error){
        res.render('partials/error404')
    }
});

router.get('/infoProf/:id_user', async (req, res) => {
    try{
        if (req.session.loggedinDirec) {
            const id = req.params;
            await pool.query('SELECT * FROM usuarios WHERE id_user = ?', [id.id_user], (err, datosProf) => {
                let resultEnc = datosProf.map(resul => ({
                    ...resul,
                    user_edad: formato.actualDate(resul.user_edad)
                }));
                res.render('director/infoProf', {
                    logindirec: true,
                    data: req.session.data,
                    escuelaExist: true,
                    infoProf: resultEnc[0],
                });
            });
        } else {
            res.render('director/infoProf', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    } catch (error){
        res.render('partials/error404')
    }
});

router.get('/estadisticas', async (req, res) => {
    if (req.session.loggedinDirec) {
        let fechaActual = new Date();
        let fechaActualFormat = formato.filtradoGrafica(fechaActual)
        let fechaActualFormat1 = formato.pruebaMoment(fechaActual)
        console.log(fechaActualFormat)
        console.log(fechaActualFormat1)
        await pool.query('SELECT * FROM alumnos a INNER JOIN (SELECT * FROM usuarios) AS b ON a.usuarios_id = b.id_user INNER JOIN (SELECT * FROM encuestas WHERE DATE(enc_fecha) BETWEEN ? AND ?) AS e ON a.id_alum = e.alumno_id WHERE escuela_id = ?', [fechaActualFormat, fechaActualFormat, req.session.data.escuela_id], async (err, encResp) => {
            var datosenc = encResp.map(function (a) {
                return a.enc_res;
            });
            var arrayRes = datosenc;
            var repetidos = [];
            arrayRes.forEach(function (numero) {
                repetidos[numero] = (repetidos[numero] || 0) + 1;
            });
            let sintomas = await pool.query('SELECT * FROM alumnos a INNER JOIN (SELECT * FROM usuarios) AS b ON a.usuarios_id = b.id_user INNER JOIN (SELECT * FROM encuestas WHERE DATE(enc_fecha) BETWEEN ? AND ?) AS e ON a.id_alum = e.alumno_id INNER JOIN (SELECT * FROM respuestas) AS r ON e.id_enc = r.encuesta_id WHERE escuela_id = ?', [fechaActualFormat, fechaActualFormat, req.session.data.escuela_id])
            let arraySinto = [];
            let datossinto = sintomas.map(function (a) {
                return a.contacto
            });
            arraySinto.push(lodash.sum(datossinto))
            let datossinto1 = sintomas.map(function (a) {
                return a.dolor_cabeza
            });
            arraySinto.push(lodash.sum(datossinto1))
            let datossinto2 = sintomas.map(function (a) {
                return a.tos
            });
            arraySinto.push(lodash.sum(datossinto2))
            let datossinto3 = sintomas.map(function (a) {
                return a.dificultad_respirar
            });
            arraySinto.push(lodash.sum(datossinto3))
            let datossinto4 = sintomas.map(function (a) {
                return a.perdida_sentidos
            });
            arraySinto.push(lodash.sum(datossinto4))
            let datossinto5 = sintomas.map(function (a) {
                return a.moco
            });
            arraySinto.push(lodash.sum(datossinto5))
            let datossinto6 = sintomas.map(function (a) {
                return a.diarrea
            });
            arraySinto.push(lodash.sum(datossinto6))
            let datossinto7 = sintomas.map(function (a) {
                return a.fiebre
            });
            arraySinto.push(lodash.sum(datossinto7))
            // console.log(arraySinto)

            if (err) {
                res.json(err);
            }
            await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEnc) => {
                res.render('director/estadisticas', {
                    logindirec: true,
                    data: req.session.data,
                    escuelaExist: true,
                    dataEsc: datosEnc[0],
                    resultados: repetidos,
                    sintos: arraySinto
                });
                if (err) {
                    console.log(err)
                }
            });
        });
    } else {
        res.render('director/estadisticas', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }

});

function restarDias(dateN, dias) {
    dateN.setDate(dateN.getDate() - dias);
    return formato.filtradoML(dateN);
}

router.get('/EstadisticasFuturas', async (req, res) => {
    if (req.session.loggedinDirec) {
        let fechaActual = new Date();
        let fechaActualFormat = formato.filtradoML(fechaActual)
        // await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT * FROM alumnos) AS t ON c.alumno_id=t.id_alum INNER JOIN (SELECT id_user, escuela_id FROM usuarios) AS a ON t.usuarios_id = a.id_user WHERE escuela_id = ?', [req.session.data.escuela_id], (err, datosEnc) => {
        await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT * FROM alumnos) AS t ON c.alumno_id=t.id_alum INNER JOIN (SELECT id_user, escuela_id FROM usuarios) AS a ON t.usuarios_id = a.id_user WHERE escuela_id = ? AND enc_res = 1 AND DATE(enc_fecha) BETWEEN ? AND ? ORDER BY enc_fecha ASC', [req.session.data.escuela_id, restarDias(fechaActual, 7), fechaActualFormat], async (err, datosEnc) => {

            let consulta0 = await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT * FROM alumnos) AS t ON c.alumno_id=t.id_alum INNER JOIN (SELECT id_user, escuela_id FROM usuarios) AS a ON t.usuarios_id = a.id_user WHERE escuela_id = ? AND enc_res = 0 AND DATE(enc_fecha) BETWEEN ? AND ? ORDER BY enc_fecha ASC', [req.session.data.escuela_id, restarDias(fechaActual, 7), fechaActualFormat])
            let cantidadAlumnos = await pool.query('SELECT * FROM usuarios WHERE escuela_id = ? AND tipo_user = "Alumno"', [req.session.data.escuela_id])
            console.log("La cantidad de alumnos es: " + cantidadAlumnos.length)
            var datosencml0 = consulta0.map(function (a) {
                // return a.enc_fecha;
                return formato.actualDateML(a.enc_fecha)
            });
            console.log(datosencml0)
            var datosencml = datosEnc.map(function (a) {
                // return a.enc_fecha;
                return formato.actualDateML(a.enc_fecha)
            });
            // res.send(datosEnc)
            res.render('director/graficaML', {
                logindirec: true,
                dataEnc: datosencml,
                dataEnc0: datosencml0,
                cantidadAlum: cantidadAlumnos.length,
                data: req.session.data,
                escuelaExist: true
            });
            console.log(datosencml)
            if (err) {
                console.log(err)
            }
        });
    } else {
        res.render('director/estadisticas', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.post('/enviarCorreoAlerta', async (req, res) => {
    if (req.session.loggedinDirec) {
        // const email = req.body.user_correo;
        var correosEscuela = await pool.query('SELECT user_correo FROM usuarios WHERE escuela_id = ?', [req.session.data.escuela_id])

        var correosEsc = correosEscuela.map(function(a){
            return a.user_correo;
        });
        let fechaActual = new Date();
        let fechaActualFormat = formato.filtradoML(fechaActual)
        var casosAltoRiesgo = await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT * FROM alumnos) AS t ON c.alumno_id=t.id_alum INNER JOIN (SELECT id_user, escuela_id FROM usuarios) AS a ON t.usuarios_id = a.id_user WHERE escuela_id = ? AND enc_res = 1 AND DATE(enc_fecha) BETWEEN ? AND ? ORDER BY enc_fecha ASC', [req.session.data.escuela_id, restarDias(fechaActual, 7), fechaActualFormat])

        var casosAlto = casosAltoRiesgo.length
        // var contra = correoRecu[0];
        // let contraOri = await cifrar.descifrartext(contra.user_contra);

        var transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: "dictamigosasocs@gmail.com",
                pass: google.password,
            }
        });
        var mailOptions = {
            from: "dictamigosasocs@gmail.com",
            to: correosEsc,
            subject: 'Aviso casos probables SARS-COV-2 CATARINA',
            html: `<!DOCTYPE html>
            <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
                xmlns:o="urn:schemas-microsoft-com:office:office">
            
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="x-apple-disable-message-reformatting"> 
                <title></title>
                <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700" rel="stylesheet">
                <style>
                    html,
                    body {
                        margin: 0 auto !important;
                        padding: 0 !important;
                        height: 100% !important;
                        width: 100% !important;
                        background: #f1f1f1;
                    }
                    * {
                        -ms-text-size-adjust: 100%;
                        -webkit-text-size-adjust: 100%;
                    }
                    div[style*="margin: 16px 0"] {
                        margin: 0 !important;
                    }
                    table,
                    td {
                        mso-table-lspace: 0pt !important;
                        mso-table-rspace: 0pt !important;
                    }
                    table {
                        border-spacing: 0 !important;
                        border-collapse: collapse !important;
                        table-layout: fixed !important;
                        margin: 0 auto !important;
                    }
                    img {
                        -ms-interpolation-mode: bicubic;
                    }
                    a {
                        text-decoration: none;
                    }
                    *[x-apple-data-detectors],
                    .unstyle-auto-detected-links *,
                    .aBn {
                        border-bottom: 0 !important;
                        cursor: default !important;
                        color: inherit !important;
                        text-decoration: none !important;
                        font-size: inherit !important;
                        font-family: inherit !important;
                        font-weight: inherit !important;
                        line-height: inherit !important;
                    }
                    .a6S {
                        display: none !important;
                        opacity: 0.01 !important;
                    }
                    .im {
                        color: inherit !important;
                    }
                    img.g-img+div {
                        display: none !important;
                    }
                    @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
                        u~div .email-container {
                            min-width: 320px !important;
                        }
                    }
                    @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
                        u~div .email-container {
                            min-width: 375px !important;
                        }
                    }
                    @media only screen and (min-device-width: 414px) {
                        u~div .email-container {
                            min-width: 414px !important;
                        }
                    }
                </style>
                <style>
                    .primary {
                        background: #5bd0d4;
                    }
                    .bg_white {
                        background: #ffffff;
                    }
                    .bg_light {
                        background: #fafafa;
                    }
                    .bg_black {
                        background: #000000;
                    }
                    .bg_dark {
                        background: rgba(0, 0, 0, .8);
                    }
                    .email-section {
                        padding: 2.5em;
                    }
                    .btn {
                        padding: 10px 15px;
                        display: inline-block;
                    }
                    .btn.btn-primary {
                        border-radius: 5px;
                        background: #5bd0d4;
                        color: #ffffff;
                    }
                    .btn.btn-white {
                        border-radius: 5px;
                        background: #ffffff;
                        color: #000000;
                    }
                    .btn.btn-white-outline {
                        border-radius: 5px;
                        background: transparent;
                        border: 1px solid #fff;
                        color: #fff;
                    }
                    .btn.btn-black-outline {
                        border-radius: 0px;
                        background: transparent;
                        border: 2px solid #000;
                        color: #000;
                        font-weight: 700;
                    }
                    h1,
                    h2,
                    h3,
                    h4,
                    h5,
                    h6 {
                        font-family: 'Lato', sans-serif;
                        color: #000000;
                        margin-top: 0;
                        font-weight: 400;
                    }
                    body {
                        font-family: 'Lato', sans-serif;
                        font-weight: 400;
                        font-size: 15px;
                        line-height: 1.8;
                        color: rgba(0, 0, 0, .4);
                    }
                    a {
                        color: #5bd0d4;
                    }
                    .logo h1 {
                        margin: 0;
                    }
                    .logo h1 a {
                        color: #5bd0d4;
                        font-size: 24px;
                        font-weight: 700;
                        font-family: 'Lato', sans-serif;
                    }
                    .hero {
                        position: relative;
                        z-index: 0;
                    }
                    .hero .text {
                        color: rgba(0, 0, 0, .3);
                    }
                    .hero .text h2 {
                        color: #000;
                        font-size: 40px;
                        margin-bottom: 0;
                        font-weight: 400;
                        line-height: 1.4;
                    }
                    .hero .text h3 {
                        font-size: 24px;
                        font-weight: 300;
                    }
                    .hero .text h2 span {
                        font-weight: 600;
                        color: #5bd0d4;
                    }
                    .heading-section h2 {
                        color: #000000;
                        font-size: 28px;
                        margin-top: 0;
                        line-height: 1.4;
                        font-weight: 400;
                    }
                    .heading-section .subheading {
                        margin-bottom: 20px !important;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(0, 0, 0, .4);
                        position: relative;
                    }
                    .heading-section .subheading::after {
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: -10px;
                        content: '';
                        width: 100%;
                        height: 2px;
                        background: #5bd0d4;
                        margin: 0 auto;
                    }
                    .heading-section-white {
                        color: rgba(255, 255, 255, .8);
                    }
                    .heading-section-white h2 {
                        line-height: 1;
                        padding-bottom: 0;
                    }
                    .heading-section-white h2 {
                        color: #ffffff;
                    }
                    .heading-section-white .subheading {
                        margin-bottom: 0;
                        display: inline-block;
                        font-size: 13px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        color: rgba(255, 255, 255, .4);
                    }
                    ul.social {
                        padding: 0;
                    }
                    ul.social li {
                        display: inline-block;
                        margin-right: 10px;
                    }
                    .footer {
                        border-top: 1px solid rgba(0, 0, 0, .05);
                        color: rgba(0, 0, 0, .5);
                    }
                    .footer .heading {
                        color: #000;
                        font-size: 20px;
                    }
                    .footer ul {
                        margin: 0;
                        padding: 0;
                    }
                    .footer ul li {
                        list-style: none;
                        margin-bottom: 10px;
                    }
                    .footer ul li a {
                        color: rgba(0, 0, 0, 1);
                    }
                    @media screen and (max-width: 500px) {}
                </style>
            
            </head>
            <body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;">
                <center style="width: 100%; background-color: #f1f1f1;">
                    <div
                        style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
                        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
                    </div>
                    <div style="max-width: 600px; margin: 0 auto;" class="email-container">
                        <!-- BEGIN BODY -->
                        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                            style="margin: auto;">
                            <tr>
                                <td valign="top" class="bg_white" style="padding: 1em 2.5em 0 2.5em;">
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td class="logo" style="text-align: center;">
                                                <h1><a href="#">CATARINA</a></h1>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td valign="middle" class="hero bg_white" style="padding: 3em 0 2em 0;">
                                    <img src="https://firebasestorage.googleapis.com/v0/b/dictamigos.appspot.com/o/dibujocovid.png?alt=media&token=5d3b0dad-1783-41c5-8b60-715caa11cc9c" alt=""
                                        style="width: 300px; max-width: 600px; height: auto; margin: auto; display: block;">
                                </td>
                            </tr>
                            <tr>
                                <td valign="middle" class="hero bg_white" style="padding: 2em 0 4em 0;">
                                    <table>
                                        <tr>
                                            <td>
                                                <div class="text" style="padding: 0 2.5em; text-align: center;">
                                                    <h3>ALERTA DE COLEGIO</h3>
                                                    <h4>Estimado miembro y usuario de Catarina, el director de tu plantel ha decidido hacerte llegar este correo debido a que los casos de alto riesgo en los últimos 7 días han sido de <b>${casosAlto}</b>, te recomendamos tomes tus precauciones y actues con responsabilidad.</h4>
                                                    <h4>Para dudas o alcaraciones sobre la información proporcionada, comunicarse con el director de la institución.</h4>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </center>
            </body>
            
            </html>`
        }
        transporter.sendMail(mailOptions, (error, inf) => {
            if (error) {
                res.render('director/inicioDirec', {
                    alert: true,
                    alertTitle: "Ocurrió un error inesperado.",
                    alertMessage: "Por favor, vuelva a intentar",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 3000,
                    ruta: 'inicioDirec'
                })
                console.log("el error es..................." + error)
            } else {
                console.log("Email enviado correctamente")
                res.redirect('/inicioDirec')
            }
        })
    } else {
        res.render('director/inicioDirec', {
            logindirec: false,
            name: 'Debes iniciar sesión'
        });
    }
})

router.get('/detallesEscuela/:id_escuela', async (req, res) => {
    try{
        let sesion = req.session.data
        if (req.session.data.escuela_id == req.params.id_escuela){
            const id = req.params;
            if (req.session.loggedinDirec) {
                let buscaEsc = await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.params.id_escuela]);
                let buscaDirec = await pool.query('SELECT * FROM usuarios WHERE id_user = ?', [buscaEsc[0].usuario_creador])
                    res.render('director/editarEsc', {
                        logindirec: true,
                        data: req.session.data,
                        escuelaExist: true,
                        datosEsc: buscaEsc[0],
                        datosDirec: buscaDirec[0]
                    });
            } else {
                res.render('director/editarEsc', {
                    logindirec: false,
                    name: 'Debes iniciar sesión'
                });
            }
        } else {
            res.render('partials/error404')
        }
    } catch (error){
        res.render('partials/error404')
        console.log(error)
    }
})

router.post('/detallesEscuela/:id_escuela'
    // [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    // body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    // body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    // body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    // body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)]
    , async (req, res) => {
        if (req.session.loggedinDirec) {
            // const id = req.params;
            let newInfo = req.body;
            let buscaDirec = await pool.query('SELECT * FROM usuarios WHERE user_correo = ?', [newInfo.user_correo])
            let datosFinal = { escuela_nom: newInfo.escuela_nom, cct: newInfo.cct, estado: newInfo.estado, municipio: newInfo.municipio, calle: newInfo.calle, usuario_creador: buscaDirec[0].id_user }
            
            // let usuarioContra = await cifrar.cifrar(newInfo.user_contra)
            // delete newInfo.user_contra;

            // let contraCifrada = { user_contra: usuarioContra }
            // let datosFinal = Object.assign(newInfo, contraCifrada);
            pool.query('UPDATE escuelas SET ? WHERE id_escuela = ?', [datosFinal, req.params.id_escuela]);
            res.redirect('/inicioDirec');
        } else {
            res.render('director/inicioDirec', {
                logindirec: false,
                name: 'Debes iniciar sesión'
            });
        }
    });

module.exports = router;