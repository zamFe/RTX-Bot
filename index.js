const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

var fetch = require("node-fetch");
var htmlToJson = require("html-to-json");
var fs = require('fs');
const { type } = require('os');

var prefix = "!";

//runs when bot goes online
client.on('ready', () => {
    console.log('RTX Bot is online!');

    client.user.setActivity("komplett.no")
})

client.on('message', async msg => {

    //ignore bots
    if (msg.author.bot) return;

    //ignore prefix messages
    if (msg.content.indexOf(prefix) !== 0) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    //sinple greeting
    if (command === "hello") {
        return msg.reply('Hello to you too!')
    }

    //r6s operator info
    if (command === "rtx") {
        // response = await fetch('https://www.komplett.no/category/10412/datautstyr/pc-komponenter/skjermkort?nlevel=10000%C2%A728003%C2%A710412&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203080&stockStatus=InStock');
        //var text = await response.text();
        //var el = htmlToJson.parse(text);
        var komplett = htmlToJson.request('https://www.komplett.no/category/10412/datautstyr/pc-komponenter/skjermkort?nlevel=10000%C2%A728003%C2%A710412&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203080&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203090&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203070&stockStatus=InStock', {
            'card': ['h2', function ($h) {
                return $h.text();
            }],
            'available': ['div .product-list-item', function ($d) {
                return $d.text();
            }],
            'link' : ['a .image-container', function ($a) {
                return $a.attr('href');
            }]
        }, function (err, result) {
            //console.log(result);
            fs.writeFile("test.txt", JSON.stringify(result), function(err) {
                if (err) {
                    console.log(err);
                }
            });
            var cardStr = "\n *Currently listed cards: *\n\n";
            for (let i = 0; i < result.card.length; i++) {
                cardStr += JSON.stringify(result.card[i]) + "\n";
                cardStr += "status: ";
                if(result.available.length > i) {
                    if(JSON.stringify(result.available[i]).includes("Motta Varsel")) {
                        cardStr += "not available \n";
                        cardStr += "\n";
                    } else if(JSON.stringify(result.available[i]).includes("Ikke på lager")) {
                        cardStr += "not in stock\n";
                        //cardStr += "buy here: " + result.link[i] + "\n";
                        cardStr += "\n";
                    } else if(JSON.stringify(result.available[i]).includes("stk. på lager")) {
                        cardStr += "in stock!\n";
                        //cardStr += "buy here: " + result.link[i] + "\n";
                        cardStr += "\n";
                    }
                } else {
                    cardStr += "\n";
                    cardStr += "\n";
                }
            }
            return msg.channel.send(cardStr);
        });
    }
});

//logging in with token
client.login(config.token);

var prevStatusList = [];

function checkForUpdate(result) {
    if (result.available.length != prevStatusList.length) {
        return true;
    }
    for (let i = 0; i < prevStatusList.length; i++) {
        if(JSON.stringify(prevStatusList[i]) != JSON.stringify(result.available[i])) {
            return true;
        }
    }
    return false;
}

setInterval(function() {
    var komplett = htmlToJson.request('https://www.komplett.no/category/10412/datautstyr/pc-komponenter/skjermkort?nlevel=10000%C2%A728003%C2%A710412&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203080&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203090&cnet=Grafikkprosessor_A00247%20%20%C2%A7NVIDIA%20GeForce%20RTX%203070&stockStatus=InStock', {
            'card': ['h2', function ($h) {
                return $h.text();
            }],
            'available': ['div .product-list-item', function ($d) {
                return $d.text();
            }],
            'link' : ['a .image-container', function ($a) {
                return $a.attr('href');
            }]
        }, function (err, result) {
            //console.log(result);
            if(checkForUpdate(result) == false) {
                return;
            }
            fs.writeFile("test.txt", JSON.stringify(result), function(err) {
                if (err) {
                    console.log(err);
                }
            });
            var cardStr = "\n *Currently listed cards:* \n\n";
            for (let i = 0; i < result.card.length; i++) {
                cardStr += JSON.stringify(result.card[i]) + "\n";
                cardStr += "status: ";
                if(result.available.length > i) {
                    if(JSON.stringify(result.available[i]).includes("Motta Varsel")) {
                        cardStr += "not available \n";
                        cardStr += "\n";
                    } else if(JSON.stringify(result.available[i]).includes("Ikke på lager")) {
                        cardStr += "not in stock\n";
                        //cardStr += "buy here: " + result.link[i] + "\n";
                        cardStr += "\n";
                    } else if(JSON.stringify(result.available[i]).includes("stk. på lager")) {
                        cardStr += "in stock!\n";
                        //cardStr += "buy here: " + result.link[i] + "\n";
                        cardStr += "\n";
                    }
                } else {
                    cardStr += "\n";
                    cardStr += "\n";
                }
            }
            client.channels.cache.get(config.ID).send(cardStr);
            prevStatusList = result.available;
        });
}, 1000); // 60 * 1000 milsec