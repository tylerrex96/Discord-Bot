// Also requires .env file with auth tokens.
const Discord = require("discord.js");
require("dotenv").config();
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN); // initialize discord.js server
var channel;
client.once("ready", () => {
  channel = client.channels.cache.get("773286118753828914");
});

const prefix = "!"; // the trigger prefix for bot commands

// This first section is entirely working with Twitch and their API. A list of IDs for streamers is compiled, and then live-alerts enabled. (WIP)

const fs = require("fs"); // for logging to JSON files
const axios = require("axios").default; // HTTP handling

let twitchToken;
let twitchTokenResponse;
let streamsFollowed = [];
let streamsFollowedNames;

function parseFollowList() {
  fs.readFile("twitchstreamerlist.json", (error, data) => {
    if (error) {
      console.error(error);
      return;
    }
    const currentlyFollowed = JSON.parse(data).streamsFollowed; // returns an Array of Objects
    currentlyFollowed.forEach((streamer) => {
      streamsFollowed.push({
        display_name: streamer.display_name,
        id: streamer.id,
        is_live: false,
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
      let foundStream = parseStreams(response.data, newStreamerName);
      if (foundStream != null) {
        streamsFollowed.push({
          display_name: foundStream.display_name,
          id: foundStream.id,
          is_live: false,
        });
        const streamsJSON = JSON.stringify({
          streamsFollowed,
        });
        fs.writeFile("twitchstreamerlist.json", streamsJSON, (error) => {
          if (error) throw error;
        });
      }
    })
    .catch(function (error) {
      console.error(`Error adding new Twitch streamer to follow: ${error}`);
    });
}

// for sorting through the JSON data that Twitch responds with on search
function parseStreams(streams, newStreamerName) {
  return streams.data.find(
    (stream) =>
      stream.display_name.toUpperCase() === newStreamerName.toUpperCase()
  );
}

async function twitchLiveNotifications() {
  // tracks a value for is_live and compares it to the current stat, for checking if streamers are live
  streamsFollowed.forEach((streamer) => {
    axios
      .get(
        `https://api.twitch.tv/helix/search/channels?query=${streamer.display_name}`,
        {
          headers: {
            // prettier-ignore
            "Authorization": twitchToken,
            "Client-Id": process.env.TWITCH_CLIENT_ID,
          },
        }
      )
      .then(function (response) {
        let foundStream = parseStreams(response.data, streamer.display_name);
        if (foundStream != null) {
          if (foundStream.is_live == true && streamer.is_live == false) {
            streamer.is_live = true;
            channel.send(
              `${streamer.display_name} is currently live playing ${foundStream.game_name} at https://twitch.tv/${streamer.display_name}!`
            );
          } else if (
            streamer.is_live == false &&
            streamsFollowed.is_live == true
          ) {
            streamer.is_live = false;
          } else {
            return;
          }
        }
      })
      .catch(function (error) {
        console.error(`Error checking on currently live streams: ${error}`);
      });
  });
}

function removeStreamer(streamerRemoved) {
  streamsFollowed = streamsFollowed.filter(function (streamer) {
    return (
      streamer.display_name.toUpperCase() !== streamerRemoved.toUpperCase()
    );
  });
  const streamsJSON = JSON.stringify({ streamsFollowed });
  fs.writeFile("twitchstreamerlist.json", streamsJSON, (error) => {
    if (error) throw error;
  });
}

// Defining bot commands and interactions
client.on("message", (msg) => {
  if (msg.content.startsWith(prefix)) {
    const msgBody = msg.content.slice(prefix.length);
    const msgSplit = msgBody.split(" ");
    switch (msgSplit[0]) {
      case "newstreamer": // Adds a new streamer to the follow list
        streamsFollowedNames = [];
        streamsFollowed.forEach((streamer) => {
          streamsFollowedNames.push(streamer.display_name); // maybe make this to a function later
        });
        if (streamsFollowedNames.includes(msgSplit[1])) {
          msg.channel.send("This streamer is already on the list!");
          break;
        } else {
          msg.channel.send(`New streamer added: ${msgSplit[1]}`);
          getStreamerId(msgSplit[1]);
          break;
        }
      case "liststreams": // list the names of all channels currently being followed
        streamsFollowedNames = [];
        streamsFollowed.forEach((streamer) => {
          streamsFollowedNames.push(streamer.display_name);
        });
        msg.channel.send(
          `Streams currently being followed: ${streamsFollowedNames.join(
            ", "
          )}.`
        );
        break;
      case "unfollow":
        removeStreamer(msgSplit[1]);
        msg.channel.send(`No longer following ${msgSplit[1]}`);
        break;
      case "commands":
        msg.channel.send(
          "Currently available commands: !newstreamer, !liststreams, !commands, !unfollow."
        );
        break;
      default:
        msg.channel.send("Sorry! Didn't recognize that command.");
    }
  }
});

parseFollowList();
getTwitchToken();
setInterval(function () {
  twitchLiveNotifications();
}, 10000);
