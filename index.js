const Discord = require("discord.js");
const config = require("./config.json");
const menu = require("./menu.json");
const client = new Discord.Client();
const Jikan = require('jikan-node');
const mal = new Jikan();
const fetch = require('cross-fetch');
const URL = require('url').URL;

client.login(config.BOT_TOKEN);

const prefix = "m! ";

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("m! help");
});


client.on("message", async msg => {
    msg.content = (msg.content).toLowerCase();
    if (msg.content === "oh malbot you're so cute") msg.reply("You too, UwU :heart:");
    if (msg.author.bot || !msg.content.startsWith(prefix)) return;
    const command = msg.content.slice(prefix.length).trim();

    if (command === "help") {
        try {
            var current_page_number = 1;
            msg.channel.send("MAL-Bot commands:");
            // New Embed
            var help_msg = new Discord.MessageEmbed();
            help_msg.setFooter(`Requested by ${msg.member.nickname != null ? msg.member.nickname : msg.author.username}`, msg.author.displayAvatarURL({
                format: "png",
                dynamic: true
            }));
            help_msg.setColor("#2a50a3");
            help_msg.setTitle(`**Page ${current_page_number}/${String(Math.ceil(menu[0].length / 5))}**`);
            help_msg.setThumbnail('https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ');
            help_msg.setTimestamp();
            help_msg.setDescription(loadPage(menu[0], current_page_number));
            // Sending Embed
            var menu_msg = await msg.channel.send(help_msg);
            for (var emoji of ['◀', '▶']) await menu_msg.react(emoji);

            const lFilter = (reaction, user) => reaction.emoji.name === '◀' && current_page_number > 1;
            const lCollector = menu_msg.createReactionCollector(lFilter, {
                time: 300000
            });

            lCollector.on('collect', async () => {
                removeReaction(menu_msg, msg);
                current_page_number--;
                help_msg.setDescription(loadPage(menu[0], current_page_number));
                help_msg.setTitle(`**Page ${current_page_number}/${String(Math.ceil(menu[0].length / 5))}**`);
                menu_msg.edit(help_msg);
            });

            const rFilter = (reaction, user) => reaction.emoji.name === '▶' && current_page_number < Math.ceil(menu[0].length / 5);
            const rCollector = menu_msg.createReactionCollector(rFilter, {
                time: 300000
            });

            rCollector.on('collect', async () => {
                removeReaction(menu_msg, msg);
                current_page_number++;
                help_msg.setDescription(loadPage(menu[0], current_page_number));
                help_msg.setTitle(`**Page ${current_page_number}/${String(Math.ceil(menu[0].length / 5))}**`);
                menu_msg.edit(help_msg);
            });


        } catch (error) {
            console.log(error);
        }

    } else if (command === "ping") {
        msg.channel.send(`**${msg.member.nickname ? msg.member.nickname : msg.author.username}**: Pong! This message had a latency of ${Date.now() - msg.createdTimestamp}ms.`);
    } else if (command === "about") {
        msg.channel.send("Hello **" + msg.member.nickname + "**! I'm MAL-Bot and I display information from My AnimeList using the Jikan(時間) API");
        msg.channel.send("You can find me here: <https://github.com/mrblacklicorice/MAL-Bot/blob/master/README.md>");
    } else if (command.split(" ")[0] === "help") {
        try {
            if (menu[1][command.split(" ")[1]]) msg.channel.send(`${"```"}${menu[1][command.split(" ")[1]]}${"```"}`);
        } catch (error) {
            msg.channel.send(error);
        }
    } else {
        try {
            var commands = [];
            for (item of command.split(" ")) if (item != "") commands.push(item);

            if (commands[0] == "anime" || commands[0] == "manga" || commands[0] == "character" || commands[0] == "person") {
                if (String(parseInt(commands[1])) == commands[1]) {
                    if (commands[0] === "anime") msg.channel.send(anime(await mal.findAnime(parseInt(commands[1])), true));
                    else if (commands[0] === "manga") msg.channel.send(manga(await mal.findManga(parseInt(commands[1])), true));
                    else if (commands[0] === "character") msg.channel.send(character(await mal.findCharacter(parseInt(commands[1])), true));
                    else if (commands[0] === "person") msg.channel.send(person(await mal.findPerson(parseInt(commands[1])), true));
                } else {
                    search(([""]).concat(commands), msg);
                }
            } else if (commands[0] == "a" || commands[0] == "m" || commands[0] == "c" || commands[0] == "p") {
                if (String(parseInt(commands[1])) == commands[1]) {
                    if (commands[0] === "a") msg.channel.send(anime(await mal.findAnime(parseInt(commands[1])), false));
                    else if (commands[0] === "m") msg.channel.send(manga(await mal.findManga(parseInt(commands[1])), false));
                    else if (commands[0] === "c") msg.channel.send(character(await mal.findCharacter(parseInt(commands[1])), false));
                    else if (commands[0] === "p") msg.channel.send(person(await mal.findPerson(parseInt(commands[1])), false));
                } else {
                    search(([""]).concat(commands), msg);
                }
            } else {
                if (commands[0] === "search") search(commands, msg);
                else if (commands[0] === "top") top(commands, msg);
                else if (commands[0] === "season") season(commands, msg);
                else if (commands[0] === "genre") genre(commands, msg);
            }
        } catch (error) {
            msg.channel.send(`**${msg.member.nickname ? msg.member.nickname : msg.author.username}**: ${error}`);
        }
    }
});

