# @elizaos/plugin-autonome Documentation

## Overview
### Purpose
The @elizaos/plugin-autonome is designed to enhance the Eliza agent's capabilities by integrating dynamic contextual information and facilitating complex interactions within an agent runtime environment. It leverages various components such as providers, actions, and evaluators to supply real-time data, modify agent behavior, and build long-term conversational memory, thus ensuring the agent can respond accurately and intelligently to user inputs.

### Key Features
Integration with external systems for real-time data access,Support for dynamic contextual information injection,Ability to perform complex task handling via actions,Evaluation of conversations to extract insights and track progress,Seamless formatting of information for conversational templates

## Installation
### Installation and Integration Instructions for @elizaos/plugin-autonome

#### 1. Add the plugin to your ElizaOS project:
   - Add the following to your agent/package.json dependencies:
     ```json
     {
       "dependencies": {
         "@elizaos/plugin-autonome": "workspace:*"
       }
     }
     ```
   - cd into the agent/ directory
   - Run `pnpm install` to install the new dependency
   - Run `pnpm build` to build the project with the new plugin

#### 2. Import and Use the Plugin:
   - Import the plugin using: `import { autonomePlugin } from "@elizaos/plugin-autonome";`
   - Add the plugin to the AgentRuntime plugins array

#### 3. Integration Example:
   ```typescript
   import { autonomePlugin } from "@elizaos/plugin-autonome";

   return new AgentRuntime({
       // other configuration...
       plugins: [
           autonomePlugin,
           // other plugins...
       ],
   });
   ```

#### 4. Verification Steps:
   - Ensure you see ["✓ Registering action: <plugin actions>"] in the console to verify successful integration

### Note:
- This plugin is dependent on specific versions of other packages, make sure to install those peer dependencies as well.

## Configuration
# Configuration Documentation

To configure the application, you will need to set the following environment variables in a .env file. Please make sure to add the .env file to your .gitignore to prevent sensitive information from being committed to the repository.

## Required Environment Variables

1. `DATABASE_URL`: 
   - Purpose: Specifies the URL for connecting to the database.
2. `API_KEY`:
   - Purpose: Specifies the API key required for authentication.

## Example .env File

```plaintext
DATABASE_URL=your_database_url_here
API_KEY=your_api_key_here
```

## Features

### Actions
### LAUNCH_AGENT
Launch an Eliza agent

#### Properties
- Name: LAUNCH_AGENT
- Similes: CREATE_AGENT, DEPLOY_AGENT, DEPLOY_ELIZA, DEPLOY_BOT

#### Handler
The handler for this action launches an Eliza agent by generating launch content, validating it, and sending a POST request to the Autonome RPC to create the agent. It also provides a callback with the success or error message.

#### Examples
- User: "Launch an agent, name is xiaohuo"
- Agent: "I'll launch the agent now..."
- Agent: "Successfully launch agent, id is ba2e8369-e256-4a0d-9f90-9c64e306dc9f"



### Providers
No providers documentation available.

### Evaluators
No evaluators documentation available.

## Usage Examples
### actions/launchAgent.ts

### Common Use Cases
1. Checking if a provided content is of type LaunchAgentContent:
```typescript
import { isLaunchAgentContent } from './actions/launchAgent';

const content = {
  name: 'Example Launch Agent',
  config: 'exampleConfig'
};

if (isLaunchAgentContent(content)) {
  console.log('The content is of type LaunchAgentContent');
} else {
  console.log('The content is not of type LaunchAgentContent');
}
```

2. Using the LaunchAgentContent interface to define the content of a launch agent:
```typescript
import { LaunchAgentContent } from './interfaces';

const newLaunchAgent: LaunchAgentContent = {
  name: 'New Launch Agent',
  config: 'newConfig'
};
console.log(newLaunchAgent);
```

### Best Practices
- Use the isLaunchAgentContent function to ensure that the provided content is of the correct type before using it in other parts of the code.
- Utilize the LaunchAgentContent interface to maintain consistency and clarity in defining the content structure for launch agents.

## FAQ
### Q: My action is registered, but the agent is not calling it
Ensure that action's name clearly aligns with the task, and ensure you give a detailed description of the conditions that should trigger the action.

### Q: Can the plugin integrate with custom data sources?
Yes, by implementing a custom provider, you can inject dynamic data from external systems into the agent runtime, thus enabling custom data source integration.

### Q: How do I create a new action for interacting with an API?
To create a new action, define its unique name, description, and implementation within the handler function. Validate the action to ensure it's suitable for the task and provide examples for common usage patterns.

### Q: How can the agent maintain long-term memory of interactions?
By using evaluators, the agent can store and retrieve information from past interactions, track goals, and maintain contextual awareness, thus enabling long-term memory capability.

### Q: Is it possible to extend the agent to perform sentiment analysis?
Yes, by utilizing or creating a provider that connects to a sentiment analysis API, the agent can be extended to perform real-time sentiment analysis on user inputs.

### Q: What should I do if the agent fails to extract required information from a conversation?
Check the implementation of the evaluator to ensure it's correctly set up to process the conversation data and that the extraction logic is aligned with the information requirements.

## Development

### TODO Items
No TODO items found.

## Troubleshooting Guide
### Agent is not responding to specific actions
- Cause: Action handler is not correctly implemented or the action is not registered
- Solution: Verify that the action is correctly registered with a valid handler implementation and matches the expected invocation conditions.

### Providers are not retrieving data
- Cause: Providers may not be correctly integrated or configured with external data sources
- Solution: Ensure that the provider is correctly set up with the necessary configurations for the external systems and that any required API keys or access permissions are in place.

### Debugging Tips
- Check console logs for any error messages that can provide insight into the operational issues.
- Validate that all plugins and components are correctly registered and initialized within the agent runtime.
- Use test cases to simulate interactions and pinpoint the failure points within actions or providers.