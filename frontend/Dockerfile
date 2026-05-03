# Use the standard slim Debian-based image to prevent LightningCSS crashes
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Expose the port Next.js uses
EXPOSE 3000

# Start the dev server using the 0.0.0.0 host we set in package.json
CMD ["npm", "run", "dev"]