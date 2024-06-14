import { z } from "zod";

export const promptTemplateSchema = z.object({
    system_prompt: z.string(),
});