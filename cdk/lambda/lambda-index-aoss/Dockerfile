FROM public.ecr.aws/lambda/python:3.9

# create code dir inside container
RUN mkdir ${LAMBDA_TASK_ROOT}/source

# copy code to container
COPY "requirements.txt" ${LAMBDA_TASK_ROOT}/source

# copy handler function to container
COPY ./index.py ${LAMBDA_TASK_ROOT}

# install dependencies for running time environment
RUN pip3 install -r ./source/requirements.txt --target "${LAMBDA_TASK_ROOT}"
RUN python3 -m pip install boto3 --upgrade

# set the CMD to your handler
CMD [ "index.handler" ]