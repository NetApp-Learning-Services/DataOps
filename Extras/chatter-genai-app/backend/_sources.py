# This code uploads a document file to the server. 
# The document file is received as a POST request and saved to the specified directory. 
# The code checks if a document file is found in the request and returns an error response if no file is found. 
# It then saves the document file to the specified path and returns a success response.
# The sources_api Blueprint is registered in the main.py file to handle document uploads.
# The sources_directory variable is set to the SOURCES_DIRECTORY environment variable, which specifies the directory where the document files are saved.
# The sources_directory will used by _ingest.py to create a vector database.

import os
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from langchain_community.vectorstores.chroma import Chroma
import chromadb
from chromadb.config import Settings

sources_api = Blueprint('sources_api', __name__)

# Get relative path
relativepath = os.path.dirname(__file__)

# Load the environment variables from the .env file or from the system environment variables
load_dotenv()
sources_directory = os.path.join(relativepath,os.environ.get('SOURCES_DIRECTORY'))
embeddings_server_url = os.environ.get("EMBEDDINGS_SERVER_URL")
embeddings_collection = os.environ.get("EMBEDDINGS_COLLECTION")

def is_file_in_collection(filename):
    """
    Check if a file is already in the collection.

    Args:
        filename (str): The name of the file to check.

    Returns:
        bool: True if the file is in the collection, otherwise False.
    """
    chromaClient = chromadb.HttpClient(host=embeddings_server_url, settings=Settings(allow_reset=True))
    db = Chroma(client=chromaClient, collection_name=embeddings_collection)
    collection = db.get()
    current_ingested_files = list(set([metadata['source'] for metadata in collection['metadatas']]))

    print(f'current_ingested_files: {current_ingested_files}')
    returnValue = any(os.path.basename(file) == filename for file in current_ingested_files)
    return returnValue

@sources_api.route('/check_sources', methods=['GET'])
def check_sources():
    """
    Retrieves all the files in the sources_directory and returns a JSON of the file names.
    """
    # Create the sources folder if it doesn't exist
    if not os.path.exists(sources_directory):
        os.makedirs(sources_directory)
    # Get all the files in the sources_directory
    files = os.listdir(sources_directory)
    # Create an array of file names with boolean indicating if they are in the collection
    file_names_with_status = [{'file': file, 'ingested': is_file_in_collection(file)} for file in files]
    # Create a JSON object with the file names
    file_names = {'files': file_names_with_status}
    # Return the JSON object
    return jsonify(file_names)

@sources_api.route('/upload_source', methods=['POST'])
def upload_document():
    """
    Uploads a document file to the serv    
    """
    # Create the sources folder if it doesn't exist
    if not os.path.exists(sources_directory):
        os.makedirs(sources_directory)
    # Get the document file from the request
    document = request.files.get('document')
    # If no document file is found, return an error response
    if not document:
        return jsonify(response="No document file found"), 400  
    # Get the filename of the document
    filename = document.filename
    # If no file is selected, return an error response
    if not filename:
        return jsonify(response="No selected file"), 400
    # Define the save path for the document
    save_path = os.path.join(sources_directory, filename)
    # Save the document file to the specified path
    document.save(save_path)

    # Return a success response
    return jsonify(response="Document upload successful")

@sources_api.route('/reset_sources', methods=['GET'])
def reset_sources():
    """
    Resets the sources directory by deleting the folder and recreating it.
    """
    # Delete all files recursively in the sources_directory
    for root, dirs, files in os.walk(sources_directory):
        for file in files:
            file_path = os.path.join(root, file)
            os.remove(file_path)

    # Delete the collection
    chromaClient = chromadb.HttpClient(host=embeddings_server_url, settings=Settings(allow_reset=True))
    chromaClient.reset()

    # Return a success response
    return jsonify(response="Sources directory reset successful"), 200