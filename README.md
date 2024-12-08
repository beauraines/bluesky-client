Bluesky Client
==============

> [!IMPORTANT]
> This is still in the beta stages. Not all functions have been completed and the documentation is missing.

## Usage


1. Instantiate a client
2. Login
3. Interact with Bluesky

```nodejs
const bsClient = new BlueSkyClient(identifier,password)

let profile;
try {
    await bsClient.login();
    profile = await bsClient.getProfile(identifier);
} catch (error) {
    context.error(error.message);
}
```