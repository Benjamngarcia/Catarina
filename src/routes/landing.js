const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const {body, validationResult} = require('express-validator');

router.get('/', (req, res) => {
    res.render('index');
});

router.post('/EnviarCorreo', 
    [body('name', 'Ingrese su nombre.').exists().matches(/^[a-zA-ZÀ-ÿ\s]{1,40}$/),
    body('email', 'Ingrese un email válido.').exists().isEmail(),
    body('mensaje', 'Escriba su mensaje.').exists().isLength({min:10})],
    (req, res) => {
        const valores = req.body
        let errors = validationResult(req);
    if (!errors.isEmpty()) {
        const validaciones = errors.array();
        console.log(valores)
        res.render('index',{
            alert: true,
            alertTitle: "Error al enviar correo.",
            alertMessage: "El correo no se envío, favor de llenar bien el formulario.",
            alertIcon: "error",
            showConfirmButton: true,
            timer: 3000,
            ruta: '#contacto'
        });
        console.log(validaciones)
    }else{
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
            from: valores.email,
            to: 'dictamigosasocs@gmail.com',
            subject: 'Contacto página DICTAMIGOS',
            html:`<p><b>Te está tratando de contactar: </b>${valores.name}</p>
            <p><b>Lo puedes contactar en: </b>${valores.email}</p>
            <p><b>Su mensaje es:</b5> ${valores.mensaje}</p>`
        }
        transporter.sendMail(mailOptions, (error, inf)=>{
            if(error){
                res.render('index',{
                    alert: true,
                    alertTitle: "Ocurrió un error inesperado.",
                    alertMessage: "Por favor, vuelva a intentar",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: 3000,
                    ruta: '#contacto'
                })
            } else {
                console.log("Email enviado correctamente")
                res.render('index',{
                    alert: true,
                    alertTitle: "Correo enviado.",
                    alertMessage: "Pronto nos comunicaremos con usted",
                    alertIcon: "success",
                    showConfirmButton: true,
                    timer: 3000,
                    ruta: '#contacto'
                })
            }
        })
    }
}); 


module.exports = router;