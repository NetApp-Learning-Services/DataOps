import glob
import os
from dotenv import load_dotenv
from multiprocessing import Pool
from tqdm import tqdm
from flask import jsonify, request, Blueprint
import chromadb
from chromadb.config import Settings
from _embeddingfunction import MyONNXMiniLM_L6_v2
import uuid

# used only if on Linux Mint 20.3
#import pysqlite3
#sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")


from typing import List
from langchain_community.document_loaders import (
    CSVLoader,
    EverNoteLoader,
    PyMuPDFLoader,
    TextLoader,
    UnstructuredEmailLoader,
    UnstructuredEPubLoader,
    UnstructuredHTMLLoader,
    UnstructuredMarkdownLoader,
    UnstructuredODTLoader,
    UnstructuredPowerPointLoader,
    UnstructuredWordDocumentLoader,
)

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores.chroma import Chroma

ingest_api = Blueprint('ingest_api', __name__)

# Get relative path
relativepath = os.path.dirname(__file__)

# List to store the processed files for each ingest round
processed_files = []

# Load the environment variables from the .env file or from the system environment variables
load_dotenv()
sources_directory = os.path.join(relativepath,os.environ.get('SOURCES_DIRECTORY'))
models_directory = os.path.join(relativepath, os.environ.get('MODELS_DIRECTORY'))
embeddings_server_url = os.environ.get("EMBEDDINGS_SERVER_URL")
embeddings_collection = os.environ.get("EMBEDDINGS_COLLECTION")
chunk_size = int(os.environ.get('EMBEDDINGS_CHUNK_SIZE', 350))
chunk_overlap = int(os.environ.get('EMEDDINGS_CHUNK_OVERLAP', 35))
sources_minimun_size = int(os.environ.get('SOURCES_MINIMUM_SIZE', 3))

# Custom document loaders
class MyElmLoader(UnstructuredEmailLoader):
    """Wrapper to fallback to text/plain when default does not work"""

    def load(self) -> List[Document]:
        """Wrapper adding fallback for elm without html"""
        try:
            try:
                doc = UnstructuredEmailLoader.load(self)
            except ValueError as e:
                if 'text/html content not found in email' in str(e):
                    # Try plain text
                    self.unstructured_kwargs["content_source"]="text/plain"
                    doc = UnstructuredEmailLoader.load(self)
                else:
                    raise
        except Exception as e:
            # Add file_path to exception message
            raise type(e)(f"{self.file_path}: {e}") from e

        return doc

# Map file extensions to document loaders and their arguments
LOADER_MAPPING = {
    ".csv": (CSVLoader, {}),
    # ".docx": (Docx2txtLoader, {}),
    ".doc": (UnstructuredWordDocumentLoader, {}),
    ".docx": (UnstructuredWordDocumentLoader, {}),
    ".enex": (EverNoteLoader, {}),
    ".eml": (MyElmLoader, {}),
    ".epub": (UnstructuredEPubLoader, {}),
    ".html": (UnstructuredHTMLLoader, {}),
    ".md": (UnstructuredMarkdownLoader, {}),
    ".odt": (UnstructuredODTLoader, {}),
    ".pdf": (PyMuPDFLoader, {}),
    ".ppt": (UnstructuredPowerPointLoader, {}),
    ".pptx": (UnstructuredPowerPointLoader, {}),
    ".txt": (TextLoader, {"encoding": "utf8"}),
    # Add more mappings for other file extensions and loaders as needed
}

# Function to load a single document based on the file extension
def load_single_document(file_path: str) -> List[Document]:
    # Get the file extension
    ext = "." + file_path.rsplit(".", 1)[-1]

    # Check if the file extension is supported
    if ext in LOADER_MAPPING:
        # Get the loader class and loader arguments based on the file extension
        loader_class, loader_args = LOADER_MAPPING[ext]

        # Create an instance of the loader class with the file path and loader arguments
        loader = loader_class(file_path, **loader_args)

        # Load the document using the loader
        return loader.load()

    # Raise an error if the file extension is not supported
    raise ValueError(f"Unsupported file extension '{ext}'")

