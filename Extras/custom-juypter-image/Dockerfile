FROM kubeflownotebookswg/jupyter-scipy:v1.7.0

# install graphviz
USER root
RUN apt-get update && \
    apt-get install -y graphviz 
# install sudo
RUN apt-get install -y sudo && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# add a new user with necessary permssions
RUN adduser --disabled-password --gecos "" admin \ 
    && usermod -aG sudo admin \ 
    && echo "admin ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

ENV NB_PREFIX /

CMD ["sh","-c", "jupyter lab --notebook-dir=/home/${NB_USER} --ip=0.0.0.0 --no-browser --allow-root --port=8888 --NotebookApp.token='' --NotebookApp.password='' --NotebookApp.allow_origin='*' --NotebookApp.base_url=${NB_PREFIX}"]