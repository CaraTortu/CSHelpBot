import type {
    ChatInputCommandInteraction,
    CommandInteraction,
    ContextMenuCommandBuilder,
    MessageContextMenuCommandInteraction,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
} from "discord.js";
//import { ping } from "./ping"
import { logs } from "./logs";
import { search } from "./search";
import { all } from "./all";

export type Command =
    | {
          cmd: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
          execute: (interaction: CommandInteraction) => Promise<void>;
      }
    | {
          cmd: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
          execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
      }
    | {
          cmd: ContextMenuCommandBuilder;
          execute: (
              interaction: MessageContextMenuCommandInteraction,
          ) => Promise<void>;
      };

export const commands: Command[] = [
    // ping, // EXAMPLE
    logs,
    search,
    all,
];
