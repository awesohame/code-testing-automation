# Project Setup and Run Instructions 
 
## 1. Nodejs Server 
Navigate to the `server` directory and install dependencies: 
```sh 
cd server 
npm install 
npm run dev 
```
This will start the server in development mode. 

## 2. Python Server

### a. **Set Up a Virtual Environment**  
Before running the server, create and activate a virtual environment to manage dependencies.

#### Navigate to the directory
```sh
cd python-server
```

#### On Windows (Command Prompt / PowerShell):
```sh
python -m venv venv
venv\Scripts\activate
```

#### On macOS / Linux (Terminal):
```sh
python3 -m venv venv
source venv/bin/activate
```

---

### b. **Install Dependencies**  
Once the virtual environment is activated, install the required dependencies:

```sh
pip install -r requirements.txt
```

---

### c. **Set Up Environment Variables**  
Copy the sample environment file and configure it:

```sh
cp .env.sample .env
```
Then, update the `.env` file with the necessary values.

---

### d. **Run the FastAPI Server**  
Start the FastAPI server using `uvicorn`:

```sh
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

> **Note:** Ensure that the server is running before starting the client application.

---

Now your FastAPI server should be up and running on **http://localhost:8001**. 🚀
 
## 3. Client 
Navigate to the client directory and install dependencies: 
```sh 
cd client 
npm install --f
npm run dev 
```
This will start the client application. 
 
## 4. VS Code Extension (vscode-soham-extension) 
Navigate to the extension directory and 
Then, open the extension in VS Code development mode: 
 
- Open the vscode-soham-extension folder in VS Code. 
- install dependencies: 
```sh 
cd vscode-soham-extension 
npm install 
npm run compile 
```
- Press F5 to launch the extension in a new VS Code window. 
 
## 5. AI Agent Calls with ElevenLabs and Twilio

### Prerequisites
Ensure you have the following:
- **Node.js** installed
- **Ngrok** installed for tunneling
- A **Twilio** account with a verified phone number
- An **ElevenLabs** API key and Agent ID

### Installation
1. navigate to the repository:
   ```sh
   cd ai-call-agent
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your `.env` file with the required credentials:
   ```sh
   ELEVENLABS_AGENT_ID=<your-elevenlabs-agent-id>
   TWILIO_ACCOUNT_SID=<your-twilio-account-sid>
   TWILIO_AUTH_TOKEN=<your-twilio-auth-token>
   TWILIO_PHONE_NUMBER=<your-twilio-phone-number>
   ```

### Running the Server
1. Start the server:
   ```sh
   node index.js
   ```
2. Expose port `8000` using ngrok in another terminal:
   ```sh
   ngrok http 8000
   ```
   Copy the generated `https://<ngrok-subdomain>.ngrok.io` URL.

### Making an Outbound Call
Use any HTTP client(postman, curl, thunder client, etc.) to make an outbound call to the server.
```
POST https://<ngrok-subdomain>.ngrok.io/make-outbound-call
```
With the following JSON body:
```json
{
  "to": "<recipient-phone-number>"
}
```
*Ensure the recipient phone number is verified on Twilio.*

## Important Configurations
### ElevenLabs Settings
- **TTS Output Format**: Set to `μ-law 8000 Hz`.
- **User Audio Input Format**: Set to `μ-law 8000 Hz`.

### Precautions
- Verify that all `.env` variables are correctly set before running the application.
- Ensure the recipient phone number is **verified in Twilio** before making calls.
- Keep your **Twilio Auth Token** and **ElevenLabs API credentials** secure.




Now, all components should be running successfully.