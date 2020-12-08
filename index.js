const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

var fetch = require("node-fetch");
var htmlToJson = require("html-to-json");
var fs = require('fs');
const { type } = require('os');

var prefix = "!";

var previousMessage;

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
            'link': ['div .product-list-item', function ($a) {
                return $a.attr('href');
            }]
        }, function (err, result) {
            //console.log(result);
            fs.writeFile("test.txt", JSON.stringify(result), function (err) {
                if (err) {
                    console.log(err);
                }
            });
            var cardStr = "\n *Currently listed cards: *\n\n";
            for (let i = 0; i < result.card.length; i++) {
                cardStr += JSON.stringify(result.card[i]) + "\n";
                cardStr += "status: ";
                if (result.available.length > i) {
                    if (JSON.stringify(result.available[i]).includes("Motta Varsel")) {
                        cardStr += "not available \n";
                        cardStr += "\n";
                    } else if (JSON.stringify(result.available[i]).includes("Ikke på lager")) {
                        cardStr += "not in stock\n";
                        //cardStr += "buy here: " + result.link[i] + "\n";
                        cardStr += "\n";
                    } else if (JSON.stringify(result.available[i]).includes("stk. på lager")) {
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
        if (JSON.stringify(prevStatusList[i]) != JSON.stringify(result.available[i])) {
            return true;
        }
    }
    return false;
}

function addZero(i) {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  }

setInterval(function () {
    var komplett = htmlToJson.request('https://www.komplett.no/search?q=rtx%2030&stockStatus=InStock&sort=titleSort%3AASCENDING&nlevel=10000%C2%A728003%C2%A710412', {
        'card': ['h2', function ($h) {
            return $h.text();
        }],
        'available': ['div .product-list-item', function ($d) {
            return $d.text();
        }],
        'link': ['div .product-link', function ($a) {
            return $a.attr('href');
        }]
    }, function (err, result) {
        //console.log(result);
        if (checkForUpdate(result) == false) {
            return;
        }
        fs.writeFile("test.txt", JSON.stringify(result), function (err) {
            if (err) {
                console.log(err);
            }
        });
        var links = result.link;
        let uniqueLinks = [...new Set(links)];
        console.log(uniqueLinks);
        var cardStr = "\n *Currently listed cards:* \n\n";
        for (let i = 0; i < result.card.length; i++) {
            cardStr += JSON.stringify(result.card[i]) + "\n";
            cardStr += "status: ";
            if (result.available.length > i) {
                if (JSON.stringify(result.available[i]).includes("Motta Varsel")) {
                    cardStr += "not available :clock1:  \n";
                    cardStr += "\n";
                } else if (JSON.stringify(result.available[i]).includes("Ikke på lager")) {
                    cardStr += "not in stock :warning: \n";
                    cardStr += "https://www.komplett.no/" + uniqueLinks[i] + "\n";
                    cardStr += "\n";
                } else if (JSON.stringify(result.available[i]).includes("stk. på lager")) {
                    var stkIndex = JSON.stringify(result.available[i]).indexOf("stk. på lager");
                    cardStr += "in stock! :white_check_mark: Cards Left: " + JSON.stringify(result.available[i]).substring(stkIndex - 3, stkIndex - 1) + "\n";
                    cardStr += "https://www.komplett.no/" + uniqueLinks[i] + "\n";
                    cardStr += "\n";
                }
            } else {
                cardStr += "\n";
                cardStr += "\n";
            }
        }

        cardStr += "**What do these symbols mean?**\n";
        cardStr += ":clock1: The card is listed, but is not available for purchase  (yet) \n";
        cardStr += ":warning: The card is listed for purchase, but there is no stock left (too late or too early) \n";
        cardStr += ":white_check_mark: The card is currently in stock! \n";

        var currentdate = new Date(); 
        var datetime = "\n Last updated: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " Kl. "  
                + addZero(currentdate.getHours()) + ":" +
                + addZero(currentdate.getMinutes());

        cardStr += datetime;

        //message = new Discord.Message(client, cardStr, client.channels.cache.get("596121073867817000"));
        if(previousMessage != undefined && previousMessage != null) {
            previousMessage.delete();
        }
        client.channels.cache.get("785810248782708796").send(cardStr).then(msg => previousMessage = msg);
        prevStatusList = result.available;
    });
}, 1000); // 60 * 1000 milsec