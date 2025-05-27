# Installation de Node.js, npm et Sass sous WSL

## Étapes d'installation

```bash
# Installer nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm --version

# Installer Node.js version LTS et l'utiliser
nvm install --lts
nvm use --lts
node -v
npm -v

# Installer Sass globalement
npm install -g sass
sass --version
```

## Lancer sass

```bash
# Compiler un fichier SCSS en CSS une fois
sass styles/style.scss styles/style.css

# Compiler en mode "watch" (surveillance des changements)
sass --watch styles/style.scss:styles/style.css
```