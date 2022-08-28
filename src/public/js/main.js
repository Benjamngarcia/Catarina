//SCROLL COLOR NAVBAR
$(window).scroll(function () {
    if ($("#menu").offset().top > 30) {
        $("#menu").addClass("color-navbar");
		$(".nav-link").removeClass("text-light");
		$(".navbar-brand").removeClass("text-light");
		$(".fa-bars").removeClass("text-light");
		$(".svg-cls").removeClass("strow-svg-custom");
		$(".nav-link").addClass("text-dark");
		$(".navbar-brand").addClass("text-dark");
		$(".fa-bars").addClass("text-dark");
		$(".svg-cls").addClass("strow-svg-custom-dark");
    } else {
        $("#menu").removeClass("color-navbar");
		$(".nav-link").removeClass("text-dark");
		$(".navbar-brand").removeClass("text-dark");
		$(".fa-bars").removeClass("text-dark");
		$(".svg-cls").removeClass("strow-svg-custom-dark");
		$(".nav-link").addClass("text-light");
		$(".navbar-brand").addClass("text-light");
		$(".fa-bars").addClass("text-light");
		$(".svg-cls").addClass("strow-svg-custom");
    }
});

//SMOOTH SCROLLING
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
//TYPED JS
// const typed = new Typed('.typed', {
// 	strings: [
// 		'<span>tu salud.</span>', '<span>a tus hijos.</span>', '<sapn>tu escuela.</sapn>'
// 	],
// 	typeSpeed: 70,
// 	startDelay: 200,
// 	backSpeed: 75,
// 	smartBackspace: true,
// 	backDelay: 500, 
// 	loop: true,
// 	loopCount: false,
// 	showCursor: false,
// 	contentType: 'html',
// });

//BOTÓN IR ARRIBA
$(document).ready(function(){
	$('.ir-arriba').click(function(){
		$('body, html').animate({
			scrollTop: '0px'
		}, 500);
	});
	$(window).scroll(function(){
		if( $(this).scrollTop() > 0 ){
			$('.ir-arriba').slideDown(300);
		} else {
			$('.ir-arriba').slideUp(300);
		}
	});
});

//SCROLL REVEAL
window.sr = ScrollReveal({ reset: false });

sr.reveal('.navbar, .showcase', {
    origin: 'top',
    duration: 800,
	distance: '-10px'
});

sr.reveal('.title-about, .regi-div', {
    origin: 'bottom',
    duration: 1000,
	distance: '-10px'
});

sr.reveal('.text-about, .form-contact, .text-necesidad', {
    origin: 'left',
    duration: 900,
	distance: '-10px'
});

sr.reveal('.text-objetivo, .mockups-catarina', {
	origin: 'right',
	duration: 900,
	distance: '-10px'
});

//FORMULARIO

const formularioD = document.getElementById('enviarCorreo');
const inputs = document.querySelectorAll('#enviarCorreo input');

const expresiones = {
	nombre: /^[a-zA-ZÀ-ÿ\s]{1,44}$/, // Letras y espacios, pueden llevar acentos.
	correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/
}

const campos = {
	name: false,
	email: false
}

const validarFormulario = (e) => {
	switch (e.target.name) {
		case "name":
			validarCampo(expresiones.nombre, e.target, 'name');
		break;
		case "email":
			validarCampo(expresiones.correo, e.target, 'email');
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

	if(campos.name && campos.email){

	} else {
        swal('Advertencia','Tiene que llenar todos los campos correctamente.','warning');
        e.preventDefault();
	}
});