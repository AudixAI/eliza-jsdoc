# @elizaos/plugin-goat Documentation

## Overview
### Purpose
The @elizaos/plugin-goat is designed to act as a middleware framework for integrating Eliza-based agents with blockchain ecosystems via on-chain actions and wallet interactions. By leveraging wallet clients, the plugin facilitates seamless execution of on-chain activities such as retrieving account balances and executing smart contract functions. This plugin emphasizes enhancing the agent's capability to interact dynamically with decentralized data and systems, making it a powerful tool for blockchain and cryptocurrency applications.

### Key Features
Fetch on-chain actions using a wallet client,Create action handlers for customizable tasks,Compose action and response contexts for effective agent interactions,Develop dynamic response generation based on runtime contexts,Integrate with wallet providers for real-time balance and transaction information,Support dynamic contextual information and evaluation through providers and evaluators

## Installation
### Installation Instructions:
1. **Add the plugin to your ElizaOS project**:
   - Add the following to your agent/package.json dependencies:
     ```json
     {
       "dependencies": {
         "@elizaos/plugin-goat": "workspace:*"
       }
     }
     ```
   - To install the new dependency, navigate to the agent/ directory and run:
     ```
     pnpm install
     ```
   - Next, build the project with the new plugin by running:
     ```
     pnpm build
     ```

2. **Import and Use the Plugin**:
   - Import the plugin using:
     ```typescript
     import { plugin-goatPlugin } from "@elizaos/plugin-goat";
     ```
   - Add the plugin to the AgentRuntime plugins array in your code.

3. **Integration Example**:
   ```typescript
   import { plugin-goatPlugin } from "@elizaos/plugin-goat";

   return new AgentRuntime({
       // other configuration...
       plugins: [
           plugin-goatPlugin,
           // other plugins...
       ],
   });
   ```

4. **Verification Steps**:
   - To ensure successful integration, verify that you see ["✓ Registering action: <plugin actions>"] in the console.

**Note**: This plugin is a workspace package that needs to be added to agent/package.json and built to properly integrate with your ElizaOS project.

## Configuration
# Configuration Documentation

## Setting Environment Variables

Configuration in this application is done using environment variables in a .env file. 
Please ensure the .env file is set in the .gitignore file to prevent it from being committed to the repository.

## Required Environment Variables

### 1. ENV_VARIABLE_1
- Purpose: Description of what ENV_VARIABLE_1 is used for.

### 2. ENV_VARIABLE_2
- Purpose: Description of what ENV_VARIABLE_2 is used for.

### 3. ENV_VARIABLE_3
- Purpose: Description of what ENV_VARIABLE_3 is used for.

## Example .env File

```plaintext
ENV_VARIABLE_1=value1
ENV_VARIABLE_2=value2
ENV_VARIABLE_3=value3
```

# No Environment Variables Found

## Features

### Actions
No actions documentation available.

### Providers
No providers documentation available.

### Evaluators
No evaluators documentation available.

## Usage Examples
### actions.ts

### Common Use Cases
1. Retrieve on-chain actions using a wallet client:
```typescript
import { WalletClientBase, getOnChainActions } from 'actions';

const wallet = new WalletClientBase();
const onChainActions = getOnChainActions(wallet);
console.log(onChainActions);
```

2. Generate a response based on the specified runtime and context:
```typescript
import { IAgentRuntime, generateResponse } from 'actions';

const runtime: IAgentRuntime = { /* runtime information */ };
const context = 'sampleContext';
generateResponse(runtime, context)
    .then((response) => {
        console.log(response);
    });
```

### Best Practices
- Ensure that the necessary tools are provided when creating an action handler.
- Use composed action and response contexts to maintain consistency in handling actions and responses.

### index.ts

### Common Use Cases
1. Creating a GOAT plugin with specific settings:
```typescript
import { createGoatPlugin } from './index';

const getSetting = (key: string) => {
    // Function to retrieve settings based on a key
    // This could be retrieving settings from a database or configuration file
}

const main = async () => {
    const plugin = await createGoatPlugin(getSetting);
    console.log(plugin);
}

main();
```

