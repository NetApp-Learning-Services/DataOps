"use server";

import { SourceList } from "@/components/sidesources/SourceList";
import { revalidatePath } from "next/cache";
import { getRuntimeEnvVars } from "./env";

async function checkSources() {
    const url = getRuntimeEnvVars().SERVER_URL + "/check_sources";
    console.log("url: " + url);
    const res = await fetch(url, {cache: "no-store"});
    return res;
}

export  async function GenerateSources() {
    const res = await checkSources();
    
    if (!res.ok || res.status == 204) {
        console.log("No sources available");
        return (
            <SourceList files={[]} />
        );
    }

    const jsonData = await res.json();

    console.log("Files: " + jsonData.files);

    return (
        <SourceList files={jsonData.files} />
    );
}

export  async function CheckSources() {
    const res = await checkSources();
    
    if (!res.ok || res.status == 204) {
        console.log("No sources available");
        return [];
        
    }

    const jsonData = await res.json();

    console.log("Files: " + jsonData.files);

    return jsonData.files;
}

async function uploadSource(formData: FormData) {
    const url = getRuntimeEnvVars().SERVER_URL + "/upload_source";
    console.log("url: " + url);
    return await fetch(url, {
        cache: 'no-store',
        method: "POST",
        body: formData
    });
}

export async function UploadSource(formData: FormData) {
    const res = await uploadSource(formData);

    if (!res.ok) {
        console.log("Error uploading source file");
    } else {
        console.log("Source file uploaded successfully");
    }
    revalidatePath("/");
}

async function resetSources() {
    const url = getRuntimeEnvVars().SERVER_URL + "/reset_sources";
    console.log("url: " + url);
    return await fetch(url, {cache: 'no-store'});
}

export async function ResetSources() {
    const res = await resetSources();

    if (!res.ok) {
        console.log("Error resetting sources");
    } else {
        console.log("Sources reset successfully");
    }
    revalidatePath("/");
}

async function ingestSources() {
    const url = getRuntimeEnvVars().SERVER_URL + "/ingest";
    console.log("url: " + url);
    return await fetch(url, {cache: 'no-store'});
}

export async function IngestSources() {
    const res = await ingestSources();

    if (!res.ok) {
        console.log("Error ingesting sources");
    } else {
        console.log("Sources ingested successfully");
    }
    revalidatePath("/");
}