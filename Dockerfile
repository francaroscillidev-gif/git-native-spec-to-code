FROM node:22-alpine

WORKDIR /workspace

# Installa strumenti di compilazione essenziali e python3
RUN apk add --no-cache python3 py3-pip git bash

# Copia file package e installa dipendenze in layer separato
COPY package*.json ./
RUN npm install

# Copia il codice sorgente
COPY . .

# Esegue in modalità sandboxed sicura senza permessi root
USER node

ENTRYPOINT ["npx", "tsx", "src/cli/index.ts"]
CMD ["--help"]
