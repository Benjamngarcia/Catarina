const express = require('express');
const router = express.Router();
const pool = require('../database');
const qrcode = require('qrcode');
const moment = require('moment');
const formato = require('../lib/formatoFechas');


//Abrir vista cuestionario
router.get('/cuestionario', async (req, res) => {
    //Se verifica que el usuario haya iniciado sesión
    if (req.session.loggedinAlum) {
        //Se obtienen los identificadores
        let id_user = req.session.data.id_user;
        let dataAlum = await pool.query('SELECT * FROM alumnos WHERE usuarios_id = ?', [id_user])
        let datosAlumno = dataAlum[0]
        //Se obtiene la fecha del último formulario contestado
        let Bop = await pool.query('SELECT * from encuestas WHERE alumno_id = ?', [datosAlumno.id_alum]);
        //Si no es la primer vez contestando el cuestionario, se ejecutará la siguiente parte
        if (Bop.length > 0) {
            let LastTime = await pool.query('SELECT enc_fecha FROM encuestas c INNER JOIN (SELECT alumno_id, MAX(id_enc) max_time FROM encuestas GROUP BY alumno_id) AS t ON c.id_enc=t.max_time AND c.alumno_id=t.alumno_id INNER JOIN alumnos a ON c.alumno_id = a.id_alum WHERE id_alum = ?', [datosAlumno.id_alum]);
            let LastAnswer = await pool.query('SELECT enc_res FROM encuestas c INNER JOIN (SELECT alumno_id, MAX(id_enc) max_time FROM encuestas GROUP BY alumno_id) AS t ON c.id_enc=t.max_time AND c.alumno_id=t.alumno_id INNER JOIN alumnos a ON c.alumno_id = a.id_alum WHERE id_alum = ?', [datosAlumno.id_alum]);
            let Respuesta = '';
            if (LastTime === undefined) LastTime[0].enc_fecha = 0;
            console.log(LastTime[0].enc_fecha)
            if (LastAnswer === undefined) LastAnswer[0].enc_res = 0;
            //Se formatea a la fecha adecuada
            LastTime = LastTime.map(resul => ({
                ...resul,
                enc_fecha: formatDate(resul.enc_fecha)
            }));
            //Se verifica el tiempo transcurrido desde el último cuestionario contestado
            const HoraEnc = moment(LastTime[0].enc_fecha).add(15, "hours").add(00, "minutes")
            const actualHour = moment().unix() + "000";
            const comparison = (moment.duration(actualHour - HoraEnc)) + '';
            console.log(comparison)
            Respuesta = LastAnswer[0].enc_res;
            //Si ha transcurrido el tiempo suficiente, se podrá contestar el formulario nuevamente
            if (comparison >= 0) {
                res.render('alumno/cuestionario', {
                    loginalum: true,
                    data: req.session.data,
                    mayorEdad: true
                });
                //Si no ha transcurrido el tiempo suficiente, se mostrará el último
            } else if (comparison < 0) {
                //Se genera el link para el código QR
                if (Respuesta == 0) {
                    let protocol = req.get('X-Forwarded-Protocol');
                    if (protocol === undefined) {
                        protocol = '';
                    }
                    const host = req.get('host');
                    const linkCuest = protocol + host + "/Cuestionario/Resultados/" + datosAlumno.id_alum;
                    console.log(linkCuest);
                    qrcode.toDataURL(linkCuest, (error, src) => {
                        if (error) res.send('Algo salió mal');
                        LastTime = LastTime.map(resul => ({
                            ...resul,
                            enc_fecha: actualDate(resul.enc_fecha)
                        }));
                        res.render('alumno/showqr', {
                            loginalum: true,
                            data: req.session.data,
                            date: LastTime[0],
                            qr_code: src,
                            link: src,
                            mayorEdad:true
                        });
                    })
                } else if (Respuesta == 1) {
                    res.render('alumno/redirect', {
                        loginalum: true,
                        data: req.session.data,
                        mayorEdad:true
                    });
                } else {
                    res.render('alumno/cuestionario', {
                        loginalum: true,
                        data: req.session.data,
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Lo sentimos, ocurrió un error mientras procesabamos tu solicitud. Intenta nuevamente en unos minutos.",
                        alertIcon: "error",
                        showConfirmButton: true,
                        timer: 2000,
                        ruta: 'inicioAlumno',
                        mayorEdad:true
                    });
                }
            } else {
                //Si ocurre un error, saltará una alerta
                res.render('alumno/cuestionario', {
                    loginalum: true,
                    data: req.session.data,
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Lo sentimos, ocurrió un error mientras procesabamos tu solicitud. Intenta nuevamente en unos minutos.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 2000,
                    ruta: 'inicioAlumno',
                    mayorEdad:true
                });
            }
            //Si es la primera vez contestando el cuestionario, te remitirá automáticamente al cuestionario
        } else {
            res.render('alumno/cuestionario', {
                loginalum: true,
                data: req.session.data,
                mayorEdad: true
            });
        }
        //Se remite al usuario no registrado a la página de inicio
    } else {
        res.render('alumno/cuestionario', {
            loginalum: false,
            name: 'Debes iniciar sesión',
            mayorEdad: true
        });
    }
});

