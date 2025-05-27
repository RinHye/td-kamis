# Installation de Node.js, npm et Sass sous WSL

## Étapes d'installation

```bash

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
sass sass styles.scss styles/style.css

# Compiler en mode "watch" (surveillance des changements)
sass --watch styles.scss:styles/style.css
```