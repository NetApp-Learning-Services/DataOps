"use client";

import React, { startTransition } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loadingspinner";
import { DownloadEmbeddingsModel } from "@/server/Models";

export default function EmbeddingsModelDownload() {

    const [downloadEmbeddingsModelInProgress, setdownloadEmbeddingsModelInProgress] = useState(false);

    return (
        <>
            <div className="flex flex-row">

                <div className="p-2">Embeddings Model</div>
                {downloadEmbeddingsModelInProgress ? (
                    <div className="p-2 ms-auto w-fit"><LoadingSpinner /></div>
                ) : (
                    <div className="p-2 ms-auto">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                setdownloadEmbeddingsModelInProgress(true)
                                startTransition(async () => {
                                    console.log("Downloading embeddings model");
                                    await DownloadEmbeddingsModel();
                                    setdownloadEmbeddingsModelInProgress(false)
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