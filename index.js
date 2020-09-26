const Discord = require("discord.js");
const config = require("./config.json");
const menu = require("./menu.json");
const client = new Discord.Client();
const Jikan = require('jikan-node');
const mal = new Jikan();

client.login(config.BOT_TOKEN);

const prefix = "m! ";

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("In construction | m! help");
});


client.on("message", async msg => {
    if (msg.content === "oh Malbot you're so cute") msg.reply("You too, UwU :heart:");
    if (msg.author.bot || !msg.content.startsWith(prefix)) return;
    const command = msg.content.slice(prefix.length).trim().toLowerCase();

    if (command === "help") {
        try {
            var current_page_number = 1;
            msg.channel.send("MAL-Bot commands:");
            // New Embed
            var help_msg = new Discord.MessageEmbed();
            help_msg.setFooter(`Requested by ${msg.member.nickname!=null? msg.member.nickname:msg.author.username}`, msg.author.displayAvatarURL({
                format: "png",
                dynamic: true
            }));
            help_msg.setColor("#2a50a3");
            help_msg.setTitle(`**Page ${current_page_number}/${String(Math.ceil(menu[0].length/5))}**`);
            help_msg.setThumbnail('https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ');
            help_msg.setTimestamp();
            help_msg.setDescription(loadPage(menu[0], current_page_number));
            // Sending Embed
            var menu_msg = await msg.channel.send(help_msg);
            for (var emoji of ['◀', '▶']) await menu_msg.react(emoji);

            const lFilter = (reaction, user) => reaction.emoji.name === '◀' && current_page_number > 1 && user.id === msg.author.id;
            const lCollector = menu_msg.createReactionCollector(lFilter, {
                time: 300000
            });

            lCollector.on('collect', async () => {
                removeReaction(menu_msg, msg);
                current_page_number--;
                help_msg.setDescription(loadPage(menu[0], current_page_number));
                help_msg.setTitle(`**Page ${current_page_number}/${String(Math.ceil(menu[0].length/5))}**`);
                menu_msg.edit(help_msg);
            });

            const rFilter = (reaction, user) => reaction.emoji.name === '▶' && current_page_number < Math.ceil(menu[0].length / 5) && user.id === msg.author.id;
            const rCollector = menu_msg.createReactionCollector(rFilter, {
                time: 300000
            });

            rCollector.on('collect', async () => {
                removeReaction(menu_msg, msg);
                current_page_number++;
                help_msg.setDescription(loadPage(menu[0], current_page_number));
                help_msg.setTitle(`**Page ${current_page_number}/${String(Math.ceil(menu[0].length/5))}**`);
                menu_msg.edit(help_msg);
            });


        } catch (error) {
            console.log(error);
        }

    } else if (command === "ping") {
        msg.channel.send(`**${msg.member.nickname}**: Pong! This message had a latency of ${Date.now() - msg.createdTimestamp}ms.`);
    } else if (command === "about") {
        msg.channel.send("Hello **" + msg.member.nickname + "**! I'm MAL-Bot and I display information from My AnimeList using the Jikan(時間) API");
        msg.channel.send("You can find me here: <https://github.com/mrblacklicorice/MAL-Bot/blob/master/README.md>");
    } else if (command.split(" ")[0] === "help") {
        try {
            if(menu[1][command.split(" ")[1]]) msg.channel.send(`${"```"}${menu[1][command.split(" ")[1]]}${"```"}`);
        } catch (error) {
            msg.channel.send(error);
        }
    }else{
        try {
            var results;
            var commands = [];
            for(item of command.split(" ")) if(item != "") commands.push(item);

            if(commands[0] === "anime"){
                results = await mal.findAnime(parseInt(commands[1]));
            }else{
                msg.channel.send(`**${msg.member.nickname}**: Incorrect command`);
            }
        } catch (error) {
            msg.channel.send(`**${msg.member.nickname}**: ${error}`);
        }
    }
});

function loadPage(content, pg_number) {
    var string = "";
    for (let i = 0; i < 5; i++) {
        if (content[((pg_number - 1) * 5) + i] != undefined) {
            string += `${"`"}${content[((pg_number-1)*5)+i].name}${"`"} - ${content[((pg_number-1)*5)+i].value}\n`;
        }
    }
    return string.substr(0,string.length-1);
}

const removeReaction = async (embed_msg, msg) => {
    const userReactions = embed_msg.reactions.cache.filter(reaction => reaction.users.cache.has(msg.author.id));
    try {
        for (const reaction of userReactions.values()) {
            await reaction.users.remove(msg.author.id);
        }
    } catch (error) {
        console.error('Failed to remove reactions.');
    }
}


