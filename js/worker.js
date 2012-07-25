// importamos la librería de funciones.
importScripts('math_functions.js');

// Función que manejará los mensajes recibidos.
function messageHandler(event) {
    // Accedemos a la información del mensaje enviado por la página principal.
    var data = event.data;

    // Expresión regular que filtra el mensaje
    var cmd_regexp = /w:([a-z]+)(\s(.*))*/;
    // Obtenemos las partes del mensaje.
    var match = data.msg.match(cmd_regexp);
    // Guardamos el cmd.
    var cmd = match[1];
    // Guardamos los parámetros
    var params = match[3];
    // Declaramos el la variable del mensaje de vuelta.
    var messageReturned = '';
    // Evaluamos el comando.
    switch(cmd)
    {
        case 'h':
            // Enviamos saludo de vuelta.
            // w:h
            messageReturned = "¡Hola!";
            break;
        case 'primo':
            // Comprobamos si el número es primo.
            // w:primo params
            messageReturned = isPrime(params);
            break;
        case 'divisores':
            // Calculamos los divisores del número.
            // w:divisores params
            messageReturned = divisores(params);
            break;
        default:
            // En cualquier otro caso indicamos el error.
            messageReturned = 'Comando no reconocido.';
            break;
    }
    // Enviamos de vuelta un mensaje a la página principal.
    this.postMessage({
        msg: messageReturned,
        cmd: data.msg
    });
}

// Definimos la función de callback para cuando nos llame la página principal.
this.addEventListener('message', messageHandler, false);