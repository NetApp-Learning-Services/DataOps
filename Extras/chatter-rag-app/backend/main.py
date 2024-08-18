import os
from flask import Flask, request, Response
from flask_cors import CORS

from _models import models_api
from _ingest import ingest_api
from _sources import sources_api
from _prompts import prompts_api

app = Flask(__name__)
app.register_blueprint(models_api)
app.register_blueprint(ingest_api)
app.register_blueprint(sources_api)
app.register_blueprint(prompts_api)

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        res = Response()
        res.headers['X-Content-Type-Options'] = '*'
        return res

if __name__ == '__main__':

    print("Using the following environment variables:")
    print(f"App relative path: {os.path.dirname(__file__)}")
    print(f"Sources directory: {os.environ.get('SOURCES_DIRECTORY')}")
    print(f"Sources minimum size: {os.environ.get('SOURCES_MINIMUM_SIZE')}")
 
    print(f"Models directory: {os.environ.get('MODELS_DIRECTORY')}")
    print(f"Model server: {os.environ.get('MODEL_SERVER')}")

    print(f"LLM server URL: {os.environ.get('LLM_SERVER_URL')}")
    print(f"LLM name: {os.environ.get('LLM_NAME')}")
    print(f"LLM family: {os.environ.get('LLM_FAMILY')}")
    print(f"LLM parameter size: {os.environ.get('LLM_PARAMETER_SIZE')}")
    print(f"LLM temperature: {os.environ.get('LLM_TEMPERATURE')}")
    print(f"LLM top p: {os.environ.get('LLM_TOP_P')}")
    print(f"LLM top k: {os.environ.get('LLM_TOP_K')}")
    print(f"LLM n ctx: {os.environ.get('LLM_N_CTX')}")
    print(f"LLM n batch: {os.environ.get('LLM_N_BATCH')}")

    print(f"Embeddings server URL: {os.environ.get('EMBEDDINGS_SERVER_URL')}")
    print(f"Embeddings name: {os.environ.get('EMBEDDINGS_NAME')}")
    print(f"Embeddings subpath: {os.environ.get('EMBEDDINGS_SUBPATH')}")
    print(f"Embeddings collection: {os.environ.get('EMBEDDINGS_COLLECTION')}")
    print(f"Embeddings top k: {os.environ.get('EMBEDDINGS_TOP_K')}")
    print(f"Embeddings chunk size: {os.environ.get('EMBEDDINGS_CHUNK_SIZE')}")
    print(f"Embeddings chunk overlap: {os.environ.get('EMBEDDINGS_CHUNK_OVERLAP')}")
    print(f"Embeddings download url: {os.environ.get('EMBEDDINGS_DOWNLOAD_URL')}")
    
    print(f'Starting server on port 5000')

    CORS(app)
    app.run(
        host="0.0.0.0",
        port=5000
    )