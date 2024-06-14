import React from "react";

export default function LanguageModel({ model } : { model: string }) {

    return (
        <div className="flex flex-row">
            <div className="p-2">Language Model</div>
            <div className="p-2 ms-auto">
                {model}
            </div>
        </div>
    )
}