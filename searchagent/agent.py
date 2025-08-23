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
    model="gemini-2.0-flash",
    instruction=(
        "You are a search assistant that helps users find people based on location, job, or random selection. "
        "Use the provided tools to handle queries. For nearby users, extract latitude, longitude, and radius "
        "(default to 10km if not specified). If coordinates are missing, ask the user to provide them. Include "
        "user_id if provided for authenticated users. For people search, extract job and/or location. At least one "
        "must be provided. For random user search, no parameters are needed. Respond with the tool's output in a "
        "user-friendly JSON format. If clarification is needed (e.g., missing coordinates), ask the user politely "
        "with a JSON response."
    ),
    tools=[
         tools.FunctionTool(search_nearby_users),
         tools.FunctionTool(search_people),
         tools.FunctionTool(search_random),
    ],
)

# if __name__ == "__main__":
#     print("Run with: adk run or adk web from the agent directory")