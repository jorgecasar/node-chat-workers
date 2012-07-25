/* Author: Jorge del Casar (jorge.casar@gmail.com)

*/
var chatDemo = (function($, io){
    "use strict";
    // Variables globales
    // Inicializamos el socket.
    var socket = io.connect(window.location.href);
    // Inicializamos el worker.
    var trabajador = new Worker('js/worker.js');
    // Obtenemos el elmento del DOM.
    var $chat = $(document.getElementById('chat'));

    var chatEvents = function(){
        // Obtenemos los elementos de nuestro chat.
        // Aplicación.
        var $chat_app = $(document.getElementById('chat_app'));
        // Log de mensajes.
        var $chat_log = $(document.getElementById('chat_log'));
        // Lista de usuarios.
        var $chat_users = $(document.getElementById('chat_users'));

        // Formulario de para seleccionar nombre de usuario.
        var $chat_nickname = $(document.getElementById('chat_nickname'));
        // Formulario de envío de mensajes.
        var $chat_msg = $(document.getElementById('chat_msg'));

        // Asociación de eventos al elemento del DOM #chat.
        // muestra el formulario de selección de usuario.
        $chat.on('show_login', function(){
            $chat_nickname.show();
        });
        // oculta el formulario de selección de usuario.
        $chat.on('hide_login', function(){
            $chat_nickname.hide();
        });
        // muestra la aplicación de chat.
        $chat.on('show_chat', function(){
            $chat_app.show();
        });
        // Escribe en el log de mensajes.
        $chat.on('write', function(event, data) {
            // Si hay nombre de usuario lo añadimos "nickname: " al mensaje.
            if( !!data.nickname )
            {
                data.msg = '<p class="' + data.nickname + '"><strong>' + data.nickname + '</strong>: ' + data.msg + '</p>';
            }
            // Añadimos el mensaje al log de mensajes
            $chat_log.append(data.msg);
            // Hacemos scroll para que el log baje cuando hay mensajes nuevos.
            var offset = $chat_log[0].scrollHeight - $chat_log[0].clientHeight;
            if ( offset > 0 ) {
                $chat_log.scrollTop(offset);
            }
        });
        // añade la lista de usuarios.
        $chat.on('user_list', function(event, data){
            var users = data.users;
            // Obtenemos el número de usuarios.
            var num_users = users.length;
            // Preparamos el html que vamos a incluir en el DOM.
            var html = '<p>usuarios: <span id="num_users">' + num_users + '</span></p>';
            html += '<ul>';
            for(var i = 0; i < num_users; i++)
            {
                // Establecemos un id para su posterior eliminación.
                html += '<li id="' + users[i] + '">' + users[i] + '</li>';
            }
            html += '</ul>';
            // Añadimos el html al DOM
            // 1 sola inclusión de todo es más rápida.
            // que 1 por cada item de la lista.
            $chat_users.html(html);
        });
        // Elimina un usuario.
        $chat.on('remove_user', function(event, data){
            // Actualizamos el contador de usuarios
            document.getElementById('num_users').innerHTML = data.users.length;
            // Eliminamos el usuario de la lista.
            $chat_users.find('#' + data.nickname).remove();
        });

        // Da la bienvenida al usuario.
        $chat.on('welcome', function(event, data) {
            var msg = '<p class="welcome">Welcome  ' + data.nickname + '</p>';
            $chat.trigger('write', {msg: msg});
        });

        // Despide a un usuario.
        $chat.on('goodbye', function(event, data) {
            var msg = '<p class="goodbye">Goodbye  ' + data.nickname + '</p>';
            $chat.trigger('write', {msg: msg});
        });

        // Mensaje de un trabajador.
        $chat.on('worker', function(event, data) {
            data.msg = data.nickname + ': ' + data.msg;
            data.nickname = 'worker';
            $chat.trigger('write', data);
        });

        // Cargamos el nickname almacenado en localStorage.
        $chat.on('autoLogin', function(event, data){
            $chat_nickname.get(0).nickname.value = data.nickname;
            $chat_nickname.trigger('submit');
        });
    };
    var saveNickname = function(nickname){
        var ls = window.localStorage;
        ls.setItem('chat_nickname', nickname);
    }

    var loadNickname = function(){
        var ls = window.localStorage;
        var nickname = ls.getItem('chat_nickname');
        if( nickname ) {
            $chat.trigger('autoLogin', { nickname: nickname} );
        }
    }
    // Eventos de los formularios
    var formsEvents = function() {
        // Captura del evento submit del formulario de nombre de usuario.
        $chat.on('submit', '#chat_nickname', function(event){
            // Evitamos que se envíe el formulario refrescando la página.
            event.preventDefault();
            // comprobamos que el formulario es válido.
            // Utilizando las propiedades definidas en el HTML.
            if( this.checkValidity() )
            {
                var nicknameCallback = function(success, nickname){
                    if(success)
                    {
                        $chat.trigger('hide_login');
                        $chat.trigger('show_chat');
                        saveNickname(nickname);
                    }
                    else
                    {
                        window.alert('Error: Nickname existente');
                    }
                };
                // Enviamos al servidor el nickname.
                socket.emit('set nickname', this.nickname.value, nicknameCallback);
            }
            else
            {
                // Alertamos al usuario del error.
                window.alert('Formulario no válido');
            }
        });
        // Captura del evento submit del formulario de envio de mensajes.
        $chat.on('submit', '#chat_msg', function(event){
            // Evitamos que se envíe el formulario refrescando la página.
            event.preventDefault();
            // comprobamos que el formulario es válido.
            // Utilizando las propiedades definidas en el HTML.
            if( this.checkValidity() )
            {
                // Guardamos el mensaje introducido.
                var msg = this.msg.value;
                // Limpiamos las etiquetas del mensaje.
                msg = msg.replace(/(<([^>]+)>)/ig,"");
                // Evaluamos que no sea una orden para el worker.
                if( msg.indexOf('w:') === 0 )
                {
                    // Enviamos el mensaje recibido al worker.
                    trabajador.postMessage({ msg: msg });
                }
                // Enviamos el mensaje al servidor.
                socket.emit('msg', { msg: msg });
                // Vaciamos el campo del formulario.
                this.msg.value = '';
            }
        });
    };

    // Capturamos los eventos que envia el servidor.
    var socketEvents = function(){
        // El servidor notifica la conexión del socket.
        socket.on('connect', function(){
            // Lanzamos el evento que muestra el formulario de nickname.
            $chat.trigger('show_login');
        });
        // El servidor notifica la conexión de un usuario.
        socket.on('welcome', function (data) {
            // Lanzamos el evento de bienvenida.
            $chat.trigger('welcome', data);
            // Lanzamos el evento para actualizar la lista de usuarios.
            $chat.trigger('user_list', data);
        });
        // El servidor notifica la salida de un usuario.
        socket.on('goodbye', function (data) {
            // Lanzamos el evento de despedida.
            $chat.trigger('goodbye', data);
            // Lanzamos el evento que elimina el usuario de la lista.
            $chat.trigger('remove_user', data);
        });
        // El servidor notifica de un nuevo mensaje.
        socket.on('msg', function (data) {
            // Determinamos si es un mensaje de un worker o un usuario.
            if( data.cmd )
            {
                $chat.trigger('worker', data);
            }
            else
            {
                $chat.trigger('write', data);
            }
        });
    };

    // Capturamos los eventos del trabajador.
    var workerEvents = function() {
        // Definimos la función de callback para cuando nos llame el worker.
        trabajador.addEventListener("message", function (event) {
            // Enviamos al servidor los datos recibidos.
            socket.emit('msg', event.data);
        }, false);
    };

    // Inicializamos la aplicaicón.
    var init = function(){
        // Lanzamos la funciones necesarias.
        chatEvents();
        formsEvents();
        loadNickname();
        socketEvents();
        workerEvents();
    };

    init();
})(jQuery, io);
