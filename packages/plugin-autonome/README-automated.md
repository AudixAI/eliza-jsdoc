# @elizaos/plugin-autonome Documentation

## Overview
### Purpose
The @elizaos/plugin-autonome plugin is designed to enhance the functionality of Eliza agents by integrating dynamic content and automating interaction processes through the implementation of Launch Agent Content interfaces, actions, providers, and evaluators. It allows for the creation of autonomous agents capable of real-time decision making and task execution, offering seamless integration with various external systems to provide instant access to necessary data and context.

### Key Features
Defines and manages Launch Agent Content with distinct properties like name and configuration.,Incorporates dynamic content through Providers, enabling real-time context and data access.,Facilitates interaction and task execution with Actions, which include validation and handling processes.,Supports extensive information extraction and awareness through Evaluators.,Offers a templated system for launching agents with predefined settings.

## Installation
## Installation and Integration Instructions for @elizaos/plugin-autonome

### 1. Adding the Plugin to Your ElizaOS Project:
   - Add the following to your agent/package.json dependencies:
   ```json
   {
     "dependencies": {
       "@elizaos/plugin-autonome": "workspace:*"
     }
   }
   ```
   - Navigate to the agent/ directory in your project
   - Run the following commands:
     1. `pnpm install` to install the new dependency
     2. `pnpm build` to build the project with the new plugin

### 2. Importing and Using the Plugin:
   - Import the plugin in your code:
   ```typescript
   import { autonomePlugin } from "@elizaos/plugin-autonome";
   ```
   - Add the plugin to the AgentRuntime plugins array in your code

### 3. Integration Example:
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

### 4. Verification Steps:
   - Ensure you see ["✓ Registering action: <plugin actions>"] in the console after integrating the plugin

**Note:** This plugin has dependencies and peer dependencies that need to be resolved. Make sure to install those dependencies as well for successful integration.

## Configuration
# Configuration Documentation

## Environment Variables

Below is a list of all the required environment variables and their purpose:

- `DATABASE_URL`: Used to specify the connection URL for the database.
- `SECRET_KEY`: Used to store a secret key for security purposes.
- `API_KEY`: Used to store an API key for accessing external services.

## .env Example File

Please create a .env file in your project directory and add the following variables with their respective values:

```plaintext
DATABASE_URL=your_database_connection_url_here
SECRET_KEY=your_secret_key_here
API_KEY=your_api_key_here
```

Make sure to set the .env file in the .gitignore to prevent it from being committed to the repository. The configuration should be done in the .env file for security and ease of maintenance.

## Features

### Actions
### LAUNCH_AGENT
Launch an Eliza agent

#### Properties
- Name: LAUNCH_AGENT
- Similes: CREATE_AGENT, DEPLOY_AGENT, DEPLOY_ELIZA, DEPLOY_BOT

#### Handler
The handler function for LAUNCH_AGENT action launches an Eliza agent by sending a POST request to a specified endpoint with the agent configuration details provided in the message content.

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
1. By using the provided `LaunchAgentContent` interface, developers can define the structure of a launch agent's content. This can be useful when creating or updating launch agents.
```typescript
const newLaunchAgent: LaunchAgentContent = {
  name: "MyLaunchAgent",
  config: "some configuration details"
};
```

2. The `isLaunchAgentContent` function can be used to validate if a given content object is of type `LaunchAgentContent`. This can help ensure that the correct type of content is being used.
```typescript
const content = {
  name: "InvalidLaunchAgent",
  config: "invalid configuration"
};

if (isLaunchAgentContent(content)) {
  // Handle launch agent content
} else {
  console.error("Invalid launch agent content");
}
```

### Best Practices
- When defining the structure of a launch agent, always use the `LaunchAgentContent` interface to maintain consistency and clarity.
- Before working with launch agent content, make sure to validate it using the `isLaunchAgentContent` function to prevent runtime errors.

## FAQ
### Q: My action is registered, but the agent is not calling it
Ensure that the action's name clearly aligns with the task, and provide a detailed description of the conditions that should trigger the action.

### Q: Can the current implementation handle real-time data from external sources?
Yes, the plugin uses Providers to inject dynamic and real-time information from external systems into the agent's interactions.

### Q: How can I extend the functionality of an Evaluator?
You can extend an Evaluator by implementing additional functions for extracting specific types of information or tracking new aspects of conversation context, then integrating it into the AgentRuntime's evaluation system.

### Q: How do I customize the configuration of a launch agent?
Customize the Launch Agent Content by specifying the desired 'name' and 'config' properties, and ensure these align with your agent's intended tasks and interactions.

### Q: What should I do if the data provided by a Provider is inconsistent?
Check the integration settings for the Provider to ensure correct data sources are being accessed. Validate that the format and delivery of data match the agent's requirements.

## Development

### TODO Items
No TODO items found.

## Troubleshooting Guide
### Agent does not respond to registered actions
- Cause: Misalignment between action name and triggering conditions
- Solution: Verify that the action's name and description accurately reflect the triggering task and conditions.

### Provider data not updating in real-time
- Cause: Integration with external data source may be misconfigured
- Solution: Ensure the provider's connections to data sources are correctly set up and functioning.

### Debugging Tips
- Use console logs to track the execution flow of actions and evaluate if conditions are met.
- Validate the formatting and completeness of your Launch Agent Content configurations.
- Check for errors or warning messages in the agent's log output that might indicate misconfigurations.