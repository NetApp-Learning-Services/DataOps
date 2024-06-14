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

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SetPromptTemplateFromModal } from "@/server/Prompts";

import { z } from 'zod';
import { promptTemplateSchema } from '@/components/sideprompts/PromptTemplateSchema';
import { Textarea } from '../ui/textarea';


export default function ModalPromptTemplate({ template }: { template: Array<Array<string>> }) {
    const [promptTemplate, setPromptTemplate] = useState(template);
    const [systemText, setSystemText] = useState(template[0][1]);
    const [openDialog, setOpenDialog] = useState(false);

    const form = useForm({
        resolver: zodResolver(promptTemplateSchema),
        defaultValues: {
            system_prompt: systemText,
        }
    });

    const updateText = (value : string) => { 
        setSystemText(value); 
        setPromptTemplate(prevCompleteText => {
          const updatedCompleteText = [...prevCompleteText];
          updatedCompleteText[0][1] = value;
          return updatedCompleteText;
        });
      };

    function onSubmit(values: z.infer<typeof promptTemplateSchema>) {
        setOpenDialog(false);
        SetPromptTemplateFromModal(promptTemplate);
    }

    return (
        <>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline">Template</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Prompt Template</DialogTitle>
                        <DialogDescription>Set the default template for each prompt</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form
                            id="prompt-template-form"
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8">
                            <FormField
                                control={form.control}
                                name="system_prompt"
                                render={() => (

                                    <FormItem>
                                        <FormLabel>System</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                onChange={(e) => updateText(e.target.value)}
                                                className='flex'
                                                rows={4}
                                                value={systemText}
                                                placeholder='Enter your system prompt template here...'
                                            />
                                        </FormControl>

                                        <FormDescription>Define the nature of LLM system</FormDescription>
                                    </FormItem>

                                )}
                            />
                        </form>
                    </Form>
                    <Table>
                        <TableCaption>The current template</TableCaption>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promptTemplate.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item[0]}</TableCell>
                                    <TableCell>{item[1]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <DialogFooter>
                        <Button type="submit" form='prompt-template-form'>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

