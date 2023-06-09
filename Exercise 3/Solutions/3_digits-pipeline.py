from datetime import datetime
import kfp
import kfp.dsl as dsl
import kfp.onprem as onprem
import kfp.components as components
from typing import NamedTuple

# Container images
clone_step_container_image: str = "curtisab/ndot-jupyter-scipy:v1alpha1"
shape_step_container_image: str = "curtisab/ndot-jupyter-scipy:v1alpha1"
train_step_container_image: str = "curtisab/ndot-jupyter-scipy:v1alpha1"
serve_step_container_image: str = "public.ecr.aws/j1r0q0g6/notebooks/notebook-servers/jupyter-tensorflow-full:v1.5.0"

# Clone Volumes Step
def clone_step(
    user_namespace: str = "kubeflow-user-example-com",
    clone_step_train_pvc_existing: str = "digits-train",
    clone_step_valid_pvc_existing: str = "digits-valid",
    clone_step_train_pvc: str = "digits-train-clone",
    clone_step_valid_pvc: str = "digits-valid-clone"
):
    print("Data Clone Step")
    
    """
    Clone the existing volumes
    Export clone pvc name
    """

    from netapp_dataops.k8s import clone_volume
    
    clone_volume(
        source_pvc_name=clone_step_train_pvc_existing, 
        new_pvc_name=clone_step_train_pvc, 
        namespace=user_namespace, 
        print_output=True)
    clone_volume(
        source_pvc_name=clone_step_valid_pvc_existing, 
        new_pvc_name=clone_step_valid_pvc, 
        namespace=user_namespace, 
        print_output=True)

# Shape Data Step
def shape_step(
    shape_step_train_mountpoint: str = "/mnt/train",
    shape_step_valid_mountpoint: str = "/mnt/valid"
) :

    import os
    import numpy as np
    import pandas as pd

    DATA_TRAIN_FILE = os.path.join(shape_step_train_mountpoint,'train.csv')
    TRAIN_DF = pd.read_csv(DATA_TRAIN_FILE)
    TRAIN_X = TRAIN_DF.drop('label', axis=1)
    TRAIN_Y = TRAIN_DF.label
    # Reshape image in 3 dimensions (height = 28px, width = 28px , channel = 1)... This is needed for the Keras API
    TRAIN_X = TRAIN_X.values.reshape(-1,28,28,1)
    # Normalize the data
    # Each pixel has a value between 0-255. Here we divide by 255, to get values from 0-1
    TRAIN_X = TRAIN_X /255.0
    DATA_TRAIN_X_FILE = os.path.join(shape_step_train_mountpoint, "train_x.npy")
    np.save(DATA_TRAIN_X_FILE, TRAIN_X)
    print('File saved: ' + DATA_TRAIN_X_FILE)
    DATA_TRAIN_Y_FILE = os.path.join(shape_step_train_mountpoint, "train_y.npy")
    np.save(DATA_TRAIN_Y_FILE, TRAIN_Y)
    print('File saved: ' + DATA_TRAIN_Y_FILE)

    DATA_VALID_FILE = os.path.join(shape_step_valid_mountpoint,'valid.csv')
    VALID_DF = pd.read_csv(DATA_VALID_FILE)
    VALID_X = VALID_DF.drop('label', axis=1)
    VALID_Y = VALID_DF.label
    # Reshape image in 3 dimensions (height = 28px, width = 28px , channel = 1)... This is needed for the Keras API
    VALID_X = VALID_X.values.reshape(-1,28,28,1)
    # Normalize the data
    # Each pixel has a value between 0-255. Here we divide by 255, to get values from 0-1
    VALID_X = VALID_X /255.0 
    DATA_VALID_X_FILE = os.path.join(shape_step_valid_mountpoint, "valid_x.npy")
    np.save(DATA_VALID_X_FILE, VALID_X)
    print('File saved: ' + DATA_VALID_X_FILE)
    DATA_VALID_Y_FILE = os.path.join(shape_step_valid_mountpoint, "valid_y.npy")
    np.save(DATA_VALID_Y_FILE, VALID_Y)
    print('File saved: ' + DATA_VALID_Y_FILE)

