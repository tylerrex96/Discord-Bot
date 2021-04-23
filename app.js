// Also requires .env file with auth tokens.
const Discord = require("discord.js");
require("dotenv").config();
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN); // initialize discord.js server
const prefix = "!"; // the trigger prefix for bot commands

// This first section is entirely working with Twitch and their API. A list of IDs for streamers is compiled, and then live-alerts enabled. (WIP)

const fs = require("fs"); // for logging to JSON files
const axios = require("axios").default; // HTTP handling

let twitchToken;
let twitchTokenResponse;
let newStreamerId;
const streamsFollowed = [];
let isDuplicate = false;

function parseFollowList() {
  fs.readFile("twitchstreamerlist.json", (error, data) => {
    if (error) {
      console.error(error);
      return;
    }
    const currentlyFollowed = JSON.parse(data).streamsFollowed;
    console.log(currentlyFollowed); // returns an Array of Objects

    currentlyFollowed.forEach((streamer) => {
      streamsFollowed.push({
        display_name: streamer.display_name,
        id: streamer.id,
      });
    });
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
            isDuplicate = true;
          } else {
            streamsFollowed.push({
              display_name: newStreamerName,
              id: newStreamerId,
            });
            let streamsJSON = JSON.stringify(streamsFollowed); // if not, add to the list
            fs.writeFile("twitchstreamerlist.json", streamsJSON, (err) => {
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
        console.log(isDuplicate);
        if (isDuplicate) {
          msg.channel.send("This streamer is already on the list!");
          break;
        } else {
          msg.channel.send(`New streamer added: ${msgSplit[1]}`);
          break;
        }

      case "liststreams":
        break;
    }
  }
});

parseFollowList();
getTwitchToken();
