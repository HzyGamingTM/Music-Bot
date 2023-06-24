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
                this.Play(msg, false);
                break;
            case "playnow":
                this.Play(msg, true);
                break;
            case "loop":
                this.SetLoop(msg);
                break;
            case "skip":
                this.Skip(msg);
                break;
            case "queue":
                this.Queue(msg);
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
        let result = Music_1.MusicManager.join(authorVcs.channel.id, guild);
        switch (result) {
            case 3:
                textChannel.send("I am already in another voice channel.");
                return;
        }
        textChannel.send("Joig");
    }
    static Leave(msg) {
        let guild = msg.guild;
        let author = msg.author;
        let authorVcs = msg.member.voice;
        let textChannel = msg.channel;
        if (!authorVcs.channelId) {
            textChannel.send("You must be in a vc to kick the bot!");
            return;
        }
        let result = Music_1.MusicManager.leave(guild.id, authorVcs.channelId);
        switch (result) {
            case 1:
                textChannel.send("I am not in a voice channel.");
                return;
            case 2:
                textChannel.send("You're not in my voice channel.");
                return;
        }
        textChannel.send("Leav");
    }
    static Play(msg, now = false) {
        let textChannel = msg.channel;
        let cid = msg.member.voice.channelId;
        if (!cid) {
            textChannel.send("ur not in a vc dumbas");
            return;
        }
        let args = proparse.parse(msg.content);
        let oa = proparse.optandargs(args, this.cmdcfgs.PlayNow);
        args = oa.args;
        let options = oa.options;
        let pOpt = {
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
                    pOpt.rate.push(tempNum);
                    break;
                case "-v":
                case "--volume":
                    tempNum = parseFloat(opt[1]);
                    if (isNaN(tempNum))
                        break;
                    pOpt.volume.push(tempNum);
                    break;
                case "-p":
                case "--pitch":
                    tempNum = parseFloat(opt[1]);
                    if (isNaN(tempNum))
                        break;
                    pOpt.pitch.push(tempNum);
                    break;
            }
        }
        let result = 0;
        if (now)
            result = Music_1.MusicManager.playNow(msg.guild.id, cid, args[1], pOpt);
        else
            result = Music_1.MusicManager.play(msg.guild.id, cid, args[1], pOpt);
        if (result == 1) {
            textChannel.send("I am not in a voice channel.");
        }
        else if (result == 2) {
            textChannel.send("You're not in my voice channel.");
        }
        else if (!result) {
            textChannel.send("Plag");
        }
    }
    static SetLoop(msg) {
        let textChannel = msg.channel;
        let cid = msg.member.voice.channelId;
        if (!cid) {
            textChannel.send("You are not in a voice channel.");
            return;
        }
        // simple parsing
        let args = msg.content.split(" ");
        if (args.length != 2 || args[1] == "--help" || args[1] == "-h") {
            textChannel.send("Usage: `$setloop <option>`\n" +
                "Possible options: one (or 2), all (or 1)");
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
        let result = Music_1.MusicManager.setloop(msg.guild.id, cid, loopOption);
        if (result == 1) {
            textChannel.send("I am not in a voice channel.");
        }
        else if (result == 2) {
            textChannel.send("You have no rights (for now).");
        }
        else if (result == 0) {
            textChannel.send("Loo");
        }
    }
    static Skip(msg) {
        let textChannel = msg.channel;
        let cid = msg.member.voice.channelId;
        if (!cid) {
            textChannel.send("You are not in a voice channel.");
            return;
        }
        // simple parsing
        let args = msg.content.split(" ");
        if (args[1] == "--help" || args[1] == "-h") {
            textChannel.send("Usage: `$setloop <option>`\n" +
                "Possible options: one (or 2), all (or 1)");
            return;
        }
        let option = 1;
        if (args[1] != undefined) {
            option = parseInt(args[1]);
            if (isNaN(option)) {
                textChannel.send("Invalid option at parameter 1: " + args[1]);
                return;
            }
        }
        let result = Music_1.MusicManager.skip(msg.guild.id, cid, option);
        switch (result) {
            case 1:
                textChannel.send("I am not in a voice channel.");
                break;
            case 2:
                textChannel.send("You're not in my voice channel.");
                break;
            default:
                textChannel.send("Scab");
                break;
        }
    }
    static Queue(msg) {
        Music_1.MusicManager.logqueue(msg.guild.id, 'intercour');
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
