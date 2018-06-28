var irc = require('irc');

var username = 'irc_username';
var password = 'irc_password';
var webhookurl_nc = 'discord_webhook_for_normal_and_alpha_pings_';
var webhookurl_nc_supercaps = 'discord_webhook_for_general_supercap_pings';
var webhookurl_nc_supers = 'discord_webhook_for_supercarriers';
var webhookurl_nc_titans = 'discord_webhook_for_titans';
var webhookurl_nc_blops = 'discord_webhook_for_black_ops';
var webhookurl_rest	= 'discord_webhook_for_not_matched_messages';

var ping_modifier 			= '*@everyone*';
var bot_name 				= "sphere";

var last_message 			= "";


var client = new irc.Client('irc.ncdot.co.uk', username, {
    userName: username,
    port: 6666,
    realName: username,
    password: password,
    secure: true,
    selfSigned: true,
    autoConnect: false,
    debug: false,
    stripColors: true,
	//encoding: 'UTF-8'
});
client.connect();
client.addListener('error', function (message) {
    console.log('error: ', message);
});

client.addListener('message', function (from, to, message) {
        console.log(from + "->" + to + ": " + message);
        if (from == bot_name && to == username && last_message != message) {
            last_message = message;
            var parts = message.split(': ');
            parts[1] = parts.slice(1).join(": ");
            var name = parts[0].split(' ')[0];
            var group = parts[0].split(' ')[1].replace(/]|\[/gi, "");
            console.log(group);
            if (name == "CCP_KenZoku") {
                /* name_old = name;
                 message_old = parts[1];
                 try {
                 name = parts[1].split(': ')[0];
                 parts[1] = parts[1].split(': ').slice(1).join(": ");
                 } catch (e) {
                 name = name_old;
                 parts[1] = message_old;
                 } */
            }

            name = name.replace(/\_/g, " ");
            console.log(name);
            var request = require("request");
            var options = {
                method: 'GET',
                url: 'https://esi.tech.ccp.is/latest/search/',
                qs: {
                    categories: 'character',
                    datasource: 'tranquility',
                    language: 'en-us',
                    search: name,
                    strict: 'true'
                }
            };

            request(options, function (error, response, body) {
                if (error) throw new Error(error);
                var obj = JSON.parse(body);
                console.log(body);
                try {
                    var charId = obj["character"][0];
                    var img_url = getCharUrl(charId);
                }
                catch (err) {
                    var img_url = "https://imageserver.eveonline.com/Alliance/1727758877_128.png";
                    console.log(err)
                }
                var date = new Date();
                message = "**" + parts[1] + "**\n";
                message += "*From " + name + " to " + group.toLowerCase() + "*\n";
                message += "*Send at " + date.toUTCString() + "*";
                console.log(message);
				
				
				
                if (["nc", "alphas"].indexOf(group.toLowerCase()) > -1) {
                    sendPing(message + "\n" + ping_modifier, webhookurl_nc, img_url, name, false);
                }
                else if (['supers'].indexOf(group.toLowerCase()) > -1) {
                    sendPing(message + "\n" + ping_modifier, webhookurl_nc_supers, img_url, name, false);
                }
                else if (['titans'].indexOf(group.toLowerCase()) > -1) {
                    sendPing(message + "\n" + ping_modifier, webhookurl_nc_titans, img_url, name, false);
                }
                else if (['supercaps'].indexOf(group.toLowerCase()) > -1) {
                    sendPing(message + "\n" + ping_modifier, webhookurl_nc_supercaps, img_url, name, false);
                }
                else if (['blackops'].indexOf(group.toLowerCase()) > -1) {
                    sendPing(message + "\n" + ping_modifier, webhookurl_nc_blops, img_url, name, false);
                }
				else {
					sendPing(message + "\n" + ping_modifier, webhookurl_rest, img_url, name, false);
				}
				
            });
        }
    }
);

function sendPing(text, webhook, url, name, tts) {
    var request = require("request");
    var options = {
        method: 'POST',
        url: webhook,
        headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded'
        },
        form: {
            content: text,
            username: name,
            avatar_url: url,
            tts: tts
        }
    };
    request(options, function (error, response, body) {
        if (error)
		{
			console.log(error);
		}
		if (response.statusCode != 204)
		{
			console.log("Error while sending:")
			console.log(error)
			console.log(response)
			console.log(body)			
		}		
        console.log(body);
    });
}

function getCharUrl(charId) {
    return "https://imageserver.eveonline.com/Character/" + charId + "_128.jpg";
}