//Validación cuestionario
router.post('/redir/:id', async (req, res) => {
    const validar = req.body.contacto;
    let cambioVal = 0
    console.log(validar);
    const Resultados = req.body; //Se obtienen los valores del cuestionario (Respuestas marcadas)
    //Los datos se envían de forma independiente a Resultados
    let dataCuest = {
        dolor_cabeza: req.body.cabeza,
        tos: req.body.tos,
        fiebre: req.body.fiebre,
        dificultad_respirar: req.body.difrespirar,
        perdida_sentidos: req.body.nosentidos,
        moco: req.body.escurrinasal,
        diarrea: req.body.diarrea
    };
    //Se cambian los datos no marcados y los marcados por tiny ints
    for (let i in dataCuest) {
        if (dataCuest[i] === undefined) {
            dataCuest[i] = 0
        } else {
            dataCuest[i] = 1
        }
    }
    let datosCuest = [];
    //Los resultados del cuestionario se limpian
    for (let i in Resultados) {
        datosCuest[i] = JSON.parse(Resultados[i]);
    }
    let resCuest = '2';
    const { id } = req.params;
    let sum = 0;
    //Se obtiene el id del alumno
    let alumno = await pool.query('SELECT * FROM alumnos WHERE usuarios_id = ?', [id]);
    id_alum = alumno[Object.keys(alumno)].id_alum
    //Se obtiene el link de los resultados
    let protocol = req.get('X-Forwarded-Protocol');
    if (protocol === undefined) {
        protocol = '';
    }
    const host = req.get('host');
    const linkCuest = protocol + host + "/Cuestionario/Resultados/" + id;
    console.log(linkCuest);
    if (req.session.loggedinAlum) {
        //Se utiliza contacto para validar y acceder al resto de la función
        if (validar == '0' || validar == '3') {
            //Se suman los datos del cuestionario
            for (let i in datosCuest) {
                sum += datosCuest[i];
            }
            //Basados en la información de la suma, se dará acceso al código QR o a la página de redirección
            if (sum <= 5) {
                resCuest = 0;
            } else if (sum > 5) {
                resCuest = 1;
                //Si en un caso  I M P R O B A B L E  el resultado es distinto, saltará una alerta
            } else {
                resCuest = 2;
            }
            //Se valida la respuesta del cuestionario
            if (resCuest == 0 || resCuest == 1) {
                //Se guarda la respuesta del cuestionario
                pool.query('INSERT INTO encuestas SET ?', { alumno_id: id_alum, enc_res: resCuest }, async (error, results) => {
                    if (error) {
                        res.render('alumno/cuestionario', {
                            loginalum: true,
                            data: req.session.data,
                            alert: true,
                            alertTitle: "Error",
                            alertMessage: "Lo sentimos, ocurrió un error mientras guardábamos tu respuesta.",
                            alertIcon: "error",
                            showConfirmButton: true,
                            timer: 2000,
                            ruta: 'inicioAlumno',
                            mayorEdad:true
                        });
                    } else {
                        //Se obtiene el id del último cuestionario contestado
                        let LastResp = await pool.query('SELECT MAX(id_enc) AS id_enc FROM encuestas');
                        if(validar == 0){ cambioVal = 0 }else if(validar == 3){ cambioVal = 1 }else{console.log(error)}
                        dataCuest.contacto = cambioVal
                        dataCuest.encuesta_id = LastResp[Object.keys(LastResp)].id_enc;
                        //Se agregan los resultados totales a respuestas
                        pool.query('INSERT INTO respuestas set ?', [dataCuest], async (err, results) => {
                            if (err) {
                                console.log(err);
                                res.render('alumno/cuestionario', {
                                    loginalum: true,
                                    data: req.session.data,
                                    alert: true,
                                    alertTitle: "Error",
                                    alertMessage: "Lo sentimos, ocurrió un error mientras guardábamos tu respuesta.",
                                    alertIcon: "error",
                                    showConfirmButton: true,
                                    timer: 2000,
                                    ruta: 'inicioAlumno',
                                    mayorEdad:true
                                });
                            } else {
                                //Da acceso al QR
                                if (resCuest == '0') {
                                    let LastTime = await pool.query('SELECT enc_fecha FROM encuestas c INNER JOIN (SELECT alumno_id, MAX(id_enc) max_time FROM encuestas GROUP BY alumno_id) AS t ON c.id_enc=t.max_time AND c.alumno_id=t.alumno_id INNER JOIN alumnos a ON c.alumno_id = a.id_alum WHERE id_alum = ?', [id_alum]);
                                    //Se formatea a la fecha adecuada
                                    LastTime = LastTime.map(resul => ({
                                        ...resul,
                                        enc_fecha: formatDate(resul.enc_fecha)
                                    }));
                                    LastTime = LastTime.map(resul => ({
                                        ...resul,
                                        enc_fecha: actualDate(resul.enc_fecha)
                                    }));
                                    qrcode.toDataURL(linkCuest, (error, src) => {
                                        if (error) res.send('Algo salió mal');
                                        res.render('alumno/showqr', {
                                            loginalum: true,
                                            data: req.session.data,
                                            date: LastTime[0],
                                            qr_code: src,
                                            link: src,
                                            mayorEdad:true
                                        });
                                    })
                                    //Da acceso a la redirección con indicaciones
                                } else if (resCuest == '1') {
                                    res.render('alumno/redirect', {
                                        loginalum: true,
                                        data: req.session.data,
                                        mayorEdad: true
                                    });
                                }
                            }
                        });

                    }
                });
                //Salta la alerta de error
            } else {
                res.render('alumno/cuestionario', {
                    loginalum: true,
                    data: req.session.data,
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Lo sentimos, ocurrió un error mientras guardábamos tu respuesta.",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 2000,
                    ruta: 'inicioAlumno'
                });
            }
        } else {
            //Se revisa la validación y salta alerta
            res.render('alumno/cuestionario', {
                loginalum: true,
                data: req.session.data,
                alert: true,
                alertTitle: "Error",
                alertMessage: "Debes contestar la primer pregunta",
                alertIcon: "error",
                showConfirmButton: true,
                timer: 2000,
                ruta: 'inicioAlumno'
            });
        }
    }
});

