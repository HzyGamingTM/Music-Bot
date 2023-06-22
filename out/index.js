"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const process_1 = require("process");
const Commands_js_1 = require("./Commands.js");
const token_json_1 = require("./token.json");
const intents = discord_js_1.GatewayIntentBits.Guilds |
    discord_js_1.GatewayIntentBits.GuildMembers |
    discord_js_1.GatewayIntentBits.GuildMessages |
    discord_js_1.GatewayIntentBits.MessageContent |
    discord_js_1.GatewayIntentBits.GuildVoiceStates;
const client = new discord_js_1.Client({ intents: intents });
client.on(discord_js_1.Events.ClientReady, () => {
    process_1.stdout.write("[Info]: Bot Starting\n");
});
client.on(discord_js_1.Events.MessageCreate, (msg) => __awaiter(void 0, void 0, void 0, function* () {
    let author = msg.author;
    if (author.id == client.user.id)
        return;
    if (author.bot)
        return;
    Commands_js_1.MessageCommands.handle(msg);
}));
client.login(token_json_1.token);
