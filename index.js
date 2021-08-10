const { Client, Message, MessageEmbed, Collection } = require("discord.js");
const colors = require("colors");
const fs = require("fs");
const config = require("./config/config.json");
const client = new Client({
  messageCacheLifetime: 60,
  fetchAllMembers: false,
  messageCacheMaxSize: 10,
  restTimeOffset: 0,
  restWsBridgetimeout: 100,
  shards: "auto",
  allowedMentions: {
    parse: ["roles", "users", "everyone"],
    repliedUser: true,
  },
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  intents: [
    "GUILDS",
    "GUILD_MEMBERS",
    "GUILD_BANS",
    "GUILD_EMOJIS_AND_STICKERS",
    "GUILD_MESSAGE_REACTIONS",
    "GUILD_MESSAGES",
  ],
});


module.exports = client;

const db = require("./utils/ReconDB");
client.db = db;
// MongoDB
const mongoose = require("mongoose");
mongoose
  .connect(config.mongooseConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(console.log("MongoDB Conneted.."));

const ee = require("./config/embed.json");
const prefix = config.prefix;
const token = config.token;
// Global Variables
client.commands = new Collection();
client.aliases = new Collection();
client.events = new Collection();
client.cooldowns = new Collection();
client.slashCommands = new Collection();
client.categories = fs.readdirSync("./commands/");

// Initialise discord giveaways
const { GiveawaysManager } = require("npg-discord-giveaways");
client.giveawaysManager = new GiveawaysManager(client, {
  updateCountdownEvery: 3000,
  default: {
    botsCanWin: false,
    embedColor: "#FF0000",
    reaction: "🎉"
  }
});

client.giveawaysManager.on(
  "giveawayReactionAdded",
  async (giveaway, reactor, messageReaction) => {
    if (reactor.user.bot) return;
    try {
      if(giveaway.extraData){
      await client.guilds.cache.get(giveaway.extraData.server).members.fetch(reactor.id)
      }
      reactor.send(
        new Discord.MessageEmbed()
          .setTimestamp()
          .setTitle("Entery Approved! | You have a chance to win!!")
          .setDescription(
            `Your entery to [This Giveaway](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}) has been approved!`
          )
          .setFooter("Npg op!")
          .setTimestamp()
      );
    } catch (error) {
       const guildx = client.guilds.cache.get(giveaway.extraData.server)
      messageReaction.users.remove(reactor.user);
      reactor.send( new Discord.MessageEmbed()
          .setTimestamp()
          .setTitle(":x: Entery Denied | Databse Entery Not Found & Returned!")
          .setDescription(
            `Your entery to [This Giveaway](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}) has been denied as you did not join **${guildx.name}**`
          )
          .setFooter("Npg op!")
      );
    }
  }
);
// Check if user reacts on an ended giveaway
client.giveawaysManager.on('endedGiveawayReactionAdded', (giveaway, member, reaction) => {
     reaction.users.remove(member.user);
     member.send(`**Aw snap! Looks Like that giveaway has already ended!**`)

});
// Dm our winners
client.giveawaysManager.on('giveawayEnded', (giveaway, winners) => {
     winners.forEach((member) => {
         member.send(new Discord.MessageEmbed()
         .setTitle(`🎁 Let's goo!`)
         .setDescription(`Hello there ${member.user}\n I heard that you have won **[[This Giveaway]](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID})**\n Good Job On Winning **${giveaway.prize}!**\nDirect Message the host to claim your prize!!`)
         .setTimestamp()
         .setFooter(member.user.username, member.user.displayAvatarURL())
         );
     });
});
// Dm Rerolled winners
client.giveawaysManager.on('giveawayRerolled', (giveaway, winners) => {
     winners.forEach((member) => {
         member.send(new Discord.MessageEmbed()
         .setTitle(`🎁 Let's goo! We Have A New Winner`)
         .setDescription(`Hello there ${member.user}\n I heard that the host rerolled and you have won **[[This Giveaway]](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID})**\n Good Job On Winning **${giveaway.prize}!**\nDirect Message the host to claim your prize!!`)
         .setTimestamp()
         .setFooter(member.user.username, member.user.displayAvatarURL())
         );
     });
});
// When They Remove Reaction
client.giveawaysManager.on('giveawayReactionRemoved', (giveaway, member, reaction) => {
     return member.send( new Discord.MessageEmbed()
          .setTimestamp()
          .setTitle('❓ Hold Up Did You Just Remove a Reaction From A Giveaway?')
          .setDescription(
            `Your entery to [This Giveaway](https://discord.com/channels/${giveaway.guildID}/${giveaway.channelID}/${giveaway.messageID}) was recorded but you un-reacted, since you don't need **${giveaway.prize}** I would have to choose someone else 😭`
          )
          .setFooter("Think It was a mistake? Go react again!")
      );
});

client.commands = new Collection();
client.aliases = new Collection();
client.events = new Collection();
client.cooldowns = new Collection();
client.slashCommands = new Collection();
client.categories = fs.readdirSync("./commands/");

["command"].forEach((handler) => {
  require(`./handler/${handler}`)(client);
});

client.login(token);