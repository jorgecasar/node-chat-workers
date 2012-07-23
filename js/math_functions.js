var isPrime = function(number){
    num = parseInt(number, 10);
    var result = '';
    var prime = true;
    if (isNaN(num) || num <= 0)
    {
        result = number + " no es un número válido. ¡Prueba de nuevo!";
        prime = false;
    }
    else if (num <= 2)
    {
        result = num + " es primo!";
    }
    else
    {
        var i = 2;
        while ( prime && i < num)
        {
            prime = num % i !== 0;
            if (prime)
            {
                result = '¡' + num + " es primo!";
            }
            else
            {
                result = num + " no es primo. Es divisible por " + i + ".";
            }
            i++;
        }
    }
    return result;
};

var divisores = function(number) {
    var num = parseInt( number );
    if ( isNaN( num ) || num < 0)
    {
        result = number + " no es un número válido. ¡Prueba de nuevo!";
    }
    else if ( num === 0 )
    {
        result = number + " no tiene divisores.";
    }
    else if ( num === 1 ) {
        result = number + " solo es divisible por si mismo.";
    }
    else
    {
        var divisores = [1];
        for ( var i = 2; i <= num; i++ ) {
            if( num % i === 0 )
            {
                divisores.push(i);
            }
        }
        result = "Los divisores de " + num + " son: "+ divisores.join(', ');
    }
    return result;
};