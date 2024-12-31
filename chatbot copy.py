# conda create --name 'chatWithSql' python=3.10

#  activate the environment

# pip install python-dotenv
# pip install h5py
# pip install typing-extensions
# pip install wheel
# !pip install -r requirements.txt --use-deprecated=legacy-resolver

# pip install streamlit langchain langchain-openai langchain-groq mysql-connector-python python-dotenv

# to run the python alone (streamlit run chatbot.py)



from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
import streamlit as st


# chat_ai = ChatOpenAI(api_key="sk-proj-Cp1nhZRHqPoi3iqmZE2DT3BlbkFJ6ksing17jMI6Ud8WlyOd")

if "chat_history" not in st.session_state:
    st.session_state.chat_history = [
      AIMessage(content="Hello! I'm a Jarvis your assistant. Ask me anything about your comapny."),
    ]

st.set_page_config(
  page_title="RootPoint Chat", 
  page_icon=":speech_balloon:", 
  layout="wide", 
  initial_sidebar_state="expanded")

# st.set_option("theme.base", config.theme_base)
# st.set_option("theme.primaryColor", config.theme_primary_color)
# st.set_option("theme.backgroundColor", config.theme_background_color)
# st.set_option("theme.secondaryBackgroundColor", config.theme_secondary_background_color)
# st.set_option("theme.textColor", config.theme_text_color)
# st.set_option("theme.font", config.theme_font)

# [theme]
# primaryColor="#c4661f"
# backgroundColor="#d3d3d3"
# secondaryBackgroundColor="#a9b388"
# textColor="#425037"



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
    SQL Query: SELECT branch FROM branches WHERE company_id = (SELECT company_id FROM companies WHERE company = 'hilton');
    
    
    Your turn:
    
    Question: {question}
    SQL Query:
    
    """
    
  prompt = ChatPromptTemplate.from_template(template)
  
  # llm = ChatOpenAI(model="gpt-4-0125-preview")
  llm = ChatGroq(model="mixtral-8x7b-32768", temperature=0)
  
  def get_schema(_):
    return db.get_table_info()
  
  return (
    RunnablePassthrough.assign(schema=get_schema)
    | prompt
    | llm
    | StrOutputParser()
  )
  
    
def get_response(user_query: str, db: SQLDatabase, chat_history: list, ratings: dict = None):
  
  # Check for common greetings
    greetings = ["hello", "hi", "hey"]
    if any(greeting in user_query.lower() for greeting in greetings):
        return "Hello! How can I assist you today?"


    # Check for common farewells
    farewells = ["bye", "goodbye", "see you"]
    if any(farewell in user_query.lower() for farewell in farewells):
        return "Goodbye! Have a great day."
      
    # Generate rating suggestions if ratings are provided
    rating_suggestions = generate_rating_suggestions(ratings) if ratings else []

    # Construct SQL processing chain
    sql_chain = get_sql_chain(db)
    
    # SQL Query: <SQL>{query}</SQL>
    template = """
    You are a data analyst at a company. You are interacting with a user who is asking you questions about the company's database.
    Based on the table schema below, question, sql query, and sql response, write a natural language response.
    <SCHEMA>{schema}</SCHEMA>

    Conversation History: {chat_history}
    
    User question: {question}
    SQL Response: {response}
    
    Rating Suggestions: {rating_suggestions}
    """
    
    prompt = ChatPromptTemplate.from_template(template)
    
    llm = ChatGroq(model="mixtral-8x7b-32768", temperature=0)
    
    chain = (
        RunnablePassthrough.assign(query=sql_chain).assign(
            schema=lambda _: db.get_table_info(),
            response=lambda vars: db.run(vars["query"]),
        )
        | prompt
        | llm
        | StrOutputParser()
    )
    
    # Invoke the processing chain
    response = chain.invoke({
        "question": user_query,
        "chat_history": chat_history,
        "rating_suggestions": rating_suggestions,
    })
    
     # Check if the response is empty 
    if not response :
        return "Sorry, I couldn't understand. Please rephrase your question."

    return response


def generate_rating_suggestions(ratings: dict):
    suggestions = []

    # Room Service
    if ratings["Room_Service"] < 4:
        suggestions.append("Consider adding more employees or providing additional training to improve room service.\n\n")

    # Restaurant
    if ratings["Restaurant"] < 4:
        suggestions.append("Consider hiring new chefs, introducing new dishes, or providing additional training to improve restaurant services.\n\n")

    # Sanitary Conditions
    if ratings["Sanitary_Conditions"] < 4:
        suggestions.append("Consider hiring more cleaning staff, upgrading cleaning products, or providing additional training to maintain better sanitary conditions.\n\n")

    # Front Desk
    if ratings["Front_Desk"] < 4:
        suggestions.append("Consider providing additional training to front desk staff or upgrading equipment to enhance customer service.\n\n")

    # Car Parking
    if ratings["Car_Parking"] < 4:
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
        # response = get_response(user_query, st.session_state.db, st.session_state.chat_history)
        response = get_response(user_query, st.session_state.db, st.session_state.chat_history, ratings=None)

        st.markdown(response)
        
    st.session_state.chat_history.append(AIMessage(content=response))
    
    
print(st.session_state)
    
#     # Define SQL processing chain
# sql_chain = get_sql_chain(db)

# # Read user query from stdin
# for line in sys.stdin:
#     data = json.loads(line)
#     user_query = data.get('query', '')

#     # Get response to user query
#     response = get_response(user_query, db, [])

#     # Send response to stdout
#     print(json.dumps({'response': response}))