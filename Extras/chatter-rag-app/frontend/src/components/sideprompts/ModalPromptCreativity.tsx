"use client";
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { Slider } from "@/components/ui/slider"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SetPromptCreativityFromModal } from "@/server/Prompts";
import { promptCreativitySchema } from "@/components/sideprompts/PromptCreativitySchema";
import { z } from 'zod';


export default function ModalPromptCreativity({ temperature, topk, topp } : { temperature: number, topk : number, topp: number}) {
    const [openDialog, setOpenDialog] = useState(false);

    const initialState = { 
        temperature: temperature,
        topk: topk,
        topp: topp,
    };
    
    const form = useForm({
        resolver: zodResolver(promptCreativitySchema),
        defaultValues: initialState,
    });

    function onSubmit(values: z.infer<typeof promptCreativitySchema>) {
        setOpenDialog(false);
        SetPromptCreativityFromModal(values);
    }

    return (
        <>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline">Creativity</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Prompt Creativity</DialogTitle>
                        <DialogDescription>Set the creativity parameters for the prompt</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form 
                           id="prompt-creativity-form"
                           onSubmit={form.handleSubmit(onSubmit)}
                           className="space-y-8">
                            <FormField
                                control={form.control}
                                name="temperature"
                                render={({ field: { value, onChange } }: { field: { value: number, onChange: (value: number) => void } }) => (

                                    <FormItem>
                                        <FormLabel>Temperature - {value}</FormLabel>
                                        <FormControl>
                                            <Slider
                                                defaultValue={[value]}
                                                onValueChange={(vals) => { onChange(vals[0]); }}
                                                min={0}
                                                max={5} //TODO: check the max value
                                                step={0.1}
                                                className="mb-3"
                                            />
                                        </FormControl>
                                        
                                        <FormDescription>Amount of randomness to be added to requests</FormDescription>
                                    </FormItem>

                                )}
                            />
                            <FormField
                                control={form.control}
                                name="topk"
                                render={({ field: { value, onChange } }: { field: { value: number, onChange: (value: number) => void } }) => (

                                    <FormItem>
                                        <FormLabel>Top K - {value}</FormLabel>
                                        <FormControl>
                                            <Slider
                                                defaultValue={[value]}
                                                onValueChange={(vals) => { onChange(vals[0]); }}
                                                min={0}
                                                max={300} //TODO: check the max value
                                                step={1}
                                                className="mb-3"
                                            />
                                        </FormControl>
                                        
                                        <FormDescription>Limit the number of tokens in requests</FormDescription>
                                    </FormItem>

                                )}
                            />
                            <FormField
                                control={form.control}
                                name="topp"
                                render={({ field: { value, onChange } }: { field: { value: number, onChange: (value: number) => void } }) => (

                                    <FormItem>
                                        <FormLabel>Top P - {value}</FormLabel>
                                        <FormControl>
                                            <Slider
                                                defaultValue={[value]}
                                                onValueChange={(vals) => { onChange(vals[0]); }}
                                                min={0}
                                                max={1} //TODO: check the max value
                                                step={0.1}
                                                className="mb-3"
                                            />
                                        </FormControl>
                                       
                                        <FormDescription>Probability of similar tokens to be used</FormDescription>
                                    </FormItem>

                                )}
                            />


                        </form>
                    </Form>
                    <DialogFooter>
                        <Button type="submit" form='prompt-creativity-form'>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

