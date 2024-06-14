# Description: This file contains the code to download the LLM and embeddings models.
# NOTE: This code is not complete and is intended to be used as a reference for the final implementation.
# The final implementation will include additional error handling and validation to ensure the models are downloaded successfully.
# This code requires environment variables to be set for the model paths and URLs.
# The download_models function requires about 8 GB of free disk space to download the models.

from io import BytesIO
import os
from zipfile import ZipFile
from dotenv import load_dotenv
from flask import Blueprint, jsonify, Response
from _embeddingfunction import MyONNXMiniLM_L6_v2

from ollama import Client

models_api = Blueprint('models_api', __name__)

# Get relative path
relativepath = os.path.dirname(__file__)

# Load the environment variables from the .env file or from the system environment variables
load_dotenv()
models_directory = os.path.join(relativepath, os.environ.get('MODELS_DIRECTORY'))
llm_server_url = os.environ.get("LLM_SERVER_URL")
llm_name = os.environ.get("LLM_NAME")
llm_family = os.environ.get("LLM_FAMILY")
llm_parameter_size = os.environ.get("LLM_PARAMETER_SIZE")
embeddings_name = os.environ.get("EMBEDDINGS_NAME")
embeddings_subpath = os.environ.get("EMBEDDINGS_SUBPATH")
embeddings_path = os.path.join(models_directory, embeddings_subpath)
embeddings_download_url = os.environ.get("EMBEDDINGS_DOWNLOAD_URL") 

@models_api.route('/check_language_model', methods=['GET'])
def check_llm_model():
    """
    Check if the LLM model is already downloaded.

    Returns:
        llm_model_name if true, otherwise 204 status.
    """
    ollama = Client(host=llm_server_url)
    print(f"Checking LLM model {llm_name}")
    try:
        response = ollama.show(llm_name)
        print(response['details'])
        if (response['details']['family'] == llm_family and 
            response['details']['parameter_size'] == llm_parameter_size):
            return jsonify(response=llm_name)
        else:
            return Response(status=204) # 204 No Content
    except Exception as e:
        print(f"Error checking LLM model: {e}")
        return Response(status=204) # 204 No Content
    
@models_api.route('/download_language_model', methods=['GET'])
def download_llm_model():
    """
    Downloads a file from a given URL and saves it to the local file system.

    Returns:
        A JSON response indicating the status of the download.
    """
    print(f"Downloading LLM model {llm_name} using {llm_server_url}")
    
    # create ollama client
    ollama = Client(host=llm_server_url)
    response = ollama.pull(model=llm_name)
    print(f"Ollama pull: {response}")
    print("LLM model downloaded and ready!")
    # Return a JSON response indicating the status of the download
    return jsonify(response=llm_name)

@models_api.route('/check_embeddings_model', methods=['GET'])
def check_embeddings_model():
    """
    Check if the embeddings model is already downloaded.

    Returns:
        Embedding_model_name if true, otherwise 204 status.
    """
    
    if os.path.exists(embeddings_path):
        return jsonify(response=embeddings_name)
    else:
        return Response(status=204) # 204 No Content

@models_api.route('/download_embeddings_model', methods=['GET'])
def download_embeddings_model():
    """
    Load the embeddings model for the LLM.

    Returns:
        The embeddings model for the LLM.
    """
    print(f"Downloading embeddings model {embeddings_name} into {models_directory}")

    # Create the models folder if it doesn't exist
    if not os.path.exists(models_directory):
        os.makedirs(models_directory)

    # Download the embeddings model
    embeddings = MyONNXMiniLM_L6_v2(model_path=models_directory)
    embeddings.get_model()
        
    print("Embeddings model downloaded and ready!")
    return jsonify(response=embeddings_name)