//Formato de fecha en vista Resultados
function formatDate(date) {
    return moment(date).utcOffset("-12:00").format();
}

function actualDate(date) {
    return moment(date).utcOffset("-12:00").format("DD/MM/YYYY");
}

// function respDate(date) {
//     return moment(date).utcOffset("-10:00").calendar();
// }
function respDate(date) {
    return moment(date).subtract(5, 'hours').calendar()
}

//Ver resultados de encuesta
router.get('/Cuestionario/Resultados/:id_alum', async (req, res) => {
    try{
        let datosEncuesta = await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT alumno_id, MAX(id_enc) max_time FROM encuestas GROUP BY alumno_id) AS t ON c.id_enc=t.max_time AND c.alumno_id=t.alumno_id INNER JOIN alumnos a ON c.alumno_id = a.id_alum INNER JOIN usuarios u ON a.usuarios_id = u.id_user WHERE id_alum = ?', [req.params.id_alum])
        
        let datosResultados = datosEncuesta[0]
        delete datosResultados.user_contra;
        delete datosResultados.user_correo;
        delete datosResultados.user_edad;
        delete datosResultados.tipo_user;
        let result = datosEncuesta.map(resul => ({
                ...resul,
                enc_fecha: respDate(resul.enc_fecha)
            }));
            console.log(result)
            res.render('alumno/resultadosenc', {
                resultadosAlum: result[0]
            });
    } catch (error){
        res.render('partials/error404')
    }
});
module.exports = router;