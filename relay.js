// import external libary. For documentation see here: https://www.npmjs.com/package/irc
var irc = require('irc');
// set diffrent variables for irc and discord
var username = 'irc_username';
var password = 'irc_password';
var webhookurl_nc = 'discord_webhook_for_normal_and_alpha_pings_';
var webhookurl_nc_supercaps = 'discord_webhook_for_general_supercap_pings';
var webhookurl_nc_supers = 'discord_webhook_for_supercarriers';
var webhookurl_nc_titans = 'discord_webhook_for_titans';
var webhookurl_nc_blops = 'discord_webhook_for_black_ops';
var webhookurl_rest	= 'discord_webhook_for_not_matched_messages';

// define which to append to discord messages to ping @here or @everyone
var ping_modifier 			= '*@everyone*';
// name of irc bot user
var bot_name 				= "sphere";

// an empthy string to later store the last ping message for spam protecten
var last_message 			= "";

/* create a new irc client. 
    secure enforces ssl
    selfSigned accepts the ssl cert from ncdot
    stripColors remove all colors, if any are set for easier message processing
*/
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
// let the client try to connecto to irc
client.connect();
// add a listener to the client for error events and log these
// if error events are not listend the app would crash
client.addListener('error', function (message) {
    console.log('error: ', message);
});

/* add a listener to new incoming messages
  these contain 3 parts:
  from: the sending irc user name
  to: the receiving irc user or channel
  message: the message content */
client.addListener('message', function (from, to, message) {
	// log the incoming message
        console.log(from + "->" + to + ": " + message);
	// check that the message comes from the bot and is a direct message to the listing client
	// aswell checks that it is not the same message as before (thanks Vince), otherwise do nothing
        if (from == bot_name && to == username && last_message != message) {
	    // if its not equal to the last message, set the new last message to the current message
            last_message = message;
	    // split the message at every ": " to an arry
            var parts = message.split(': ');
	    // Join the array again together to fix for strings there the actual ping contans ": "
            parts[1] = parts.slice(1).join(": ");
	    // the first part, before the first ": " is then the name
            var name = parts[0].split(' ')[0];
	    // the group to which the ping was meant can be extracted with a regex
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
	    // replace underscorses with spaces as it is ingame	
            name = name.replace(/\_/g, " ");
            console.log(name);
	    // load the libary to do easy http requests
            var request = require("request");
	    // create a request to the ccp esi api search endpoint with the name as search parametes to receive the character id
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
            // fire the request and check for an error
            request(options, function (error, response, body) {
                if (error) throw new Error(error);
		// parse the returing Json response to an javascript object
                var obj = JSON.parse(body);
                console.log(body);
		// try to extract from the response the character id and generate from it the portrait image url
                try {
                    var charId = obj["character"][0];
                    var img_url = getCharUrl(charId);
                }
                catch (err) {
		    // if it doesn't succeed for whatever reason (char doesn't exist, API down) fall back to nc alliance image
                    var img_url = "https://imageserver.eveonline.com/Alliance/1727758877_128.png";
                    console.log(err)
                }
                // get current date object
                var date = new Date();
		// construct message with the main message as first part. Use "**" markdown syntax for bold 
                message = "**" + parts[1] + "**\n";
		// Add sender and target group
                message += "*From " + name + " to " + group.toLowerCase() + "*\n";
		// Add current time
                message += "*Send at " + date.toUTCString() + "*";
                console.log(message);
				
				
		// check if the groupname is in the array (index of the element would be larger then -1; 0 for first element; 
		// 1 for second and so on)
		// If matched call the sendPing function with all needed variables
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
					// fallback function if non of the above matched
					sendPing(message + "\n" + ping_modifier, webhookurl_rest, img_url, name, false);
				}
				
            });
        }
    }
);

// function to send the Ping to the specified webhook
// text: The message content
// webhook: discord webhook url
// url: image url to be shown next to message
// name: the name to be shown above the message
// tts: use text-to-speach (it's funny)
function sendPing(text, webhook, url, name, tts) {
    var request = require("request");
	// prepare a post request to the webhook url and add all required data to the form 
	// https://discordapp.com/developers/docs/resources/webhook
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
	// fire the request and check for errors
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

// just return the url with the charId embedded for the character portrait
function getCharUrl(charId) {
    return "https://imageserver.eveonline.com/Character/" + charId + "_128.jpg";
}
