"use client";

// FORM IMPORTS
import { set, z } from "zod";
import { Button } from "../ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "../ui/input";

// HOOK IMPORTS
import { BaseSyntheticEvent, useEffect, useRef, useState } from "react";
import { LoadingSpinner } from "../ui/loadingspinner";
import { flushSync } from "react-dom";

export default function MainContainer() {

    interface ISource {
        name: string
    }

    interface IJsonResponse {
        model: string,
        query: string,
        answer: string,
        source: ISource[],
        done: boolean,
    }

    interface IMessage {
        isBot: boolean,
        msg: string,
        source: ISource[],
        done: boolean,
    }

    const [chat, setChat] = useState<IMessage[]>([]);
    const [partialquestion, setPartialQuestion] = useState("");
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const focus = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const getAnswer = async (
        _question: string,
        _signal: AbortController
    ) => {
        const response = await fetch("/api/generate", {
            cache: 'no-store',
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(_question),
            signal: _signal.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP error: Status ${response.status}`);
        }

        return response;
    };

    useEffect(() => {
        const abortController = new AbortController();

        const requestAsk = async () => {
            try {

                const res = await getAnswer(question, abortController);

                // this is a sample partial response
                // response:  {"model": "llama3:8b", "query": "Hello", "answer": " have", "source": [], "done": false}

                let newChat: IMessage = {
                    isBot: true,
                    msg: "",
                    source: [],
                    done: false,

                };
                setChat((chat) => [...chat, newChat]);
                const reader = res.body!.getReader();
                const processStream = async () => {
                    while (true) {

                        const { done, value } = await reader.read();
                        if (done) {
                            console.log('stream completed');
                            setLoading(false);
                            break;
                        }
                        if (value == null) { break; }
                        let chunk = new TextDecoder('utf-8').decode(value);
                        chunk = chunk.replace(/^data: /, '');
                        try {

                            if (chunk === '\n' || chunk === '\n\n') {
                                newChat.msg += ""
                            } else {
                                const data: IJsonResponse = JSON.parse(JSON.parse(chunk));
                                console.log(data);

                                if (data.done) {
                                    abortController.abort();
                                    newChat.msg = data.answer;
                                    newChat.done = true;
                                    setChat((chat) => [...chat.slice(0, chat.length - 1), newChat]);
                                    break;
                                }

                                newChat.msg += data.answer;
                            }

                            setChat((chat) => [...chat.slice(0, chat.length - 1), newChat]);

                        }
                        catch (e) {
                            console.log(e);
                            continue; // maybe should be break
                        }
                    }
                    setLoading(false);
                }
                processStream().catch(err => console.log('--stream error--', err));

            } catch (err: unknown) {
                const error = err as Error;
                console.log(error.message.toString());
            } finally {
            }
        };
        if (requesting) {
            requestAsk();
        }
    }, [requesting]);

    useEffect(() => {
        if (!loading) {
            focus();
            form.reset({ ask: "" });
            setRequesting(false);
            setQuestion("");
            setPartialQuestion("");
        }
    }, [loading]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chat]);

    // FORM OBJECTS/FUNCTIONS
    const formSchema = z.object({
        ask: z.string().min(4, {
            message: "Your question must be at least 4 characters.",
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ask: "",
        },
    })

    const handleInputChanges = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPartialQuestion(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    const onSubmit: { (values: { ask: string; }): Promise<void>; (data: { ask: string; }, event?: BaseSyntheticEvent<object, any, any> | undefined): unknown; } = async (values: z.infer<typeof formSchema>) => {
        console.log(values);
        setQuestion(values.ask);
        flushSync(() => {
            // write the question to the interface
            setChat((chat) => [...chat, { isBot: false, msg: values.ask, done: true, source: [] }]);
        });
        setLoading(true);
        setRequesting(true);
    }

    // RETURN

    return (
        <div className="flex w-full">

            <div className="mx-2 md:px-12 sm:py-6 chat-scroll w-full" >

                {chat.length > 0 ? (
                    chat.map((msg, index) => (
                        <div key={index} className="w-full">
                            <div
                                className={
                                    msg.isBot
                                        ? " p-6 text-start w-full min-w-full bot-msg mb-3"
                                        : " p-6 text-start w-full min-w-full user-msg mb-3"
                                }
                            >
                                <div className="">
                                    {msg.isBot ? (
                                        <span style={{ fontSize: "12px" }}>Chatter</span>
                                    ) : (
                                        <span style={{ fontSize: "12px" }}>User</span>
                                    )}
                                </div>
                                <div className="min-w-full w-full">
                                    <div>
                                        {msg.isBot ? (
                                            <>
                                                {msg.msg == null ? (
                                                    <div>
                                                        <span className="blinking-cursor"> █</span>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <span>{msg.msg}</span>
                                                        {/* <span style={{ fontSize: "12px" }}>
                                                            {msg.source != null && msg.source[0] != ""
                                                                ? "Source: " + msg.source[0]["name"]
                                                                : ""}
                                                        </span> */}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            msg.msg
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))

                ) : (

                    <div className="">
                        <h1 className="flex items-center justify-center text-4xl font-bold">Chatter by NetApp Learning Services</h1>
                        <p className="flex items-center justify-center text-lg text-gray-600">A private discourse with your docs</p>
                    </div>

                )}
                {loading ? <LoadingSpinner /> : null}
                <div className="mt-4" ref={bottomRef} />
            </div>
            <div className="fixed inset-x-0 bottom-0">
                <div className="m-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="flex justify-center items-center space-x-2">
                                <div className="flex-auto">
                                    <FormField
                                        control={form.control}
                                        name="ask"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl
                                                    ref={inputRef}
                                                    id="uniqueaskid"
                                                    onChange={handleInputChanges}>
                                                    <Input
                                                        disabled={loading}
                                                        placeholder="What would you like to chat about?" {...field} />
                                                </FormControl>
                                                {/* <FormMessage /> */}
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex-0 mx-2">
                                    <Button type="submit" disabled={loading}>Submit</Button>
                                </div>
                            </div>
                        </form>
                    </Form >
                </div>
            </div>
        </div>
    );
}