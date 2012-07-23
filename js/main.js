/* Author: Jorge del Casar (jorge.casar@gmail.com)

*/
var chatDemo = (function(){
    // Inicializamos el socket.
    var socket = io.connect(window.location.href);
    // Inicializamos el worker.
    var trabajador = new Worker('js/worker.js');

    var $chat = $(document.getElementById('chat'));
    var nickname = '';

    var chatEvents = function(){
        var $chat_app = $(document.getElementById('chat_app'));
        var $chat_log = $(document.getElementById('chat_log'));
        var $chat_users = $(document.getElementById('chat_users'));

        var $chat_nickname = $(document.getElementById('chat_nickname'));
        var $chat_msg = $(document.getElementById('chat_msg'));

        $chat.on('show_login', function(){
            $chat_nickname.show();
        });
        $chat.on('hide_login', function(){
            $chat_nickname.hide();
        });
        $chat.on('show_chat', function(){
            $chat_app.show();
        });
        $chat.on('write', function(event, data) {
            if( !!data.nickname )
            {
                data.msg = '<p class="' + data.nickname + '"><strong>' + data.nickname + '</strong>: ' + data.msg + '</p>';
            }
            $chat_log.append(data.msg);
            var offset = $chat_log[0].scrollHeight - $chat_log[0].clientHeight;
            if ( offset > 0 ) {
                $chat_log.scrollTop(offset);
            }
        });
        $chat.on('user_list', function(event, data){
            var nicknames = data.users.sort();
            var users_max = nicknames.length;
            var html = '<p>usuarios: ' + users_max + '</p><ul>';
            for(var i = 0; i < users_max; i++)
            {
                html += '<li id="' + nicknames[i] + '">' + nicknames[i] + '</li>';
            }
            html += '</ul>';
            $chat_users.html(html);
        });
        $chat.on('remove_user', function(event, data){
            $chat_users.find('#' + data.nickname).remove();
        });
        $chat.on('welcome', function(event, data) {
            var msg = '<p class="welcome">Welcome  ' + data.nickname + '</p>';
            $chat.trigger('write', {msg: msg});
        });
        $chat.on('goodbye', function(event, data) {
            var msg = '<p class="goodbye">Goodbye  ' + data.nickname + '</p>';

            $chat.trigger('write', {msg: msg});
        });
        $chat.on('worker', function(event, data) {
            data.msg = data.nickname + ': ' + data.msg;
            data.nickname = 'worker';
            $chat.trigger('write', data);
        });
    };

    var formsEvents = function() {
        $chat.on('submit', '#chat_nickname', function(event){
            event.preventDefault();
            if( this.checkValidity() )
            {
                nickname = this.nickname.value;
                socket.emit('set nickname', nickname, function(success){
                    if(success)
                    {
                        $chat.trigger('hide_login');
                        $chat.trigger('show_chat');
                    }
                    else
                    {
                        alert('Error: Nickname existente');
                    }
                });
            }
            else
            {
                alert('Formulario no válido');
            }
        });

        $chat.on('submit', '#chat_msg', function(event){
            event.preventDefault();
            if( this.checkValidity() )
            {
                var msg = this.msg.value;
                if( msg.indexOf('w:') === 0 )
                {
                    trabajador.postMessage({
                        msg: msg,
                        nickname: nickname
                   });
                }
                socket.emit('msg', { msg: msg });
                this.msg.value = '';
            }
        });
    };

    var socketEvents = function(){
        socket.on('connect', function(){
            $chat.trigger('show_login');
        });
        socket.on('welcome', function (data) {
            $chat.trigger('welcome', data);
            $chat.trigger('user_list', data);
        });
        socket.on('goodbye', function (data) {
            $chat.trigger('goodbye', data);
            $chat.trigger('remove_user', data);
        });
        socket.on('msg', function (data) {
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

    var workerEvents = function() {
        trabajador.addEventListener("message", function (event) {
            socket.emit('msg', event.data);
        }, false);
    };

    chatEvents();
    formsEvents();
    socketEvents();
    workerEvents();
})();
