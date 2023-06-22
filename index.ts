import { User, Message, Client, Events, GatewayIntentBits, Attachment } from "discord.js";
import { stdout } from "process";
import { MessageCommands } from "./Commands.js";
import { token } from "./token.json";

const intents: GatewayIntentBits = 
	GatewayIntentBits.Guilds |
	GatewayIntentBits.GuildMembers |
	GatewayIntentBits.GuildMessages |
	GatewayIntentBits.MessageContent |
	GatewayIntentBits.GuildVoiceStates;

const client: Client = new Client({ intents: intents });

client.on(Events.ClientReady, () => {
	stdout.write("[Info]: Bot Starting\n");
});

client.on(Events.MessageCreate, async (msg: Message) => {
	let author: User = msg.author;
	if (author.id == client.user.id) return;
	if (author.bot) return;
	
	MessageCommands.handle(msg);
});

client.login(token);