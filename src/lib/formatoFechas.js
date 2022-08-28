const moment = require('moment');
const tz = require('moment-timezone')
require ('moment/locale/es')  // without this line it didn't work
moment.locale('es')
const formato = {};

formato.actualDate = (date) =>{
    return moment(date).subtract(5, 'hours').format("DD/MM/YYYY");
}

formato.actualDateML = (date) =>{
    return moment(date).subtract(5, 'hours').format("DD/MM/YYYY");
}

formato.cumpleDate = (date) =>{
    return moment(date).format("YYYY,MM,DD")
}

formato.filtradoML = (date) =>{
    return moment(date).format("YYYY-MM-DD")
}

formato.filtradoGrafica = (date) =>{
    return moment(date).subtract(5, 'hours').format("YYYY-MM-DD")
}

formato.pruebaMoment = (date) =>{
    return moment(date).format("YYYY-MM-DD HH:MM:SS")
}


formato.formatDate = (date) =>{
    return moment(date).utcOffset("-12:00").format();
}

module.exports = formato;