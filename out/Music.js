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
const ytdl = __importStar(require("youtube-dl-exec"));
const prism = __importStar(require("prism-media"));
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
        voiceConn.subscribe(player);
        this.voicers.set(guild.id, {
            conn: voiceConn,
            player: player,
            queue: null,
        });
    }
    static leave(gid) {
        this.voicers.get(gid).conn.destroy();
        this.voicers.delete(gid);
    }
    static play(gid, args) {
        // TODO: The
    }
    static playNow(gid, link, opt) {
        let ffmpegArgs = [
            "-analyzeduration", "0", "-loglevel", "0", "-f", "s16le",
            "-ar", "48000", "-ac", "2"
        ];
        {
            let filter = "";
            if (opt.volume.length) {
                filter += "volume=" + opt.volume[0].toString();
                for (let i = 1; i < opt.volume.length; i++)
                    filter += ",volume=" + opt.volume[i].toString();
            }
            for (let pitch of opt.pitch) {
                filter += ",asetrate=48000*" + pitch.toString();
                filter += ",aresample=48000";
            }
            for (let rate of opt.rate)
                filter += ",atempo=" + rate.toString();
            if (filter !== "") {
                ffmpegArgs.push("-filter:a");
                ffmpegArgs.push(filter);
            }
        }
        let transcoder = new prism.FFmpeg({ args: ffmpegArgs });
        let encoder = new prism.opus.Encoder({
            rate: 48000, channels: 2, frameSize: 960
        });
        let subprocess = ytdl.exec(link, { output: "-", format: "251" });
        let output = subprocess.stdout.pipe(transcoder).pipe(encoder);
        let resource = new djsv.AudioResource([], [output], "", 5);
        this.voicers.get(gid).player.play(resource);
    }
}
exports.MusicManager = MusicManager;
MusicManager.voicers = new Map();
