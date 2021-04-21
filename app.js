const Discord = require("discord.js");
require("dotenv").config();
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN); // initialize discord.js server

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest; // for API http requests

const fs = require("fs"); // for logging to txt files

let twitchToken;
let newStreamerName = "pokimane";
let newStreamerId;

function getTwitchToken() {
  let xhr = new XMLHttpRequest();
  xhr.open(
    "POST",
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
    true
  );

  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        let twitchTokenResponse = JSON.parse(xhr.responseText);
        twitchToken = "Bearer " + twitchTokenResponse.access_token;
        console.log(twitchToken);
        getStreamerId();
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);
}

function getStreamerId() {
  xhr = new XMLHttpRequest();
  if (xhr.readyState === 4) {
    xhr.setRequestHeader("Authorization", twitchToken);
    xhr.setRequestHeader("Client-Id", process.env.TWITCH_CLIENT_ID);
    xhr.open(
      "GET",
      `https://api.twitch.tv/helix/search/channels?query=${newStreamerName}`,
      true
    );
    search = JSON.parse(xhr.responseText);
    for (let i = 0; i < search.data.length; i++) {
      if (search.data[i].display_name.toUpperCase() == newStreamerName) {
        newStreamerId = search.data[i].id;
        fs.appendFile(twitchstreamerlist.txt, newStreamerId); // on getting the ID, store to log
      }
    }
  }
}

getTwitchToken();
