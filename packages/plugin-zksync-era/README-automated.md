# @elizaos/plugin-zksync-era Documentation

## Overview
### Purpose
The @elizaos/plugin-zksync-era is designed to facilitate seamless and secure transactions on the ZKSync network. It acts as an intermediary that enhances agent interactions with blockchain environments, allowing for dynamic, context-aware token transfers. By integrating with external systems and leveraging real-time data, it ensures that automated actions are executed correctly and efficiently.

### Key Features
Validation of transfer content through structured validation mechanisms,Ability to specify detailed transfer attributes such as token address, recipient, and transfer amount,Comprehensive configuration validation for ZKSync using runtime settings and environment variables,Schema support for environment configurations,Integration with Eliza's action, evaluation, and provider systems

## Installation
## Installation and Integration Instructions for @elizaos/plugin-zksync-era

### 1. Adding the Plugin to Your ElizaOS Project:
- Add the following to your agent/package.json dependencies:
  ```json
  {
    "dependencies": {
      "@elizaos/plugin-zksync-era": "workspace:*"
    }
  }
  ```
- CD into the agent/ directory
- Run `pnpm install` to install the new dependency
- Run `pnpm build` to build the project with the new plugin

### 2. Importing and Using the Plugin:
- Import the plugin using: `import { zksyncEraPlugin } from "@elizaos/plugin-zksync-era";`
- Add it to the AgentRuntime plugins array

### 3. Integration Example:
```typescript
import { zksyncEraPlugin } from "@elizaos/plugin-zksync-era";

return new AgentRuntime({
    // other configuration...
    plugins: [
        zksyncEraPlugin,
        // other plugins...
    ],
});
```

### 4. Verification Steps:
Ensure successful integration by verifying that ["✓ Registering action: <plugin actions>"] appears in the console.

**Note:** This plugin is a workspace package and needs to be added to agent/package.json and built using pnpm.

## Configuration
# Configuration Documentation

## Required Environment Variables

1. **ZKSYNC_ADDRESS**  
   - Purpose: Specifies the ZKSync address used for configuration.  

2. **ZKSYNC_PRIVATE_KEY**  
   - Purpose: Specifies the ZKSync private key used for configuration.  

## .env Example File

```plaintext
ZKSYNC_ADDRESS=value_here
ZKSYNC_PRIVATE_KEY=value_here
```

Please note that the configuration is done in the .env file.  
Ensure that the .env file is set in the .gitignore to prevent it from being committed to the repository.

## Features

### Actions
No actions documentation available.

### Providers
No providers documentation available.

### Evaluators
No evaluators documentation available.

## Usage Examples
### utils/validateContext.ts

### Common Use Cases
1. Checking if a given content is a valid TransferContent object:
```typescript
import { ValidateContext } from './utils/validateContext';

const content = { 
  amount: 100, 
  recipient: 'John Doe' 
};

const isValid = ValidateContext.transferAction(content);
console.log(isValid); // Output: true
```

2. Validating transfer action content before performing a transfer:
```typescript
import { ValidateContext } from './utils/validateContext';

const transferContent = { 
  amount: 50, 
  recipient: 'Alice' 
};

if (ValidateContext.transferAction(transferContent)) {
  // Perform transfer
  console.log(`Transfer of ${transferContent.amount} to ${transferContent.recipient} is valid`);
} else {
  console.log('Invalid transfer content');
}
```

### Best Practices
- It is recommended to always validate transfer action content before proceeding with the transfer to ensure data integrity and prevent errors.
- Ensure to handle cases where the provided content is not a valid TransferContent object to avoid unexpected behavior in the application.

### actions/transferAction.ts

### Common Use Cases
1. **Transfer Tokens:** This code can be used to transfer tokens from one address to another.  
```typescript
const transfer: TransferContent = {
    tokenAddress: '0x123abc...',
    recipient: '0x456def...',
    amount: '100'
};

transferTokens(transfer);
```

