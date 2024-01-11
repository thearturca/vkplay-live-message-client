import VKPLMessageClient from "../index.js";
import { APITypes } from "../types/ApiTypes.js";
import { TVKPLMessageClient } from "../types/libTypes.js";
import { VKPLApiService } from "./VKPLApiService.js";

const markdownLinkRegex = /(?:__|[*#])|\[(.*?)\]\((.*?)\)/gm;

export class MessageService {
      constructor(private authToken: string, public smiles: Map<string, string>) {
      }

      public async sendMessage(message: string, channel: string, mentionUsers?: number[], threadId?: number): Promise<APITypes.TMessageResponse> {
            const serializedMessage = { data: JSON.stringify(this.serializeMessage(message, mentionUsers)) };
            const body = new URLSearchParams(serializedMessage);

            if (threadId)
                  body.set("reply_to_id", threadId.toString());

            const res = await VKPLApiService.sendMessage(channel, this.authToken, body.toString());

            if (VKPLMessageClient.debugLog)
                  console.warn("[debug:send-message] ", JSON.stringify(res, null, 4));

            return res;
      }

      static replaceMarkdownLinks(message: string): [string, RegExpMatchArray[]] {
            const markdownLinks = Array.from(message.matchAll(markdownLinkRegex));
            return [
                  message.replaceAll(markdownLinkRegex, (substring) => {
                        const index = markdownLinks.findIndex(link => link[0] === substring);
                        return "__markdownLink+" + index.toString() + "__";
                  }),
                  markdownLinks
            ];
      }

      public serializeMessage(message: string, mentionIds?: number[]): APITypes.TMessageBlock[] {
            const serializedMessage: APITypes.TMessageBlock[] = [];

            if (mentionIds)
                  for (const mentionId of mentionIds)
                        serializedMessage.push(...this.getMentionBlock(mentionId));

            const [messageWithoutMarkdownLinks, markdownLinks] = MessageService.replaceMarkdownLinks(message);
            const splitedMessage: string[] = messageWithoutMarkdownLinks.split(" ");
            let textStack: string = "";

            for (const word of splitedMessage)
                  if (this.smiles.has(word)) {
                        if (textStack != "") {
                              serializedMessage.push(...this.getTextBlock(textStack));
                              textStack = "";
                        }

                        serializedMessage.push(...this.getSmileBlock(word, this.smiles.get(word)!));
                  } else if (word.startsWith("https://") || word.startsWith("http://")) {
                        if (textStack != "") {
                              serializedMessage.push(...this.getTextBlock(textStack));
                              textStack = "";
                        }

                        serializedMessage.push(...this.getLinkBlock(word, word));
                  } else if (word.startsWith("__markdownLink+") && word.endsWith("__")) {
                        const mdlIndex = Number(word.slice("__markdownLink+".length, -2));

                        if (!isNaN(mdlIndex) && markdownLinks[mdlIndex]) {
                              if (textStack != "") {
                                    serializedMessage.push(...this.getTextBlock(textStack));
                                    textStack = "";
                              }

                              serializedMessage.push(...this.getLinkBlock(markdownLinks[mdlIndex][2], markdownLinks[mdlIndex][1] || markdownLinks[mdlIndex][2]));
                        }
                  } else {
                        textStack += word + " ";
                  }

            if (textStack != "")
                  serializedMessage.push(...this.getTextBlock(textStack));

            return serializedMessage;
      }

      private getSmileBlock(word: string, smileId: string): APITypes.TMessageBlock[] {
            return [
                  this.getBlockEnd(),
                  { type: "smile", id: smileId, name: word },
                  this.getBlockEnd(),
            ];
      }

      private getTextBlock(text: string): APITypes.TMessageBlock[] {
            return [
                  { type: "text", content: JSON.stringify([text, "unstyled", []]), modificator: "" }
            ];
      }

      private getBlockEnd(): APITypes.TMessageBlock {
            return { type: "text", content: "", modificator: "BLOCK_END" };
      }

      private getMentionBlock(userId: number): APITypes.TMessageBlock[] {
            return [
                  this.getBlockEnd(),
                  { type: "mention", id: userId },
                  this.getBlockEnd(),
            ];
      }

      private getLinkBlock(link: string, text?: string): APITypes.TMessageBlock[] {
            return [
                  {
                        explicit: false,
                        type: "link",
                        content: JSON.stringify([text ?? link, "unstyled", []]),
                        url: link
                  },
                  ...this.getTextBlock(" ")
            ];
      }

      public static deserializeMessage(message: APITypes.TMessageBlock[]): TVKPLMessageClient.DeserializedMessage {
            const deserializedMessage: TVKPLMessageClient.DeserializedMessage = {
                  smiles: [],
                  text: "",
                  mentions: [],
                  links: [],
            };

            for (const block of message)
                  switch (block.type) {
                        case 'mention':
                              const blockAsBlockMention: APITypes.TMessageBlockMention = block as APITypes.TMessageBlockMention;
                              deserializedMessage.mentions.push({
                                    displayName: blockAsBlockMention.displayName,
                                    name: blockAsBlockMention.name,
                                    nick: blockAsBlockMention.nick,
                                    userId: blockAsBlockMention.id
                              });

                              if ((block as APITypes.TMessageBlockMention).displayName)
                                    deserializedMessage.text = deserializedMessage.text.trim() + " " + blockAsBlockMention.displayName;

                              break;

                        case 'text':
                              deserializedMessage.text = deserializedMessage.text.trim() + " " + (block.content && block.content.length > 0 ? JSON.parse(block.content)[0] : "");
                              break;

                        case 'smile':
                              deserializedMessage.smiles.push(block as APITypes.TMessageBlockSmile);
                              deserializedMessage.text = deserializedMessage.text.trim() + " " + (block as APITypes.TMessageBlockSmile).name
                              break;

                        case 'link':
                              deserializedMessage.links.push({
                                    text: block.content,
                                    url: (block as APITypes.TMessageBlockLink).url,
                              });
                              deserializedMessage.text = deserializedMessage.text.trim() + " " + (block.content && block.content.length > 0 ? JSON.parse(block.content)[0] : "");
                              break;

                        default:
                              break;
                  };

            deserializedMessage.text = deserializedMessage.text.trim();

            return deserializedMessage;
      }
}
