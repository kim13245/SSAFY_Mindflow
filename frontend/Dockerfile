# React build stage
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first, leveraging Docker's layer caching
COPY frontend/package*.json ./ 
RUN npm install

# Copy the rest of the project and build the React app
COPY frontend/ .
RUN npm run build

# Nginx server
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Copy the built React files to Nginx's web root directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]