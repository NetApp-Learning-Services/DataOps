import os
from dotenv import load_dotenv
import json
from flask import Blueprint, jsonify, request, Response, stream_with_context, current_app
from langchain_community.vectorstores.chroma import Chroma
from langchain_community.llms.ollama import Ollama
from langchain.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from ollama import Client
import chromadb
from _embeddingfunction import MyONNXMiniLM_L6_v2

prompts_api = Blueprint('prompts_api', __name__)

# Get relative path
relativepath = os.path.dirname(__file__)

# Load the environment variables from the .env file or from the system environment variables
load_dotenv()
models_directory = os.path.join(relativepath, os.environ.get('MODELS_DIRECTORY'))
llm_server_url = os.environ.get("LLM_SERVER_URL")
llm_model_name = os.environ.get("LLM_NAME")
llm_model_family = os.environ.get("LLM_FAMILY")
llm_model_parameter_size = os.environ.get("LLM_PARAMETER_SIZE")
llm_model_temperature = float(os.environ.get("LLM_TEMPERATURE"))
llm_model_top_p = float(os.environ.get("LLM_TOP_P"))
llm_model_top_k = int(os.environ.get("LLM_TOP_K"))
llm_model_n_ctx = int(os.environ.get("LLM_N_CTX"))
llm_model_n_batch = int(os.environ.get("LLM_N_BATCH"))
embeddings_server_url = os.environ.get("EMBEDDINGS_SERVER_URL")
embeddings_name = os.environ.get("EMBEDDINGS_NAME")
embeddings_subpath = os.environ.get("EMBEDDINGS_SUBPATH")
embeddings_download_url = os.environ.get("EMBEDDINGS_DOWNLOAD_URL") 
embeddings_path = os.path.join(models_directory, embeddings_subpath)
embeddings_collection = os.environ.get("EMBEDDINGS_COLLECTION")
embeddings_top_k = int(os.environ.get("EMBEDDINGS_TOP_K"))
prompt_template = [
        ("system", "You are a technical assistant working for NetApp, the best data management storage company in the world. You are asked to answer questions about a specific topic. You should provide accurate and concise answers to the questions. Please keep your answers short."),
        ("system", "Use these documents as context: {context}"),
        ("human", "{question}"),
        ("ai", "Answer:"),
    ]

prompt = ChatPromptTemplate.from_messages(prompt_template)
llm = Ollama(
        model=llm_model_name, 
        base_url=llm_server_url, 
        keep_alive=-1, # keep alive for the duration of the container
        stop=["<|start_header_id|>", "<|end_header_id|>", "<|eot_id|>", "<|reserved_special_token|>"], 
    )

def check_llm_model():
    """
    Check if the LLM model is already downloaded.

    Returns:
        true if available, otherwise false
    """
    """
    Check if the LLM model is already downloaded.

    Returns:
        llm_model_name if true, otherwise 204 status.
    """
    ollama = Client(host=llm_server_url)
    response = ollama.show(llm_model_name)
    if (response['details']['family'] == llm_model_family and 
        response['details']['parameter_size'] == llm_model_parameter_size):
        return True
    else:
        return False
    
def check_embeddings_model():
    """
    Check if the embeddings model is already downloaded.

    Returns:
        true if available, otherwise false
    """
    if os.path.exists(embeddings_path):
        return True
    else:
        return False

def get_chain():
    """
    Get the chain for the RAG model.    

    Returns:
        chain: the chain for the RAG model
    """
    # Create an instance of the MyONNXMiniLM_L6_v2 embeddings model
    embeddings = MyONNXMiniLM_L6_v2(model_path=models_directory)
    
    # Create a Chroma client to connect to the embeddings database
    chromaClient = chromadb.HttpClient(host=embeddings_server_url)
    
    # Create a Chroma instance with the client, collection name, and the embeddings function
    db = Chroma(client=chromaClient, collection_name=embeddings_collection, embedding_function=embeddings)

    # Create a retriever using the embeddings database with k as the number of top embeddings to retrieve
    retriever = db.as_retriever(k=embeddings_top_k)
    
    # Create a RAG chain that consists of multiple runnables
    rag_chain_from_docs = (
        RunnablePassthrough.assign(context=(lambda x: format_docs(x["context"])))  # Assign the formatted context to the 'context' key
        | prompt  # Use the prompt template to generate a prompt
        | llm  # Use the Ollama language model to generate an answer
        | StrOutputParser()  # Parse the output of the language model as a string
    )

    # Create a parallel runnable that runs the retriever and the question in parallel
    rag_chain_with_source = RunnableParallel(
        {"context": retriever, "question": RunnablePassthrough()}  # Assign the retriever and the question to the respective keys
    ).assign(answer=rag_chain_from_docs)  # Assign the answer from the RAG chain to the 'answer' key

    # Set the chain to be the rag_chain_with_source
    chain = rag_chain_with_source

    return chain

