# Script d'aide pour lancer le backend (server/) et ouvrir l'application.
# AVANT utilisation, remplacez les valeurs {{NEWSAPI_API_KEY}} et {{GOOGLE_GENAI_API_KEY}}
# par vos vraies clés dans votre environnement local, ou commentez ces lignes
# et définissez les variables d'environnement à l'avance.

$env:NEWSAPI_API_KEY = "{{NEWSAPI_API_KEY}}"
$env:GOOGLE_GENAI_API_KEY = "{{GOOGLE_GENAI_API_KEY}}"

# Lancer le backend dans une nouvelle fenêtre PowerShell
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd `"$PSScriptRoot/server`"; npm install; npm start" | Out-Null

# Ouvrir l'application dans le navigateur par défaut
Start-Process "$PSScriptRoot/index.html" | Out-Null
