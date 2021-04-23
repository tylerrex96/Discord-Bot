// Also requires .env file with auth tokens.
const Discord = require("discord.js");
require("dotenv").config();
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN); // initialize discord.js server
const prefix = "!"; // the trigger prefix for bot commands

// This first section is entirely working with Twitch and their API. A list of IDs for streamers is compiled, and then live-alerts enabled. (WIP)

const fs = require("fs"); // for logging to txt files
const axios = require("axios").default; // HTTP handling

let twitchToken;
let twitchTokenResponse;
let newStreamerId;
let streamsFollowed = [];

function parseFollowList() {
  fs.readFile("twitchstreamerlist.txt", "utf8", (error, data) => {
    if (error) {
      console.error(error);
      return;
    }
    streamsFollowed = JSON.parse(data);
    console.log(streamsFollowed);
  });
}

function getTwitchToken() {
  axios
    .post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
    )
    .then(function (response) {
      twitchTokenResponse = response.data;
      twitchToken = "Bearer " + twitchTokenResponse.access_token;
      getStreamerId();
      return twitchToken;
    })
    .catch(function (error) {
      console.error(`Error obtaining Twitch access token: ${error}`);
    });
}

function getStreamerId(newStreamerName) {
  axios // Request streamer info by name
    .get(
      `https://api.twitch.tv/helix/search/channels?query=${newStreamerName}`,
      {
        headers: {
          // prettier-ignore
          "Authorization": twitchToken,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
      }
    )
    .then(function (response) {
      // Get the streamer ID number
      search = response.data;
      for (let i = 0; i < search.data.length; i++) {
        if (search.data[i].display_name == newStreamerName) {
          newStreamerId = search.data[i].id;
          if (streamsFollowed.includes(newStreamerId)) {
            // see if this ID is a duplicate
            console.log("Already following this streamer, aborted");
          } else {
            streamsFollowed.push(newStreamerId);
            let streamsJSON = JSON.stringify(streamsFollowed); // if not, add to the list
            fs.writeFile("twitchstreamerlist.txt", streamsJSON, (err) => {
              if (err) throw err;
              console.log("New streamer added to the list!");
            });
          }
        }
      }
    })
    .catch(function (error) {
      console.error(`Error adding new Twitch streamer to follow: ${error}`);
    });
}

// Defining bot commands and interactions
client.on("message", (msg) => {
  if (msg.content.startsWith(prefix)) {
    const msgBody = msg.content.slice(prefix.length);
    const msgSplit = msgBody.split(" ");
    switch (msgSplit[0]) {
      case "newstreamer": // Adds a new streamer to the follow list
        getStreamerId(msgSplit[1]);
        msg.channel.send(`New streamer added: ${msgSplit[1]}`);
        break;
      case "liststreams":
        break;
    }
  }
});

parseFollowList();
getTwitchToken();
