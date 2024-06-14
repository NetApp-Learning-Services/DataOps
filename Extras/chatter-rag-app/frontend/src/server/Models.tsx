"use server";

import React from "react";
import LanguageModel from "@/components/sidemodels/LanguageModel.server";
import LanguageModelDownload from "@/components/sidemodels/LanguageModelDownload";
import EmbeddingsModelDownload from "@/components/sidemodels/EmbeddingsModelDownload";
import EmbeddingsModel from "@/components/sidemodels/EmbeddingsModel.server";
import { revalidatePath } from "next/cache";
import { getRuntimeEnvVars } from "./env";

async function checkLanguageModel() {
    const url = getRuntimeEnvVars().SERVER_URL + "/check_language_model";
    console.log("url: " + url);
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export  async function CheckLanguageModel() {
    const res = await checkLanguageModel();
    
    if (!res.ok || res.status == 204) {
        console.log("No language model available");
        return (
            <LanguageModelDownload />
        );
    }

    const jsonData = await res.json();

    console.log("Language model: " + jsonData.response);

    return (
        <LanguageModel model={jsonData.response} />
    );
}

async function checkEmbeddingsModel() {
    const url = getRuntimeEnvVars().SERVER_URL + "/check_embeddings_model";
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export async function CheckEmbeddingsModel() {
    const res = await checkEmbeddingsModel();
    
    if (!res.ok || res.status == 204) {
        console.log("No embeddings model available");
        return (
            <EmbeddingsModelDownload />
        );
    }

    const jsonData = await res.json();

    console.log("Embeddings model: " + jsonData.response);

    return (
        <EmbeddingsModel model={jsonData.response} />
    );
}

async function downloadLanguageModel() {
    const url = getRuntimeEnvVars().SERVER_URL + "/download_language_model";
    console.log("url: " + url);
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export async function DownloadLanguageModel() {
    const res = await downloadLanguageModel();
     
    if (!res.ok) {
        console.log("Error downloading language model");
        revalidatePath("/"); // revalidate the current page
    } else {
        console.log("Language model downloaded");
        revalidatePath("/"); // revalidate the current page
    }

}

async function downloadEmbeddingsModel() {
    const url = getRuntimeEnvVars().SERVER_URL + "/download_embeddings_model";
    console.log("url: " + url);
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export async function DownloadEmbeddingsModel() {
    const res = await downloadEmbeddingsModel();
     
    if (!res.ok) {
        console.log("Error downloading embeddings model");
        revalidatePath("/"); // revalidate the current page
    } else {
        console.log("Embeddings model downloaded");
        revalidatePath("/"); // revalidate the current page
    }

}