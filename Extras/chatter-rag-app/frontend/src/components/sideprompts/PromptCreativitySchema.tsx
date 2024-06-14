import { z } from "zod";

export const promptCreativitySchema = z.object({
    temperature: z.number(),
    topk: z.number(),
    topp: z.number(),
});