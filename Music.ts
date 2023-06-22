import * as djs from "discord.js";
import * as djsv from "@discordjs/voice";
const ytdl = require("youtube-dl-exec");
import * as prism from "prism-media";
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

function isYtLink(inp: string) : boolean {
	if (inp.startsWith("https://")) inp = inp.substring(8);
	else if (inp.startsWith("http://")) inp = inp.substring(8);

	if (!(inp.startsWith("youtu.be") ||
		inp.startsWith("youtube.com")))
		return false;
	inp = inp.substring(inp.indexOf("&"));	
}

class Queue {
	public loopOption: number;
	// Type is any because we might store metadata like title and options.
	public tracks: any[];

	public track: any;

	public constructor(loopOption: number = 0) {
		this.loopOption = loopOption;
		this.tracks = [];
		this.track = undefined;
	}

	public add(track: any) : void {
		this.tracks.push(track);
	}

	public next() : any {
		switch(this.loopOption) {
			case 1: return (this.track != undefined
				? this.track
				: (this.track = this.tracks.shift()));
			case 2: this.tracks.push(this.track);
			case 0: return (this.track = this.tracks.shift());
		}
	}
}

type Voicer = {
	conn: djsv.VoiceConnection;
	player: djsv.AudioPlayer;
	queue: Queue;
}

export class MusicManager {

	static voicers: Map<djs.Snowflake, Voicer>
		= new Map<djs.Snowflake, Voicer>();

	public static join(channelId: djs.Snowflake, guild: djs.Guild) : void {
		if (djsv == null) return;
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
			if (track == undefined) return;
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

	public static leave(gid: djs.Snowflake) : void {
		this.voicers.get(gid).conn.destroy();
		this.voicers.delete(gid);
	}

	public static play(gid: djs.Snowflake, link: string, opt: any): number {
		console.log("Play");
		let track = { link: link, options: opt };
		let voicer = this.voicers.get(gid);
		voicer.queue.add(track);

		if (voicer.player.state.status != djsv.AudioPlayerStatus.Idle)
			return 0;
		track = voicer.queue.next();
		// should not happen
		if (track == undefined) return 69;
		return this.playNow(gid, track.link, track.options);
	}

	public static playNow(gid: djs.Snowflake, link: string, opt: any): number {
		let voicer = this.voicers.get(gid);
		if (voicer == undefined) return 1;
		let ffmpegArgs = [
			"-f", "s16le", "-i", "-",
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
				filter += ",aresample=48000"
			}
			for (let rate of opt.rate) filter += ",atempo=" + rate.toString();

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

		/*
		let subprocess = ytdl(link, { output: "t.webm", format: "251" });
		subprocess.then(_ => {
		*/
			let output = fs.createReadStream("t.webm")
				.pipe(demuxer).pipe(decoder)
				.pipe(new stream.PassThrough())
				.pipe(transcoder).pipe(encoder)
			let resource = new djsv.AudioResource([], [output], "", 5);
			
			voicer.player.play(resource);
		// });

		return 0;
	}

	public static setloop(gid: djs.Snowflake, option: number) : number {
		let voicer = this.voicers.get(gid);
		if (voicer == undefined) return 1;
		voicer.queue.loopOption = option;
		console.log("Loop: " + option);
		return 0;
	}
}