function loadPage(content, pg_number) {
    var arr = new Array(5);
    for (let i = 0; i < 5; i++) {
        if (content[((pg_number - 1) * 5) + i] != undefined) {
            arr[i] = `${"`"}${content[((pg_number - 1) * 5) + i].name}${"`"} - ${content[((pg_number - 1) * 5) + i].value}`;
        }
    }
    return arr.join("\n\n");
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

function anime(results, long) {
    var reply = new Discord.MessageEmbed();
    reply.setColor("#2a50a3");
    if (results.url != null) reply.setURL(results.url);
    if (results.image_url != null) reply.setThumbnail(results.image_url);
    if (results.synopsis != null && results.synopsis.length > 2048) results.synopsis = results.synopsis.slice(0, 2045) + "...";
    if (results.synopsis != null) reply.setDescription(results.synopsis.replace(/\\n/g, ''));


    for (const key in results) {
        if (results.hasOwnProperty(key) && typeof results[key] == "string") {
            if (results[key].length > 1024) results[key] = results[key].slice(0, 1021) + "...";
        }
    }

    var temp_array = [];
    if (long) if (results.title_english != null && results.title_english != results.title) temp_array.push(results.title_english);
    if (long) if (results.title_japanese != null && results.title_japanese != results.title) temp_array.push(results.title_japanese);
    reply.setTitle(`${results.title} (${results.mal_id})${temp_array.length > 0 ? ` || ${temp_array.join(", ")}` : ""}`);

    temp_array = [];
    if (results.rank != null) temp_array.push("Rank: #" + results.rank);
    if (results.score != null) temp_array.push("Score: " + results.score);
    if (results.popularity != null) temp_array.push("Popularity: #" + results.popularity);
    reply.setAuthor(temp_array.join(" | "));

    var genre_arr = [];
    for (var item of results.genres) genre_arr.push(item.name);

    var temp_array = [];

    if (long) {
        if (results.aired.string != null && results.broadcast != null) {
            temp_array.push(results.aired.string + " | " + results.broadcast);
        } else {
            if (results.aired.string != null) temp_array.push(results.aired.string);
            if (results.broadcast != null) temp_array.push(results.broadcast);
        }
    }

    if (results.status != null && genre_arr.length > 0) {
        temp_array.push("Status: " + results.status + " | Genres: " + genre_arr.join(", "));
    } else {
        if (results.status != null) temp_array.push("Status: " + results.status);
        if (genre_arr.length != 0) temp_array.push("Genres: " + genre_arr.join(", "));
    }

    reply.setFooter(temp_array.join("\n"));

    // attributes
    if (long) if (results.rating != null) reply.addField("Rating", results.rating, true);
    if (long) if (results.type != null) reply.addField("Type", results.type, true);
    if (long) if (results.trailer_url != null) reply.addField("Trailer", `[Click Here](${results.trailer_url})`, true);
    if (long) if (results.episodes != null) reply.addField("Episodes", results.episodes, true);
    if (long) if (results.duration != null) reply.addField("Episode Length", results.duration, true);
    if (long) if (results.premiered != null) reply.addField("Season", results.premiered, true);
    if (long) if (results.opening_themes.length > 0) reply.addField("Opening(s)", results.opening_themes.join("\n"));
    if (long) if (results.ending_themes.length > 0) reply.addField("Ending(s)", results.ending_themes.join("\n"));

    return reply;
}

function manga(results, long) {
    var reply = new Discord.MessageEmbed();
    reply.setColor("#2a50a3");
    if (results.url != null) reply.setURL(results.url);
    if (results.image_url != null) reply.setThumbnail(results.image_url);
    if (results.synopsis != null && results.synopsis.length > 2048) results.synopsis = results.synopsis.slice(0, 2045) + "...";
    if (results.synopsis != null) reply.setDescription(results.synopsis.replace(/\\n/g, ''));

    for (const key in results) {
        if (results.hasOwnProperty(key) && typeof results[key] == "string") {
            if (results[key].length > 1024) results[key] = results[key].slice(0, 1021) + "...";
        }
    }

    var temp_array = [];
    if (long) if (results.title_english != null && results.title_english != results.title) temp_array.push(results.title_english);
    if (long) if (results.title_japanese != null && results.title_japanese != results.title) temp_array.push(results.title_japanese);
    reply.setTitle(`${results.title} (${results.mal_id})${temp_array.length > 0 ? ` || ${temp_array.join(", ")}` : ""}`);

    temp_array = [];
    if (results.rank != null) temp_array.push("Rank: #" + results.rank);
    if (results.score != null) temp_array.push("Score: " + results.score);
    if (results.popularity != null) temp_array.push("Popularity: #" + results.popularity);
    reply.setAuthor(temp_array.join(" | "));

    var genre_arr = [];
    for (var item of results.genres) genre_arr.push(item.name);

    var temp_array = [];
    if (long) {
        if (results.published.string != null && results.status != null) {
            temp_array.push(results.published.string + " | Status: " + results.status);
        } else {
            if (results.published.string != null) temp_array.push(results.published.string);
            if (results.status != null) temp_array.push("Status: " + results.status);
        }
    }

    if (genre_arr.length != 0) temp_array.push("Genres: " + genre_arr.join(", "));
    reply.setFooter(temp_array.join("\n"));

    // attributes
    if (long) if (results.type != null) reply.addField("Type", results.type, true);
    if (long) if (results.volumes != null) reply.addField("Volumes", results.volumes, true);
    if (long) if (results.chapters != null) reply.addField("Chapters", results.chapters, true);
    return reply;
}

function character(results, long) {
    var reply = new Discord.MessageEmbed();
    reply.setColor("#2a50a3");
    reply.setTitle(`${results.name} (${results.mal_id})${(results.name_kanji != null) ? " || " + results.name_kanji : ""}`);
    if (results.url != null) reply.setURL(results.url);
    if (results.image_url != null) reply.setThumbnail(results.image_url);
    reply.setAuthor(`${results.member_favorites != null ? "Favorites : #" + results.member_favorites : ""}`);
    if (results.about != null && results.about.length > 2048) results.about = results.about.slice(0, 2045) + "...";
    if (results.about != null) reply.setDescription(results.about.replace(/\\n/g, ''));

    for (const key in results) {
        if (results.hasOwnProperty(key) && typeof results[key] == "string") {
            if (results[key].length > 1024) results[key] = results[key].slice(0, 1021) + "...";
        }
    }

    if (long) {
        var mangaography = [];
        var animeography = [];
        for (let i = 0; i < 5; i++) if (results.mangaography[i] != null) mangaography.push(`${results.mangaography[i].name}(${results.mangaography[i].mal_id})[${results.mangaography[i].role}]`);
        for (let i = 0; i < 5; i++) if (results.animeography[i] != null) animeography.push(`${results.animeography[i].name}(${results.animeography[i].mal_id})[${results.animeography[i].role}]`);

        reply.setFooter("Manga: " + mangaography.join(", ") + "\nAnime: " + animeography.join(", "));
    }

    // attributes
    if (long) for (var item of results.voice_actors) reply.addField(item.language, `${item.name}(${item.mal_id})`, true);
    return reply;
}

function person(results, long) {
    var reply = new Discord.MessageEmbed();
    reply.setColor("#2a50a3");
    if (results.url != null) reply.setURL(results.url);
    if (results.image_url != null) reply.setThumbnail(results.image_url);
    if (results.member_favorites != null) reply.setAuthor(`${results.member_favorites} favorited`);
    if (results.about != null && results.about.length > 2048) results.about = results.about.slice(0, 2045) + "...";
    if (results.about != null) reply.setDescription(results.about.replace(/\\n/g, ''));
    if (results.birthday != null) reply.setFooter(`Birthday: ${results.birthday.slice(0, 10)}`);

    for (const key in results) {
        if (results.hasOwnProperty(key) && typeof results[key] == "string") {
            if (results[key].length > 1024) results[key] = results[key].slice(0, 1021) + "...";
        }
    }

    var temp_array = [];
    if (results.family_name != null && results.family_name != results.title) temp_array.push(results.family_name);
    if (results.given_name != null && results.given_name != results.title) temp_array.push(results.given_name);
    reply.setTitle(`${results.name} (${results.mal_id})${temp_array.length > 0 ? ` || ${temp_array.join(" ")}` : ""}`);

    // attributes
    if (long) var voice_acting_roles = new Array(10);
    else var voice_acting_roles = new Array(3);

    for (let i = 0; i < voice_acting_roles.length; i++) {
        if (results.voice_acting_roles[i] != null) {
            reply.addField(`${results.voice_acting_roles[i].anime.name}(${results.voice_acting_roles[i].anime.mal_id})`, `${results.voice_acting_roles[i].character.name}(${results.voice_acting_roles[i].character.mal_id})[${results.voice_acting_roles[i].role}]`);
        }
    }

    return reply;
}

function loadBrowsePage(reply, content, pg_number, type, mal_id_container) {
    reply.fields = [];
    for (let i = 0; i < 5; i++) {
        if (content[((pg_number - 1) * 5) + i] != undefined) {
            if (type == "anime" || type == "manga" || type == "a" || type == "m") reply.addField(content[((pg_number - 1) * 5) + i].title, `${content[((pg_number - 1) * 5) + i].mal_id} | ${content[((pg_number - 1) * 5) + i].type}`);
            else if (type == "person" || type == "character" || type == "p" || type == "c") reply.addField((content[((pg_number - 1) * 5) + i].name != undefined) ? content[((pg_number - 1) * 5) + i].name : content[((pg_number - 1) * 5) + i].title, `${content[((pg_number - 1) * 5) + i].mal_id}`);
            mal_id_container[i] = content[((pg_number - 1) * 5) + i].mal_id;
        }
    }
}

async function search(commands, msg) {
    try {
        var type = ["anime", "manga", "person", "character", "a", "m", "c", "p"];
        var results;
        var current_page_number = 1;
        var mal_id_container = new Array(5);
        var choices = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        var current_emoji_index;

        if (!type.includes(commands[1])) throw "Invalid command";
        if (commands.slice(2).join("").length < 3) throw "Search must contain 3 or more characters";

        var mal_search_command = "";
        if (commands[1] == "anime" || commands[1] == "a") mal_search_command = "anime";
        else if (commands[1] == "manga" || commands[1] == "m") mal_search_command = "manga";
        else if (commands[1] == "character" || commands[1] == "c") mal_search_command = "character";
        else if (commands[1] == "person" || commands[1] == "p") mal_search_command = "person";

        results = (await mal.search(mal_search_command, commands.slice(2).join(" "), { page: 1 })).results;

        if (results.length == 0) throw "No search results found";

        // New Embed
        var reply = new Discord.MessageEmbed();
        // Standard
        reply.setFooter(`Requested by ${msg.member.nickname ? msg.member.nickname : msg.author.username}`, msg.author.displayAvatarURL({
            format: "png",
            dynamic: true
        }));
        reply.setColor("#2a50a3");
        reply.setThumbnail('https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ');
        reply.setTimestamp();

        // Dynamic
        reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
        reply.setDescription(`** Results for "${commands.slice(2).join(" ")}": **`);
        loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);

        // Sending Embed
        var ref_reply = await msg.channel.send(reply);
        for (var emoji of ['◀', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '▶']) await ref_reply.react(emoji);

        const lFilter = (reaction, user) => reaction.emoji.name === '◀' && current_page_number > 1;
        const lCollector = ref_reply.createReactionCollector(lFilter, {
            time: 300000
        });

        lCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number--;
            loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const rFilter = (reaction, user) => reaction.emoji.name === '▶' && current_page_number < Math.ceil(results.length / 5);
        const rCollector = ref_reply.createReactionCollector(rFilter, {
            time: 300000
        });

        rCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number++;
            loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const choose = (reaction, user) => { current_emoji_index = choices.indexOf(reaction.emoji.name); return choices.includes(reaction.emoji.name); };
        const chooseCollector = ref_reply.createReactionCollector(choose, {
            time: 300000
        });

        chooseCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            if (commands[1] == "anime") msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "manga") msg.channel.send(manga(await mal.findManga(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "person") msg.channel.send(person(await mal.findPerson(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "character") msg.channel.send(character(await mal.findCharacter(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "a") msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "m") msg.channel.send(manga(await mal.findManga(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "p") msg.channel.send(person(await mal.findPerson(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "c") msg.channel.send(character(await mal.findCharacter(mal_id_container[current_emoji_index]), false));
        });
    } catch (error) {
        msg.channel.send(`**${msg.member.nickname ? msg.member.nickname : msg.author.username}**: ${error}`);
    }
}

async function top(commands, msg) {
    try {
        var type = ["anime", "manga", "person", "character", "a", "m", "c", "p"];
        var anime_subtype = ["airing", "upcoming", "tv", "movie", "ova", "special", "bypopularity", "favorite"];
        var manga_subtype = ["manga", "novels", "oneshots", "doujin", "manhwa", "manhua", "bypopularity", "favorite"];
        var results;
        var current_page_number = 1;
        var mal_id_container = new Array(5);
        var choices = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        var current_emoji_index;

        if ((commands.length > 2 && commands[1] != "anime" && commands[1] != "manga" && commands[1] != "a" && commands[1] != "m") || !type.includes(commands[1])) throw "Invalid command";

        if (commands.length > 2) {
            if (commands[1] == "anime" || commands[1] == "a") if (!anime_subtype.includes(commands[2].toLowerCase())) throw "Invalid subtype";
            else if (commands[1] == "manga" || commands[1] == "m") if (!manga_subtype.includes(commands[2].toLowerCase())) throw "Invalid subtype";
        }

        var mal_search_command = "";
        if (commands[1] == "anime" || commands[1] == "a") mal_search_command = "anime";
        else if (commands[1] == "manga" || commands[1] == "m") mal_search_command = "manga";
        else if (commands[1] == "characters" || commands[1] == "c") mal_search_command = "characters";
        else if (commands[1] == "people" || commands[1] == "p") mal_search_command = "people";

        if (commands.length > 2) {
            results = (await mal.findTop(mal_search_command, 1, commands[2])).top;
        } else {
            results = (await mal.findTop(mal_search_command, 1)).top;
        }

        if (commands[1] == "people") commands[1] = "person";
        else if (commands[1] == "characters") commands[1] = "character";

        if (results.length == 0) throw "No search results found";

        // New Embed
        var reply = new Discord.MessageEmbed();
        // Standard
        reply.setFooter(`Requested by ${msg.member.nickname ? msg.member.nickname : msg.author.username}`, msg.author.displayAvatarURL({
            format: "png",
            dynamic: true
        }));
        reply.setColor("#2a50a3");
        reply.setThumbnail('https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ');
        reply.setTimestamp();

        // Dynamic
        reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
        reply.setDescription(`**Top ${(commands[1]).charAt(0).toUpperCase() + commands[1].substr(1).toLowerCase()}: **`);


        loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);

        // Sending Embed
        var ref_reply = await msg.channel.send(reply);
        for (var emoji of ['◀', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '▶']) await ref_reply.react(emoji);

        const lFilter = (reaction, user) => reaction.emoji.name === '◀' && current_page_number > 1;
        const lCollector = ref_reply.createReactionCollector(lFilter, {
            time: 300000
        });

        lCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number--;
            loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const rFilter = (reaction, user) => reaction.emoji.name === '▶' && current_page_number < Math.ceil(results.length / 5);
        const rCollector = ref_reply.createReactionCollector(rFilter, {
            time: 300000
        });

        rCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number++;
            loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const choose = (reaction, user) => { current_emoji_index = choices.indexOf(reaction.emoji.name); return choices.includes(reaction.emoji.name); };
        const chooseCollector = ref_reply.createReactionCollector(choose, {
            time: 300000
        });

        chooseCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            if (commands[1] == "anime") msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "manga") msg.channel.send(manga(await mal.findManga(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "person") msg.channel.send(person(await mal.findPerson(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "character") msg.channel.send(character(await mal.findCharacter(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "a") msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "m") msg.channel.send(manga(await mal.findManga(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "p") msg.channel.send(person(await mal.findPerson(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "c") msg.channel.send(character(await mal.findCharacter(mal_id_container[current_emoji_index]), false));
        });
    } catch (error) {
        msg.channel.send(`**${msg.member.nickname ? msg.member.nickname : msg.author.username}**: ${error}`);
    }
}

async function season(commands, msg) {
    try {
        var season_choices = ["spring", "summer", "fall", "winter"];
        var results;
        var current_page_number = 1;
        var mal_id_container = new Array(5);
        var choices = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        var current_emoji_index;

        var max = ((await (await fetch(new URL("https://api.jikan.moe/v3/season/archive"))).json()).archive[0]).year;

        if (parseInt(commands[1]) < 1917 || parseInt(commands[1]) > max) throw "Invalid Year";
        if (!season_choices.includes(commands[2].toLowerCase())) throw "Invalid Season";

        results = (await mal.findSeason(parseInt(commands[1]), commands[2])).anime;

        if (results.length == 0) throw "No search results found";

        // New Embed
        var reply = new Discord.MessageEmbed();
        // Standard
        reply.setFooter(`Requested by ${msg.member.nickname ? msg.member.nickname : msg.author.username}`, msg.author.displayAvatarURL({
            format: "png",
            dynamic: true
        }));
        reply.setColor("#2a50a3");
        reply.setThumbnail('https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ');
        reply.setTimestamp();

        // Dynamic
        reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
        reply.setDescription(`**Anime from ${(commands[2]).charAt(0).toUpperCase() + commands[2].substr(1).toLowerCase()} of ${String(parseInt(commands[1]))}: **`);


        loadBrowsePage(reply, results, current_page_number, "anime", mal_id_container);

        // Sending Embed
        var ref_reply = await msg.channel.send(reply);
        for (var emoji of ['◀', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '▶']) await ref_reply.react(emoji);

        const lFilter = (reaction, user) => reaction.emoji.name === '◀' && current_page_number > 1;
        const lCollector = ref_reply.createReactionCollector(lFilter, {
            time: 300000
        });

        lCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number--;
            loadBrowsePage(reply, results, current_page_number, "anime", mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const rFilter = (reaction, user) => reaction.emoji.name === '▶' && current_page_number < Math.ceil(results.length / 5);
        const rCollector = ref_reply.createReactionCollector(rFilter, {
            time: 300000
        });

        rCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number++;
            loadBrowsePage(reply, results, current_page_number, "anime", mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const choose = (reaction, user) => { current_emoji_index = choices.indexOf(reaction.emoji.name); return choices.includes(reaction.emoji.name); };
        const chooseCollector = ref_reply.createReactionCollector(choose, {
            time: 300000
        });

        chooseCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index])));
        });
    } catch (error) {
        msg.channel.send(`**${msg.member.nickname ? msg.member.nickname : msg.author.username}**: ${error}`);
    }
}

async function genre(commands, msg) {
    try {
        var main_genre = ["Action", "Adventure", "Cars", "Comedy", "Dementia", "Demons", "Mystery", "Drama", "Ecchi", "Fantasy", "Game", "Hentai", "Historical", "Horror", "Kids", "Magic", "Martial_Arts", "Mecha", "Music", "Parody", "Samurai", "Romance", "School", "Sci_Fi", "Shoujo", "Shoujo_Ai", "Shounen", "Shounen_Ai", "Space", "Sports", "Super_Power", "Vampire", "Yaoi", "Yuri", "Harem", "Slice_Of_Life", "Supernatural", "Military", "Police", "Psychological"];
        var anime_genre = main_genre.concat(["Thriller", "Seinen", "Josei"]);
        var manga_genre = main_genre.concat(["Seinen", "Josei", "Doujinshi", "Gender_Bender", "Thriller"]);
        var results;
        var current_page_number = 1;
        var mal_id_container = new Array(5);
        var choices = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
        var current_emoji_index;

        commands[2] = (commands.slice(2)).join("_");
        commands[2] = ((commands[2].split("_")).map(x => x.charAt(0).toUpperCase() + x.substr(1).toLowerCase())).join("_");

        var mal_search_command = "";
        if (commands[1] == "anime" || commands[1] == "a") mal_search_command = "anime";
        else if (commands[1] == "manga" || commands[1] == "m") mal_search_command = "manga";

        if (commands[1] == "anime" || commands[1] == "a") {
            if (!anime_genre.includes(commands[2])) throw "Invalid Genre"
            else results = (await mal.findGenre(mal_search_command, anime_genre.indexOf(commands[2]) + 1, 1))[mal_search_command];
        } else if (commands[1] == "manga" || commands[1] == "m") {
            if (!manga_genre.includes(commands[2])) throw "Invalid Genre";
            else results = (await mal.findGenre(mal_search_command, manga_genre.indexOf(commands[2]) + 1, 1))[mal_search_command];
        } else {
            throw "Invalid type";
        }

        if (results.length == 0) throw "No search results found";

        // New Embed
        var reply = new Discord.MessageEmbed();
        // Standard
        reply.setFooter(`Requested by ${msg.member.nickname ? msg.member.nickname : msg.author.username}`, msg.author.displayAvatarURL({
            format: "png",
            dynamic: true
        }));
        reply.setColor("#2a50a3");
        reply.setThumbnail('https://image.myanimelist.net/ui/OK6W_koKDTOqqqLDbIoPAiC8a86sHufn_jOI-JGtoCQ');
        reply.setTimestamp();

        // Dynamic
        reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
        reply.setDescription(`**${commands[2].replace(/_/g, " ")} ${mal_search_command == "anime" ? "Anime" : "Manga"}s: **`);
        loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);

        // Sending Embed
        var ref_reply = await msg.channel.send(reply);
        for (var emoji of ['◀', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '▶']) await ref_reply.react(emoji);

        const lFilter = (reaction, user) => reaction.emoji.name === '◀' && current_page_number > 1;
        const lCollector = ref_reply.createReactionCollector(lFilter, {
            time: 300000
        });

        lCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number--;
            loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const rFilter = (reaction, user) => reaction.emoji.name === '▶' && current_page_number < Math.ceil(results.length / 5);
        const rCollector = ref_reply.createReactionCollector(rFilter, {
            time: 300000
        });

        rCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            current_page_number++;
            loadBrowsePage(reply, results, current_page_number, commands[1], mal_id_container);
            reply.setTitle(`**Page ${current_page_number}/${String(Math.ceil(results.length / 5))}**`);
            ref_reply.edit(reply);
        });

        const choose = (reaction, user) => { current_emoji_index = choices.indexOf(reaction.emoji.name); return choices.includes(reaction.emoji.name); };
        const chooseCollector = ref_reply.createReactionCollector(choose, {
            time: 300000
        });

        chooseCollector.on('collect', async () => {
            removeReaction(ref_reply, msg);
            if (commands[1] == "anime") msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "manga") msg.channel.send(manga(await mal.findManga(mal_id_container[current_emoji_index]), true));
            else if (commands[1] == "a") msg.channel.send(anime(await mal.findAnime(mal_id_container[current_emoji_index]), false));
            else if (commands[1] == "m") msg.channel.send(manga(await mal.findManga(mal_id_container[current_emoji_index]), false));
        });
    } catch (error) {
        msg.channel.send(`**${msg.member.nickname ? msg.member.nickname : msg.author.username}**: ${error}`);
    }
}