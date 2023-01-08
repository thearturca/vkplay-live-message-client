import fetch from "node-fetch";
import { APITypes } from "../types/ApiTypes";
import { TVKPLMessageClient } from "../types/libTypes";

export class MessageService
{
      constructor(private authToken: string, public smiles: Map<string, string>)
      {
      }

      public async sendMessage(message: string, channel: string, mentionUser?: number): Promise<void>
      {
            try
            {
                  const serializedMessage = { data: JSON.stringify(this.serializeMessage(message, mentionUser)) };
                  await fetch(`https://api.vkplay.live/v1/blog/${channel}/public_video_stream/chat`, 
                  { 
                        method: "POST", 
                        headers: 
                        {
                              Authorization: `Bearer ${this.authToken}`, 
                              "Content-type": "application/x-www-form-urlencoded"
                        }, 
                        body: new URLSearchParams(serializedMessage).toString()
                  })
                  // .then(res => res.json()).then(console.log);
            }
            catch (e)
            {
                  console.error(e);
            }
      }

      public serializeMessage(message: string, mentionId?: number): APITypes.TMessageBlock[]
      {
            const serializedMessage: APITypes.TMessageBlock[] = [];

            if (mentionId)
                  serializedMessage.push(...this.getMentionBlock(mentionId));

            const splitedMessage: string[] = message.split(" ");
            let textStack: string = "";
            for (const word of splitedMessage)
                  if (this.smiles.has(word))
                  {
                        serializedMessage.push(...this.getTextBlock(textStack));
                        textStack = " ";

                        serializedMessage.push(...this.getSmileBlock(word, this.smiles.get(word)!));
                  }
                  else
                        textStack += word + " ";
            
            if (textStack != "")
                  serializedMessage.push(...this.getTextBlock(textStack));

            return serializedMessage;
      }

      private getSmileBlock(word: string, smileId: string): APITypes.TMessageBlock[]
      {
            return [ 
                  { type: "text", content: "", modificator: "BLOCK_END" },
                  { type: "smile", id: smileId, name:  word},
                  { type: "text", content: "", modificator: "BLOCK_END" },
            ];
      }

      private getTextBlock(text: string): APITypes.TMessageBlock[]
      {
            return [{ type: "text", content: JSON.stringify([text, "unstyled", []]), modificator: "" }];
      }

      private getBlockEnd(): APITypes.TMessageBlock[]
      {
            return [{ type: "text", content: "", modificator: "BLOCK_END" }];
      }

      private getMentionBlock(userId: number): APITypes.TMessageBlockMention[]
      {
            return [{ type: "mention", id: userId }]
      }

      public static deserializeMessage(message: APITypes.TMessageBlock[]): TVKPLMessageClient.DeserializedMessage
      {
            let deserializedMessage: string = "";
            const emotesInMessage: APITypes.TMessageBlockSmile[] = [];
            for (const block of message)
            switch (block.type)
            {
                  case 'text':
                        deserializedMessage = deserializedMessage.trim() + " " + (block.content && block.content.length > 0 ? JSON.parse(block.content)[0] : "");
                        break;

                  case 'smile':
                        emotesInMessage.push(block as APITypes.TMessageBlockSmile);
                        deserializedMessage = deserializedMessage.trim() + " " + (block as APITypes.TMessageBlockSmile).name
                        break;

                  default:
                        break; 
            };

            return {text: deserializedMessage.trim(), smiles: emotesInMessage};
      }
}
