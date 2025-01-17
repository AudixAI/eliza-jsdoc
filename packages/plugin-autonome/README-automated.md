# @elizaos/plugin-autonome Documentation

## Overview
### Purpose
The @elizaos/plugin-autonome is designed to enhance the functionality and adaptability of agents within the Eliza operating system by providing support for launch agents. It accomplishes this by utilizing interfaces and functionality that identify and interact with launch agent content. The plugin serves as a bridge to access dynamic contextual data by integrating launch agents efficiently with external systems.

### Key Features
Interface representation of launch agent contents to ensure consistent data structures.,Functionality to verify if content is of type LaunchAgentContent.,Support for dynamic integration with providers to manage real-time data and external system interactions.,Action definitions for agents to personalize behaviors and strategic responses.,Evaluator components for extracting insights and maintaining contextual awareness.

## Installation
## Installation and Integration Instructions for @elizaos/plugin-autonome

### Adding the Plugin to Your ElizaOS Project:

1. Add the following to your agent/package.json dependencies:
   ```json
   {
     "dependencies": {
       "@elizaos/plugin-autonome": "workspace:*"
     }
   }
   ```
2. Navigate to the agent/ directory in your project.
3. Run the following commands to install the new dependency and build the project:
   - `pnpm install`
   - `pnpm build`

### Importing and Using the Plugin:

- Import the plugin in your code using:
  ```typescript
  import { autonomePlugin } from "@elizaos/plugin-autonome";
  ```

- Add the plugin to the AgentRuntime plugins array like this:
  ```typescript
  return new AgentRuntime({
      // other configuration...
      plugins: [
          autonomePlugin,
          // other plugins...
      ],
  });
  ```

### Verification Steps:

After integrating the plugin, verify its successful integration by checking for the message:
- Ensure you see ["✓ Registering action: <plugin actions>"] in the console.

### Note:
This is a workspace package, so make sure to add it to the agent/package.json file and then build the project for the changes to take effect.

## Configuration
# Configuration Documentation

## Required Environment Variables

1. `AUTONOME_JWT_TOKEN`: 
   - Purpose: Used to store the JWT token for Autonome authentication.
   
2. `AUTONOME_RPC`:
   - Purpose: Used to store the RPC endpoint for Autonome communication.

## Example .env File

```plaintext
AUTONOME_JWT_TOKEN=your_jwt_token_here
AUTONOME_RPC=https://autonome.rpc.endpoint.com
```

Please ensure that the configuration is done in the .env file. Remember to set the .env file in the .gitignore so it is not committed to the repository.

## Features

### Actions
### Launch Agent
Launch an Eliza agent

#### Properties
- Name: LAUNCH_AGENT
- Similes: ["CREATE_AGENT", "DEPLOY_AGENT", "DEPLOY_ELIZA", "DEPLOY_BOT"]

#### Handler
The handler function for the LAUNCH_AGENT action launches an Eliza agent. It composes the launch context, generates the launch content, validates the content, makes a POST request to launch the agent, and provides a success or error message accordingly.

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
import { LaunchAgentContent, isLaunchAgentContent } from './actions/launchAgent';

const content: LaunchAgentContent = { name: 'Agent1', config: 'Config1' };

if(isLaunchAgentContent(content)) {
    console.log('Valid launch agent content');
} else {
    console.log('Invalid launch agent content');
}
```

2. Using LaunchAgentContent interface in a function signature:
```typescript
import { LaunchAgentContent } from './actions/launchAgent';

function createLaunchAgent(content: LaunchAgentContent): void {
    // Logic to create a launch agent using the provided content
    console.log(`Creating launch agent ${content.name} with config ${content.config}`);
}

const newAgent: LaunchAgentContent = { name: 'Agent2', config: 'Config2' };
createLaunchAgent(newAgent);
```

### Best Practices
- Ensure to type-check the content using isLaunchAgentContent before working with LaunchAgentContent interface to prevent any runtime errors.
- Keep the LaunchAgentContent interface definition and related functions in a separate file to maintain code modularity and readability.

## FAQ
### Q: My action is registered, but the agent is not calling it
Ensure that the action's name clearly aligns with the task, and provide a detailed description of the conditions that should trigger the action.

### Q: Can I extend the functionality of a LaunchAgent?
Yes, you can extend the functionality by creating custom implementations of the LaunchAgentContent interface and defining new providers or actions that interact with these agents.

### Q: How do I validate if an action is appropriate within the current agent context?
Create a validation function within the Action definition that checks if the current agent and content conditions meet the requirements to execute the action.

### Q: What is the role of Evaluators?
Evaluators assess and extract information from conversations, helping agents to build long-term memory, track goals, extract facts, and maintain contextual awareness.

### Q: How can I integrate external market data into my agent's responses?
Utilize providers as modules that fetch and format market data. The providers maintain a dynamic context that your agents can interact with in real time.

### Q: What is the purpose of the launchTemplate variable?
The launchTemplate variable is used to extract and respond with JSON configurations of launch agents, ensuring agents can access necessary metadata for initialization and operations.

## Development

### TODO Items
No TODO items found.

## Troubleshooting Guide
### Launch agent does not initialize correctly
- Cause: Incorrect configuration or missing properties in the LaunchAgentContent.
- Solution: Verify that all required properties such as name and config are correctly specified and match expected formats.

### Dynamic data not reflecting in agent interactions
- Cause: Providers may not be correctly integrated or are missing necessary data sources.
- Solution: Ensure providers are properly configured and connected to valid data sources. Confirm they are supplying correct context data to agents.

### Debugging Tips
- Check logs for any errors related to invalid data formats in the launch configuration.
- Use mock data to test provider integrations before deploying with live data.
- Ensure all action validation functions are correctly implemented to cover anticipated conditions.