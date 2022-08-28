const formularioD = document.getElementById('validarUser');
const inputs = document.querySelectorAll('#validarUser input');

const expresiones = {
	correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
	password: /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/ // 8 a 20 digitos.
}

const campos = {
	user_correo: false,
	user_contra: false
}

const validarFormulario = (e) => {
	switch (e.target.name) {
		case "user_correo":
			validarCampo(expresiones.correo, e.target, 'user_correo');
		break;
        case "user_contra":
			validarCampo(expresiones.password, e.target, 'user_contra');
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

	if(campos.user_correo && campos.user_contra){
        
	} else {
        swal('Advertencia','Tiene que llenar todos los campos correctamente.','error');
		e.preventDefault();
	}
});