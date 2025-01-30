import * as vscode from 'vscode';
import ollama from 'ollama';

function getWebviewContent(): string{
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<style>
			body { font-family: sans-serif; margin: 1rem; }
			#prompt { width: 100%; box-sizing: border-box; }
			#response { border: 2px solid #ccc; margin-top: 1rem; padding: 1rem; }
		</style>
	</head>
	<body>
		<h2>Vo1d Seek Chat VS Code Extension</h2>
		<textarea id="prompt" rows="4" placeholder="Ask the vo1d..."></textarea><br />
		<button id='askBtn'>Ask</button>
		<div id="response"></div>

		<script>
			const vscode = acquireVsCodeApi();

			document.getElementById('askBtn').addEventListener('click', () => {
				const prompt = document.getElementById('prompt').value;
				vscode.postMessage({ command: 'chat',prompt });
			});

			window.addEventListener('message', event => {
				const message = event.data;
				if (message.command === 'chatResponse') {
					document.getElementById('response').innerText = message.text;
				}
			});
		</script>
	</body>
	</html>
	`
}

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('vo1dseek.start', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'Void Seek Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		)

		panel.webview.html = getWebviewContent()

		panel.webview.onDidReceiveMessage( async (message: any) =>{
			if (message.command === 'chat') {
				const userPrompt = message.prompt;
				let responseText = '';

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{ role: 'user', content: userPrompt }],
						stream: true,
					})
					
					for await (const part of streamResponse) {
						responseText += part.message.content
						panel.webview.postMessage({ command: 'chatResponse', text: responseText })
					}
				} catch (error) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(error)}`  })
				}
			}
		})

	})

	context.subscriptions.push(disposable);

}


export function deactivate() {}