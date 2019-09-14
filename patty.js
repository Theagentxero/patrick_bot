const Discord = require('discord.js');
const client = new Discord.Client();
const fetch = require('node-fetch');
const config = require('./hidden/config.json');
const fs = require('fs');
/** 
 * config expects json object in form:
 *  {
 *      "token": "YOUR-BOT-TOKEN",
 *      "client_id": "BOT-CLIENT-ID",
 *      "secret": "BOT-SECRET",
 *      "prefix": ["!patrick"],
 *      "angryPrefix" : [],
 *  }
*/

function botscore(value){
    var score = JSON.parse(fs.readFileSync('./botscore.json'));
    if(value == '+'){
        //was a good bot
        score.good = score.good + 1;
    }else{
        //was a bad bot
        score.bad = score.bad + 1;
    }
    fs.writeFileSync('./botscore.json',JSON.stringify(score));

    return score;
}

function checkMessageForCommand(msg){
    // check if bot command and dont respond to yourself
    config.prefix.forEach((pf) => {
        if( msg.content.startsWith(pf) && !msg.author.bot && !(msg.author == client.user)){
            //parse and return commands
            return true;
        }
    })
    config.angryPrefix.forEach((pf) => {
        if( msg.content.startsWith(pf) && !msg.author.bot && !(msg.author == client.user)){
            //Patrick Becomes Irrate, Being Called The Krusty Krab
            var sendThis = await new ImageEmbed("NO, THIS IS PATRICK", 'I am not a krusty krab...\nPlease Use ' + config.prefix[0] + ' to make !pat requests.', "https://i.imgur.com/iukRzk7.gif").discordEmbedModel();
            
            msg.channel.send(sendThis);   
            return false;
        }
    })
    return false;
}

class QuickEmbed {
    
    constructor(title, description){
        this.color = 0xFFC0CB;
        this.title = title;
        this.desc = description;
    }

    discordEmbedModel(){
        return new Discord.RichEmbed().setTitle(this.title).setColor(this.color).setDescription(this.desc);
    }

};

class ThumbEmbed extends QuickEmbed {
    constructor(title, description, thumbnail){
        super(title, description);
        this.thumbnail = thumbnail;
    }

    discordEmbedModel(){ 
        return super.discordEmbedModel().setThumbnail(this.thumbnail);
    }
};

class ImageEmbed extends QuickEmbed {
    constructor(title, description, image){
        super(title, description);
        this.image = image;
    }
    discordEmbedModel(){ 
        return super.discordEmbedModel().setImage(this.image);
    }
};

class ImageAndThumbEmbed extends ImageEmbed {
    constructor(title, description, image, thumbnail){
        super(title, description, image);
        this.thumbnail = thumbnail
    }
    discordEmbedModel(){ 
        return super.discordEmbedModel().setThumbnail(this.thumbnail);
    }
};

class Commands extends Array{
    constructor(){
        super();
    }
    getCommandsList(){
        var list = "";
        super.forEach(elm => {
            //start the syntax description
            var commandsyntax = "`" + config.prefix[0] + " " + elm.name;
            if( 'inputType' in elm ){
                commandsyntax = commandsyntax + " " + elm.inputType;
            }
            //close it
            commandsyntax = commandsyntax  + "`";
            //Build List With Available Values
            list = list + commandsyntax + "\n";
            //Build Description if exists
            if( 'description' in elm ){
                list = list + " - *" + elm.description + "* \n\n";
            }
        });
        return list;
    }
}

function fetchErrorDisplay(message){
    //https://i.imgflip.com/1rq4so.jpg
    return new ThumbEmbed("Request Failed", message, "https://i.imgflip.com/1rq4so.jpg").discordEmbedModel();
}

function helpDisplay(){
    var allCommands = commands.getCommandsList();
    return new ImageEmbed("Patrick Help", allCommands, "https://i.imgur.com/YHrUUcn.gif").discordEmbedModel();
}

function echoDisplay(input){
    return new QuickEmbed("Echo", input).discordEmbedModel();
}

async function randomFact(){
    try {
        var res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
        var fact = await res.json()
        return new QuickEmbed("Random Fact", fact.text).discordEmbedModel().setURL(fact.permalink);
    } catch (error) {
        return fetchErrorDisplay("Something Broke Durring The External API Call");
    }
    
}

async function beeMovie(){
    try {
        var bee = fs.readFileSync('./bee_movie.txt').toString('utf8');
        //console.log(bee);
        return bee;
    } catch (error) {
        console.log(error)
        return fetchErrorDisplay("Failed To Load Bee Movie Script File");
    }
}

async function goodBot(){
    "http://giphygifs.s3.amazonaws.com/media/13k4VSc3ngLPUY/giphy.gif"
    var score = await botscore('+');
    var body = "PATRICK DID GOOD! \n" + "Patrick did good " + score.good + " times so far";
    return new ImageEmbed("Patrick Do Good?", body, "http://giphygifs.s3.amazonaws.com/media/13k4VSc3ngLPUY/giphy.gif").discordEmbedModel();
}
async function badBot(){
    "http://giphygifs.s3.amazonaws.com/media/13k4VSc3ngLPUY/giphy.gif"
    var score = await botscore('-');
    var body = ":cry: \n" + "Patrick was bad " + score.bad + " times so far";
    return new ImageEmbed("Patrick Bad?", body, "http://giphygifs.s3.amazonaws.com/media/7wuPBQkbmf6dW/giphy.gif").discordEmbedModel();
}

