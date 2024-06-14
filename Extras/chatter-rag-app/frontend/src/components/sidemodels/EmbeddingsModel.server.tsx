import React from "react";

export default function EmbeddingsModel({ model } : { model: string }) {

    return (
        <div className="flex flex-row">
            <div className="p-2">Embeddings Model</div>
            <div className="p-2 ms-auto">
                {model}
            </div>
        </div>
    )
}