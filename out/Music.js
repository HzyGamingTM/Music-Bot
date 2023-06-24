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
exports.MusicManager = void 0;
const djsv = __importStar(require("@discordjs/voice"));
const ytdl = require("youtube-dl-exec");
const prism = __importStar(require("prism-media"));
const fs = require("node:fs");
const stream = require("node:stream");
const childp = require("child_process");
const FFMPEG_PCM_ARGUMENTS = [
    '-analyzeduration', '0',
    '-loglevel', '0', '-f', 's16le',
    '-ar', '48000',
    '-ac', '2'
];
const FFMPEG_OPUS_ARGUMENTS = [
    '-analyzeduration', '0',
    '-loglevel', '0',
    '-acodec', 'libopus',
    '-f', 'opus',
    '-ar', '48000',
    '-ac', '2',
];
function isYtLink(inp) {
    if (inp.startsWith("https://"))
        inp = inp.substring(8);
    else if (inp.startsWith("http://"))
        inp = inp.substring(8);
    if (!(inp.startsWith("youtu.be") ||
        inp.startsWith("youtube.com")))
        return false;
    inp = inp.substring(inp.indexOf("&"));
}
class Queue {
    constructor(loopOption = 0) {
        this.loopOption = loopOption;
        this.tracks = [];
        this.track = undefined;
    }
    add(track) {
        this.tracks.push(track);
    }
    next() {
        switch (this.loopOption) {
            case 1: return (this.track != undefined
                ? this.track
                : (this.track = this.tracks.shift()));
            case 2: this.tracks.push(this.track);
            case 0: return (this.track = this.tracks.shift());
        }
    }
}
class MusicManager {
    static join(channelId, guild) {
        if (djsv == null)
            return;
        let voiceConn = djsv.joinVoiceChannel({
            adapterCreator: guild.voiceAdapterCreator,
            guildId: guild.id,
            channelId: channelId,
            selfMute: false
        });
        let player = djsv.createAudioPlayer();
        player.on(djsv.AudioPlayerStatus.Idle, (oldState, newState) => {
            console.log("Idle");
            if (newState.status != djsv.AudioPlayerStatus.Idle)
                return;
            let voicer = this.voicers.get(guild.id);
            let track = voicer.queue.next();
            if (track == undefined)
                return;
            this.playNow(guild.id, track.link, track.options);
        });
        voiceConn.subscribe(player);
        let queue = new Queue(0);
        this.voicers.set(guild.id, {
            conn: voiceConn,
            player: player,
            queue: queue,
        });
    }
    static leave(gid) {
        this.voicers.get(gid).conn.destroy();
        this.voicers.delete(gid);
    }
    static play(gid, link, opt) {
        console.log("Play");
        let track = { link: link, options: opt };
        let voicer = this.voicers.get(gid);
        voicer.queue.add(track);
        if (voicer.player.state.status != djsv.AudioPlayerStatus.Idle)
            return 0;
        track = voicer.queue.next();
        // should not happen
        if (track == undefined)
            return 69;
        return this.playNow(gid, track.link, track.options);
    }
    static playNow(gid, link, opt) {
        let voicer = this.voicers.get(gid);
        if (voicer == undefined)
            return 1;
        let ffmpegArgs = [
            "-f", "s16le", "-ac", "2", "-ar", "48000", "-i", "-",
            "-analyzeduration", "0", "-loglevel", "0", "-f", "s16le",
            "-ar", "48000", "-ac", "2"
        ];
        {
            let filter = "";
            for (let pitch of opt.pitch) {
                filter += ",asetrate=48000*" + pitch.toString();
                filter += ",aresample=48000";
            }
            for (let rate of opt.rate)
                filter += ",atempo=" + rate.toString();
            if (opt.volume.length) {
                filter += ",volume=" + opt.volume[0].toString();
                for (let i = 1; i < opt.volume.length; i++)
                    filter += ",volume=" + opt.volume[i].toString();
            }
            if (filter[0] == ",")
                filter = filter.substring(1);
            if (filter !== "") {
                ffmpegArgs.push("-filter:a");
                ffmpegArgs.push(filter);
            }
        }
        let demuxer = new prism.opus.WebmDemuxer();
        let decoder = new prism.opus.Decoder({
            frameSize: 960, rate: 48000, channels: 2
        });
        let transcoder = new prism.FFmpeg({ args: ffmpegArgs });
        let encoder = new prism.opus.Encoder({
            rate: 48000, channels: 2, frameSize: 960
        });
        let subprocess = ytdl.exec(link, { output: "-", format: "251" });
        // subprocess.then(_ => {
        let output = subprocess.stdout //fs.createReadStream("o.webm")
            .pipe(demuxer).pipe(decoder)
            .pipe(transcoder).pipe(encoder);
        let resource = new djsv.AudioResource([], [output], "", 5);
        voicer.player.play(resource);
        // });
        return 0;
    }
    static setloop(gid, option) {
        let voicer = this.voicers.get(gid);
        if (voicer == undefined)
            return 1;
        voicer.queue.loopOption = option;
        console.log("Loop: " + option);
        return 0;
    }
}
exports.MusicManager = MusicManager;
MusicManager.voicers = new Map();
