const Discord = require("discord.js");
require("dotenv").config();
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN); // initialize discord.js server

const fs = require("fs"); // for logging to txt files
const axios = require("axios").default; // HTTP handling

let twitchToken;
let twitchTokenResponse;
let newStreamerName = "pokimane";
let newStreamerId;

function getTwitchToken() {
  axios
    .post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    )
    .then(function (response) {
      twitchTokenResponse = response.data;
      twitchToken = "Bearer " + twitchTokenResponse.access_token;
      console.log(twitchToken);
    })
    .catch(function (error) {
      console.error(`Error obtaining Twitch access token: ${error}`);
    });
}

function getStreamerId() {
  axios
    .get(`https://api.twitch.tv/helix/search/channels?query=${newStreamerName}`)
    .then(function (response) {
      search = response.data;
      for (let i = 0; i < search.data.length; i++) {
        if (search.data[i].display_name.toUpperCase() == newStreamerName) {
          newStreamerId = search.data[i].id;
          fs.appendFile(twitchstreamerlist.txt, newStreamerId);
        }
      }
    })
    .catch(function (error) {
      console.error(`Error adding new Twitch streamer to follow: ${error}`);
    });
}

// async function getStreamerId() {
//   let xhr = new XMLHttpRequest();
//   xhr.setRequestHeader("Authorization", twitchToken);
//   xhr.setRequestHeader("Client-Id", env.TWITCH_CLIENT_ID);
//   console.log("I'm working 2");
//   xhr.open(
//     "GET",
//     `https://api.twitch.tv/helix/search/channels?query=${newStreamerName}`,
//     true
//   );
//   if (xhr.readyState === 4) {
//     console.log("Im working 1");
//     search = JSON.parse(xhr.responseText);
//     for (let i = 0; i < search.data.length; i++) {
//       if (search.data[i].display_name.toUpperCase() == newStreamerName) {
//         newStreamerId = search.data[i].id;
//         fs.appendFile(twitchstreamerlist.txt, newStreamerId); // on getting the ID, store to log
//       }
//     }
//   }
// }

getTwitchToken();
getStreamerId();
