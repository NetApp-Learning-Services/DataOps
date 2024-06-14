"use client";

import { SetStateAction, startTransition, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { SquareCheckBig, Square } from 'lucide-react';
import { ResetSources, UploadSource, IngestSources, CheckSources } from "@/server/Sources";

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "../ui/loadingspinner";


export function SourceList({ files }: { files: { file: string, ingested: Boolean }[] }) {
    const [sourceList, setSourceList] = useState(files);
    const [isIngesting, setIsIngesting] = useState(false);
    const [isReseting, setIsReseting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0] != null) {
            setSelectedFile(event.target.files[0]);
        }

    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-row">
                {/* <Label htmlFor="file">Upload</Label> */}
                <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:border file:border-solid file:border-blue-700 file:rounded-md border-blue-600"
                />
                {isUploading ? (
                    <div className="p-2 ms-auto w-fit"><LoadingSpinner /></div>
                ) : (
                    <div className="pl-2 ms-auto">
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                setIsUploading(true)
                                startTransition(async () => {
                                    console.log("Uploading source file...");
                                    if (selectedFile) {
                                        const formData = new FormData();
                                        formData.append("document", selectedFile);
                                        await UploadSource(formData);
                                    }
                                    const fileInput = document.getElementById("file") as HTMLInputElement;
                                    if (fileInput) {
                                        fileInput.value = "";
                                    }
                                    const res = await CheckSources();
                                    setSourceList(res);
                                    setIsUploading(false)
                                })
                            }}
                        >
                            Upload
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex flex-row">
                <Table>
                    {/* <TableCaption>Sources</TableCaption> */}
                    <TableHeader>
                        <TableRow>
                            <TableHead>File</TableHead>
                            <TableHead>Ingested</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sourceList && sourceList.length == 0 ? <TableRow><TableCell className="text-center" colSpan={2}>No files uploaded</TableCell></TableRow> : null}
                        {sourceList && sourceList.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.file}</TableCell>
                                <TableCell>{item.ingested ? <SquareCheckBig /> : <Square />}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex flex-row">
                <div className="p-2">
                    {isIngesting ? (
                        <div className="p-2 ms-auto w-fit"><LoadingSpinner /></div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                setIsIngesting(true)
                                startTransition(async () => {
                                    console.log("Ingesting sources...");
                                    await IngestSources();
                                    const res = await CheckSources();
                                    setSourceList(res);
                                    setIsIngesting(false)
                                })
                            }}
                        >
                            Ingest
                        </Button>
                    )}
                </div>
                <div className="p-2 ms-auto">
                    {isReseting ? (
                        <div className="p-2 ms-auto w-fit"><LoadingSpinner /></div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={(e) => {
                                setIsReseting(true)
                                startTransition(async () => {
                                    console.log("Reseting sources...");
                                    await ResetSources();
                                    const res = await CheckSources();
                                    setSourceList(res);
                                    setIsReseting(false)
                                })
                            }}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </div>
        </div >
    )
}