# Train Model Step
def train_step(    
    no_epochs:int = 1,   
    optimizer: str = "adam",
    train_step_train_mountpoint: str = "/mnt/train",
    train_step_valid_mountpoint: str = "/mnt/valid",
    train_step_model_mountpoint: str = "/mnt/model"
) -> NamedTuple('Output', [('mlpipeline_ui_metadata', 'UI_metadata'),('mlpipeline_metrics', 'Metrics')]):

    print("Model Generation Step")

    """
    Build the model with Keras API
    Export model parameters
    """
    import os
    from tensorflow import keras
    import tensorflow as tf
    import numpy as np
    import pandas as pd
    import json

    # Construct the model structure
    
    model = keras.models.Sequential()
    model.add(keras.layers.Conv2D(64, (3, 3), activation='relu', input_shape=(28,28,1)))
    model.add(keras.layers.MaxPool2D(2, 2))

    model.add(keras.layers.Flatten())
    model.add(keras.layers.Dense(64, activation='relu'))

    model.add(keras.layers.Dense(32, activation='relu'))

    model.add(keras.layers.Dense(10, activation='softmax')) # Output are 10 classes, numbers from 0-9

    # Show model summary - how it looks
    stringlist = []
    model.summary(print_fn=lambda x: stringlist.append(x))
    metric_model_summary = "\n".join(stringlist)
    
    # Compile the model - we want to have a binary outcome
    model.compile(optimizer=optimizer,
              loss="sparse_categorical_crossentropy",
              metrics=['accuracy'])

    # Get the data
    DATA_TRAIN_X_FILE = os.path.join(train_step_train_mountpoint, "train_x.npy")
    x_train = np.load(DATA_TRAIN_X_FILE)
    
    DATA_TRAIN_Y_FILE = os.path.join(train_step_train_mountpoint, "train_y.npy")
    y_train = np.load(DATA_TRAIN_Y_FILE)
    
    # Fit the model and return the history while training
    history = model.fit(
      x=x_train,
      y=y_train,
      epochs=no_epochs,
      batch_size=20,
    )
    
    DATA_VALID_X_FILE = os.path.join(train_step_valid_mountpoint, "valid_x.npy")
    x_test = np.load(DATA_VALID_X_FILE)

    DATA_VALID_Y_FILE = os.path.join(train_step_valid_mountpoint, "valid_y.npy")
    y_test = np.load(DATA_VALID_Y_FILE)
    

    # Test the model against the test dataset
    # Returns the loss value & metrics values for the model in test mode.
    model_loss, model_accuracy = model.evaluate(x=x_test,y=y_test)
    
    # Confusion Matrix

    # Generates output predictions for the input samples.
    test_predictions = model.predict(x=x_test)

    # Returns the indices of the maximum values along an axis.
    test_predictions = np.argmax(test_predictions,axis=1) # the prediction outputs 10 values, we take the index number of the highest value, which is the prediction of the model

    # Generate confusion matrix
    confusion_matrix = tf.math.confusion_matrix(labels=y_test,predictions=test_predictions)
    confusion_matrix = confusion_matrix.numpy()
    vocab = list(np.unique(y_test))
    data = []
    for target_index, target_row in enumerate(confusion_matrix):
        for predicted_index, count in enumerate(target_row):
            data.append((vocab[target_index], vocab[predicted_index], count))

    df_cm = pd.DataFrame(data, columns=['target', 'predicted', 'count'])
    cm_csv = df_cm.to_csv(header=False, index=False)
    
    metadata = {
        "outputs": [
            {
                "type": "confusion_matrix",
                "format": "csv",
                "schema": [
                    {'name': 'target', 'type': 'CATEGORY'},
                    {'name': 'predicted', 'type': 'CATEGORY'},
                    {'name': 'count', 'type': 'NUMBER'},
                  ],
                "target_col" : "actual",
                "predicted_col" : "predicted",
                "source": cm_csv,
                "storage": "inline",
                "labels": [0,1,2,3,4,5,6,7,8,9]
            },
            {
                'storage': 'inline',
                'source': '''# Model Overview
## Model Summary

```
{}
```

## Model Performance

**Accuracy**: {}
**Loss**: {}

'''.format(metric_model_summary,model_accuracy,model_loss),
                'type': 'markdown',
            }
        ]
    }
    
    metrics = {
      'metrics': [{
          'name': 'model_accuracy',
          'numberValue':  float(model_accuracy),
          'format' : "PERCENTAGE"
        },{
          'name': 'model_loss',
          'numberValue':  float(model_loss),
          'format' : "PERCENTAGE"
        }]}
    
    ### Save model to the storage
    from datetime import datetime
    now = datetime.now()
    DATA_MODEL_VERSION = now.strftime("%Y-%m-%d-%H-%M-%S")
    DATA_MODEL_VERSION_PATH = os.path.join(train_step_model_mountpoint, DATA_MODEL_VERSION)
    os.makedirs(DATA_MODEL_VERSION_PATH, exist_ok=True)
    keras.models.save_model(model,DATA_MODEL_VERSION_PATH)

    ### Save model to the version 1 folder
    import shutil
    DATA_MODEL_V1_PATH = os.path.join(train_step_model_mountpoint, "1")
    if os.path.exists(DATA_MODEL_V1_PATH) and os.path.isdir(DATA_MODEL_V1_PATH):
        # Delete the old version
        shutil.rmtree(DATA_MODEL_V1_PATH) 
    # Recreate the version 1 folder
    os.makedirs(DATA_MODEL_V1_PATH, exist_ok=False)
    keras.models.save_model(model,DATA_MODEL_V1_PATH)
    
    print("Saved model to the model volume twice")
    
    from collections import namedtuple
    output = namedtuple('output', ['mlpipeline_ui_metadata', 'mlpipeline_metrics'])
    return output(json.dumps(metadata),json.dumps(metrics))

