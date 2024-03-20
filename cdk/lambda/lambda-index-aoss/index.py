# haimtran 07 DEC 2022
# opensearch serverless

from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
import boto3
import json
import os
from datetime import datetime

#
INDEX = "demo"

# chunk size
CHUNK_SIZE = 1000

#
if "BUCKET" in os.environ:
    pass
else:
    os.environ["BUCKET"] = "demo"

# opensearch domain
if "OPENSEARCH_DOMAIN" in os.environ:
    pass
else:
    os.environ["OPENSEARCH_DOMAIN"] = (
        "demo.us-east-1.aoss.amazonaws.com"
    )
    os.environ["REGION"] = "us-east-1"

# bedrock client
bedrock_client = boto3.client("bedrock-runtime", region_name="us-east-1")

# s3 client
s3_client = boto3.client("s3")

# host and opensearch client
host = os.environ["OPENSEARCH_DOMAIN"]
client = boto3.client("opensearchserverless")
region = os.environ["REGION"]
credentials = boto3.Session().get_credentials()

# auth
awsauth = AWS4Auth(
    credentials.access_key,
    credentials.secret_key,
    region,
    "aoss",
    session_token=credentials.token,
)

# opensearch client
aoss_client = OpenSearch(
    hosts=[{"host": host, "port": 443}],
    http_auth=awsauth,
    use_ssl=True,
    verify_certs=True,
    connection_class=RequestsHttpConnection,
    timeout=300,
)


def get_embedded_vector(query: str):
    """
    convert text to embedding vector using bedrock
    """
    # request body
    body = json.dumps({"inputText": query})
    # call bedrock titan
    response = bedrock_client.invoke_model(
        body=body,
        modelId="amazon.titan-embed-text-v1",
        accept="application/json",
        contentType="application/json",
    )
    # get embed vector
    vector = json.loads(response["body"].read())["embedding"]
    # return
    return vector


def load_pdf_to_vectors(key: str):
    """
    load pdf to opensearch
    """
    # filename
    filename = (
        key.split("/").pop().split(".")[0] + "-" + datetime.now().isoformat() + ".pdf"
    )
    # download s3 file YOUR-DEFAULT-AWS-REGION
    s3_client.download_file(os.environ["BUCKET"], key, f"/tmp/{filename}")
    # read pdf file
    loader = PyPDFLoader(f"/tmp/{filename}")
    pages = loader.load_and_split()
    # chunk with fixed size
    text_splitter = CharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=0)
    docs = text_splitter.split_documents(documents=pages)
    # embedding
    vectors = [get_embedded_vector(doc.page_content) for doc in docs]
    # return
    return vectors, docs


def index_vectors_to_aoss(vectors, docs, filename):
    """
    indexing data to opensearch
    """
    # bulk indexing
    data = ""
    for index, doc in enumerate(docs):
        data += json.dumps({"index": {"_index": INDEX}}) + "\n"
        data += (
            json.dumps(
                {
                    "vector_field": vectors[index],
                    "text": doc.page_content,
                    "title": f"{filename} chunk {index}",
                }
            )
            + "\n"
        )
    # bulk index
    aoss_client.bulk(data)
    # return
    return data


def handler(event, context):
    """
    seach
    """
    # get filename from event
    for record in event["Records"]:
        # get key object
        key = record["s3"]["object"]["key"]
        print(key)
        # filename
        filename = key.split("/").pop()
        # load pdf to vectors
        vectors, docs = load_pdf_to_vectors(key=key)
        print(vectors)
        # index vectors to aoss
        data = index_vectors_to_aoss(vectors=vectors, docs=docs, filename=filename)
        print(data)
    # return
    return {
        "statusCode": 200,
        "headers": {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        },
        "body": json.dumps({}),
    }


if __name__ == "__main__":
    # vecs, docs = load_pdf_to_vectors("book/datasheet.pdf")
    # data = index_vectors_to_aoss(vecs, docs)
    # print(data)

    handler(
        event={"Records": [{"s3": {"object": {"key": "book/datasheet.pdf"}}}]},
        context=None,
    )
