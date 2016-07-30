var oscar = require('./oscar');
var Promise = require('bluebird');
/**
 * Modulo principal do bot
 * @returns
 */
var icqBot = (function () {
    //Constantes e variáveis 
    var TIME_OUT_MSG = 20000;
    var senders = {};
    var steps = [];

    //Inicializar configurações do Oscar
    var aim = new oscar.OscarConnection({
        connection: {
            username: 'xxxxxxxxx',
            password: 'xxxxxxxxx',
            host: 'login.icq.com',
            port: '443'
        }
    });

    /**
     * Loop principal para receber mensagens    
     * @param string text - mensagem recebida
     * @param object sender - dados do usuário que enviou
     * @param int flags 
     * @param string when - quando a mensagem foi enviada
     */
    var mainLoop = function () {
        aim.on('im', function (text, sender, flags, when) {

            console.log("Usuário enviou uma mensagem: " + text + " " + sender.name);

            if (!senders.hasOwnProperty(sender.name))
                senders[sender.name] = sender;

            if (!senders[sender.name].hasOwnProperty('firstMessage'))
                senders[sender.name].firstMessage = true;

            if (senders.hasOwnProperty(sender.name))
                generateQuest(senders[sender.name]);
        });
    }


    /**
     * Aguarda uma mensagem do usuário
     * Caso seja a primeira mensagem do usuario
     * o método é finalizado
     * @param boolean firstMessage
     * @returns Promise
     */
    var receberMensagemAsync = function (firstMessage) {

        if (firstMessage) return q.defer().promise;
        return new Promise(function (resolve, reject) {
            aim.on('im', function (mensagem, sender, flags, when) {
                resolve(mensagem);
            });
        });
    };


    /**
     * Envia uma mensagem ao usuário
     * 
     * @param string mensagem
     * @param string usuario
     */
    var enviarMensagem = function (mensagem, usuario, timeOut) {
        if (timeOut === undefined) timeOut = 0;

        setTimeout(function () {
            aim.sendIM(usuario, mensagem, function (err) {
                if (err) throw new Error(err);
            });
        }, timeOut);
    }


    /**
     * Gera a quest
     */
    var generateQuest = function (sender) {

        if (sender.firstMessage) {
            enviarMensagem("Bem vindo jovem aventureiro(a), para falar com o nordestino, é necessário enfrentar um longa jornada, ou simplesmente resolver um cálculo matemático", sender);
            enviarMensagem("Deseja continuar? (Responda sim ou não)", sender, 5000);
            sender.firstMessage = false;
        }


        receberMensagemAsync(sender.firstMessage).then(function (resposta) {

            if ((steps.length === 0 || steps.indexOf('sim') !== -1) && resposta.contains('sim')) {
                if(steps.indexOf('sim') === -1){
                    steps.push('sim');
                    enviarMensagem('Infelizmente, eu tava zoando, não tem jornada nenhuma, adeus!', sender);
                }
                

            } else if ((steps.length === 0 || steps.indexOf('calc') !== -1) && !resposta.contains('sim')) {
                if (steps.indexOf('calc') === -1) {
                    steps.push('calc');

                    var questao = randomQuestion();
                    var resultadoQuestion = eval(questao);

                    enviarMensagem("Já que você quer assim, então resolva um cálculo simples de matemática para poder falar com o nordestino", sender);
                    enviarMensagem("Resolva: " + questao, sender, 1000);

                }
                if (steps.length == 1 || steps.indexOf('resolvaCalc') !== -1) {
                    if (steps.indexOf('resolvaCalc') === -1) {
                        steps.push('resolvaCalc');
                    }

                    receberMensagemAsync(sender.firstMessage).then(function (resposta) {
                        if (resultadoQuestion !== undefined) {
                            if (resposta.contains(resultadoQuestion)) {
                                if (steps.indexOf('genio') === -1) {
                                    enviarMensagem("Parabéns, já pode participar do enem!", sender);
                                    steps.push('genio');
                                }

                            } else {
                                if (steps.indexOf('buru') === -1) {
                                    enviarMensagem("Burro :(", sender);
                                    enviarMensagem('http://www.americanas.com.br/sublinha/228375/livros/ciencias-exatas/matematica', sender, 5000);
                                    steps.push('buru');
                                }
                            }
                        }

                    });
                }


            } else {
                //Sei que nunca vai bater aqui, mas foda-se
                enviarMensagem('Se decide cabra!', sender);
            }

        });

        // receberMensagemAsync(sender.firstMessage).then(function (resposta) {
        //     if (resposta.contains("sim")) {
        //         console.log(resposta);
        //     } else {
        //         var questao = randomQuestion();
        //         var resultadoQuestion = eval(questao);

        //         enviarMensagem("Já que você quer assim, então resolva um cálculo simples de matemática para poder falar com o nordestino", sender);
        //         setTimeout(function () {
        //             enviarMensagem("Resolva: " + questao, sender);
        //         }, 500);

        //         receberMensagemAsync(sender.firstMessage).then(function (resposta) {
        //             if (resposta == resultadoQuestion) {
        //                 enviarMensagem("Parabéns, você pode passar!", sender);
        //             } else {
        //                 enviarMensagem("Burro :(", sender);
        //             }
        //         });

        //     }
        // });


    }

    /**
     * 
     * Verifica a existência de um padrão em uma string
     * @param string strPattern
     * @returns boolean
     */
    String.prototype.contains = function (strPattern) {
        //if (typeof strPattern !== 'string') return false;

        var pattern = new RegExp(strPattern, "i");

        return pattern.test(this);
    }

    /**
     * Deleta todos os contatos 
     * Nivil de útilidade: mais de 8000
     */
    var deletarTodosOsContatos = function () {
        for (var groups in aim.contacts.list) {
            if (aim.contacts.list.hasOwnProperty(groups)) {
                var group = aim.contacts.list[groups];
                console.log(group);

                for (var contatos in group.contacts) {
                    if (group.contacts.hasOwnProperty(contatos)) {
                        var contato = group.contacts[contatos];


                        aim.delContact(contato.name, function (err) {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log("success" + ": " + contato.name);
                            }
                        });

                    }
                }
            }
        }
    }

    /**
     * Gera um calculo matemático 
     * Nivil de dificuldade: fácil
     * @returns string 
     */
    var randomQuestion = function () {
        var operadores = ["*", "+", "-", "/"];

        var indexRandom = Math.floor(Math.random() * ((operadores.length) - 0)) + 0;
        var randomNumber1 = Math.floor(Math.random() * (100 - 0) + 0);
        var randomNumber2 = Math.floor(Math.random() * (100 - 0) + 0);

        // if((indexRandom === 0 || indexRandom === 3) && (randomNumber1 === 0 || randomNumber2 == 0)){
        //   randomNumber1 = randomNumber1 == 0 ? 99 : randomNumber1;
        //   randomNumber2 = randomNumber2 == 0 ? 99 : randomNumber2;
        // }
        //Hard mode on & fix divide by zero KAPPAAAAAAAAAAAAAAA
        //TODO: Melhorar o hard mode 
        if (randomNumber1 === 0 || randomNumber2 == 0) {
            randomNumber1 = randomNumber1 == 0 ? 99 : randomNumber1;
            randomNumber2 = randomNumber2 == 0 ? 99 : randomNumber2;
        }

        var question = randomNumber1 + " " + operadores[indexRandom] + " " + randomNumber2;

        return question;

    };

    /**
     * Executa conexão com o servidor ICQ
     * Inicializa o bot 
     *
     */
    var connect = function () {
        aim.connect(function (err) {
            if (err)
                console.log(err);
            else {
                console.log('Pronto!');
            }

            console.log('Servidor iniciado.');
            mainLoop();
        });
    };

    return {
        start: connect
    };
})();

icqBot.start();