def format_docs(docs):
    """
    Format the documents with two line returns between each document for the RAG model.

    Args:   
        docs: the documents to format

    Returns:    
        formatted_docs: the formatted documents
    """
    return "\n\n".join(doc.page_content for doc in docs)

def generate_tokens(question):
    """
    Generate tokens for the question.
    
    Args:   
        question: the question to generate tokens for

    Yields:
        tokens: the tokens for the question
    """
    for tokens in get_chain().stream({"question": question}):
         yield tokens

@prompts_api.route('/get_answer', methods=['POST'])
def get_answer():
    """
    Get the answer for the question.
    
    Returns:
        the answer for the question
    """

    # Subfuction that generates JSON objects for the question
    def generate_json(question):
        """
        Generate JSON objects for the question.
        
        Args:
            question (str): The question to generate JSON objects for.
            
        Yields: 
            json_bytes (bytes): The JSON objects for the question.
        """
        app = current_app._get_current_object()
        with app.app_context():  # Ensure we're within the application context
            sources = []
            full_response = ""
            skip_first = False
            skip_second = False
            for token in generate_tokens(question):
                if not skip_first:
                    # this is the question repeated
                    skip_first = True
                    print(f'query request: {token}')
                    continue #ignore the first token
                if not skip_second:
                    # this is the context
                    skip_second = True
                    for doc in token["context"]:
                        file = os.path.basename(doc.metadata["source"])
                        sources.append(file)  # Add the filename of the document to the sources list
                    sources = list(set(sources)) # remove duplicates
                    print(f'context request: {token}')
                    continue #ignore the second token
                full_response += token["answer"]
                json_data = {
                    "model": llm_model_name,
                    "query": question,
                    "answer": token["answer"],
                    "source": sources,
                    "done": False
                }
                print (f"partial answer: {token}")
                json_str = json.dumps(json_data)  # Convert JSON data to a string
                json_bytes = json_str.encode('utf-8')  # Encode JSON string to bytes
                yield json_bytes # Yield JSON bytes
                yield b'\n'  # Yield newline as bytes

            # Once streaming is finished, yield one last JSON object with "done" set to True
            json_data = {
                "model": llm_model_name,
                "query": question,
                "answer": full_response,
                "source": sources,
                "done": True
            }
            print (f"full answer: {full_response}")
            json_str = json.dumps(json_data)  # Convert JSON data to a string
            json_bytes = json_str.encode('utf-8')  # Encode JSON string to bytes
            yield json_bytes # Yield JSON bytes for the last object

    # This is the main function that will be called when the API is invoked
    # Check if the LLM and embeddings models are available
    if not check_llm_model():
        return "Language model not available", 400
    if not check_embeddings_model():
        return "Emeddings model not available", 400
    
    query = request.json # Get the query from the Post request of the API /get_answer
    if query==None and query=="":
        return "Empty query",400
    print(f"Query received: {query}")
    output=stream_with_context(generate_json(query)) # Get the streamed JSON objects for the question  
    return Response(output, content_type='application/json') # Return the response as a JSON object


@prompts_api.route('/get_prompt_template', methods=['GET'])
def get_prompt_template():
    """
    Get the prompt template.
    
    Returns:
        the prompt template    
    """
    return jsonify(template=prompt_template)

@prompts_api.route('/set_prompt_template', methods=['POST'])
def set_prompt_template():
    """
    Set the prompt template.
    
    Returns:
        200 status code
    """
    rawtemplate = request.json
    template = list(tuple(x) for x in rawtemplate) # convert to list of tuples
    global prompt_template 
    prompt_template = template
    global prompt
    prompt = ChatPromptTemplate.from_messages(prompt_template)
    return Response(status=200)

@prompts_api.route('/get_prompt_creativity', methods=['GET'])
def get_prompt_creativity():
    """
    Get the prompt creativity.
    
    Returns:
        the prompt creativity
    """
    return jsonify(temperature=llm_model_temperature, topp=llm_model_top_p, topk=llm_model_top_k)

@prompts_api.route('/set_prompt_creativity', methods=['POST'])
def set_prompt_creativity():
    """
    Set the prompt creativity.
    
    Returns:
        200 status code    
    """
    query = request.json
    print(query)
    global llm_model_temperature, llm_model_top_p, llm_model_top_k
    llm_model_temperature = float(query['temperature'])
    llm_model_top_p = float(query['topp'])
    llm_model_top_k = int(query['topk'])
    global llm
    llm.temperature = llm_model_temperature
    llm.top_p = llm_model_top_p
    llm.top_k = llm_model_top_k
    return Response(status=200)