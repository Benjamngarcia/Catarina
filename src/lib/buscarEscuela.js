const pool = require('../database');
const buscarEsc = {};


buscarEsc.buscarA = async (contra) => {
    var buscarEscuela =  await pool.query('SELECT * FROM escuelas WHERE escuela_contraAlum = ?', [contra]);
    return buscarEscuela;
}

buscarEsc.buscarP = async (contra) => {
    var buscarEscuela =  await pool.query('SELECT * FROM escuelas WHERE escuela_contraProf = ?', [contra]);
    return buscarEscuela;
}

module.exports = buscarEsc;