2. **Transfer Assets:** The code can also be used to transfer assets such as digital collectibles or in-game items.  
```typescript
const transfer: TransferContent = {
    tokenAddress: '0x789ghi...',
    recipient: '0x012jkl...',
    amount: '1'
};

transferAssets(transfer);
```

### Best Practices
- **Input Validation:** Always ensure that the input values for tokenAddress, recipient, and amount are properly validated before performing the transfer.
- **Error Handling:** Implement comprehensive error handling to gracefully handle any issues that may arise during the transfer process.

### enviroment.ts

### Common Use Cases
1. **Initializing ZKsync configuration**: One common use case for the provided code is to initialize the ZKsync configuration by validating the configuration settings based on the runtime environment variables.

```typescript
import { validateZKsyncConfig } from './environment';

// Assuming runtime is an instance of IAgentRuntime with settings and environment variables
validateZKsyncConfig(runtime)
    .then((config) => {
        // Use the validated configuration object for ZKsync
    })
    .catch((error) => {
        console.error('Error validating ZKsync configuration:', error);
    });
```

2. **Updating ZKsync configuration**: Another use case can be updating the ZKsync configuration dynamically and revalidating it.

```typescript
import { validateZKsyncConfig } from './environment';

// Assuming newRuntime is an instance of IAgentRuntime with updated settings and environment variables
validateZKsyncConfig(newRuntime)
    .then((config) => {
        // Use the updated and validated configuration object for ZKsync
    })
    .catch((error) => {
        console.error('Error validating updated ZKsync configuration:', error);
    });
```

### Best Practices
- **Error handling**: It is recommended to always handle any potential errors that may occur during the validation process to provide a more robust implementation.
- **Caching**: For performance optimization, consider caching the validated ZKsync configuration object if it's used frequently within the application. This can help reduce unnecessary validation calls.

## FAQ
### Q: Can the ValidateContext class be used to validate other types of transactions?
No, the ValidateContext class is specifically designed to validate TransferContent objects. For other types of transactions, equivalent validation mechanisms would need to be established.

### Q: How can I extend the TransferContent interface?
To extend the TransferContent interface, you can add additional properties like metadata or timestamps within your own implementation, ensuring it aligns with the base properties such as tokenAddress, recipient, and amount.

### Q: How do I validate a ZKSync configuration in my runtime environment?
Utilize the validateZKsyncConfig function, providing the IAgentRuntime instance that includes the necessary settings and environment variables for validation. This function will return a promise resolving to a ZKsyncConfig object.

### Q: How do actions and providers integrate in the @elizaos/plugin-zksync-era?
Actions and providers are integrated to enrich agent interactions. Providers fetch dynamic data and supply it to actions, which then perform specific tasks like token transfers using real-time information.

### Q: What are the common components of an Action in this plugin?
An Action typically includes a name, similes for action variations, a validation function to check applicability, and a handler function to execute the desired behavior. Each Action is designed to interact directly with blockchain elements or facilitate data exchange.

### Q: My action is registered, but the agent is not calling it.
Ensure that the action's name clearly aligns with the task. Provide a detailed description of conditions that should trigger the action, ensuring that context within the agent's environment invokes it appropriately.

## Development

### TODO Items
No TODO items found.

## Troubleshooting Guide
### TransferContent validation failure
- Cause: Incorrect or missing tokenAddress, recipient, or amount properties
- Solution: Verify that all properties of the TransferContent object are populated correctly and adhere to required data types.

### Invalid ZKSync configuration settings
- Cause: Incorrect or incomplete environment variables
- Solution: Ensure that environment variables like ZKSYNC_ADDRESS and ZKSYNC_PRIVATE_KEY are correctly set and validated using the zksyncEnvSchema.

### Debugging Tips
- Always log the output of validateZKsyncConfig to verify configurations
- Check the agent's log for any missed conditions or errors that prevent action triggering
- Use console logging to trace data states within actions and validate their execution