async function findPhoto(value){
    //"https://api.unsplash.com/search/photos?page=1&per_page=1&query=office"
    try {
        console.log(value)
        var raw = await fetch("https://pixabay.com/api/?key=" + config.pixabay_key + "&q=" + value + "&image_type=photo");
        var res = await raw.json();
        //res.hits[0].imageURL
        console.log(res.hits[0].largeImageURL);
        var x = await fetch('https://api.imgur.com/3/upload', { 
            method: 'POST', 
            headers: { 'Authorization': 'Client-ID ' + config.imgur_client_id, 'content-type': 'multipart/form-data' },
            body: res.hits[0].largeImageURL
        });
        var y = await x.json();
        //console.log(y.data.link);
        return new ImageEmbed("Patrick Found A " + value, '', y.data.link ).discordEmbedModel();
    } catch (error) {
        console.log(error);
        return fetchErrorDisplay("External API Call Failed");
    }
}

/** 
 * commands object:
 *      name: "string literal for command trigger" [REQUIRED]
 *      inputType: 'string describing the input type' [OPTIONAL] (exclude key to ignore)
 *      description: 'rtf formatted string that describes the command' [OPTIONAL] (exclude key to ignore)
 *      functionTrigger: function() [REQUIRED]
*/

var commands = new Commands();
initCommands();
//console.log(commands);
function initCommands(){
    //help command
    var help = {
        name: 'help',
        description: 'Displays this help file',
        functionTrigger: () => {return helpDisplay()}
    };
    commands.push(help);

    var echo = {
        name: 'echo',
        inputType: 'string',
        description: 'Echos the string input back to the chat',
        functionTrigger: (val) => {return echoDisplay(val)}
    };
    commands.push(echo);

    var random = {
        name: 'facts',
        description: 'Serves a random fact',
        functionTrigger: () => {return randomFact()}
    };
    commands.push(random);

    var script = {
        name: 'bee-movie',
        description: 'Will post the entire bee movie script',
        functionTrigger: () => {return beeMovie()}
    };
    //commands.push(script);

    var good = {
        name: 'goodbot',
        description: 'Give Patrick Some Love, Hes A Good Bot',
        functionTrigger: () => {return goodBot()}
    };
    commands.push(good);

    var bad = {
        name: 'badbot',
        description: 'Patrick Deserves To Suffer, He Sucks As A Bot',
        functionTrigger: () => {return badBot()}
    };
    commands.push(bad);

    var find = {
        name: 'find',
        inputType: 'thing',
        description: 'Patrick Will Search High And Low For A Picture Of The Thing You Said, He Doesn\'t Always Get It Right Though',
        functionTrigger: (val) => {return findPhoto(val)}
    };
    commands.push(find);
}



function commandSyntaxErrorDisplay( cmdobj ){
    return new ThumbEmbed("Missing Input", cmdobj.name + " requires an input.\nCommand Syntax Described As" + "```" + config.prefix[0] + " " + cmdobj.name + " " + cmdobj.inputType + "```", "https://i.ytimg.com/vi/Iyn-0af_hlI/hqdefault.jpg").discordEmbedModel();
}

async function parseCommand(msg){
    var contentRaw = msg.content;
    //console.log(msg.content);
    //discard config string
    var com = contentRaw.slice(config.prefix[0].length + 1).split(" ");
    var seek = com[0].toUpperCase();
    var match = commands.filter((c) => c.name.toUpperCase() == seek)[0];
    //console.log(match);
    if(!match){
        return new ImageEmbed("Me No Understand","For a list of commands type: ```" + config.prefix[0] + " help```", "http://giphygifs.s3.amazonaws.com/media/LnKa2WLkd6eAM/giphy.gif").discordEmbedModel();
    }else{
        if('inputType' in match){
            //Validate Input and Run Trigger With Input
            if(com.length < 2){
                //Take our problems and put them somewhere else
                return commandSyntaxErrorDisplay(match);
            }else{
                //do the thing
                console.log("Now: " + match.name + " for " + com[1] )
                return await match.functionTrigger(com[1]);
            }
        }else{
            //Run input as it is
            return match.functionTrigger();
        }
    }
    
}


client.on('ready', () =>{
    client.user.setPresence({ game: { name: 'dumb', type: 0, url: "https://www.twitch.tv/sodapoppin"}}); 
    console.log("Logged in As: " + client.user.tag);
});



client.on('message',async msg => {
    if(checkMessageForCommand(msg)){
        console.log("Oh Boy 3am");
        var sendThis = await parseCommand(msg);
        // happy patrick: "http://giphygifs.s3.amazonaws.com/media/13k4VSc3ngLPUY/giphy.gif"
        //"https://i.imgur.com/jzc9UkS.gif"
        //dumb patrick "http://giphygifs.s3.amazonaws.com/media/LnKa2WLkd6eAM/giphy.gif"
        
        msg.channel.send(sendThis);   
    }
});



client.login(config.token);