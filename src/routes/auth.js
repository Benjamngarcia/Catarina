const express = require('express');
const router = express.Router();
const pool = require('../database');
const { body, validationResult } = require('express-validator');
const cifrar = require('../lib/cifrados');
const nodemailer = require('nodemailer');


router.get('/iniciarSesion', (req, res) => {
    res.render('auth/loginDirec');
});

router.post('/loginDirec',
    [body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 8 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)],
    async (req, res) => {
        try {
            const valores = req.body
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                console.log(valores)
                res.render('auth/loginDirec', {
                    alert: true,
                    alertTitle: "Error al iniciar sesión.",
                    alertMessage: "No se pudo iniciar sesión correctamente, favor de llenar correctamente el formulario.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 3000,
                    ruta: 'iniciarSesion'
                });
            } else {
                var usuarios = await pool.query('SELECT * FROM usuarios WHERE user_correo = ?', [valores.user_correo]);
                var usuario = usuarios[0];
                if (usuarios.length < 0) {
                    res.render('auth/loginDirec', {
                        alert: true,
                        alertTitle: "Correo",
                        alertMessage: "El correo no existe",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: 2500,
                        ruta: 'iniciarSesion'
                    });
                } else {
                    let validPassword = await cifrar.descifrartext(usuario.user_contra);
                    if (validPassword === valores.user_contra) {
                        if (usuario.usuario_verificado == 1) {
                            switch (usuario.tipo_user) {
                                case 'Director':
                                    req.session.data = usuario;
                                    req.session.loggedinDirec = true;
                                    res.redirect('/inicioDirec');
                                    break;
                                case 'Alumno':
                                    req.session.data = usuario;
                                    req.session.loggedinAlum = true;
                                    res.redirect('/inicioAlumno');
                                    break;
                                case 'Tutor':
                                    req.session.data = usuario;
                                    req.session.loggedinTutor = true;
                                    res.redirect('/inicioTutor');
                                    break;
                                case 'Profesor':
                                    req.session.data = usuario;
                                    req.session.loggedinProf = true;
                                    res.redirect('/inicioProfesor');
                                    break;
                                case 'Administrador':
                                    req.session.data = usuario;
                                    req.session.loggedinAdmin = true;
                                    res.redirect('/admin/inicioAdministrador');
                                    break;
                            }
                        } else {
                            res.render('partials/validaCuenta')
                        }
                    } else {
                        res.render('auth/loginDirec', {
                            alert: true,
                            alertTitle: "Contraseña",
                            alertMessage: "La contraseña es incorrecta",
                            alertIcon: "error",
                            showConfirmButton: true,
                            timer: 2500,
                            ruta: 'iniciarSesion'
                        });
                    }
                }
            }
        } catch (error) {
            res.render('auth/loginDirec', {
                alert: true,
                alertTitle: "Error al iniciar sesión.",
                alertMessage: "Ocurrió un error inesperado, por favor vuelve a intentar.",
                alertIcon: "error",
                showConfirmButton: true,
                timer: 3000,
                ruta: 'iniciarSesion'
            });
            console.log(error)
        }
    });

router.get('/registrarDirector', (req, res) => {
    res.render('auth/regDirec');
});

