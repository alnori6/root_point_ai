# conda create --name 'chatWithSql' python=3.10

#  activate the environment

# pip install python-dotenv
# pip install h5py
# pip install typing-extensions
# pip install wheel
# !pip install -r requirements.txt --use-deprecated=legacy-resolver

# pip install streamlit langchain langchain-openai langchain-groq mysql-connector-python python-dotenv

# to run the python alone (streamlit run chatbot.py)


# what is the highest rating in riyadh branch

import re
import spacy
import logging
from spacy.matcher import PhraseMatcher
from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
# If you prefer to use ChatGroq, uncomment the line below
# from langchain_groq import ChatGroq
import streamlit as st

# Load NLP model
nlp = spacy.load('en_core_web_sm')

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Streamlit session state
if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
        # Added SystemMessage to define assistant's behavior
        SystemMessage(content="You are a helpful assistant that answers questions about the company's database."),
        AIMessage(content="Hello! I'm Jarvis, your assistant. Ask me anything about your company."),
    ]

st.set_page_config(
    page_title="RootPoint Chat",
    page_icon=":speech_balloon:",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.title("Welcome to RootPoint Chatbot")

def init_database(user: str, password: str, host: str, port: str, database: str) -> SQLDatabase:
    db_uri = f"mysql+mysqlconnector://{user}:{password}@{host}:{port}/{database}"
    return SQLDatabase.from_uri(db_uri)

def get_sql_chain(db):
    template = """
    You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
    Based on the table schema below, write a SQL query that would answer the user's question. Take the conversation history into account.

    <SCHEMA>{schema}</SCHEMA>

    Conversation History: {chat_history}

    Write only the SQL query and nothing else. Do not wrap the SQL query in any other text, not even backticks.

    For example:
    Question: which 3 artists have the most tracks?
    SQL Query: SELECT ArtistId, COUNT(*) as track_count FROM Track GROUP BY ArtistId ORDER BY track_count DESC LIMIT 3;

    Question: Name 10 artists
    SQL Query: SELECT Name FROM Artist LIMIT 10;

    Question: what are the hilton branches
    SQL Query: SELECT branch FROM branches WHERE company_id = (SELECT company_id FROM companies WHERE company = 'Hilton');

    Question: Which service has the best rating in the Riyadh branch?
    SQL Query: SELECT service, average_rating FROM (
        SELECT 'Room_Service' AS service, AVG(Room_Service) AS average_rating
        FROM customer_rating
        WHERE branch_id IN (SELECT branch_id FROM branches WHERE branch = 'Riyadh branch')

        UNION ALL

        SELECT 'Restaurant' AS service, AVG(Restaurant) AS average_rating
        FROM customer_rating
        WHERE branch_id IN (SELECT branch_id FROM branches WHERE branch = 'Riyadh branch')

        UNION ALL

        SELECT 'Sanitary_Conditions' AS service, AVG(Sanitary_Conditions) AS average_rating
        FROM customer_rating
        WHERE branch_id IN (SELECT branch_id FROM branches WHERE branch = 'Riyadh branch')

        UNION ALL

        SELECT 'Front_Desk' AS service, AVG(Front_Desk) AS average_rating
        FROM customer_rating
        WHERE branch_id IN (SELECT branch_id FROM branches WHERE branch = 'Riyadh branch')

        UNION ALL

        SELECT 'Car_Parking' AS service, AVG(Car_Parking) AS average_rating
        FROM customer_rating
        WHERE branch_id IN (SELECT branch_id FROM branches WHERE branch = 'Riyadh branch')
    ) AS services
    ORDER BY average_rating DESC
    LIMIT 1;

    Your turn:

    Question: {question}
    SQL Query:
    """

    prompt = ChatPromptTemplate.from_template(template)

    # Update the model to 'gpt-4o-mini'
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    def get_schema(_):
        return db.get_table_info()

    return (
        RunnablePassthrough.assign(schema=get_schema)
        | prompt
        | llm
        | StrOutputParser()
    )



def get_response(user_query: str, db: SQLDatabase, chat_history: list, ratings: dict = None):
    # Preprocess the user query (if applicable)
    original_query = user_query
    # If you have a preprocess_query function, uncomment the line below
    # user_query = preprocess_query(user_query)
    logging.info(f"Original User Query: {original_query}")

    # Split the user query into words
    user_words = user_query.lower().split()

    # Check for common greetings and farewells using exact matches
    greetings = ["hello", "hi", "hey"]
    farewells = ["bye", "goodbye", "see you"]

    if any(greeting == word for greeting in greetings for word in user_words):
        return "Hello! How can I assist you today?"

    if any(farewell == word for farewell in farewells for word in user_words):
        return "Goodbye! Have a great day."

    # Generate rating suggestions if ratings are provided
    rating_suggestions = generate_rating_suggestions(ratings) if ratings else []

    # Construct SQL processing chain
    sql_chain = get_sql_chain(db)

    # Template for the final response
    template = """
    You are a helpful assistant that answers questions about the company's database.

    Based on the table schema below, user question, SQL query, and SQL response, provide a clear and concise natural language answer.

    <SCHEMA>{schema}</SCHEMA>

    User question: {question}
    SQL Query: {query}
    SQL Response: {response}

    Rating Suggestions: {rating_suggestions}
    """

    prompt = ChatPromptTemplate.from_template(template)

    # Update the model to 'gpt-4o-mini'
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
    # If you prefer to use ChatGroq, uncomment the line below
    # llm = ChatGroq(model="mixtral-8x7b-32768", temperature=0)

    def extract_sql_query(query_text):
        # import re
        # Match from 'SELECT' or other SQL keywords to the end
        match = re.search(r"(SELECT|WITH|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b[\s\S]*", query_text, re.IGNORECASE)
        if match:
            return match.group(0).strip()
        else:
            # If no SQL command is found, return the original text
            return query_text.strip()

    chain = (
        RunnablePassthrough.assign(query=sql_chain)
        .assign(
            schema=lambda _: db.get_table_info(),
            # Extract the SQL query before executing
            clean_query=lambda vars: extract_sql_query(vars["query"]),
            response=lambda vars: db.run(vars["clean_query"]),
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    # Invoke the processing chain
    try:
        response = chain.invoke({
            "question": user_query,
            "chat_history": chat_history,
            "rating_suggestions": rating_suggestions,
        })
    except Exception as e:
        logging.error(f"Error during processing: {str(e)}")
        return "Sorry, I couldn't process your request due to an internal error."

    # Check if the response is empty
    if not response:
        return "Sorry, I couldn't understand. Please rephrase your question."

    return response

def generate_rating_suggestions(ratings: dict):
    suggestions = []

    # Room Service
    if ratings and ratings.get("Room_Service", 5) < 4:
        suggestions.append("Consider adding more employees or providing additional training to improve room service.\n\n")

    # Restaurant
    if ratings and ratings.get("Restaurant", 5) < 4:
        suggestions.append("Consider hiring new chefs, introducing new dishes, or providing additional training to improve restaurant services.\n\n")

    # Sanitary Conditions
    if ratings and ratings.get("Sanitary_Conditions", 5) < 4:
        suggestions.append("Consider hiring more cleaning staff, upgrading cleaning products, or providing additional training to maintain better sanitary conditions.\n\n")

    # Front Desk
    if ratings and ratings.get("Front_Desk", 5) < 4:
        suggestions.append("Consider providing additional training to front desk staff or upgrading equipment to enhance customer service.\n\n")

    # Car Parking
    if ratings and ratings.get("Car_Parking", 5) < 4:
        suggestions.append("Consider implementing a passkey system for residents, expanding parking areas, or enhancing parking management to improve car parking services.\n\n")

    # Generate overall suggestion
    if not suggestions:
        suggestions.append("Congratulations! Everything seems excellent.\n\n")

    return suggestions

load_dotenv()

# Define database connection parameters
HOST = "localhost"
PORT = "8889"
USER = "root"
PASSWORD = "root"
DATABASE = "root_point"

# Initialize database connection
db = init_database(USER, PASSWORD, HOST, PORT, DATABASE)

st.session_state.db = db

# Display chat history
for message in st.session_state.chat_history:
    if isinstance(message, AIMessage):
        with st.chat_message("AI"):
            st.markdown(message.content)
    elif isinstance(message, HumanMessage):
        with st.chat_message("Human"):
            st.markdown(message.content)

user_query = st.chat_input("Type a message...")

if user_query is not None and user_query.strip() != "":
    st.session_state.chat_history.append(HumanMessage(content=user_query))

    with st.chat_message("Human"):
        st.markdown(user_query)

    with st.chat_message("AI"):
        response = get_response(user_query, st.session_state.db, st.session_state.chat_history, ratings=None)
        st.markdown(response)

    st.session_state.chat_history.append(AIMessage(content=response))

# Optional: Print session state for debugging
# print(st.session_state)