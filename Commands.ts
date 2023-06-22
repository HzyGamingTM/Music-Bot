import { Message, Guild, User, messageLink, TextChannel } from "discord.js";
import { MusicManager } from "./Music"
import * as proparse from "./proparse";

export class MessageCommands {
	static pro = {
		hzy: "383939718796017664",
		benim: "596651685145870367",
		fish: "414364900367007745",
		eth: "527811597851295754",
	}

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

	static cmdcfgs = {
		PlayNow: {
			"--volume": 1, "-v": 1,
			"--pitch": 1, "-p": 1,
			"--rate": 1, "-r": 1,
			// count comes later
			// "--count": 1, "-c": 1,
		}	
	};

	static prefix: string = '$';

	static handle(msg: Message) : void {
		if (!msg.content.startsWith(this.prefix)) return;
		/* Since args isn't used for anything other than the command name,
			it's getting removed for now.
		let args: string[] = msg.content.split(" ");
		args[0] = argsrstSpace = msg.content.indexOf(" ");
		*/
		let firstSpace = msg.content.indexOf(" ");
		let cmdName: string = "";
		if (firstSpace != -1) cmdName = msg.content.substring(1, firstSpace);
		else cmdName = msg.content.substring(1);

		switch (cmdName /* args[0] */) {
			case "ping": this.Ping(msg); break;
			case "join": this.Join(msg); break;
			case "leave": this.Leave(msg); break;
			case "play": this.Play(msg); break;
			case "playnow": this.Play(msg, true); break;
			case "loop": this.SetLoop(msg); break;
		}
	}

	static Ping(msg: Message) : void {
		(msg.channel as TextChannel).send("Pong!");
	}

	static Join(msg: Message): void {
		let guild: Guild = msg.guild;
		let authorVcs = msg.member.voice;
		let textChannel = msg.channel as TextChannel;
		
		if (!authorVcs.channel) {
			textChannel.send("You must be in a channel to music!");
			return;
		}

		if (authorVcs.channel.guild != textChannel.guild) {
			textChannel.send("You must be in the same server to musc!");
			return;
		}

		MusicManager.join(authorVcs.channel.id, guild);
		
		textChannel.send("Joig");
	}

	static Leave(msg: Message): void {
		let guild: Guild = msg.guild;
		let author: User = msg.author;
		let authorVcs = msg.member.voice;
		let textChannel = msg.channel as TextChannel;
		
		if (!authorVcs.channel) {
			textChannel.send("You must be in a vc to leave!");
			return;
		}

		if (authorVcs.channel.guild != textChannel.guild) {
			textChannel.send("You must be in the same server to leave!");
			return;
		}

		MusicManager.leave(guild.id);
		
		textChannel.send("Leav");
	}

	static Play(msg: Message, now: boolean = false) : void {
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
				case "-r": case "--rate":
					tempNum = parseFloat(opt[1]);
					if (isNaN(tempNum)) {
						// Ignore? or tell user that their input for rate
						// is wrong?
						// TODO: do something else other than ignore maybe
						break;
					}
					passOptions.rate.push(tempNum);
					break;
				case "-v": case "--volume":
					tempNum = parseFloat(opt[1]);
					if (isNaN(tempNum)) break;
					passOptions.volume.push(tempNum);
					break;
				case "-p": case "--pitch":
					tempNum = parseFloat(opt[1]);
					if (isNaN(tempNum)) break;
					passOptions.pitch.push(tempNum);
					break;
			}
		}

		let result = 0;
		if (now)
			result = MusicManager.playNow(msg.guild.id, args[1], passOptions);
		else
			result = MusicManager.play(msg.guild.id, args[1], passOptions);

		if (result == 1) {
			// TODO: the bot is not in a voice channel
		} else if (result == 2) {
			// TODO: the user is not in the same voice channel as the bot
		}
	}

	static SetLoop(msg: Message) {
		// TODO: check if user is in a voice channel
		// simple parsing
		let args = msg.content.split(" ");
		if (args.length < 2) {
			// TODO: inform the user of the usage
			return;
		}
		let option = args[1].toLowerCase();
		let loopOption = 0;
		switch(args[1]) {
			case "2": case "one": loopOption++;
			case "1": case "all": loopOption++;
		}
		let result = MusicManager.setloop(msg.guild.id, loopOption));

		if (result == 1) {
			// TODO: the bot is not in a voice channel
		} else if (result == 2) {
			// TODO: the user is not in the same voice channel as the bot
		}
	}
}
