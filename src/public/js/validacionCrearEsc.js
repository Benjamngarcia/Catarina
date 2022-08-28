const formularioD = document.getElementById('crearEscuela');
const inputs = document.querySelectorAll('#crearEscuela input');

const expresiones = {
	nombre: /^[a-zA-ZÀ-ÿ\s]{1,44}$/, // Letras y espacios, pueden llevar acentos.
}

const campos = {
	escuela_nom: false
}

const validarFormulario = (e) => {
	switch (e.target.name) {
		case "escuela_nom":
			validarCampo(expresiones.nombre, e.target, 'escuela_nom');
		break;
	}
}

const validarCampo = (expresion, input, campo) => {
	if(expresion.test(input.value)){
		document.getElementById(`input__${campo}`).classList.remove('formulario__input-incorrecto');
		document.querySelector(`#input__${campo} .formulario__input-error`).classList.remove('formulario__input-error-activo');
		campos[campo] = true;
	} else {
		document.getElementById(`input__${campo}`).classList.add('formulario__input-incorrecto');
		document.querySelector(`#input__${campo} .formulario__input-error`).classList.add('formulario__input-error-activo');
		campos[campo] = false;
	}
}

inputs.forEach((input) => {
	input.addEventListener('keyup', validarFormulario);
	input.addEventListener('blur', validarFormulario);
});

formularioD.addEventListener('submit', (e) => {

	if(campos.escuela_nom){

	} else {
        swal('Advertencia','Tiene que llenar todos los campos correctamente.','error');
        e.preventDefault();
	}
});