router.post('/registrarDirec', //REGISTRAR A UN NUEVO DIRECTOR
    [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/),
    body("user_edad", "Ingrese una fecha válida").exists(),
    body('user_sexo', 'Elija un sexo.').exists(),
    body('terminos', 'Acepte los terminos.').exists()],
    async (req, res) => {
        var valores = req.body
        delete valores.terminos;
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(valores)
            res.render('auth/regDirec', {
                alert: true,
                alertTitle: "Error al registrar.",
                alertMessage: "No se pudo registrar correctamente, favor de llenar correctamente el formulario.",
                alertIcon: "error",
                showConfirmButton: true,
                timer: 3000,
                ruta: 'registrarDirector'
            });
            console.log(errors);
        } else {
            var correoExistente = await pool.query('SELECT * FROM usuarios WHERE user_correo = ?', [valores.user_correo])
            if (correoExistente.length > 0) {
                res.render('auth/regDirec', {
                    alert: true,
                    alertTitle: "CORREO",
                    alertMessage: "El correo electrónico que ingresaste ya existe, intenta ingresar otro.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 3500,
                    ruta: 'registrarDirector'
                });
            } else {
                let contraCifrada = await cifrar.cifrar(valores.user_contra);
                const datosFaltantes = { user_contra: contraCifrada, tipo_user: 'Director' }
                var resultFinal = Object.assign(valores, datosFaltantes);
                pool.query('INSERT INTO usuarios SET ?', [resultFinal], async (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        let buscaUsu = await pool.query ('SELECT * FROM usuarios WHERE user_correo = ?', [valores.user_correo])
                        let protocol = req.get('X-Forwarded-Protocol');
                                        if (protocol === undefined) {
                                            protocol = '';
                                        }
                                        const host = req.get('host');
                                        const linkDirec = protocol + host + "/verificaUsuarioNuevo/" + buscaUsu[0].id_user;
                        var transporter = nodemailer.createTransport({
                            host: "smtp.gmail.com",
                            port: 465,
                            secure: true,
                            auth: {
                                user: "dictamigosasocs@gmail.com",
                                pass: "vkwjipzlmiqlmfda",
                            }
                        });
                        var mailOptions = {
                            from: "dictamigosasocs@gmail.com",
                            to: valores.user_correo,
                            subject: 'Verificación de usuario Catarina',
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
                                            <img src="https://firebasestorage.googleapis.com/v0/b/dictamigos.appspot.com/o/CatarinaGreen.png?alt=media&token=ddb8666b-e450-47c7-b600-ac7393e393ae" alt=""
                                                style="width: 300px; max-width: 600px; height: auto; margin: auto; display: block;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td valign="middle" class="hero bg_white" style="padding: 2em 0 4em 0;">
                                            <table>
                                                <tr>
                                                    <td>
                                                        <div class="text" style="padding: 0 2.5em; text-align: center;">
                                                            <h3>BIENVENIDO A CATARINA</h3>
                                                            <h4>Vimos que creaste una nueva cuenta en <i>Catarina</i> y te agradecemos por eso, así que te pedimos que inicies sesión dando click en el siguiente botón para verificar tu nueva cuenta.</h4>
                                                            <p><a href="${linkDirec}" class="btn btn-primary">Iniciar sesión</a></p>
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
                                res.render('auth/regDirec', {
                                    alert: true,
                                    alertTitle: "Ocurrió un error inesperado.",
                                    alertMessage: "Por favor, vuelva a intentar",
                                    alertIcon: "error",
                                    showConfirmButton: true,
                                    timer: 3000,
                                    ruta: 'registrarDirector'
                                })
                                console.log("el error es..................." + error)
                            } else {
                                console.log("Email enviado correctamente")
                                res.render('auth/regDirec', {
                                    alert: true,
                                    alertTitle: "Verifica tu cuenta.",
                                    alertMessage: "Se ha enviado un correo eléctronico a la dirección que ingresaste, por favor acceder a él para verificar su cuenta.",
                                    alertIcon: "success",
                                    showConfirmButton: true,
                                    timer: 3000,
                                    ruta: 'iniciarSesion'
                                })
                            }
                        })
                    }
                });
            }
        }
    });

router.get('/verificaUsuarioNuevo/:id_user', async (req, res) => {
    try {
        res.render('auth/verificaUser', {
            identificador: req.params.id_user
        });
    } catch (error) {
        res.render('partials/error404')
    }
})

router.post('/verificaUsuario/:id_user',
    [body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 8 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)],
    async (req, res) => {
        const valores = req.body
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(valores)
            res.render('auth/verificaUser', {
                alert: true,
                alertTitle: "Error al identificar.",
                alertMessage: "No se pudo identificar correctamente, favor de llenar correctamente el formulario.",
                alertIcon: "error",
                showConfirmButton: true,
                timer: 3000,
                ruta: 'verificaUsuarioNuevo/' + req.params.id_user
            });
        } else {
            let searchById = await pool.query('SELECT * FROM usuarios WHERE id_user = ?', [req.params.id_user])
            var usuarios = await pool.query('SELECT * FROM usuarios WHERE user_correo = ?', [valores.user_correo]);
            if (searchById[0].id_user == usuarios[0].id_user) {
                var usuario = usuarios[0];
                if (usuarios.length < 0) {
                    res.render('auth/verificaUser', {
                        alert: true,
                        alertTitle: "No coinciden",
                        alertMessage: "Las credenciales que ingresaste no coinciden.",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: 2500,
                        ruta: 'verificaUsuarioNuevo/' + req.params.id_user
                    });
                } else {
                    let validPassword = await cifrar.descifrartext(usuario.user_contra);
                    if (validPassword === valores.user_contra) {
                        pool.query('UPDATE usuarios SET usuario_verificado = 1 WHERE id_user = ?', [req.params.id_user]);
                        res.redirect('/iniciarSesion')
                    } else {
                        res.render('auth/verificaUser', {
                            alert: true,
                            alertTitle: "No coinciden",
                            alertMessage: "Las credenciales que ingresaste no coinciden.",
                            alertIcon: "error",
                            showConfirmButton: true,
                            timer: 2500,
                            ruta: 'verificaUsuarioNuevo/' + req.params.id_user
                        });
                    }
                }
            } else {
                res.render('auth/verificaUser', {
                    alert: true,
                    alertTitle: "No coinciden",
                    alertMessage: "Las credenciales que ingresaste no coinciden.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 2500,
                    ruta: 'verificaUsuarioNuevo/' + req.params.id_user
                });
            }
        }
    })


router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    })
});


module.exports = router;