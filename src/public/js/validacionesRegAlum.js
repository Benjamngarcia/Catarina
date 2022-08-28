const formularioD = document.getElementById('registroDirec');
const inputs = document.querySelectorAll('#registroDirec input');
const terminos = document.getElementById('terminos');

const expresiones = {
	nombre: /^[a-zA-ZÀ-ÿ\s]{1,40}$/, // Letras y espacios, pueden llevar acentos.
	password: /^(?=\w*\d)(?=\w*[A-Z])(?=\w*[a-z])\S{8,20}$/, // 8 a 20 digitos.
	correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
    grupo: /^[0-9a-zA-ZÀ-ÿ\s]{1,10}$/
}

const campos = {
	user_nom: false,
    user_appat: false,
    user_apmat: false,
	user_correo: false,
	user_contra: false,
    grupo_alum: false
}

const validarFormulario = (e) => {
	switch (e.target.name) {
		case "user_nom":
			validarCampo(expresiones.nombre, e.target, 'user_nom');
		break;
		case "user_appat":
			validarCampo(expresiones.nombre, e.target, 'user_appat');
		break;
		case "user_apmat":
			validarCampo(expresiones.nombre, e.target, 'user_apmat');
		break;
		case "user_correo":
			validarCampo(expresiones.correo, e.target, 'user_correo');
		break;
		case "user_contra":
			validarCampo(expresiones.password, e.target, 'user_contra');
		break;
        case "grupo_alum":
			validarCampo(expresiones.grupo, e.target, 'grupo_alum');
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

	if(campos.user_nom && campos.user_appat && campos.user_apmat && campos.user_correo && campos.user_contra && grupo.alum && terminos.checked){
        
	} else {
        swal('Advertencia','Tiene que llenar todos los campos correctamente.','error');
		e.preventDefault();
	}
});