# Serve Model Step
def serve_step(
    train_step_model_pvc_existing: str = "digits-model",
    user_namespace: str = "kubeflow-user-example-com"
):
    """
    Create kserve instance
    """
    from kubernetes import client 
    from kserve import KServeClient
    from kserve import constants
    from kserve import utils
    from kserve import V1beta1InferenceService
    from kserve import V1beta1InferenceServiceSpec
    from kserve import V1beta1PredictorSpec
    from kserve import V1beta1TFServingSpec
    from datetime import datetime

    print("Model Serve Step")

    namespace = user_namespace

    now = datetime.now()
    v = now.strftime("%Y-%m-%d--%H-%M-%S")

    name='digits-recognizer-{}'.format(v)
    kserve_version='v1beta1'
    api_version = constants.KSERVE_GROUP + '/' + kserve_version
    pvc_path = "pvc://" + train_step_model_pvc_existing 
    print("Path to pvc: " + pvc_path)

    isvc = V1beta1InferenceService(api_version=api_version,
                                   kind=constants.KSERVE_KIND,
                                   metadata=client.V1ObjectMeta(
                                       name=name, namespace=namespace, annotations={'sidecar.istio.io/inject':'false'}),
                                   spec=V1beta1InferenceServiceSpec(
                                   predictor=V1beta1PredictorSpec(
                                       tensorflow=(V1beta1TFServingSpec(
                                           storage_uri=pvc_path))))
    )

    KServe = KServeClient()
    KServe.create(isvc)
    

# Create components from the step functions
comp_clone = components.create_component_from_func(
    clone_step, 
    base_image=clone_step_container_image,
    packages_to_install=['netapp-dataops-k8s==2.4.0', 'kfp==1.8.20', 'jsonschema==4.17.3', 'requests==2.25.1'])

comp_shape = components.func_to_container_op(
    shape_step, 
    base_image=shape_step_container_image)

comp_train= components.create_component_from_func(
    train_step, 
    base_image=train_step_container_image, 
    packages_to_install=['tensorflow==2.12.0'])

