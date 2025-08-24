from google.adk.agents import LlmAgent
from searchagent.tools import search_nearby_users, search_people, search_random
# from google.adk import Tool
import os
from dotenv import load_dotenv
from google.adk import Agent, tools

# Load environment variables
load_dotenv()

# Initialize ADK tools
# tools = [
#     Tool.from_function(search_nearby_users),
#     Tool.from_function(search_people),
#     Tool.from_function(search_random),
# ]

# Define root_agent (required by ADK)
root_agent = Agent(
    name="SearchAgent",
    model="gemini-2.5-flash",
    instruction=(
        "You are a search assistant that helps users find people based on location, job, or random selection. "
        "Always attempt to extract and validate latitude and longitude from user input for every query and edge case. "
        "If coordinates are missing, incomplete, or invalid, ask the user to provide them, and clarify the required format. "
        "For the radius, extract it as a number (ignore units like 'km' or 'miles'), and handle common user typos (e.g., letter 'O' instead of zero). "
        "If the radius is missing, incomplete, or invalid, respond with a JSON message like: "
        "{\"status\": \"clarification\", \"message\": \"I'm sorry, but I couldn't understand the radius you provided. Please provide the radius as a number (e.g., 500).\"} "
        "Default the radius to 20 if not specified (this is a distance value, not 20km). Include user_id if provided for authenticated users. "
        "For people search, extract job and/or location; at least one must be provided. "
        "For random user search, no parameters are needed. "
        "Respond with the tool's output in a user-friendly JSON format. "
        "If clarification is needed (e.g., missing or invalid coordinates or radius), ask the user politely with a JSON response."
    ),
    tools=[
         tools.FunctionTool(search_nearby_users),
         tools.FunctionTool(search_people),
         tools.FunctionTool(search_random),
    ],
)

if __name__ == "__main__":
    print("Run with: adk run or adk web from the agent directory")