# Function to load documents from a source directory, ignoring specified files
def load_documents(source_dir: str, ignored_files: List[str] = []) -> List[Document]:
    """
    Loads all documents from the source documents directory, ignoring specified files
    """

    # use global variable
    global processed_files

    all_files = []
    # Iterate over each file extension in the LOADER_MAPPING dictionary
    for ext in LOADER_MAPPING:
        # Use glob to find all files with the current extension in the source directory and its subdirectories
        all_files.extend(
            glob.glob(os.path.join(source_dir, f"**/*{ext}"), recursive=True)
        )
    # Filter out the ignored files from the list of all files
    filtered_files = [file_path for file_path in all_files if file_path not in ignored_files]
    # keep track of processed files
    processed_files = [os.path.basename(doc) for doc in filtered_files]

    # Use multiprocessing to load the documents in parallel
    with Pool(processes=os.cpu_count()) as pool:
        results = []
        # Use tqdm to display a progress bar while loading the documents
        with tqdm(total=len(filtered_files), desc='Loading new documents', ncols=80) as pbar:
            for i, docs in enumerate(pool.imap_unordered(load_single_document, filtered_files)):
                results.extend(docs)
                pbar.update()

    return results

def process_documents(ignored_files: List[str] = []) -> List[str]:
    """
    Load documents and split them into chunks.

    Args:
        ignored_files (List[str], optional): A list of file names to ignore during document loading. Defaults to [].

    Returns:
        List[str]: A list of text chunks obtained from the loaded documents.
    """
    # use global variable
    global processed_files

    # Print a message indicating that the documents are being loaded
    print(f"Loading documents from {sources_directory}")

    # Print a message indicating the ignored files
    print(f'Ignored files: {ignored_files}')

    # Load the documents from the specified directory, ignoring any files in the ignored_files list
    documents = load_documents(sources_directory, ignored_files)

    # If there are no documents to load, print a message and return an empty list
    if not documents:
        print("No new documents to load")
        processed_files=[]
        return []

    # Print a message indicating the number of documents loaded
    print(f"Loaded {len(documents)} new documents from {sources_directory}")

    # Create a text splitter object with the specified chunk size and overlap
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    # Split the documents into text chunks using the text splitter
    texts = text_splitter.split_documents(documents)

    # Print a message indicating the number of text chunks created
    print(f"Split into {len(texts)} chunks of text (max. {chunk_size} tokens each)")

    # Return the list of text chunks
    return texts

@ingest_api.route('/ingest', methods=['GET'])
def ingest():
    """
    Endpoint for ingesting data into the system.

    This function creates embeddings for the documents and stores them in a vectorstore.
    If the vectorstore already exists, it updates the vectorstore with new documents.
    If the vectorstore does not exist, it creates a new vectorstore.

    Returns:
        A JSON response indicating the success of the data ingestion.
    """

    # Clear out all previous processed files
    # processed_files = []

    # Create embeddings
    embeddings = MyONNXMiniLM_L6_v2(model_path=models_directory)

    chromaClient = chromadb.HttpClient(host=embeddings_server_url, settings=Settings(allow_reset=True))
    #chromaCollection = chromaClient.get_or_create_collection(name=embeddings_collection, embedding_function=embeddings)
    
    db = Chroma(client=chromaClient, collection_name=embeddings_collection, embedding_function=embeddings)
    collection = db.get()
    
    # Process the documents from sources directory, passing the ignored files from the current vectorstore
    texts = process_documents([metadata['source'] for metadata in collection['metadatas']])
    # Add the new document chunks to the existing vectorstore, generating the embeddings in this process
    if not texts:
        print(f"No new documents to ingest")
        return jsonify([])
    print(f"Creating embeddings from {len(texts)} new documents. May take some minutes...")
    # for doc in texts:
    #     chromaCollection.add(
    #         ids=[str(uuid.uuid1())], metadatas=doc.metadata, documents=doc.page_content
    #     )
    db.add_documents(documents=texts)
    #db.persist()
    db = None

    print(f"Ingestion complete for {len(texts)} embedded document(s) from {len(processed_files)} processed file(s).")
    
    # Create a JSON object with the file names
    file_names = {'files': processed_files}
    # Return the JSON object
    return jsonify(file_names)


