let fechas = document.getElementById('fechasML').value;
let strFechas = fechas;
let arrFechas = strFechas.split(' ');
let fin = [];
let array = arrFechas;
array.forEach(element => {//Para cada valor del array
    element.split(",").forEach(elm => {//Lo divido en 2 por la coma y para cada uno de los resultados
        fin.push((elm));//LO meto en el array fin haciéndole un parse a float para evitar comillas
    });
});
console.log(fin)

let fechas0 = document.getElementById('fechasML0').value;
let strFechas0 = fechas0;
let arrFechas0 = strFechas0.split(' ');
let fin0 = [];
let array0 = arrFechas0;
array0.forEach(element => {//Para cada valor del array
    element.split(",").forEach(elm => {//Lo divido en 2 por la coma y para cada uno de los resultados
        fin0.push((elm));//LO meto en el array fin haciéndole un parse a float para evitar comillas
    });
});

let cantidadAlum = document.getElementById('cantidadAlum').value;

console.log(fin0)
var maxValY = cantidadAlum; //Aqui va el maximo de morrillos
var fechas_BD1 = fin;
var fechas_BD0 = fin0;
var porDia1 = [];
var porDia0 = [];

var contador = 0;

for (i = 0; i < fechas_BD1.length; i++) {
    if (fechas_BD1[i] == fechas_BD1[i + 1]) {
        contador++;
    } else {
        contador++;
        porDia1.push(contador);
        contador = 0;
    }
}

for (i = 0; i < fechas_BD0.length; i++) {
    if (fechas_BD0[i] == fechas_BD0[i + 1]) {
        contador++;
    } else {
        contador++;
        porDia0.push(contador);
        contador = 0;
    }
}

var total_enc = 0;
var porDia = [];

for (i = 0; i < porDia1.length; i++) {
    total_enc = (porDia0[i] + porDia1[i]);
    porDia.push((porDia1[i] / total_enc) * maxValY);
}
console.log(porDia)



var valX = [];
for (k = 0; k < porDia.length; k++) {
    valX.push(k);
}
var valY = porDia;
var datosGrafica = deArrayAMatriz(valX, valY);
// Inicializamos la Grafica
console.log(datosGrafica)
var grafica = new Chart(document.getElementById("myChart"), {
    type: 'line',
    data: {
        labels: valX,
        datasets: [{
            label: "Casos de alto riesgo",
            data: porDia,
            borderColor: "rgb(255, 5, 63)",
            backgroundColor: "rgb(255, 99, 132)",
            fill: false,
        }]
    },
    options: {
        responsive: false
    }
});
var nodes = porDia.length;
//Creamos una funcion asincrona (para que se active hasta que termine de cargar la pagina)
async function learnLinear() {
    for (j = 0; j < 10; j++) {
        //Definimos el modelo que sera de regresion lineal
        const model = tf.sequential();
        //Agregamos una capa densa porque todos los nodos estan conectado entre si
        model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

        // Compilamos el modelo con un sistema de perdida de cuadratico y optimizamos con sdg
        model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });
        // Creamos los tensores para x y para y
        const xs = tf.tensor2d(valX, [nodes, 1]);
        const ys = tf.tensor2d(valY, [nodes, 1]);

        // Obtenemos la epocas (Las veces que se repetira para encontrar el valor de x)
        var epocas = 100;
        // Obtenemos el valor de x
        var nuevoValX = (nodes);

        // Ciclo que va ir ajustando el calculo
        for (i = 0; i < epocas; i++) {
            // Entrenamos el modelo una sola vez (pero como esta dentro de un ciclo se va ir entrenando por cada bucle)
            await model.fit(xs, ys, { epochs: 1 });
            // Obtenemos el valor de Y cuando el valor de x sea
            var prediccionY = model.predict(tf.tensor2d([nuevoValX], [1, 1])).dataSync()[0];
            // Escribimos el valor de y
            if (prediccionY >= maxValY) {
                prediccionY = maxValY;
            }
            document.getElementById("valy").innerText = prediccionY;
            // Escribimos en que epoca vamos
            document.getElementById("epocas").innerText = i + 1;
            // Redibujamos la grafica con el nuevo valor de X y Y
            if (i == epocas - 1) {
                datosGrafica.push(prediccionY);
                porDia.push(parseInt(prediccionY));
                nodes++;
                valX.push(nodes - 1);
                console.log(porDia);
                console.log(datosGrafica)
                grafica.data.datasets[0].data = datosGrafica;
                grafica.update();
            }

        }
    }
}
function deArrayAMatriz(arx, ary) {
    var data = [];
    for (i = 0; i < arx.length; i++) {
        data.push(porDia[i]);
    }
    return data;
}