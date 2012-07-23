importScripts('math_functions.js');

function messageHandler(event) {
    // Accedemos a la información del mensaje enviado por la página principal.
    var data = event.data;

    var regexp = /w:([a-z]+)(\s(.*))*/;
    var match = data.msg.match(regexp);

    var messageReturned = '';
    switch(match[1])
    {
        case 'h':
            messageReturned = "¡Hola!";
            break;
        case 'primo':
            messageReturned = isPrime(match[3]);
            break;
        case 'divisores':
            messageReturned = divisores(match[3]);
            break;
        default:
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