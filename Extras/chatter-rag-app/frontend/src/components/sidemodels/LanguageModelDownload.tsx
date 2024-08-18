"use client";

import React, { startTransition } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loadingspinner";
import { DownloadLanguageModel } from "@/server/Models";

export default function LanguageModelDownload() {

    const [downloadLanguageModelInProgress, setdownloadLanguageModelInProgress] = useState(false);

    return (
        <>
            <div className="flex flex-row">

                <div className="p-2">Language Model</div>
                {downloadLanguageModelInProgress ? (
                    <div className="p-2 ms-auto w-fit"><LoadingSpinner /></div>
                ) : (
                    <div className="p-2 ms-auto">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                setdownloadLanguageModelInProgress(true)
                                startTransition(async () => {
                                    console.log("Downloading language model");
                                    await DownloadLanguageModel();
                                    setdownloadLanguageModelInProgress(false)
                                })
                            }}
                        >
                            Download
                        </Button>
                    </div>
                )}
            </div>
        </>
    )
}