comp_serve = components.create_component_from_func(
    serve_step,
    base_image=serve_step_container_image,
    packages_to_install=['kserve==0.10.1'])

# Define the Pipeline Metadata
@dsl.pipeline(
    name='digits-recognizer-pipeline',
    description='Detect digits'
)
# Main Method To Construct the Pipeline
def create_pipe(
    no_epochs: int = 1,
    optimizer = "adam",
    user_namespace = "kubeflow-user-example-com",
    clone_step_train_pvc_existing = "digits-train",
    clone_step_valid_pvc_existing = "digits-valid",
    clone_step_train_pvc = "digits-train-clone",
    clone_step_valid_pvc= "digits-valid-clone",
    shape_step_train_mountpoint = "/mnt/train",
    shape_step_valid_mountpoint = "/mnt/valid",
    train_step_train_mountpoint = "/mnt/train",
    train_step_valid_mountpoint = "/mnt/valid",
    train_step_model_mountpoint = "/mnt/model",
    train_step_model_pvc_existing = "digits-model",
    serve_step_model_pvc_existing = "digits-model",
):


    step1 = comp_clone(
        user_namespace,
        clone_step_train_pvc_existing,
        clone_step_valid_pvc_existing,
        clone_step_train_pvc,
        clone_step_valid_pvc)
    step2 = comp_shape(
        shape_step_train_mountpoint, 
        shape_step_valid_mountpoint)
    step2.apply(
        onprem.mount_pvc(clone_step_train_pvc, 'train', shape_step_train_mountpoint)
    )
    step2.apply(
        onprem.mount_pvc(clone_step_valid_pvc, 'valid', shape_step_valid_mountpoint)
    )
    step2.after(step1)

    step3 = comp_train(
        no_epochs, 
        optimizer, 
        train_step_train_mountpoint, 
        train_step_valid_mountpoint, 
        train_step_model_mountpoint)
    step3.apply(
        onprem.mount_pvc(clone_step_train_pvc, 'train', train_step_train_mountpoint)
    )
    step3.apply(
        onprem.mount_pvc(clone_step_valid_pvc, 'valid', train_step_valid_mountpoint)
    )
    step3.apply(
        onprem.mount_pvc(train_step_model_pvc_existing, 'model', train_step_model_mountpoint)
    )
    step3.after(step2)
    step4 = comp_serve(
        serve_step_model_pvc_existing, 
        user_namespace)
    step4.after(step3)

# The MAIN Function That Runs All Previous Code
if __name__ == "__main__":
    client = kfp.Client()

    arguments = {
        "no_epochs" : 1,
        "optimizer": "adam",
        "user_namespace": "kubeflow-user-example-com",
        "clone_step_train_pvc_existing": "digits-train",
        "clone_step_valid_pvc_existing": "digits-valid",
        "clone_step_train_pvc": "digits-train-clone",
        "clone_step_valid_pvc": "digits-valid-clone",
        "shape_step_train_mountpoint":  "/mnt/train",
        "shape_step_valid_mountpoint": "/mnt/valid",
        "train_step_train_pvc_existing": "digits-model",
        "train_step_train_mountpoint":  "/mnt/train",
        "train_step_valid_mountpoint": "/mnt/valid",
        "serve_step_train_pvc_existing": "digits-model",
    }

    now = datetime.now()
    pipe_version = now.strftime("%Y-%m-%d-%H-%M-%S")
    pipe_name = "digits-pipe-" + pipe_version
    pipe_file = pipe_name + ".yaml"
    pipe_description = "A sample digit recognizer pipeline"

    # Set this to 1 to run in Kubeflow instead of creating a yaml
    run_directly = 0
    
    if (run_directly == 1):
        client.create_run_from_pipeline_func(create_pipe,arguments=arguments,experiment_name=pipe_name)
    else:
        kfp.compiler.Compiler().compile(pipeline_func=create_pipe,package_path=pipe_file)
        #client.upload_pipeline_version(pipeline_package_path=pipe_file,pipeline_version_name=pipe_version,pipeline_name=pipe_name,description=pipe_description)