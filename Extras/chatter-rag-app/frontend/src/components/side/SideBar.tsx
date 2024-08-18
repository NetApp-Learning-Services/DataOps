"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu as MenuIcon } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"



export default function SideBar({ child0, child1, child2, child3, child4 }: { child0: React.ReactNode, child1: React.ReactNode, child2: React.ReactNode, child3: React.ReactNode, child4: React.ReactNode }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>

            {/* This button will trigger open the mobile sheet menu */}
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" >
                    <MenuIcon />
                </Button>
            </SheetTrigger>

            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>Configure the models and settings for the app</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col items-start">
                    <Accordion type="single" collapsible className='w-full'>
                        <AccordionItem value="item-0">
                            <AccordionTrigger>Sources</AccordionTrigger>
                            <AccordionContent>
                                {child0}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Models</AccordionTrigger>
                            <AccordionContent>
                                {child1}
                                {child2}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Prompts</AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-row">
                                    <div className="p-2">{child3}</div>
                                    <div className="p-2 ms-auto">{child4}</div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </SheetContent>

        </Sheet>
    );
}