const express = require('express');
const path = require('path');
const morgan = require('morgan');
const session = require('express-session');


const app = express();

app.set('port', process.env.PORT || 5000);
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', '.ejs');

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use (session({
    secret:'secret',
    resave: true,
    saveUninitialized: true,
}));

app.use(require('./routes/landing'));
app.use(require('./routes/auth'));
app.use(require('./routes/general'));
app.use(require('./routes/director'));
app.use(require('./routes/alumno'));
app.use(require('./routes/cuestionario'));
app.use(require('./routes/profesor'));
app.use(require('./routes/tutor'));
app.use('/alumnos', require('./routes/alumnosDir'));
app.use('/profesores', require('./routes/profesoresDir'));
app.use('/registro', require('./routes/registroUsuarios'));
app.use('/admin', require('./routes/admin'));

app.use((req, res, next) =>{
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(app.get('port'), () => {
    console.log(`Servidor en el puerto ${app.get('port')}`);
});