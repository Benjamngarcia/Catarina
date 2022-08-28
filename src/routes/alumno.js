const express = require('express');
const router = express.Router();
const pool = require('../database');
const { body, validationResult } = require('express-validator');
const cifrar = require('../lib/cifrados');
const formato = require('../lib/formatoFechas');

router.get('/inicioAlumno', async (req, res) => {
    if (req.session.loggedinAlum) {
        let buscaEscuela = await pool.query('SELECT * FROM usuarios WHERE escuela_id = ?', [req.session.data.escuela_id]);
        if (buscaEscuela.length > 0) {
            var edad = req.session.data.user_edad.split("-");
            var dia = edad[2];
            var mes = edad[1];
            var yy = edad[0];
            var fecha_hoy = new Date();
            var curr_y = fecha_hoy.getYear();
            var curr_m = fecha_hoy.getMonth();
            var curr_d = fecha_hoy.getDate();
            var edadR = (curr_y + 1900) - yy;
            console.log(edadR)
            if (curr_m < (mes - 1)) {
                edadR--;
            }
            if (((mes - 1) == curr_m) && (curr_d < dia)) {
                edadR--;
            }
            if (edadR > 1900) {
                edadR -= 1900;
            }
            if (edadR >= 18) {
                await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEsc) => {
                    res.render('alumno/inicioAlumno', {
                        loginalum: true,
                        data: req.session.data,
                        escuelaExist: true,
                        dataEsc: datosEsc[0],
                        mayorEdad: true,
                        existTutor: false
                    });
                    if (err) {
                        console.log(err)
                    }
                });
            } else {
                let datosAlumno = await pool.query('SELECT * FROM alumnos WHERE usuarios_id = ?', [req.session.data.id_user]);
                let buscaTutor = await pool.query('SELECT * FROM usuarios u INNER JOIN (SELECT * FROM tutores) AS t ON u.id_user = t.usuarios_id INNER JOIN (SELECT * FROM alumnos) AS a ON a.id_alum = t.alumnos_id INNER JOIN (SELECT * FROM usuarios) AS u1 ON a.usuarios_id = u1.id_user WHERE id_alum = ?', [datosAlumno[0].id_alum]);
                if(buscaTutor.length > 0){
                    await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEsc) => {
                        res.render('alumno/inicioAlumno', {
                            loginalum: true,
                            data: req.session.data,
                            escuelaExist: true,
                            dataEsc: datosEsc[0],
                            mayorEdad: false,
                            existTutor: true
                        });
                        if (err) {
                            console.log(err)
                        }
                    });
                } else {
                    await pool.query('SELECT * FROM escuelas WHERE id_escuela = ?', [req.session.data.escuela_id], (err, datosEsc) => {
                        res.render('alumno/inicioAlumno', {
                            loginalum: true,
                            data: req.session.data,
                            escuelaExist: true,
                            dataEsc: datosEsc[0],
                            mayorEdad: false,
                            existTutor: false
                        });
                        if (err) {
                            console.log(err)
                        }
                    });
                }
            }
        } else {
            res.render('alumno/inicioAlumno', {
                loginalum: true,
                data: req.session.data,
                escuelaExist: false
            });
        }
    } else {
        res.render('alumno/inicioAlumno', {
            loginalum: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.get('/Cuestionario/:id_user', async (req, res) => {
    if (req.session.loggedinAlum) {
        res.render('alumno/cuestionario', {
            loginalum: true,
            data: req.session.data
        });
    } else {
        res.render('alumno/cuestionario', {
            loginalum: false,
            name: 'Debes iniciar sesión'
        });
    }
});

router.get('/editarInfoAlumno/:id_user', async (req, res) => {
    let sesion = req.session.data
    // console.log(sesion.id_user)
    console.log(req.params.id_user)
    try{
        if (sesion.id_user == req.params.id_user){
            const id = req.params;
            if (req.session.loggedinAlum) {
                let buscaUsuario = await pool.query('SELECT * FROM usuarios WHERE ?', [id]);
                let infoAlum = buscaUsuario[0]
                let usuarioContra = await cifrar.descifrartext(buscaUsuario[0].user_contra)
                delete infoAlum.user_contra;
                let contraNormal = { user_contra: usuarioContra }
                let datosFinal = Object.assign(infoAlum, contraNormal);
                res.render('alumno/editarAlum', {
                    loginalum: true,
                    data: req.session.data,
                    info: datosFinal
                });
            } else {
                res.render('alumno/editarAlum', {
                    loginalum: false,
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

router.post('/editarInfoAlum/:id_user',
    [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/)]
    , async (req, res) => {
        if (req.session.loggedinAlum) {
            const id = req.params;
            let newInfo = req.body;
            let usuarioContra = await cifrar.cifrar(newInfo.user_contra)
            delete newInfo.user_contra;
            let contraCifrada = { user_contra: usuarioContra }
            let datosFinal = Object.assign(newInfo, contraCifrada);
            pool.query('UPDATE usuarios SET ? WHERE ?', [datosFinal, id]);
            res.redirect('/inicioAlumno');
        } else {
            res.render('alumno/editarAlum', {
                loginalum: false,
                name: 'Debes iniciar sesión'
            });
        }
    });

router.post('/registrarTutor',
    [body('user_nom', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_appat', 'Ingrese su apellido paterno.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body("user_apmat", "Ingrese su apellido materno").exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('user_correo', 'Ingrese un email válido.').exists().isEmail(),
    body('user_contra', 'La contraseña debe tener un largo de mínimo 9 caracteres').exists().matches(/^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/),
    body("user_edad", "Ingrese una fecha válida").exists(),
    body('user_sexo', 'Elija un sexo.').exists()],
    async (req, res) => {
        if (req.session.loggedinAlum) {
            var valores = req.body
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.render('alumno/inicioAlumno', {
                    alert: true,
                    alertTitle: "Error al registrar.",
                    alertMessage: "No se pudo registrar correctamente, favor de llenar correctamente el formulario.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 3000,
                    ruta: 'inicioAlumno'
                });
            } else { //SI NO HAY ERROR AL LLENAR EL FORMULARIO
                let contraCifrada = await cifrar.cifrar(valores.user_contra);
                const datosFaltantes = { escuela_id: req.session.data.escuela_id, user_contra: contraCifrada, tipo_user: 'Tutor' }
                var resultFinal = Object.assign(valores, datosFaltantes);

                await pool.query('INSERT INTO usuarios SET ?', [resultFinal], async (error, results) => {
                    if (error) {
                        console.log(error);
                    } else {
                        //CONSULTA ALUMNO ID
                        let datosAlumno = await pool.query('SELECT * FROM usuarios WHERE tipo_user = "Tutor" ORDER BY id_user DESC')
                        let datosAlu = await pool.query('SELECT * FROM alumnos WHERE usuarios_id = ?', [req.session.data.id_user])
                        // console.log(datosAlumno[0].id_user)
                        // datosTutor = await pool.query('SELECT * FROM usuarios WHERE tipo_user = "Tutor" AND MAX(id_user)')
                        await pool.query('INSERT INTO tutores SET ?', { usuarios_id: datosAlumno[0].id_user, alumnos_id: datosAlu[0].id_alum }, (err, succ) => {
                            if (err) {
                                console.log(err);
                            } else {
                                res.redirect('/inicioAlumno')
                            }
                        })
                    }
                });
            }
        } else {
            res.render('alumno/inicioAlumno', {
                loginalum: false,
                name: 'Debes iniciar sesión'
            });
        }
    });

module.exports = router;