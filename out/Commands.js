"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageCommands = void 0;
const Music_1 = require("./Music");
const proparse = __importStar(require("./proparse"));
class MessageCommands {
    static handle(msg) {
        if (!msg.content.startsWith(this.prefix))
            return;
        /* Since args isn't used for anything other than the command name,
            it's getting removed for now.
        let args: string[] = msg.content.split(" ");
        args[0] = argsrstSpace = msg.content.indexOf(" ");
        */
        let firstSpace = msg.content.indexOf(" ");
        let cmdName = "";
        if (firstSpace != -1)
            cmdName = msg.content.substring(1, firstSpace);
        else
            cmdName = msg.content.substring(1);
        switch (cmdName /* args[0] */) {
            case "ping":
                this.Ping(msg);
                break;
            case "join":
                this.Join(msg);
                break;
            case "leave":
                this.Leave(msg);
                break;
            case "play":
                this.Play(msg);
                break;
            case "playnow":
                this.Play(msg, true);
                break;
            case "loop":
                this.SetLoop(msg);
                break;
        }
    }
    static Ping(msg) {
        msg.channel.send("Pong!");
    }
    static Join(msg) {
        let guild = msg.guild;
        let authorVcs = msg.member.voice;
        let textChannel = msg.channel;
        if (!authorVcs.channel) {
            textChannel.send("You must be in a channel to music!");
            return;
        }
        if (authorVcs.channel.guild != textChannel.guild) {
            textChannel.send("You must be in the same server to musc!");
            return;
        }
        Music_1.MusicManager.join(authorVcs.channel.id, guild);
        textChannel.send("Joig");
    }
    static Leave(msg) {
        let guild = msg.guild;
        let author = msg.author;
        let authorVcs = msg.member.voice;
        let textChannel = msg.channel;
        if (!authorVcs.channel) {
            textChannel.send("You must be in a vc to leave!");
            return;
        }
        if (authorVcs.channel.guild != textChannel.guild) {
            textChannel.send("You must be in the same server to leave!");
            return;
        }
        Music_1.MusicManager.leave(guild.id);
        textChannel.send("Leav");
    }
    static Play(msg, now = false) {
        // TODO: check if user is in a voice channel
        let args = proparse.parse(msg.content);
        let oa = proparse.optandargs(args, this.cmdcfgs.PlayNow);
        args = oa.args;
        let options = oa.options;
        let passOptions = {
            volume: [],
            rate: [],
            pitch: [],
        };
        let tempNum = 0.0;
        for (let opt of options) {
            switch (opt[0]) {
                case "-r":
                case "--rate":
                    tempNum = parseFloat(opt[1]);
                    if (isNaN(tempNum)) {
                        // Ignore? or tell user that their input for rate
                        // is wrong?
                        // TODO: do something else other than ignore maybe
                        break;
                    }
                    passOptions.rate.push(tempNum);
                    break;
                case "-v":
                case "--volume":
                    tempNum = parseFloat(opt[1]);
                    if (isNaN(tempNum))
                        break;
                    passOptions.volume.push(tempNum);
                    break;
                case "-p":
                case "--pitch":
                    tempNum = parseFloat(opt[1]);
                    if (isNaN(tempNum))
                        break;
                    passOptions.pitch.push(tempNum);
                    break;
            }
        }
        let result = 0;
        if (now)
            result = Music_1.MusicManager.playNow(msg.guild.id, args[1], passOptions);
        else
            result = Music_1.MusicManager.play(msg.guild.id, args[1], passOptions);
        if (result == 1) {
            // TODO: the bot is not in a voice channel
        }
        else if (result == 2) {
            // TODO: the user is not in the same voice channel as the bot
        }
    }
    static SetLoop(msg) {
        // TODO: check if user is in a voice channel
        // simple parsing
        let args = msg.content.split(" ");
        if (args.length < 2) {
            // TODO: inform the user of the usage
            return;
        }
        let option = args[1].toLowerCase();
        let loopOption = 0;
        switch (args[1]) {
            case "2":
            case "one": loopOption++;
            case "1":
            case "all": loopOption++;
        }
        let result = Music_1.MusicManager.setloop(msg.guild.id, loopOption);
        if (result == 1) {
            // TODO: the bot is not in a voice channel
        }
        else if (result == 2) {
            // TODO: the user is not in the same voice channel as the bot
        }
    }
}
exports.MessageCommands = MessageCommands;
MessageCommands.pro = {
    hzy: "383939718796017664",
    benim: "596651685145870367",
    fish: "414364900367007745",
    eth: "527811597851295754",
};
/*
const cmdcfgs = {
  "delall": {
    "expect": {
      "--this": 0, "-t": 0,
      "--sight": 1, "-s": 1,
      "--insensitive": 0, "-i": 0,
      "--by": 1, "-b": 1,
      "--all": 0, "-a": 0,
    },
    "prefix": "-"
  }
};
*/
MessageCommands.cmdcfgs = {
    PlayNow: {
        "--volume": 1, "-v": 1,
        "--pitch": 1, "-p": 1,
        "--rate": 1, "-r": 1,
        // count comes later
        // "--count": 1, "-c": 1,
    }
};
MessageCommands.prefix = '$';
