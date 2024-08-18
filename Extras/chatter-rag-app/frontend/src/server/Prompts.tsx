"use server";

import ModalPromptCreativity from "@/components/sideprompts/ModalPromptCreativity";
import ModalPromptTemplate from "@/components/sideprompts/ModalPromptTemplate";
import { promptCreativitySchema } from "@/components/sideprompts/PromptCreativitySchema";
import{ promptTemplateSchema } from "@/components/sideprompts/PromptTemplateSchema";  
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRuntimeEnvVars } from "./env";

async function getPromptCreativity() {
    const url = getRuntimeEnvVars().SERVER_URL + "/get_prompt_creativity";
    console.log("url: " + url);
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export  async function GetPromptCreativity() {
    const res = await getPromptCreativity();
    
    if (!res.ok || res.status == 204) {
        console.log("No prompt creativity available");
        return (
            <ModalPromptCreativity temperature={0} topk={0} topp={0} />
        );
    }

    const jsonData = await res.json();

    console.log("Temperature: " + jsonData.temperature);
    console.log("Top K: " + jsonData.topk);
    console.log("Top P: " + jsonData.topp);

    return (
        <ModalPromptCreativity temperature={jsonData.temperature} topk={jsonData.topk} topp={jsonData.topp} />
    );
}

async function setPromptCreativity(temperature: number, topk: number, topp: number) {
    const url = getRuntimeEnvVars().SERVER_URL + "/set_prompt_creativity";
    console.log("url: " + url);
    return await fetch(url, {
        cache: 'no-store',
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            temperature: temperature,
            topk: topk,
            topp: topp
        })
    });
}

export async function SetPromptCreativityFromModal(
    values: z.infer<typeof promptCreativitySchema>) {

    const temperature = values.temperature ? values.temperature : 0;
    const topk = values.topk ? values.topk : 0;
    const topp = values.topp ? values.topp : 0;

    const res = await setPromptCreativity(temperature, topk, topp);

    if (!res.ok) {
        console.log("Error setting prompt creativity");
    } else {
        console.log("Prompt creativity set successfully");
    }
    revalidatePath("/");
}

async function getPromptTemplate() {
    const url = getRuntimeEnvVars().SERVER_URL + "/get_prompt_template";
    console.log("url: " + url);
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export  async function GetPromptTemplate() {
    const res = await getPromptTemplate();
    
    if (!res.ok || res.status == 204) {
        console.log("No prompt template available");
        return (
            <ModalPromptTemplate template={[]} />
        );
    }

    const jsonData = await res.json();

    console.log("Template: " + jsonData.template);

    return (
        <ModalPromptTemplate template={jsonData.template} />
    );
}

async function setPromptTemplate(template: Array<Array<string>>) {
    const url = getRuntimeEnvVars().SERVER_URL + "/set_prompt_template";
    console.log("url: " + url);
    return await fetch(url, {
        cache: 'no-store',
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(template)
    });
}

export async function SetPromptTemplateFromModal(
    template: Array<Array<string>>) {

    //Add validation check here

    const res = await setPromptTemplate(template);

    if (!res.ok) {
        console.log("Error setting prompt template");
    } else {
        console.log("Prompt template set successfully");
    }
    revalidatePath("/");
}