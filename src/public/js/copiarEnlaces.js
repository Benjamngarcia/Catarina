function copiarEnlaceAlum() {

    let content = document.getElementById('linkAlum').value;
    console.log(content);
    
    navigator.clipboard.writeText(content);
    swal('Copiado','Link de invitación de alumnos copiado exitosamente.','success');
}

function copiarEnlaceProf() {

    let content = document.getElementById('linkProf').value;
    console.log(content);
    
    navigator.clipboard.writeText(content);
    swal('Copiado','Link de invitación de profesores copiado exitosamente.','success');
}