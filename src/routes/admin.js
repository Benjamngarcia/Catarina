const express = require('express');
const router = express.Router();
const pool = require('../database');
const formato = require('../lib/formatoFechas');

router.get('/inicioAdministrador', async (req, res) => {
    if (req.session.loggedinAdmin) {
        // var buscaEscuela = await pool.query('SELECT * FROM usuarios WHERE escuela_id = ?', [req.session.data.escuela_id]);
        await pool.query('SELECT * FROM escuelas e INNER JOIN (SELECT * FROM usuarios) AS u ON e.usuario_creador = u.id_user', async (err, resul) => {
            if (err){
                console.log(err)
            } else{
                res.render('admin/vistaAdmin', {
                    loginadmin: true,
                    data: req.session.data,
                    escuelas: resul
                });
            }
        })
    } else {
        res.render('admin/vistaAdmin', {
            loginadmin: false,
            name: 'Debes iniciar sesión'
        });
    }
    
});

function restarDias(dateN, dias) {
    dateN.setDate(dateN.getDate() - dias);
    return formato.filtradoML(dateN);
}

router.get('/infoEscuela/:id_escuela', async (req, res) => {
    if (req.session.loggedinAdmin) {
        await pool.query('SELECT * FROM escuelas e INNER JOIN (SELECT * FROM usuarios) AS u ON e.usuario_creador = u.id_user WHERE id_escuela = ?', [req.params.id_escuela], async (err, resul) => {
            if (err){
                console.log(err)
            } else{
                await pool.query ('SELECT * FROM usuarios WHERE escuela_id = ? AND tipo_user = "Alumno"', [req.params.id_escuela], async (error, infoAlumnos) =>{
                    if(error){
                        console.log(error)
                    } else{
                        let fechaActual = new Date();
                        let fechaActualFormat = formato.filtradoML(fechaActual)
                        var casosAltoRiesgo = await pool.query('SELECT * FROM encuestas c INNER JOIN (SELECT * FROM alumnos) AS t ON c.alumno_id=t.id_alum INNER JOIN (SELECT id_user, escuela_id FROM usuarios) AS a ON t.usuarios_id = a.id_user WHERE escuela_id = ? AND enc_res = 1 AND DATE(enc_fecha) BETWEEN ? AND ? ORDER BY enc_fecha ASC', [req.params.id_escuela, restarDias(fechaActual, 7), fechaActualFormat])
                        var grafica = await pool.query('SELECT * FROM alumnos a INNER JOIN (SELECT * FROM usuarios) AS b ON a.usuarios_id = b.id_user INNER JOIN (SELECT * FROM encuestas) AS e ON a.id_alum = e.alumno_id WHERE escuela_id = ?', [req.params.id_escuela]);
                        var datosenc = grafica.map(function (a) {
                            return a.enc_res;
                        });
                        var arrayRes = datosenc;
                        var repetidos = [];
                        arrayRes.forEach(function (numero) {
                            repetidos[numero] = (repetidos[numero] || 0) + 1;
                        });
                        console.log(repetidos)
                        res.render('admin/infoEscuela', {
                            loginadmin: true,
                            data: req.session.data,
                            infoEscuela: resul[0],
                            numerosAlum: infoAlumnos.length,
                            altoRiesgo: casosAltoRiesgo.length,
                            datosGrafica: repetidos
                        });
                    }
                });
            }
        })
    } else {
        res.render('admin/infoEscuela', {
            loginadmin: false,
            name: 'Debes iniciar sesión'
        });
    }
    
});


module.exports = router;