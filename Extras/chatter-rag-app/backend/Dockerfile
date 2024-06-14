FROM python:3.11.5-slim-bookworm

WORKDIR /app

RUN apt-get update
RUN apt-get install build-essential -y
RUN python -m pip install pip==24.0
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt --no-cache-dir

ADD models/ models/
ADD sources/ sources/

COPY . .

CMD [ "python3", "main.py" ]