2. Integrating the GOAT plugin creation into an existing application:
```typescript
import { createGoatPlugin } from './index';

const getSetting = (key: string) => {
    // Function to retrieve settings based on a key
    // This could be retrieving settings from a database or configuration file
}

// Example code from an existing application
const appLogic = async () => {
    // Existing application logic
}

const main = async () => {
    await appLogic();

    const plugin = await createGoatPlugin(getSetting);
    console.log(plugin);
}

main();
```

### Best Practices
- Ensure the `getSetting` function passed to `createGoatPlugin` accurately retrieves the required settings for the plugin.
- Handle any errors or promises rejected when calling `createGoatPlugin` to prevent any uncaught exceptions in the code.

### wallet.ts

### Common Use Cases
1. **Use Case 1: Creating a wallet client**
```typescript
import { getWalletClient } from 'wallet';

// Define function to retrieve settings
const getSetting = (key: string) => {
    // Code to retrieve setting value
};

// Create wallet client
const walletClient = getWalletClient(getSetting);
```

2. **Use Case 2: Retrieving wallet information from a provider**
```typescript
import { getWalletProvider } from 'wallet';

// Assume we have a walletClient object already defined
const walletClient = {
    // Wallet client properties and methods
};

// Retrieve wallet information from provider
const walletInfo = getWalletProvider(walletClient);
```

### Best Practices
- **Best practice 1:** Ensure that the `getSetting` function provided to `getWalletClient` accurately retrieves the required settings for the wallet client.
- **Best practice 2:** Handle potential errors that may occur during the retrieval of wallet information from the provider to prevent crashes or unexpected behavior.

## FAQ
### Q: My action is registered, but the agent is not calling it
Ensure that the action's name clearly aligns with the task, and ensure you give a detailed description of the conditions that should trigger the action.

### Q: Can the action handle multiple tasks simultaneously?
Each action is designed to handle a specific task based on its handler implementation. To manage multiple tasks, define separate actions for each and ensure they are properly registered within the agent.

### Q: How can I integrate additional blockchain providers with the plugin?
You can extend the functionality by implementing additional wallet provider integrations through the provider structure. This involves creating a new provider module that adheres to the existing patterns of wallet client interactions.

### Q: What are the main benefits of using providers in this plugin?
Providers supply dynamic, real-time context to the agent through integration with external systems. They ensure that the agent can access up-to-date market data, wallet information, and other temporal contexts, enhancing both the relevancy and effectiveness of interactions.

### Q: How do I ensure my action descriptions are effective?
Provide clear and concise descriptions that specify the purpose, expected outcomes, and any applicable conditions or triggers. A well-defined description ensures the agent can make informed decisions about when and how to execute actions.

### Q: Why is my wallet balance not updating in the interface?
Ensure that the wallet provider and client are correctly configured and that network communications are functioning properly. Review the provider logs to identify any connectivity issues.

## Development

### TODO Items
No TODO items found.

## Troubleshooting Guide
### Failed to retrieve on-chain actions
- Cause: Wallet client configuration error or unsupported network
- Solution: Verify the wallet client settings and ensure the network is supported. Review any error logs for specific details.

### Generated response does not match the expected format
- Cause: Contextual data mismatch or formatting error in context composition
- Solution: Check the context composition parameters and ensure the correct data is passed for formatting. Debug the response generation logic for issues.

### Provider not supplying dynamic data
- Cause: Integration or API connection issues
- Solution: Ensure the provider is linked to the correct external systems and that any API keys or endpoints used are valid and up-to-date.

### Debugging Tips
- Frequently review logs for both the plugin and wallet client for abnormal patterns or errors
- Validate all configuration settings before deployment
- Utilize unit tests to confirm action and provider behavior
- Simulate various blockchain scenarios to test comprehensive action handling